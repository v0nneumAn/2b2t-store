#!/bin/bash
set -e

# Local advert-bot test harness.
# Builds the plugin, seeds the backend with a test conversation, and starts
# backend + Paper + 2 advert bots via Docker Compose.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker/docker-compose.advert.yml"

echo "=== Building advert plugin ==="
cd "${PROJECT_ROOT}/advert-bot/plugin"
./gradlew build

echo "=== Seeding backend with test conversation ==="
cd "${PROJECT_ROOT}/backend"
if [ -d .venv ]; then
    source .venv/bin/activate
fi
DATABASE_URL=sqlite:///./test_store.db python scripts/seed_advert_test.py

echo "=== Starting Docker Compose ==="
cd "${PROJECT_ROOT}/docker"
docker compose -f "${COMPOSE_FILE}" up --build -d

echo ""
echo "=== Services starting ==="
echo "Backend:     http://localhost:8000"
echo "Paper:       localhost:25565"
echo "adbot-alpha: localhost:25566 (proxy port)"
echo "adbot-beta:  localhost:25567 (proxy port)"
echo ""
echo "Watch logs:"
echo "  docker compose -f docker/docker-compose.advert.yml logs -f"
echo ""
echo "Stop:"
echo "  docker compose -f docker/docker-compose.advert.yml down"
