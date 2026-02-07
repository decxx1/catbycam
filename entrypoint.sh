#!/bin/sh
# Fix ownership of the uploads volume (mounted as root by Docker/Coolify)
chown -R bun:bun /app/dist/client/uploads 2>/dev/null || true

# Drop privileges and run the start script as 'bun'
exec su -s /bin/sh bun -c "bun src/db/start.ts"
