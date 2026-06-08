# Scalability Notes — TaskFlow API

## Current Architecture

TaskFlow is built as a monolithic Express.js application with a PostgreSQL database. While fully functional for MVP-scale deployments, this document outlines how the system can evolve to handle high traffic and scale horizontally.

---

## 1. Horizontal Scaling (Stateless Design)

The API is **stateless by design** — authentication is handled via JWT (no server-side sessions). This means:

- Multiple instances can run behind a **load balancer** (e.g., AWS ALB, Nginx, HAProxy) without session affinity concerns
- Deployments can use **Kubernetes** (HPA) or **ECS** auto-scaling based on CPU/memory metrics
- Each instance connects to the same PostgreSQL cluster

```
Client → Load Balancer → [API Instance 1]
                       → [API Instance 2]  → PostgreSQL (Primary)
                       → [API Instance 3]       ↑ Read Replicas
```

---

## 2. Database Scaling

### Connection Pooling
- Current: `pg.Pool` with max 10 connections per instance
- Production: Use **PgBouncer** as a connection pooler in front of PostgreSQL to prevent connection exhaustion when scaling to many API instances

### Read Replicas
- Route **read-heavy** queries (GET /tasks) to **read replicas**
- Write operations (INSERT/UPDATE/DELETE) go to the primary node
- Drizzle ORM supports multiple database connections — can configure separate `readDb` and `writeDb` clients

### Partitioning
- As tasks grow, partition the `tasks` table by `user_id` (range partitioning) or `created_at` (time-based)

---

## 3. Caching with Redis

### What to Cache
| Data | Strategy | TTL |
|------|----------|-----|
| `GET /tasks` (user's task list) | Cache-aside (user-scoped key) | 60s |
| `GET /auth/me` profile | Cache-aside by userId | 5 min |
| Rate limit counters | Redis sorted sets | Per window |

### Implementation Pattern
```typescript
// Cache-aside pattern
const cacheKey = `tasks:${userId}:${filter}:${page}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await db.select()...;
await redis.setex(cacheKey, 60, JSON.stringify(result));
return result;
```

### Cache Invalidation
- Invalidate `tasks:userId:*` when user creates/updates/deletes a task
- Admin mutations invalidate all related user caches

---

## 4. Microservices Extraction Path

When the monolith becomes a bottleneck, these are natural extraction points:

| Service | Responsibility | Communication |
|---------|---------------|---------------|
| **Auth Service** | Register, login, token refresh, user profiles | REST |
| **Task Service** | CRUD for tasks, filtering, pagination | REST or gRPC |
| **Notification Service** | Due date reminders, email alerts | Event-driven (Kafka/RabbitMQ) |
| **Admin Service** | User management, audit logs | REST |

**Message Queue** (RabbitMQ / AWS SQS):
- Task created → emit event → Notification service sends reminder
- Decouples services and enables async processing

---

## 5. API Rate Limiting & Throttling

Current implementation uses `express-rate-limit` (in-memory). For distributed deployments:
- Use **Redis-backed rate limiting** (`rate-limit-redis` package)
- Separate limits for: auth endpoints (10/15min), API (100/15min), admin (50/15min)
- Apply at **API Gateway** level (AWS API Gateway, Kong) for centralized control

---

## 6. Logging & Observability

| Layer | Tool | Purpose |
|-------|------|---------|
| Structured Logs | Winston (JSON) → ELK Stack | Log aggregation & search |
| Metrics | Prometheus + Grafana | Request rate, latency, error rate |
| Tracing | OpenTelemetry + Jaeger | Distributed request tracing |
| Uptime | Healthcheck endpoint `/api/v1/health` | Load balancer health checks |

---

## 7. Deployment Pipeline

```
GitHub Push → CI (GitHub Actions)
  → Run tests
  → Build Docker image
  → Push to ECR/Docker Hub
  → Deploy to ECS/K8s (rolling update, zero downtime)
```

### Docker Compose (Development)
Already included in `docker-compose.yml` for local PostgreSQL + API + Frontend.

### Production Checklist
- [ ] Use environment-specific `.env` files (never commit secrets)
- [ ] Enable PostgreSQL SSL (`?sslmode=require`)
- [ ] Set `NODE_ENV=production` to disable dev logs
- [ ] Configure CORS for actual frontend domain
- [ ] Set up database backups (pg_dump or managed snapshots)
- [ ] Enable HTTPS (TLS termination at load balancer)
