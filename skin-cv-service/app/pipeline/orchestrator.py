"""Pipeline orchestrator — sequences the stages and shapes the ScanResult.

Phase 1 is a **deterministic stub**: it derives everything from the SHA-256 of
the image bytes, so the same file always yields byte-identical output (rule R8's
content-addressing is the ultimate backstop, and here it is trivially satisfied
because the output is a pure function of the bytes).

As real stages land (Phase 2 gate, Phase 3 normalisation, Phase 4 metrics, …)
the body of ``analyze_bytes`` grows to call them in order. The *shape* returned
here is the contract the Next.js app depends on (blueprint §6.1), so it is fixed
now and stays stable.
"""

from __future__ import annotations

import hashlib
from typing import Any

from app.config import PIPELINE_VERSION

# SHA-256 of each shipped model weight file, surfaced at /healthz for provenance.
# Empty until Phase 5 ships the acne ONNX model.
MODEL_HASHES: dict[str, str] = {}

# The eight concerns the engine will measure (blueprint §1.3). Listed here so the
# stub returns the real shape; scores become live per-metric in Phase 4/5.
_CONCERNS = [
    "acne",
    "pigmentation",
    "redness",
    "dark_circles",
    "wrinkles",
    "pores",
    "oiliness",
    "texture",
]


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _empty_concerns() -> list[dict[str, Any]]:
    return [
        {
            "id": concern,
            "score": None,  # real 0..100 scores land in Phase 4/5 + 6
            "severity": None,
            "confidence": None,
            "raw": {},
            "by_region": {},
            "mask_url": None,
        }
        for concern in _CONCERNS
    ]


def analyze_bytes(data: bytes) -> dict[str, Any]:
    """Return a ScanResult for the given image bytes.

    Deterministic by construction: a pure function of the bytes (same file →
    identical output). Phase 2 runs the real capture-quality gate; measurement
    scores are still stubbed (null) until Phase 4.
    """
    digest = _sha256(data)
    base = {
        # Deterministic id derived from the content, not a random uuid.
        "scan_id": f"scn_{digest[:20]}",
        "pipeline_version": PIPELINE_VERSION,
        "image_sha256": digest,
        "cached": False,  # excluded from the determinism comparison
    }

    # Heavy deps are imported here (not at module top) so the package stays
    # importable for config/determinism harness setup without cv2/mediapipe.
    import cv2
    import numpy as np

    from app import config
    from app.pipeline import s1_gate, s2_landmarks

    img = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return {
            **base,
            "quality": {
                "passed": False,
                "reason_code": "INVALID_IMAGE",
                "user_message": "That file isn't a readable image — please upload a JPG or PNG photo.",
                "checks": [],
            },
            "skin_tone": {"median_ita_deg": None, "fitzpatrick_estimate": None, "note": "descriptive_only_not_a_concern"},
            "concerns": _empty_concerns(),
            "derived": {"skin_type": None, "skin_age_estimate": None, "skin_age_confidence": None},
        }

    min_conf = config.get("gate_v1", "face", "min_detection_confidence")
    faces = s2_landmarks.extract_landmarks(img, min_conf)
    quality = s1_gate.run_gate(img, faces)

    return {
        **base,
        "quality": quality,
        "skin_tone": {
            "median_ita_deg": None,
            "fitzpatrick_estimate": None,
            "note": "descriptive_only_not_a_concern",
        },
        "concerns": _empty_concerns(),
        "derived": {
            "skin_type": None,
            "skin_age_estimate": None,
            "skin_age_confidence": None,
        },
    }
