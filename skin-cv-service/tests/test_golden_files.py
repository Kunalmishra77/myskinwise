"""Golden-file test (blueprint §2.3) — a CI blocker.

Locks the exact canonical output for a fixed input. Any code change that alters
the golden output makes this fail, which is the point: a change to the result
shape or values must be a deliberate, reviewed decision accompanied by a
``PIPELINE_VERSION`` bump — never accidental drift.

To intentionally update the golden after a reviewed change:
    python -c "from app.pipeline.orchestrator import analyze_bytes; \
from tests._cold import canonical; \
p=bytes((j*13)%256 for j in range(2048)); \
open('tests/fixtures/expected/golden.json','w').write(canonical(analyze_bytes(p)))"
and bump PIPELINE_VERSION in app/config.py in the same commit.
"""

from __future__ import annotations

from pathlib import Path

from app.pipeline.orchestrator import analyze_bytes
from tests._cold import canonical

GOLDEN = Path(__file__).resolve().parent / "fixtures" / "expected" / "golden.json"

# The exact fixed payload the golden was generated from (fixture index 0).
FIXED_PAYLOAD = bytes((0 * 37 + j * 13) % 256 for j in range(2048))


def test_matches_committed_golden() -> None:
    expected = GOLDEN.read_text(encoding="utf-8")
    actual = canonical(analyze_bytes(FIXED_PAYLOAD))
    assert actual == expected, (
        "Output drifted from the committed golden. If this change is intended, "
        "regenerate golden.json and bump PIPELINE_VERSION in the same commit."
    )
