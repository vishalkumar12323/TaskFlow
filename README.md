# ⚡ TaskFlow — Scalable REST API with Auth & RBAC

A production-grade full-stack task management application featuring:
- **JWT Authentication** with bcrypt password hashing
- **Role-Based Access Control** (USER / ADMIN)
- **CRUD REST API** for Tasks (status, priority, due date, pagination)
- **Drizzle ORM** with PostgreSQL
- **Premium React frontend** with glassmorphism dark UI

---

## 🗂 Project Structure

```
Assignment/
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── db/           # Drizzle schema, client, migrations
│   │   ├── config/       # Zod-validated env config
│   │   ├── middleware/   # Auth, RBAC, error handler
│   │   ├── modules/
│   │   │   ├── auth/     # Register, Login, Me
│   │   │   ├── tasks/    # CRUD for tasks
│   │   │   └── admin/    # User management
│   │   └── utils/        # JWT, bcrypt, logger
│   └── drizzle.config.ts
├── frontend/         # Vite + React + TypeScript
│   └── src/
│       ├── api/          # Axios client with JWT interceptor
│       ├── context/      # AuthContext
│       ├── components/   # Navbar, TaskCard, TaskForm, Toast
│       └── pages/        # Login, Register, Dashboard, AdminPanel
├── postman/          # Postman collection (importable JSON)
├── SCALABILITY_NOTES.md
└── README.md
```

---

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone & Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
npm install
```

### 2. Database Setup

```bash
# Push schema to PostgreSQL (creates tables automatically)
npm run db:push

# OR generate SQL migration files then apply:
npm run db:generate
npm run db:migrate
```

### 3. Run Backend

```bash
npm run dev
# → http://localhost:3001
# → Health: http://localhost:3001/api/v1/health
```

### 4. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 📡 API Reference

Base URL: `http://localhost:3001/api/v1`

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | Public | Register user → returns JWT |
| `POST` | `/auth/login` | Public | Login → returns JWT |
| `GET`  | `/auth/me` | JWT | Get current user profile |

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`  | `/tasks` | JWT | List tasks (`?status=TODO&priority=HIGH&page=1&limit=10`) |
| `POST` | `/tasks` | JWT | Create task |
| `GET`  | `/tasks/:id` | JWT | Get single task |
| `PUT`  | `/tasks/:id` | JWT | Update task |
| `DELETE` | `/tasks/:id` | JWT | Delete task |

> **Admin note**: Admins see all users' tasks; regular users see only their own.

### Admin (ADMIN role required)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`    | `/admin/users` | ADMIN | List all users |
| `PATCH`  | `/admin/users/:id/role` | ADMIN | Promote/demote user |

### Response Format
```json
{
  "success": true,
  "data": { ... }
}
```

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Token is invalid or has expired"
}
```

---

## 🔐 Security Features

- **bcrypt** password hashing (12 rounds)
- **JWT** with configurable expiry (default 7d)
- **Helmet** — security headers
- **CORS** — restricted to frontend origin in production
- **Rate Limiting** — 100 req/15min global, 10 req/15min on auth routes
- **Zod** input validation on all endpoints
- **Ownership check** — users can only CRUD their own tasks
- **Postgres constraints** handled gracefully (409 Conflict)

---

## 📬 Postman

Import `postman/TaskAPI.postman_collection.json` into Postman.

**Auto-token feature**: The Login and Register requests automatically capture the JWT and set it as the `token` collection variable. All subsequent requests will use it.

---

## 🐳 Docker (Optional)

```bash
# From project root
docker-compose up -d
```

This starts PostgreSQL + Backend + Frontend containers.

---

## 🔭 Scalability

See [SCALABILITY_NOTES.md](./SCALABILITY_NOTES.md) for a detailed breakdown of:
- Horizontal scaling with stateless JWT
- Redis caching strategy
- Microservices extraction path
- Database read replicas + PgBouncer
- Observability (Winston → ELK, Prometheus, OpenTelemetry)
