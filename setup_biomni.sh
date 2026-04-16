#!/usr/bin/env bash
# BioMNI local deployment script for Ubuntu 22.04/24.04 x86_64
set -e

BIOMNI_DIR="$HOME/Biomni"
CONDA_DIR="$HOME/miniconda3"
ENV_TYPE="${1:-basic}"   # basic | reduced | full

echo "=== BioMNI Local Deployment ==="
echo "Environment type: $ENV_TYPE  (options: basic | reduced | full)"
echo ""

# ── 1. Install Miniconda if not present ────────────────────────────────────
if ! command -v conda &>/dev/null; then
  echo "[1/5] Installing Miniconda..."
  MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh"
  curl -fsSL "$MINICONDA_URL" -o /tmp/miniconda.sh
  bash /tmp/miniconda.sh -b -p "$CONDA_DIR"
  rm /tmp/miniconda.sh
  eval "$("$CONDA_DIR/bin/conda" shell.bash hook)"
  conda init bash
  echo "Miniconda installed at $CONDA_DIR"
else
  echo "[1/5] conda already installed: $(conda --version)"
  eval "$(conda shell.bash hook)"
fi

# ── 2. Clone BioMNI repository ─────────────────────────────────────────────
if [ -d "$BIOMNI_DIR" ]; then
  echo "[2/5] BioMNI repo already exists at $BIOMNI_DIR — pulling latest..."
  git -C "$BIOMNI_DIR" pull --ff-only
else
  echo "[2/5] Cloning BioMNI repository..."
  git clone https://github.com/snap-stanford/Biomni.git "$BIOMNI_DIR"
fi

# ── 3. Create conda environment ────────────────────────────────────────────
echo "[3/5] Setting up conda environment (type: $ENV_TYPE)..."
cd "$BIOMNI_DIR/biomni_env"

case "$ENV_TYPE" in
  basic)
    # Fastest option – minimal bioinformatics tools
    conda env create -f environment.yml --name biomni_e1 --yes 2>/dev/null \
      || conda env update -f environment.yml --name biomni_e1 --prune
    ;;
  reduced)
    # No R or CLI tools, but retains core Python packages (~13 GB)
    conda env create -f fixed_env.yml --name biomni_e1 --yes 2>/dev/null \
      || conda env update -f fixed_env.yml --name biomni_e1 --prune
    ;;
  full)
    # Full E1 environment – requires 30 GB disk, ~10 hours
    echo "WARNING: Full E1 setup takes 10+ hours and 30 GB disk space."
    read -p "Continue? [y/N] " confirm
    [[ "$confirm" == [yY] ]] || { echo "Aborted."; exit 1; }
    bash setup.sh
    ;;
  *)
    echo "Unknown environment type: $ENV_TYPE. Choose basic | reduced | full."
    exit 1
    ;;
esac

conda activate biomni_e1

# ── 4. Install BioMNI package ──────────────────────────────────────────────
echo "[4/5] Installing BioMNI Python package..."
pip install biomni --upgrade

# ── 5. Set up API keys ─────────────────────────────────────────────────────
ENV_FILE="$BIOMNI_DIR/.env"
echo "[5/5] Configuring API keys..."
if [ ! -f "$ENV_FILE" ]; then
  cp "$BIOMNI_DIR/.env.example" "$ENV_FILE" 2>/dev/null || cat > "$ENV_FILE" <<'EOF'
# BioMNI API Keys
# At minimum, set ANTHROPIC_API_KEY (required)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional providers
OPENAI_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
EOF
  echo ""
  echo ">>> ACTION REQUIRED: Edit $ENV_FILE and add your Anthropic API key."
else
  echo ".env file already exists at $ENV_FILE"
fi

# ── Done ───────────────────────────────────────────────────────────────────
echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Edit API keys:  nano $ENV_FILE"
echo "  2. Activate env:   conda activate biomni_e1"
echo "  3. Run BioMNI:     python -c \"from biomni.agent import BioAgent; a = BioAgent(task='hello'); a.go()\""
echo ""
echo "Optional: install Gradio web UI"
echo "  pip install 'gradio>=5.0,<6.0'"
