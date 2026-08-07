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


# Which metric extractor feeds which concern id. Acne (M1) is ML → Phase 5.
_METRIC_FOR = {
    "pigmentation": "pigmentation",
    "redness": "redness",
    "dark_circles": "dark_circles",
    "wrinkles": "wrinkles",
    "pores": "pores",
    "oiliness": "oiliness",
    "texture": "texture",
}


def _fitzpatrick_from_ita(ita: float) -> str:
    if ita > 55:
        return "I"
    if ita > 41:
        return "II"
    if ita > 28:
        return "III"
    if ita > 10:
        return "IV"
    if ita > -30:
        return "V"
    return "VI"


def _skin_type(tzone_shine: float, cheek_shine: float) -> str:
    if tzone_shine >= 25 and cheek_shine >= 20:
        return "oily"
    if tzone_shine >= 15 and cheek_shine < 20:
        return "combination"
    if tzone_shine < 8 and cheek_shine < 8:
        return "dry"
    return "normal"


def _measure(image_bgr, landmarks) -> dict[str, Any]:
    """Stages 3–6: normalise → regions → metrics → scores. Pure of I/O."""
    import numpy as np

    from app.pipeline import s3_photometric, s4_geometric, s5_regions, s6_metrics
    from app.scoring import calibrate

    shape = image_bgr.shape[:2]
    masks = s5_regions.build(landmarks, shape)
    norm_bgr, wb_method = s3_photometric.normalise(image_bgr, masks["skin"])
    mmpp = s4_geometric.mm_per_px(landmarks)
    L, a, b = s6_metrics.lab_channels(norm_bgr)

    extractors = {
        "pigmentation": s6_metrics.pigmentation,
        "redness": s6_metrics.redness,
        "dark_circles": s6_metrics.dark_circles,
        "wrinkles": s6_metrics.wrinkles,
        "pores": s6_metrics.pores,
        "oiliness": s6_metrics.oiliness,
        "texture": s6_metrics.texture,
    }

    results: dict[str, dict[str, Any]] = {}
    evidence: dict[str, Any] = {}  # concern -> binary mask (or None)
    for key, fn in extractors.items():
        try:
            raw, value, by_region, mask = fn(norm_bgr, L, a, b, masks, mmpp)
            results[key] = {
                "score": calibrate.score_for(key, value),
                "severity": None,
                "raw": raw,
                "by_region": by_region,
            }
            results[key]["severity"] = calibrate.severity_for(results[key]["score"])
            evidence[key] = mask
        except Exception as exc:  # one metric's bug shouldn't lose the others
            results[key] = {"score": None, "severity": None, "raw": {"error": f"{type(exc).__name__}: {exc}"}, "by_region": {}}
            evidence[key] = None

    concerns = []
    for concern in _CONCERNS:
        if concern == "acne":
            concerns.append({"id": "acne", "score": None, "severity": None, "confidence": None,
                             "raw": {"note": "ML model lands in Phase 5"}, "by_region": {}, "mask_url": None})
            continue
        r = results.get(concern, {})
        concerns.append({
            "id": concern,
            "score": r.get("score"),
            "severity": r.get("severity"),
            "confidence": None if r.get("score") is None else 0.7,
            "raw": r.get("raw", {}),
            "by_region": r.get("by_region", {}),
            "mask_url": None,  # overlay serving lands in Phase 6/7
        })

    # Skin tone (descriptive, never a "concern") + derived attributes.
    skin = masks["skin"] > 0
    ita_med = float(np.median(s6_metrics._ita(L, b)[skin])) if skin.sum() > 50 else 0.0
    oil = results.get("oiliness", {}).get("by_region", {})
    return {
        "_evidence": evidence,
        "skin_tone": {
            "median_ita_deg": round(ita_med, 1),
            "fitzpatrick_estimate": _fitzpatrick_from_ita(ita_med),
            "note": "descriptive_only_not_a_concern",
        },
        "concerns": concerns,
        "derived": {
            "skin_type": _skin_type(float(oil.get("tzone", 0.0)), float(oil.get("cheeks", 0.0))),
            "skin_age_estimate": None,  # needs a calibrated model
            "skin_age_confidence": None,
            "white_balance_method": wb_method,
        },
    }


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

    from app import store

    # R8 — content-addressed cache: same bytes + same pipeline version => the
    # exact stored result, so even a hypothetical bug can't yield two answers.
    key = store.cache_key(digest, PIPELINE_VERSION)
    hit = store.get_cached(key)
    if hit is not None:
        return {**hit, "cached": True}

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

    # Gate passed → run the measurement engine (Stages 3–6). Guarded so a bug in
    # measurement degrades to null scores + an error note, never a 500.
    if quality.get("passed"):
        try:
            measured = _measure(img, faces[0])
            evidence = measured.pop("_evidence", {})
            scan_id = base["scan_id"]

            # Render each concern's evidence mask to a colour-coded transparent
            # PNG, store it, and point the concern at its retrievable URL.
            from app.rendering.mask_renderer import render_overlay, CONCERN_COLOURS

            png_masks: dict[str, bytes] = {}
            for concern in measured["concerns"]:
                m = evidence.get(concern["id"])
                if m is not None and bool((m > 0).any()):
                    png = render_overlay(m, CONCERN_COLOURS.get(concern["id"], (200, 60, 100)))
                    if png:
                        png_masks[concern["id"]] = png
                        concern["mask_url"] = f"/v1/scans/{scan_id}/masks/{concern['id']}.png"

            result = {**base, "quality": quality, **measured}
            store.put(scan_id, key, result, png_masks)
            return result
        except Exception as exc:  # measurement failed after a passing gate
            quality = {**quality, "measurement_error": f"{type(exc).__name__}: {exc}"}

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
