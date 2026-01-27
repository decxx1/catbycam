# Stage 1: Build
FROM oven/bun:latest AS build
WORKDIR /app

# Copy package files (lockfile is optional)
COPY package.json ./
COPY bun.lock* ./

# Install dependencies
RUN bun install

# Copy the rest of the source code
COPY . .

# Build the project
RUN bun run build

# Stage 2: Runtime (using Bun for full framework support)
FROM oven/bun:latest AS runtime
WORKDIR /app

# Copy built assets and dependencies
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

# Copy source files for running scripts (db:setup, etc.)
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/astro.config.mjs ./astro.config.mjs

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["bun", "./dist/server/entry.mjs"]
