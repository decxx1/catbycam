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

# Stage 2: Runtime
FROM node:20-slim AS runtime
WORKDIR /app

# Copy assets from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

# Expose the application port
EXPOSE 4321

# Start the application
CMD ["node", "./dist/server/entry.mjs"]
