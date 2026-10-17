#!/usr/bin/env bash
# with_dev.sh — keep the vite DEV server (mock core) alive while an
# audit command runs against it (agent-browser screenshot passes).
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${DISKWIZARD_PORT:-1430}"
LOG=/tmp/diskwizard-vite.log

if curl -s "http://localhost:${PORT}" > /dev/null 2>&1; then
  echo "dev server already up on :${PORT}"
  exec "$@"
fi

npx vite --port "${PORT}" --strictPort >"${LOG}" 2>&1 &
VITE_PID=$!
trap 'kill ${VITE_PID} 2>/dev/null || true' EXIT

for _ in $(seq 1 60); do
  if curl -s "http://localhost:${PORT}" > /dev/null 2>&1; then
    echo "dev server ready on :${PORT}"
    exec "$@"
  fi
  sleep 0.5
done

echo "dev server failed to start (see ${LOG})" >&2
exit 1
