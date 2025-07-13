#!/bin/bash

# Development with Docker
set -e

echo "🛠️ Starting development environment..."

# Build development image
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build

# Start services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

echo "✅ Development environment started!"
echo "🌐 Application available at http://localhost:3000"
echo "📝 View logs: docker-compose logs -f"