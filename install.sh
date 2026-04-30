#!/bin/bash
set -e

echo "================================================"
echo "   Biomni 安装脚本（macOS Apple Silicon）"
echo "================================================"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
  echo "错误：Docker 未运行，请先启动 Docker Desktop"
  exit 1
fi

# 创建工作目录
mkdir -p ~/biomni-workspace/data
cd ~/biomni-workspace

# 创建 .env 文件
if [ ! -f .env ]; then
  cat > .env << 'EOF'
GEMINI_API_KEY=your_gemini_api_key_here
EOF
fi

# 检查 API Key 是否已填写
if grep -q "your_gemini_api_key_here" .env; then
  echo "请先填写你的 Gemini API Key："
  echo ""
  read -p "粘贴你的 Gemini API Key（AIza...）: " api_key
  if [ -z "$api_key" ]; then
    echo "错误：API Key 不能为空"
    exit 1
  fi
  echo "GEMINI_API_KEY=$api_key" > .env
  echo ""
fi

echo ">>> 拉取 Ubuntu 22.04 镜像..."
docker pull --platform linux/amd64 ubuntu:22.04

# 创建容器内安装脚本
cat > /tmp/biomni_setup.sh << 'INNEREOF'
#!/bin/bash
set -e

echo ""
echo ">>> [1/5] 安装系统依赖..."
apt-get update -q && apt-get install -y wget git curl > /dev/null

echo ">>> [2/5] 安装 Miniconda..."
wget -q https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh
bash /tmp/miniconda.sh -b -p /opt/miniconda3
eval "$(/opt/miniconda3/bin/conda shell.bash hook)"

# 写入 bashrc 便于每次启动自动激活
{
  echo 'eval "$(/opt/miniconda3/bin/conda shell.bash hook)"'
  echo 'conda activate biomni_e1 2>/dev/null || true'
  echo 'export $(cat /workspace/.env | grep -v "^#" | grep -v "^$" | xargs) 2>/dev/null || true'
} >> /root/.bashrc

echo ">>> [3/5] Clone Biomni 仓库..."
git clone https://github.com/snap-stanford/Biomni.git /workspace/Biomni

echo ">>> [4/5] 创建 conda 环境（约 13 GB，需要 30~60 分钟，请耐心等待）..."
cd /workspace/Biomni/biomni_env
conda env create -f fixed_env.yml

echo ">>> [5/5] 安装 biomni 及 Gemini 支持..."
source /opt/miniconda3/bin/activate biomni_e1
pip install --quiet biomni --upgrade
pip install --quiet langchain-google-genai

echo ""
echo ">>> 验证安装..."
python -c "from biomni.agent import A1; print('Biomni 安装成功！')"
INNEREOF

echo ""
echo ">>> 在容器内安装 Biomni（预计 30~60 分钟）..."
echo "    期间请勿关闭终端"
echo ""

docker run --rm \
  --platform linux/amd64 \
  -v biomni_env:/opt/miniconda3 \
  -v biomni_repo:/workspace/Biomni \
  -v "$(pwd)/data":/workspace/data \
  -v /tmp/biomni_setup.sh:/setup.sh \
  ubuntu:22.04 bash /setup.sh

echo ""
echo "================================================"
echo "   安装完成！"
echo "================================================"
echo ""
echo "使用方法："
echo "  bash ~/biomni-workspace/run.sh"
echo ""
