# hello-ai

First attempt to build a website for discovering genetic mutations, using PubMed search and Transvar tools.

---

## BioMNI Local Deployment

[BioMNI](https://github.com/snap-stanford/biomni) is a general-purpose biomedical AI agent.

### System Requirements

| Item | Requirement |
|------|-------------|
| OS | Ubuntu 22.04 / 24.04 (x86_64) |
| Disk | ≥ 13 GB (basic), ≥ 30 GB (full E1) |
| API key | Anthropic API key (required) |

### Quick Start

```bash
# Basic environment (fastest, recommended for trying it out)
bash setup_biomni.sh basic

# Reduced environment (no R/CLI tools, ~13 GB)
bash setup_biomni.sh reduced

# Full E1 environment (all bioinformatics tools, ~30 GB, ~10 hours)
bash setup_biomni.sh full
```

After setup, edit `~/Biomni/.env` and add your `ANTHROPIC_API_KEY`, then:

```bash
conda activate biomni_e1
python -c "
from biomni.agent import BioAgent
agent = BioAgent(task='Summarize recent findings on BRCA1 mutations')
agent.go()
"
```

### Optional: Gradio Web UI

```bash
pip install 'gradio>=5.0,<6.0'
```

### Notes

- First run automatically downloads ~11 GB of datalake files.  
  Skip with `expected_data_lake_files=[]` during development.
- See `~/Biomni/docs/known_conflicts.md` for dependency conflict workarounds.
