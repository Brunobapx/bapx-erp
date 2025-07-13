#!/bin/bash

# Production deployment script
set -e

echo "🚀 Starting deployment..."

# Build and tag the image
echo "📦 Building Docker image..."
docker build -t erp-system:latest .

# Stop and remove existing container
echo "🛑 Stopping existing container..."
docker stop erp-system 2>/dev/null || true
docker rm erp-system 2>/dev/null || true

# Start new container
echo "🔄 Starting new container..."
docker run -d \
  --name erp-system \
  --restart unless-stopped \
  -p 3000:80 \
  --env-file .env \
  erp-system:latest

echo "✅ Deployment completed!"
echo "🌐 Application available at http://localhost:3000"

# Health check
echo "🔍 Performing health check..."
sleep 5
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    docker logs erp-system --tail 20
    exit 1
fi