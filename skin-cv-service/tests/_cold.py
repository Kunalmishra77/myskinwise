"""Cold-process worker for the determinism test.

Run as ``python -m tests._cold <path-to-image-bytes>`` from the service root. It
imports the pipeline fresh in a brand-new interpreter and prints the canonical
(sorted-key) JSON of the result, minus volatile fields. The determinism test
compares this against the in-process result to prove a cold start produces the
identical answer — catching any hidden dependence on import order, process
state, or an unseeded RNG that a same-process repeat would miss.
"""

from __future__ import annotations

import json
import sys

from app.pipeline.orchestrator import analyze_bytes

# Fields that are allowed to vary and are excluded from the determinism check.
VOLATILE = {"processing_ms", "cached"}


def canonical(result: dict) -> str:
    stripped = {k: v for k, v in result.items() if k not in VOLATILE}
    return json.dumps(stripped, sort_keys=True, ensure_ascii=True)


def main() -> None:
    path = sys.argv[1]
    with open(path, "rb") as fh:
        data = fh.read()
    sys.stdout.write(canonical(analyze_bytes(data)))


if __name__ == "__main__":
    main()
