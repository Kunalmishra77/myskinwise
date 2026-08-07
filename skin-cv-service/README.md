# skin-cv-service

Deterministic skin-analysis engine (blueprint: `docs/SKIN_ANALYSIS_BLUEPRINT.md`).
A separate Python service so OpenCV / MediaPipe / ONNX Runtime with proper thread
control are first-class. **No LLM in the measurement path.**

> **Status: Phase 1 (scaffold + determinism harness).** `/v1/analyze` returns a
> deterministic *stub* ScanResult. The current customer-facing scan (OpenAI
> vision, in the Next.js app) stays LIVE and untouched until this engine passes
> Phase 6/7 — see `docs/REMOVAL_AUDIT.md`.

## Core guarantee

Same input image → byte-identical output, forever. Enforced by
`tests/test_determinism.py` (same-process ×20 + cold subprocess) and
`tests/test_golden_files.py`, both CI blockers. See blueprint §2.

## Run locally

```bash
cd skin-cv-service
python -m pip install -r requirements-dev.txt
python -m pytest -q                 # determinism + golden, must be green
uvicorn app.main:app --reload       # http://localhost:8000/healthz
```

`POST /v1/analyze` (multipart `image=@face.jpg`) returns the ScanResult shape
(blueprint §6.1). If `API_TOKEN` is set, requests need
`Authorization: Bearer <token>`.

## Deploy on Coolify (Hostinger VPS)

1. **New Resource → Application → Docker (Dockerfile)**, point it at this repo,
   **Base Directory `/skin-cv-service`**. Coolify builds the `Dockerfile` here.
2. **Port:** `8000`.
3. **Domain:** e.g. `scan-api.myskinwise.com` (add the DNS A record → VPS IP;
   Coolify issues the HTTPS cert).
4. **Environment:**
   - `API_TOKEN` — a long random secret. The Next.js app sends it as a bearer
     token; the browser never calls this service.
   - `WEB_CONCURRENCY` — set to the VPS vCPU count (parallelism across requests;
     each worker stays single-threaded internally for determinism).
5. **Health check path:** `/healthz`.
6. Deploy. Verify: `curl https://scan-api.myskinwise.com/healthz` →
   `{"status":"ok","pipeline_version":"…","models":{}}`.

On the **Vercel** side (later, at the Phase 6/7 swap), set the matching
`SKIN_CV_URL` + `SKIN_CV_TOKEN` env so `/api/v1/analysis` can proxy here.

## Layout

```
app/
  main.py              FastAPI: /healthz, POST /v1/analyze
  determinism.py       seed/thread pinning, imported first (R9)
  config.py            versioned YAML loader, raises on missing key
  pipeline/
    orchestrator.py    stage sequencing + ScanResult shape (stub for now)
config/                every threshold, versioned (no magic numbers in code)
models/                weights + MODELS.md provenance (empty until Phase 5)
tests/                 determinism + golden (CI blockers)
```

## Determinism rules (do not break — blueprint §2.2)

R2 ONNX Runtime, `intra_op_num_threads=1` · R4 fixed preprocessing · R5
deterministic NMS · R6 no float sums over unordered sets · R7 `Decimal`
ROUND_HALF_EVEN at the boundary · R8 SHA-256 content cache · R9 pinned seeds ·
R10 exact dependency pins.
