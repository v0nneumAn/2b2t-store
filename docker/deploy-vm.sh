#!/bin/bash
set -e

# Deploy 2b2t Store to a Tailscale VM using Docker Compose.
# Run from the docker/ directory on the VM.

ENV_FILE="${ENV_FILE:-.env.vm}"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.vm.yml"

if [ ! -f "$ENV_FILE" ]; then
    echo "Environment file not found: $ENV_FILE"
    echo "Copy .env.vm.example to $ENV_FILE and fill in real values."
    exit 1
fi

echo "Pulling latest code..."
git -C .. pull origin main || true

echo "Building and starting services..."
docker compose $COMPOSE_FILES --env-file "$ENV_FILE" up -d --build

echo "Waiting for backend to become healthy..."
sleep 5

echo "Seeding demo data..."
docker exec store-backend python scripts/seed_demo.py || true

FRONTEND_URL=$(grep '^FRONTEND_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')

echo ""
echo "Deployment complete."
echo "Web:    ${FRONTEND_URL:-http://<your-domain>}"
echo "API:    ${FRONTEND_URL:-http://<your-domain>}:8000"
echo "Admin:  ${FRONTEND_URL:-http://<your-domain>}/admin"
