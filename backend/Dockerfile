# =============================================================================
# TaskFlow Backend — Multi-Stage Dockerfile
# Stages:
#   base        → Shared Node.js Alpine foundation
#   deps        → Install ALL npm dependencies (dev + prod)
#   development → Hot-reload dev server via ts-node-dev
#   builder     → Compile TypeScript → dist/
#   production  → Lean runtime image (prod deps + compiled JS only)
# =============================================================================

# ─── Stage 1: base ────────────────────────────────────────────────────────────
# Pinned LTS Alpine for a minimal, reproducible foundation.
FROM node:20-alpine AS base

# Install OS-level utilities needed across stages:
#   curl      → healthcheck probes
#   dumb-init → proper PID-1 signal handling (no zombie processes)
RUN apk add --no-cache curl dumb-init

WORKDIR /app

# ─── Stage 2: deps ────────────────────────────────────────────────────────────
# Install ALL dependencies (including devDependencies) once and cache them.
# This layer is reused by both the development and builder stages.
FROM base AS deps

# Copy only the manifest files first — layer is invalidated only when these change.
COPY package.json package-lock.json ./

# ci install: deterministic, respects lock file, skips lifecycle scripts
RUN npm ci


# =============================================================================
# DEVELOPMENT STAGE
# Target: docker build --target development
# Features:
#   - Full devDependencies present (ts-node-dev, drizzle-kit, etc.)
#   - Source code hot-reloads via ts-node-dev --respawn
#   - Mount source via bind-volume in docker-compose for live editing
# =============================================================================
FROM deps AS development

ENV NODE_ENV=development
ENV PORT=3001

# Copy all source files (bind-mount will override in docker-compose for hot-reload)
COPY . .

EXPOSE 3001

# Use dumb-init to forward signals correctly to ts-node-dev child processes
ENTRYPOINT ["dumb-init", "--"]

# ts-node-dev: transpile-only (skips type checking) for fast restarts
CMD ["npm", "run", "dev"]


# ─── Stage 3: builder ─────────────────────────────────────────────────────────
# Compile TypeScript to JavaScript. Runs tsc — output lands in ./dist
FROM deps AS builder

# Copy full source (tsconfig.json, src/, drizzle.config.ts, etc.)
COPY . .

# Type-check + compile TypeScript → ./dist
RUN npm run build

# Prune devDependencies so only production deps are copied to the final image
RUN npm prune --omit=dev


# =============================================================================
# PRODUCTION STAGE
# Target: docker build --target production  (or omit --target — this is the default)
# Features:
#   - Only production node_modules (~60–70% smaller than full install)
#   - Only compiled JS in dist/ — no source TypeScript, no devDeps
#   - Non-root user for security hardening
#   - dumb-init as PID 1 for graceful shutdowns (SIGTERM → Node process)
#   - Built-in HEALTHCHECK via /health endpoint
# =============================================================================
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3001

# Create a non-root user/group for security best practice
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy pruned production node_modules from builder
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy compiled application
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

# Copy package.json (needed by some runtime module resolution paths)
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json

# Drop to non-root user
USER appuser

EXPOSE 3001

# Healthcheck: poll the API health endpoint every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# dumb-init ensures SIGTERM is forwarded and the Node process exits cleanly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/server.js"]