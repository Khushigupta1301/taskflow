FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies only (cached layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src
COPY docs ./docs

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
USER nodeuser

EXPOSE 5000
CMD ["node", "src/server.js"]
