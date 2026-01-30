#!/bin/bash
set -e

echo "=== Starting Application ==="

echo "Running database reset..."
bun run db:reset

echo "Running database migrations..."
bun run db:up

echo "Running database seeds..."
bun run db:seed

echo "Starting server..."
exec bun dist/server/entry.mjs
