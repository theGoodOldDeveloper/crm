#!/bin/sh
set -e

echo "🚀 Starting CRM..."

echo "⏳ Pushing database schema..."
node node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate

echo "🌱 Running seed if needed..."
node prisma/seed.js || echo "⚠️  Seed skipped (non-fatal)"

echo "✅ Starting Next.js on port 3002..."
exec node server.js
