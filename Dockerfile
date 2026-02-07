# ---- Base ----
FROM oven/bun:1 AS base
WORKDIR /app

# ---- Install dependencies ----
FROM base AS install

# Dev dependencies (needed for astro build)
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --no-save

# Production dependencies only (no lockfile - let bun resolve fresh for prod subset)
RUN mkdir -p /temp/prod
COPY package.json /temp/prod/
RUN cd /temp/prod && bun install --production

# ---- Build ----
FROM base AS build

COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Build-time env vars needed by Astro's envField and better-auth
# Coolify injects real values as ARGs; defaults here are build-only placeholders
# ARGs don't persist in the final release stage
ARG IS_PROD=true
ARG BETTER_AUTH_SECRET=build-placeholder-secret
ARG BETTER_AUTH_URL=http://localhost:4321
ARG ADMIN_NAME=build
ARG ADMIN_EMAIL=build@build.com
ARG ADMIN_PASSWORD=build123

RUN IS_PROD=${IS_PROD} \
    BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET} \
    BETTER_AUTH_URL=${BETTER_AUTH_URL} \
    ADMIN_NAME=${ADMIN_NAME} \
    ADMIN_EMAIL=${ADMIN_EMAIL} \
    ADMIN_PASSWORD=${ADMIN_PASSWORD} \
    bun run build

# ---- Release ----
FROM base AS release

# curl is required for Coolify's healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Production node_modules (native deps: sharp, mysql2, etc.)
COPY --from=install /temp/prod/node_modules node_modules

# Astro build output
COPY --from=build /app/dist dist

# DB scripts needed at runtime (migrations, seeds, start)
COPY --from=build /app/src/db src/db
COPY --from=build /app/src/utils/db-standalone.ts src/utils/db-standalone.ts

# package.json (needed by bun to resolve imports)
COPY --from=build /app/package.json .

# Uploads directory (mount as volume in Coolify for persistence)
RUN mkdir -p dist/client/uploads/products

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=80

EXPOSE 80

USER bun

CMD ["bun", "src/db/start.ts"]
