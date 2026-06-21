#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="${SCRIPT_DIR}/../server"

if [[ ! -d "$SERVER_DIR" ]]; then
    echo "Server not set up. Run ./setup-paper-server.sh first."
    exit 1
fi

cd "$SERVER_DIR"
exec ./start.sh
