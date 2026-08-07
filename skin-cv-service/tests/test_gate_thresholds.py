"""Capture-gate threshold logic (blueprint §4.1, Phase 2).

Tests the PURE check functions against the REAL shipped thresholds
(config/gate_v1.yaml) — no MediaPipe, no photo needed, so it runs anywhere
PyYAML is available. The image-measurement helpers (blur/pose/IPD on real
pixels) are validated end-to-end against real faces on the deployed service.
"""

from __future__ import annotations

import pytest

pytest.importorskip("yaml")  # config loader needs PyYAML

from app import config
from app.pipeline import s1_gate as g


@pytest.fixture(scope="module")
def cfg() -> dict:
    config.clear_cache()
    return {
        "face": config.get("gate_v1", "face"),
        "blur": config.get("gate_v1", "blur"),
        "exposure": config.get("gate_v1", "exposure"),
        "clipping": config.get("gate_v1", "clipping"),
        "pose": config.get("gate_v1", "pose"),
        "distance": config.get("gate_v1", "distance"),
        "lighting_evenness": config.get("gate_v1", "lighting_evenness"),
    }


def test_face_count(cfg):
    assert g.check_face_count(0, cfg).code == "NO_FACE"
    assert g.check_face_count(1, cfg).passed
    assert g.check_face_count(2, cfg).code == "MULTIPLE_FACES"


def test_blur(cfg):
    assert not g.check_blur(50.0, cfg).passed          # blurry
    assert g.check_blur(500.0, cfg).passed             # sharp
    assert g.check_blur(cfg["blur"]["min_variance"], cfg).passed  # exactly at bar


def test_exposure(cfg):
    assert g.check_exposure(20.0, cfg).code == "TOO_DARK"
    assert g.check_exposure(60.0, cfg).passed
    assert g.check_exposure(90.0, cfg).code == "TOO_BRIGHT"


def test_clipping(cfg):
    assert g.check_clipping(0.5, cfg).passed
    assert g.check_clipping(10.0, cfg).code == "CLIPPING"


def test_pose(cfg):
    ok = g.check_pose(2.0, -1.0, 0.5, cfg)
    assert all(c.passed for c in ok)
    yaw, pitch, roll = g.check_pose(30.0, 30.0, 30.0, cfg)
    assert yaw.code == "POSE_YAW" and not yaw.passed
    assert pitch.code == "POSE_PITCH" and not pitch.passed
    assert roll.code == "POSE_ROLL" and not roll.passed


def test_distance(cfg):
    assert g.check_distance(50.0, cfg).code == "TOO_FAR"
    assert g.check_distance(168.0, cfg).passed
    assert g.check_distance(400.0, cfg).code == "TOO_CLOSE"


def test_evenness(cfg):
    assert g.check_evenness(4.0, cfg).passed
    assert g.check_evenness(30.0, cfg).code == "UNEVEN_LIGHTING"


def test_pick_reason_respects_priority():
    priority = config.get("gate_v1", "priority")
    # Two failures at once: NO_FACE outranks UNEVEN_LIGHTING.
    checks = [
        g.Check("lighting_evenness", False, 30, "<=12", "UNEVEN_LIGHTING"),
        g.Check("face", False, 0, ">=1", "NO_FACE"),
    ]
    assert g.pick_reason(checks, priority) == "NO_FACE"
    # All good -> no reason.
    assert g.pick_reason([g.Check("blur", True, 500, ">=120", "BLUR_TOO_HIGH")], priority) is None


def test_messages_exist_for_every_priority_code():
    priority = config.get("gate_v1", "priority")
    messages = config.get("gate_v1", "messages")
    for code in priority:
        assert code in messages and messages[code], f"missing message for {code}"
