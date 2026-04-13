#!/bin/bash
# MutSearch startup script
set -e

REPO="$(cd "$(dirname "$0")" && pwd)"

echo "=== MutSearch Startup ==="
echo ""

# Check Python deps
if ! python3 -c "import fastapi" 2>/dev/null; then
  echo "[1/3] Installing Python dependencies..."
  pip install setuptools==67.8.0 -q
  pip install -r "$REPO/backend/requirements.txt" -q
else
  echo "[1/3] Python dependencies OK"
fi

# Kill existing processes on these ports
pkill -f "uvicorn app.main" 2>/dev/null || true

# Start backend
echo "[2/3] Starting backend on http://0.0.0.0:8000 ..."
cd "$REPO/backend"
uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/mutsearch-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
for i in $(seq 1 10); do
  if curl -sf http://localhost:8000/api/health >/dev/null 2>&1; then
    echo "    Backend ready!"
    break
  fi
  sleep 1
done

# Install frontend deps if needed
if [ ! -d "$REPO/frontend/node_modules" ]; then
  echo "[3/3] Installing frontend dependencies..."
  cd "$REPO/frontend" && npm install -q
fi

# Start frontend
echo "[3/3] Starting frontend on http://0.0.0.0:3000 ..."
cd "$REPO/frontend"
npm run dev -- --hostname 0.0.0.0 > /tmp/mutsearch-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
for i in $(seq 1 15); do
  if curl -sf http://localhost:3000 >/dev/null 2>&1; then
    echo "    Frontend ready!"
    break
  fi
  sleep 1
done

echo ""
echo "=== MutSearch is running ==="
echo ""
echo "  Website:  http://localhost:3000"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Logs:"
echo "  Backend:  /tmp/mutsearch-backend.log"
echo "  Frontend: /tmp/mutsearch-frontend.log"
echo ""
echo "Note: TransVar annotation databases need to be downloaded for variant"
echo "      annotation to work:"
echo "      transvar config --download_anno --refversion hg38"
echo ""
echo "Press Ctrl+C to stop."

wait $BACKEND_PID $FRONTEND_PID
