"""Determinism acceptance test (blueprint §2.3) — a CI blocker.

Same input image -> byte-identical output, in the same process AND in a cold
subprocess. This is the guarantee the whole engine is built around; it is
written and kept green from Phase 1 (against the stub) so real stages can only
ever be added *without* breaking it.

Volatile fields (wall-clock ``processing_ms``, ``cached``) are excluded — they
legitimately vary and are not part of the measurement.

NOTE: the blueprint calls for 50 real, Fitzpatrick-diverse fixture images. Until
those are committed (they arrive with Phase 2's capture work), this exercises the
same harness over deterministic synthetic byte payloads, which is sufficient to
prove the pipeline is a pure function of its input. Swap in real fixtures without
changing the assertions.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from app.pipeline.orchestrator import analyze_bytes
from tests._cold import canonical

ROOT = Path(__file__).resolve().parent.parent
N_FIXTURES = 50
RUNS = 20  # repeat the whole comparison this many times — zero tolerance.


def _payloads() -> list[bytes]:
    """Deterministic stand-in 'images': fixed pseudo-bytes, no RNG."""
    return [bytes((i * 37 + j * 13) % 256 for j in range(2048)) for i in range(N_FIXTURES)]


@pytest.mark.parametrize("run", range(RUNS))
def test_same_process_is_identical(run: int) -> None:
    for data in _payloads():
        r1 = canonical(analyze_bytes(data))
        r2 = canonical(analyze_bytes(data))
        assert r1 == r2


def test_cold_subprocess_matches(tmp_path: Path) -> None:
    env = dict(os.environ)
    env["PYTHONHASHSEED"] = "0"  # inherited by the cold interpreter
    for idx, data in enumerate(_payloads()):
        warm = canonical(analyze_bytes(data))
        fixture = tmp_path / f"fx_{idx}.bin"
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


def test_result_is_pure_function_of_bytes() -> None:
    """Different bytes -> different scan_id/hash; identical bytes -> identical."""
    a, b = _payloads()[0], _payloads()[1]
    ra, rb = analyze_bytes(a), analyze_bytes(b)
    assert ra["image_sha256"] != rb["image_sha256"]
    assert analyze_bytes(a)["scan_id"] == ra["scan_id"]
    # The canonical body carries no wall-clock, so it must round-trip exactly.
    assert canonical(ra) == canonical(analyze_bytes(a))
    assert json.loads(json.dumps(ra))  # serialisable
