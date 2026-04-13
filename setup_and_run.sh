#!/bin/bash
# MutSearch — 一键安装并启动
# 第一次运行需要几分钟，之后每次只需要几秒钟

set -e
REPO="$(cd "$(dirname "$0")" && pwd)"

echo "================================================"
echo "  MutSearch 启动脚本"
echo "================================================"
echo ""

# ---- 1. Python 依赖 ----
echo "[1/3] 安装 Python 依赖..."
pip3 install fastapi "uvicorn[standard]" httpx "pydantic>=2.7" pydantic-settings cachetools -q
echo "      ✓ Python 依赖就绪"

# ---- 2. 构建前端 ----
FRONTEND_OUT="$REPO/frontend/out"
if [ ! -d "$FRONTEND_OUT" ]; then
  echo "[2/3] 构建前端（首次需要 1-2 分钟）..."
  cd "$REPO/frontend"
  npm install -q
  npm run build
  echo "      ✓ 前端构建完成"
else
  echo "[2/3] 前端已构建，跳过 ✓"
fi

# ---- 3. 启动后端（同时提供前端页面）----
echo "[3/3] 启动服务器..."
echo ""
echo "================================================"
echo "  网站地址：http://localhost:8000"
echo "  按 Ctrl+C 可以停止服务器"
echo "================================================"
echo ""

cd "$REPO/backend"
uvicorn app.main:app --host 0.0.0.0 --port 8000
