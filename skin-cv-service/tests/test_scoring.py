"""Scoring calibration (blueprint §5) — pure, runs anywhere PyYAML is present."""

from __future__ import annotations

import pytest

pytest.importorskip("yaml")

from app import config
from app.scoring import calibrate


def test_interp_clamps_and_interpolates():
    anchors = [[0.0, 100], [10.0, 0]]
    assert calibrate._interp(-5, anchors) == 100.0   # below → first
    assert calibrate._interp(20, anchors) == 0.0     # above → last
    assert calibrate._interp(5, anchors) == 50.0     # midpoint


def test_round_half_even():
    # 0.05 → 0.0 (round-half-even), 0.15 → 0.2
    assert calibrate.round_score(0.05) == 0.0
    assert calibrate.round_score(0.15) == 0.2


def test_score_for_lower_is_better():
    config.clear_cache()
    # pigmentation: 0% affected → 100; a large area → low score
    assert calibrate.score_for("pigmentation", 0.0) == 100.0
    assert calibrate.score_for("pigmentation", 30.0) == 0.0
    mid = calibrate.score_for("pigmentation", 3.0)
    assert 60.0 <= mid <= 70.0


def test_severity_bands_cover_full_range():
    assert calibrate.severity_for(95) == "clear"
    assert calibrate.severity_for(70) == "mild"
    assert calibrate.severity_for(50) == "moderate"
    assert calibrate.severity_for(10) == "significant"


def test_every_concern_has_anchors():
    config.clear_cache()
    for concern in ("pigmentation", "redness", "dark_circles", "wrinkles", "pores", "oiliness", "texture"):
        anchors = config.get("anchors_v1", concern, "anchors")
        assert anchors and anchors == sorted(anchors), f"{concern} anchors must be ascending"
