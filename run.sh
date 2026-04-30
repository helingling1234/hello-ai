#!/bin/bash

cd ~/biomni-workspace

echo "启动 Biomni 环境..."
echo "（输入 exit 退出）"
echo ""

docker run -it --rm \
  --platform linux/amd64 \
  -v biomni_env:/opt/miniconda3 \
  -v biomni_repo:/workspace/Biomni \
  -v "$(pwd)/data":/workspace/data \
  -v "$(pwd)/.env":/workspace/.env \
  -w /workspace \
  ubuntu:22.04 bash
