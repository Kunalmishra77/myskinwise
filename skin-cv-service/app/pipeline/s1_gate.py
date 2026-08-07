"""Stage 1 — capture-quality gate (blueprint §4.1).

Split in two so it is fully testable:

  * ``check_*`` functions are PURE — they take an already-measured value plus the
    config and return a Check. Their threshold logic is unit-tested with
    synthetic inputs, no MediaPipe/real photo needed.
  * ``measure_*`` helpers do the image/landmark maths (cv2/numpy). These are
    exercised end-to-end against real faces on the deployed service.

``run_gate`` wires them together and, on failure, reports the SINGLE most-severe
failing check per the priority order in gate_v1.yaml — one clear instruction,
never a wall of errors.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any

import numpy as np

from app import config


@dataclass
class Check:
    name: str
    passed: bool
    value: float | int | None
    threshold: Any
    code: str | None = None  # reason code to surface if this check fails
    error: str | None = None  # set when the measurement itself threw


# --------------------------------------------------------------------------- #
# Pure threshold checks (unit-tested)
# --------------------------------------------------------------------------- #

def check_face_count(n: int, cfg: dict) -> Check:
    max_faces = cfg["face"]["max_faces"]
    if n == 0:
        return Check("face", False, n, f">=1", "NO_FACE")
    if n > max_faces:
        return Check("face", False, n, f"<={max_faces}", "MULTIPLE_FACES")
    return Check("face", True, n, f"<={max_faces}")


def check_blur(variance: float, cfg: dict) -> Check:
    lo = cfg["blur"]["min_variance"]
    return Check("blur", variance >= lo, round(variance, 1), f">={lo}", "BLUR_TOO_HIGH")


def check_exposure(mean_l: float, cfg: dict) -> Check:
    lo = cfg["exposure"]["min_mean_l"]
    hi = cfg["exposure"]["max_mean_l"]
    if mean_l < lo:
        return Check("exposure", False, round(mean_l, 1), f"{lo}..{hi}", "TOO_DARK")
    if mean_l > hi:
        return Check("exposure", False, round(mean_l, 1), f"{lo}..{hi}", "TOO_BRIGHT")
    return Check("exposure", True, round(mean_l, 1), f"{lo}..{hi}")


def check_clipping(clip_pct: float, cfg: dict) -> Check:
    hi = cfg["clipping"]["max_percent"]
    return Check("clipping", clip_pct <= hi, round(clip_pct, 2), f"<={hi}%", "CLIPPING")


def check_pose(yaw: float, pitch: float, roll: float, cfg: dict) -> list[Check]:
    p = cfg["pose"]
    return [
        Check("yaw", abs(yaw) <= p["max_yaw_deg"], round(yaw, 1), f"<= {p['max_yaw_deg']}", "POSE_YAW"),
        Check("pitch", abs(pitch) <= p["max_pitch_deg"], round(pitch, 1), f"<= {p['max_pitch_deg']}", "POSE_PITCH"),
        Check("roll", abs(roll) <= p["max_roll_deg"], round(roll, 1), f"<= {p['max_roll_deg']}", "POSE_ROLL"),
    ]


def check_distance(ipd_px: float, cfg: dict) -> Check:
    lo = cfg["distance"]["min_ipd_px"]
    hi = cfg["distance"]["max_ipd_px"]
    if ipd_px < lo:
        return Check("distance", False, round(ipd_px, 1), f"{lo}..{hi}px", "TOO_FAR")
    if ipd_px > hi:
        return Check("distance", False, round(ipd_px, 1), f"{lo}..{hi}px", "TOO_CLOSE")
    return Check("distance", True, round(ipd_px, 1), f"{lo}..{hi}px")


def check_evenness(delta_l: float, cfg: dict) -> Check:
    hi = cfg["lighting_evenness"]["max_delta_l"]
    return Check("lighting_evenness", delta_l <= hi, round(delta_l, 1), f"<={hi}", "UNEVEN_LIGHTING")


def pick_reason(checks: list[Check], priority: list[str]) -> str | None:
    """The single most-severe failing reason code, per the priority order.

    Pure and unit-tested: one clear instruction wins even when several checks
    fail at once (blueprint §4.1 — "show one clear instruction at a time,
    largest problem first").
    """
    failing = {c.code for c in checks if not c.passed and c.code}
    return next((code for code in priority if code in failing), None)


# --------------------------------------------------------------------------- #
# Image / landmark measurement (cv2 + numpy; validated on real photos)
# --------------------------------------------------------------------------- #

# MediaPipe FaceMesh indices used for measurement.
_IDX = {
    "nose_tip": 1,
    "chin": 152,
    "left_eye_outer": 33,
    "right_eye_outer": 263,
    "left_mouth": 61,
    "right_mouth": 291,
    "left_iris": 468,   # centre of the left-iris landmark group (refine=True)
    "right_iris": 473,  # centre of the right-iris landmark group
}
# Representative cheek points (image-left / image-right) for lighting evenness.
_LEFT_CHEEK = [205, 50, 118]
_RIGHT_CHEEK = [425, 280, 347]

# 3D reference face model (mm), paired with the landmark indices above, for
# solvePnP head-pose (blueprint §4.1 yaw/pitch/roll).
_MODEL_3D = np.array(
    [
        [0.0, 0.0, 0.0],       # nose tip
        [0.0, -63.6, -12.5],   # chin
        [-43.3, 32.7, -26.0],  # left eye outer
        [43.3, 32.7, -26.0],   # right eye outer
        [-28.9, -28.9, -24.1], # left mouth
        [28.9, -28.9, -24.1],  # right mouth
    ],
    dtype=np.float64,
)


def lab_l(image_bgr: "np.ndarray") -> "np.ndarray":
    """L* channel in real 0..100 units (cv2 stores it 0..255 for 8-bit)."""
    import cv2

    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    return lab[:, :, 0].astype(np.float32) * (100.0 / 255.0)


def face_mask(landmarks_px: "np.ndarray", shape: tuple[int, int]) -> "np.ndarray":
    """Filled convex hull of all landmarks — the skin region, roughly."""
    import cv2

    h, w = shape[:2]
    pts = landmarks_px[:, :2].astype(np.int32)
    hull = cv2.convexHull(pts)
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.fillConvexPoly(mask, hull, 255)
    return mask


def measure_blur(l_channel: "np.ndarray", mask: "np.ndarray") -> float:
    import cv2

    # Source must be float64 too: OpenCV's Laplacian doesn't support a float32
    # source with a CV_64F destination.
    lap = cv2.Laplacian(l_channel.astype(np.float64), cv2.CV_64F)
    return float(lap[mask > 0].var())


def measure_mean_l(l_channel: "np.ndarray", mask: "np.ndarray") -> float:
    return float(l_channel[mask > 0].mean())


def measure_clip_percent(image_bgr: "np.ndarray", mask: "np.ndarray", channel_value: int) -> float:
    region = image_bgr[mask > 0]
    if region.size == 0:
        return 0.0
    clipped = np.any(region >= channel_value, axis=1)
    return float(100.0 * clipped.mean())


def measure_ipd_px(landmarks_px: "np.ndarray") -> float:
    a = landmarks_px[_IDX["left_iris"], :2]
    b = landmarks_px[_IDX["right_iris"], :2]
    return float(np.linalg.norm(a - b))


def measure_head_pose(landmarks_px: "np.ndarray", shape: tuple[int, int]) -> tuple[float, float, float]:
    """(yaw, pitch, roll) in degrees via solvePnP. Near-frontal ≈ (0, 0, 0)."""
    import cv2

    h, w = shape[:2]
    image_pts = np.array(
        [landmarks_px[_IDX[k], :2] for k in
         ("nose_tip", "chin", "left_eye_outer", "right_eye_outer", "left_mouth", "right_mouth")],
        dtype=np.float64,
    )
    focal = float(w)
    cam = np.array([[focal, 0, w / 2.0], [0, focal, h / 2.0], [0, 0, 1]], dtype=np.float64)
    ok, rvec, _ = cv2.solvePnP(_MODEL_3D, image_pts, cam, np.zeros((4, 1)), flags=cv2.SOLVEPNP_ITERATIVE)
    if not ok:
        return 0.0, 0.0, 0.0
    rot, _ = cv2.Rodrigues(rvec)

    # Direct rotation-matrix → Euler (radians), which cannot throw — unlike
    # decomposeProjectionMatrix, which needs a full projection matrix.
    sy = float(np.sqrt(rot[0, 0] ** 2 + rot[1, 0] ** 2))
    if sy > 1e-6:
        x = np.arctan2(rot[2, 1], rot[2, 2])
        y = np.arctan2(-rot[2, 0], sy)
        z = np.arctan2(rot[1, 0], rot[0, 0])
    else:  # gimbal-lock fallback
        x = np.arctan2(-rot[1, 2], rot[1, 1])
        y = np.arctan2(-rot[2, 0], sy)
        z = 0.0

    def fold(deg: float) -> float:
        # The model is Y-up but the image is Y-down, so a frontal face fits at a
        # ~180° flip about X. Fold every angle into [-90, 90] so a frontal face
        # reads as ≈0 on all three axes.
        deg = float(deg)
        while deg > 90:
            deg -= 180
        while deg < -90:
            deg += 180
        return deg

    pitch = fold(np.degrees(x))
    yaw = fold(np.degrees(y))
    roll = fold(np.degrees(z))
    return yaw, pitch, roll


def measure_cheek_delta_l(l_channel: "np.ndarray", landmarks_px: "np.ndarray") -> float:
    def patch_mean(indices: list[int]) -> float:
        h, w = l_channel.shape
        vals = []
        for i in indices:
            x, y = int(landmarks_px[i, 0]), int(landmarks_px[i, 1])
            x0, x1 = max(0, x - 8), min(w, x + 8)
            y0, y1 = max(0, y - 8), min(h, y + 8)
            if x1 > x0 and y1 > y0:
                vals.append(float(l_channel[y0:y1, x0:x1].mean()))
        return float(np.mean(vals)) if vals else 0.0

    return abs(patch_mean(_LEFT_CHEEK) - patch_mean(_RIGHT_CHEEK))


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #

def run_gate(image_bgr: "np.ndarray", faces: list["np.ndarray"]) -> dict:
    """Run every check and return a QualityReport dict.

    ``passed`` is True only if every check passes. On failure ``reason_code`` is
    the FIRST failing code in the configured priority order, with a matching
    ``user_message``.
    """
    cfg = {
        "face": config.get("gate_v1", "face"),
        "blur": config.get("gate_v1", "blur"),
        "exposure": config.get("gate_v1", "exposure"),
        "clipping": config.get("gate_v1", "clipping"),
        "pose": config.get("gate_v1", "pose"),
        "distance": config.get("gate_v1", "distance"),
        "lighting_evenness": config.get("gate_v1", "lighting_evenness"),
    }
    priority: list[str] = config.get("gate_v1", "priority")
    messages: dict[str, str] = config.get("gate_v1", "messages")

    checks: list[Check] = [check_face_count(len(faces), cfg)]

    # Everything else needs a face; if there isn't one, stop here. Each
    # measurement is guarded so a bug in one can never 500 the whole request —
    # it degrades to a failed check that carries the error text, which makes the
    # response self-diagnosing.
    if faces:
        lm = faces[0]
        shape = image_bgr.shape[:2]

        def guard(name: str, code: str, produce) -> None:
            try:
                checks.append(produce())
            except Exception as exc:  # measurement bug → visible, not fatal
                checks.append(Check(name, False, None, "-", code, error=f"{type(exc).__name__}: {exc}"))

        try:
            l = lab_l(image_bgr)
            mask = face_mask(lm, shape)
        except Exception as exc:
            checks.append(Check("prep", False, None, "-", "MEASUREMENT_ERROR", error=f"{type(exc).__name__}: {exc}"))
            l = mask = None

        if l is not None and mask is not None:
            guard("blur", "BLUR_TOO_HIGH", lambda: check_blur(measure_blur(l, mask), cfg))
            guard("exposure", "TOO_DARK", lambda: check_exposure(measure_mean_l(l, mask), cfg))
            guard("clipping", "CLIPPING",
                  lambda: check_clipping(measure_clip_percent(image_bgr, mask, cfg["clipping"]["channel_value"]), cfg))
            guard("lighting_evenness", "UNEVEN_LIGHTING",
                  lambda: check_evenness(measure_cheek_delta_l(l, lm), cfg))

        try:
            yaw, pitch, roll = measure_head_pose(lm, shape)
            checks.extend(check_pose(yaw, pitch, roll, cfg))
        except Exception as exc:
            checks.append(Check("pose", False, None, "-", "POSE_YAW", error=f"{type(exc).__name__}: {exc}"))

        guard("distance", "TOO_FAR", lambda: check_distance(measure_ipd_px(lm), cfg))

    reason_code = pick_reason(checks, priority)

    return {
        "passed": reason_code is None,
        "reason_code": reason_code,
        "user_message": messages.get(reason_code) if reason_code else None,
        "checks": [asdict(c) for c in checks],
    }
