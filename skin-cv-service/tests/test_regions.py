"""Region-labelling logic (_dominant_regions). Pure numpy — no cv2/mediapipe —
so it runs anywhere. Validates that a concern's evidence maps to the friendly
display areas we show on the result, and that fine regions fold correctly."""

from __future__ import annotations

import numpy as np

from app.pipeline.orchestrator import _dominant_regions


def _box(shape, x0, y0, x1, y1):
    m = np.zeros(shape, dtype=np.uint8)
    m[y0:y1, x0:x1] = 255
    return m


def test_picks_the_area_the_evidence_is_in():
    shape = (100, 100)
    masks = {
        "left_cheek": _box(shape, 0, 40, 40, 80),
        "right_cheek": _box(shape, 60, 40, 100, 80),
        "forehead": _box(shape, 20, 0, 80, 25),
    }
    ev = _box(shape, 5, 45, 35, 75)  # entirely in the left cheek
    assert _dominant_regions(ev, masks) == ["left cheek"]


def test_no_or_tiny_evidence_returns_nothing():
    shape = (100, 100)
    assert _dominant_regions(None, {}) == []
    assert _dominant_regions(np.zeros(shape, dtype=np.uint8), {}) == []


def test_glabella_folds_into_forehead():
    shape = (100, 100)
    masks = {"forehead": _box(shape, 20, 0, 80, 20), "glabella": _box(shape, 40, 12, 60, 30)}
    ev = _box(shape, 30, 5, 70, 28)  # spans both fine regions
    assert _dominant_regions(ev, masks) == ["forehead"]


def test_both_under_eyes_collapse_to_one_area():
    shape = (100, 100)
    masks = {
        "left_periorbital": _box(shape, 15, 30, 40, 45),
        "right_periorbital": _box(shape, 60, 30, 85, 45),
    }
    ev = _box(shape, 0, 30, 100, 45)  # across both eyes
    assert _dominant_regions(ev, masks) == ["under the eyes"]


def test_orders_by_share_and_caps_at_three():
    shape = (100, 100)
    masks = {
        "forehead": _box(shape, 0, 0, 100, 10),
        "nose": _box(shape, 40, 40, 60, 60),
        "left_cheek": _box(shape, 0, 40, 30, 70),
        "right_cheek": _box(shape, 70, 40, 100, 70),
        "chin": _box(shape, 40, 85, 60, 100),
    }
    # Most evidence in the nose, a small sliver on each cheek.
    ev = _box(shape, 40, 40, 60, 60) | _box(shape, 0, 40, 10, 50) | _box(shape, 90, 40, 100, 50)
    out = _dominant_regions(ev, masks)
    assert out[0] == "nose"
    assert "left cheek" in out and "right cheek" in out
    assert len(out) <= 3
