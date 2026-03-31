#!/bin/bash
# pansclaw gateway launcher
# Loads environment variables from .env and starts the gateway

set -e

cd "$(dirname "$0")/.."

# Load all env vars from .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Start gateway with pansclaw config
exec pnpm openclaw gateway --port 18889 --bind loopback "$@"
