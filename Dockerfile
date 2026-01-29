# ---------- Build ----------
FROM oven/bun:latest AS build
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---------- Runtime ----------
FROM oven/bun:latest AS runtime
WORKDIR /app

# Instalar curl para healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=80

# Copiamos lo necesario para SSR + migraciones
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src/db ./src/db
COPY --from=build /app/src/utils/db-standalone.ts ./src/utils/db-standalone.ts

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:80/health || exit 1

# Ejecutar migraciones y luego iniciar el servidor
# TODO: Quitar db:reset después del primer deploy exitoso
CMD bun run db:reset && bun run db:auth && bun run db:up && bun run db:seed && bun dist/server/entry.mjs

