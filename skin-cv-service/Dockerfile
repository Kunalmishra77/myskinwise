# skin-cv-service — deployed as a container on the Hostinger VPS via Coolify.
# CPU-only: a single YOLO-nano forward pass on CPU is fast enough and CPU
# inference is far easier to keep deterministic than GPU (blueprint §13).
FROM python:3.11-slim

# System libraries OpenCV + MediaPipe need at runtime (headless: no GUI libs).
RUN apt-get update && apt-get install -y --no-install-recommends \
      libgl1 \
      libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=0 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv

# Install deps first for layer caching. Production pins only — no torch.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# One worker per vCPU (parallelism ACROSS requests), but intra-op threads stay
# at 1 INSIDE each worker — that single-threading is what preserves determinism
# under load (blueprint §2.2 R2, §13). Set WEB_CONCURRENCY in Coolify to the
# VPS vCPU count.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-1}"]
