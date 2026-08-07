"""skin-cv-service — FastAPI entry.

The determinism pin MUST run before anything numeric is imported, so it is the
very first import.

At this phase (§9 Phase 1) ``/v1/analyze`` is a **deterministic stub**: it hashes
the uploaded bytes and returns a fixed ``ScanResult`` shaped exactly like the
real one (blueprint §6.1). The whole point of shipping the stub first is that the
determinism harness (tests/test_determinism.py) is built and green *before* any
real measurement code exists — retrofitting determinism onto a working pipeline
is far harder than building the guarantee in from the start.
"""

from __future__ import annotations

from app import determinism  # noqa: F401  — side-effect import, must be FIRST

import os
import time

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response

from app import store
from app.config import PIPELINE_VERSION
from app.pipeline.orchestrator import analyze_bytes, MODEL_HASHES

app = FastAPI(title="skin-cv-service", version=PIPELINE_VERSION)

# When set, every /v1 request must carry `Authorization: Bearer <API_TOKEN>`.
# Coolify sets this so only the Next.js server (which holds the same secret) can
# reach the service; the browser never calls it directly. Unset in local dev.
_API_TOKEN = os.environ.get("API_TOKEN")

# Max upload the service will accept (blueprint §6.1: 12MB).
_MAX_BYTES = 12 * 1024 * 1024


def _require_auth(authorization: str | None) -> None:
    if not _API_TOKEN:
        return  # open in local dev; Coolify sets API_TOKEN in prod.
    expected = f"Bearer {_API_TOKEN}"
    # Constant-time-ish compare; token is short and this isn't the crypto core.
    if not authorization or authorization != expected:
        raise HTTPException(status_code=401, detail="unauthorized")


@app.get("/healthz")
def healthz() -> dict[str, object]:
    """Liveness + provenance: which pipeline and which model weights are live."""
    return {"status": "ok", "pipeline_version": PIPELINE_VERSION, "models": MODEL_HASHES}


@app.post("/v1/analyze")
async def analyze(
    image: UploadFile = File(...),
    authorization: str | None = Header(default=None),
) -> JSONResponse:
    _require_auth(authorization)

    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty image")
    if len(data) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="image too large")

    started = time.perf_counter()
    try:
        result = analyze_bytes(data)
    except Exception as exc:  # never leak a bare 500; surface a diagnosable error
        import traceback

        return JSONResponse(
            {
                "error": "pipeline_error",
                "detail": f"{type(exc).__name__}: {exc}",
                "where": traceback.format_exc().strip().splitlines()[-3:],
            },
            status_code=500,
        )
    # Wall-clock is deliberately OUTSIDE the deterministic result body — it is
    # the one field that legitimately varies and it is excluded from the
    # determinism comparison (see tests/test_determinism.py).
    result["processing_ms"] = round((time.perf_counter() - started) * 1000, 1)

    # A photo the capture gate rejected is a 422 with an actionable reason, not
    # a "successful" analysis of an unusable image (blueprint §4.1, §6.1).
    quality = result.get("quality", {})
    if not quality.get("passed", False):
        return JSONResponse(
            {
                "error": "capture_quality_failed",
                "reason_code": quality.get("reason_code"),
                "user_message": quality.get("user_message"),
                "scan_id": result.get("scan_id"),
                "image_sha256": result.get("image_sha256"),
                "quality": quality,
                "retryable": True,
            },
            status_code=422,
        )
    return JSONResponse(result, status_code=200)


@app.get("/v1/scans/{scan_id}")
def get_scan(scan_id: str, authorization: str | None = Header(default=None)) -> JSONResponse:
    """Re-fetch a stored ScanResult (scores are sensitive → keep it auth'd)."""
    _require_auth(authorization)
    result = store.get_result(scan_id)
    if result is None:
        raise HTTPException(status_code=404, detail="scan not found")
    return JSONResponse(result, status_code=200)


@app.get("/v1/scans/{scan_id}/masks/{concern}.png")
def get_scan_mask(scan_id: str, concern: str) -> Response:
    """The colour-coded evidence overlay for a concern.

    No auth: the PNG contains only a coloured region + outline, never any face
    pixels, so it can be dropped straight into an <img> in the browser (which
    can't send a bearer token) without exposing the photo.
    """
    png = store.get_mask(scan_id, concern)
    if png is None:
        raise HTTPException(status_code=404, detail="mask not found")
    return Response(content=png, media_type="image/png", headers={"cache-control": "public, max-age=3600"})
