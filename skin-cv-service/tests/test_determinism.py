"""Determinism acceptance test (blueprint §2.3) — a CI blocker.

Same input image -> byte-identical output, in the same process AND in a cold
subprocess. This is the guarantee the whole engine is built around.

From Phase 2 the pipeline decodes a real image and runs MediaPipe + OpenCV, so
this needs those deps installed — it runs in CI (and in the Docker image), and
is skipped locally where they aren't present. Volatile fields (``processing_ms``,
``cached``) are excluded from the comparison.

The synthetic images below carry no detectable face, so the gate deterministically
returns NO_FACE — which is fine: we are proving *determinism*, not a passing
scan. Real Fitzpatrick-diverse fixtures (which exercise the passing path) join in
Phase 4 when scores become the thing under test.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

cv2 = pytest.importorskip("cv2")
np = pytest.importorskip("numpy")
pytest.importorskip("mediapipe")

from app.pipeline.orchestrator import analyze_bytes
from tests._cold import canonical

ROOT = Path(__file__).resolve().parent.parent
N_FIXTURES = 3
RUNS = 3


def _png_bytes() -> list[bytes]:
    """Deterministic valid PNGs (fixed gradients, no RNG)."""
    out = []
    for i in range(N_FIXTURES):
        img = np.zeros((256, 256, 3), dtype=np.uint8)
        yy, xx = np.mgrid[0:256, 0:256]
        img[:, :, 0] = ((xx + i * 20) % 256).astype(np.uint8)
        img[:, :, 1] = ((yy + i * 40) % 256).astype(np.uint8)
        img[:, :, 2] = ((xx + yy + i * 60) % 256).astype(np.uint8)
        ok, buf = cv2.imencode(".png", img)
        assert ok
        out.append(buf.tobytes())
    return out


@pytest.mark.parametrize("run", range(RUNS))
def test_same_process_is_identical(run: int) -> None:
    for data in _png_bytes():
        assert canonical(analyze_bytes(data)) == canonical(analyze_bytes(data))


def test_cold_subprocess_matches(tmp_path: Path) -> None:
    env = dict(os.environ)
    env["PYTHONHASHSEED"] = "0"
    for idx, data in enumerate(_png_bytes()):
        warm = canonical(analyze_bytes(data))
        fixture = tmp_path / f"fx_{idx}.png"
        fixture.write_bytes(data)
        proc = subprocess.run(
            [sys.executable, "-m", "tests._cold", str(fixture)],
            cwd=str(ROOT),
            env=env,
            capture_output=True,
            text=True,
        )
        assert proc.returncode == 0, proc.stderr
        assert proc.stdout == warm, f"cold != warm for fixture {idx}"


def test_result_shape_is_stable() -> None:
    result = analyze_bytes(_png_bytes()[0])
    assert set(result) >= {
        "scan_id",
        "pipeline_version",
        "image_sha256",
        "quality",
        "skin_tone",
        "concerns",
        "derived",
    }
    assert len(result["concerns"]) == 8
    assert "passed" in result["quality"] and "checks" in result["quality"]
    # No detectable face in a synthetic gradient -> deterministic NO_FACE.
    assert result["quality"]["passed"] is False
    assert result["quality"]["reason_code"] == "NO_FACE"
