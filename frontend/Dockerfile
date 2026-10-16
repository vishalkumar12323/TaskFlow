# Build and run the React + Vite frontend.
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS development
ENV NODE_ENV=development
EXPOSE 5173
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM deps AS builder
COPY . .

# Vite embeds this value in the static bundle at build time.
ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
