# TaskFlow API

> Scalable REST API with JWT Authentication & Role-Based Access Control

[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18-blue)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-green)](https://mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Features

- **JWT Authentication** — Secure login/register with bcrypt password hashing
- **Role-Based Access Control** — `user` and `admin` roles with route-level enforcement
- **Task CRUD** — Full create/read/update/delete with soft-deletes and pagination
- **Input Validation** — express-validator with sanitization on all inputs
- **Rate Limiting** — Per-IP limits (10 auth attempts / 100 API calls per 15 min)
- **API Versioning** — All routes under `/api/v1/`
- **Swagger Docs** — Interactive docs at `/api-docs`
- **Structured Logging** — Winston logger with file + console transports
- **Docker Ready** — Single command to spin up the full stack

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- (Optional) Docker & Docker Compose

### Option A — Local Development

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/taskflow-api.git
cd taskflow-api/backend

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET

# 4. Run in dev mode
npm run dev
```

Server starts at `http://localhost:5000`  
Swagger docs at `http://localhost:5000/api-docs`

### Option B — Docker (recommended)

```bash
# From project root
cp backend/.env.example backend/.env
# Set JWT_SECRET in .env

docker-compose up -d
```

All services (API + MongoDB + Redis + Frontend) start automatically.

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register new user |
| POST | `/api/v1/auth/login` | — | Login & get JWT |
| GET | `/api/v1/auth/me` | JWT | Get current user |
| POST | `/api/v1/auth/logout` | JWT | Logout |

### Tasks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/tasks` | JWT | List tasks (paginated) |
| POST | `/api/v1/tasks` | JWT | Create task |
| GET | `/api/v1/tasks/:id` | JWT | Get single task |
| PATCH | `/api/v1/tasks/:id` | JWT | Update task |
| DELETE | `/api/v1/tasks/:id` | JWT | Delete task (soft) |
| GET | `/api/v1/tasks/stats` | Admin | Task statistics |

### Users (Admin Only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users` | Admin | List all users |
| PATCH | `/api/v1/users/:id/role` | Admin | Change user role |
| PATCH | `/api/v1/users/:id/toggle-active` | Admin | Activate/deactivate |
| PATCH | `/api/v1/users/me` | JWT | Update own profile |

### Query Parameters (GET /tasks)

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `todo`, `in_progress`, `done` |
| `priority` | string | Filter: `low`, `medium`, `high` |
| `search` | string | Full-text search on title |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `sort` | string | Sort field (default: `-createdAt`) |

---

## Authentication Flow

```
Client                     API
  |                          |
  |-- POST /auth/register -->|  Hash password (bcrypt, cost 12)
  |<-- { token, user } ------|  Sign JWT (HS256, 7d expiry)
  |                          |
  |-- POST /auth/login ------>|  Compare hash → issue token
  |<-- { token, user } ------|
  |                          |
  |-- GET /tasks             |
  |   Authorization: Bearer <token>
  |------------------------->|  Verify JWT → attach req.user
  |<-- { tasks } ------------|
```

---

## Project Structure

```
backend/
├── src/
│   ├── app.js              # Express app + middleware
│   ├── server.js           # Entry point
│   ├── config/
│   │   └── database.js     # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── task.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.js         # JWT protect + RBAC
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/v1/
│   │   ├── auth.routes.js
│   │   ├── task.routes.js
│   │   └── user.routes.js
│   └── utils/
│       ├── AppError.js
│       ├── jwt.js
│       └── logger.js
├── docs/
│   └── swagger.yaml
├── tests/
├── .env.example
├── Dockerfile
└── package.json
```

---

## Security Practices

- **Password hashing**: bcrypt with cost factor 12
- **JWT**: HS256, short-lived (7d), verified on every request
- **Helmet**: Sets 11 security HTTP headers
- **Rate limiting**: Strict on auth endpoints (10 req/15min)
- **Input sanitization**: express-validator on all POST/PATCH bodies
- **Soft deletes**: Data never destroyed; audit trail preserved
- **Non-root Docker**: App runs as `nodeuser` (UID 1001)
- **Field whitelisting**: Only allowed fields accepted in updates

---

## Running Tests

```bash
cd backend
npm test
```

---

## Scalability

See [SCALABILITY.md](./SCALABILITY.md) for a full breakdown of how this architecture scales from 1k to millions of users, including Redis caching, horizontal scaling, microservices, and Kubernetes.

---

## License

MIT
