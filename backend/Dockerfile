FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for TransVar
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# TransVar annotation databases are mounted as a volume at runtime.
# To download them: docker exec <container> transvar config --download_anno --refversion hg38

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
