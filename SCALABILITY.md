# TaskFlow API — Scalability Architecture Notes

## Current Architecture

A single-process Node.js + Express server with MongoDB Atlas. Handles ~500 concurrent users comfortably on a single VPS.

---

## Path to Scale

### Phase 1 — Vertical + Caching (0–10k users)

**Redis Caching Layer**
```js
// Cache user sessions and frequent queries
await redis.setEx(`user:${id}`, 3600, JSON.stringify(user));
await redis.setEx(`tasks:${userId}`, 300, JSON.stringify(tasks));
```
- Session caching: avoid repeated DB lookups for every authenticated request
- Query result caching: cache paginated task lists (TTL: 5 min)
- Rate limiter state: move `express-rate-limit` store to Redis for multi-process consistency

**Connection Pooling**
Mongoose already manages a connection pool. Tune `maxPoolSize` to 20–50 for heavier load.

---

### Phase 2 — Horizontal Scaling (10k–100k users)

**PM2 Cluster Mode**
```bash
pm2 start src/server.js -i max  # Spawn one process per CPU core
```
All instances share the same Redis and MongoDB. JWT is stateless — no sticky sessions needed.

**Load Balancer (Nginx)**
```nginx
upstream taskflow {
  least_conn;
  server 127.0.0.1:5000;
  server 127.0.0.1:5001;
  server 127.0.0.1:5002;
  server 127.0.0.1:5003;
}
```
Nginx distributes traffic across PM2 workers with least-connections algorithm.

**MongoDB Replica Set**
- 1 Primary + 2 Secondaries
- Read from secondaries for non-critical queries: `Task.find().read('secondaryPreferred')`
- Automatic failover: ~10s switchover if primary goes down

---

### Phase 3 — Microservices (100k+ users)

Split into independent deployable services:

```
API Gateway (Kong / Nginx)
├── auth-service        (user registration, JWT issuance)
├── task-service        (CRUD, search, filtering)
├── notification-service (email, push via queues)
└── admin-service       (user management, analytics)
```

**Message Queue (BullMQ + Redis)**
Offload heavy operations: email sending, report generation, webhooks
```js
await emailQueue.add('welcome', { userId, email });
await reportQueue.add('export', { filter, format: 'csv' });
```

**MongoDB Sharding**
Shard `tasks` collection on `{ owner: 1 }` — each shard handles a subset of users. Enables petabyte-scale storage with linear horizontal scaling.

---

### Phase 4 — Cloud Native (Global Scale)

- **Kubernetes (EKS/GKE)**: auto-scaling pods based on CPU/memory metrics
- **CDN (Cloudflare)**: cache static assets, protect against DDoS
- **Multi-region MongoDB Atlas**: geo-distributed writes with `@region` tags
- **Observability**: OpenTelemetry traces → Grafana + Prometheus dashboards
- **CI/CD**: GitHub Actions → Docker → ECR → EKS rolling deploys

---

## Docker Setup (included)

```bash
docker-compose up -d   # Starts API + MongoDB + Redis + Nginx
docker-compose --profile prod up -d  # Production profile
```

The `docker-compose.yml` included in this repo sets up the full local stack in one command.

---

## Key Design Decisions That Enable Scale

| Decision | Why It Scales |
|---|---|
| Stateless JWT (no server sessions) | Any node can handle any request — true horizontal scaling |
| Soft deletes (`isDeleted`) | No lock contention; deleted records remain for audit trails |
| Compound indexes on `(owner, status)` | Fast multi-tenant queries without full collection scans |
| Pagination on all list endpoints | Bounded response size; prevents OOM on large datasets |
| Whitelist-based field updates | Prevents mass assignment; explicit about what can change |
| Versioned API (`/api/v1/`) | Breaking changes go to `/v2/` — existing clients never break |
