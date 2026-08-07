"""Stage 5 — region segmentation (blueprint §4.5).

Builds a skin mask and the nine sub-region masks from FaceMesh landmarks, plus a
fixed "clean skin" reference patch (upper-mid cheek) for delta-based metrics.

Regions are built as elliptical patches around representative landmark centroids,
sized relative to the face — robust and deterministic, and enough to aggregate a
per-region metric honestly. (Exact FaceMesh polygon regions are a later
refinement.) All masks are uint8 {0,255}.
"""

from __future__ import annotations

import numpy as np

# Representative landmark indices whose centroid anchors each region.
_REGION_POINTS: dict[str, list[int]] = {
    "forehead": [10, 67, 297, 109, 338],
    "glabella": [8, 9, 168],
    "nose": [1, 4, 5, 195],
    "left_cheek": [205, 50, 118, 101],
    "right_cheek": [425, 280, 347, 330],
    "perioral": [0, 17, 61, 291, 164],
    "chin": [152, 175, 148, 377],
    "left_periorbital": [230, 229, 228, 31],
    "right_periorbital": [450, 449, 448, 261],
}
# Eyes + mouth are excluded from the skin mask (not skin).
_LEFT_EYE = [33, 133, 159, 145, 153, 154, 155, 173, 157, 158, 160, 161, 246]
_RIGHT_EYE = [263, 362, 386, 374, 380, 381, 382, 398, 384, 385, 387, 388, 466]
_MOUTH = [61, 291, 0, 17, 13, 14, 78, 308, 82, 87, 312, 317]


def _centroid(landmarks_px: "np.ndarray", idx: list[int]) -> tuple[float, float]:
    pts = landmarks_px[idx, :2]
    return float(pts[:, 0].mean()), float(pts[:, 1].mean())


def _face_width(landmarks_px: "np.ndarray") -> float:
    xs = landmarks_px[:, 0]
    return float(xs.max() - xs.min())


def _ellipse_mask(shape: tuple[int, int], cx: float, cy: float, rx: float, ry: float) -> "np.ndarray":
    import cv2

    m = np.zeros(shape, dtype=np.uint8)
    cv2.ellipse(m, (int(cx), int(cy)), (max(1, int(rx)), max(1, int(ry))), 0, 0, 360, 255, -1)
    return m


def build(landmarks_px: "np.ndarray", shape: tuple[int, int]) -> dict[str, "np.ndarray"]:
    """Return {region_name: mask} plus 'skin' and 'reference' masks."""
    import cv2

    h, w = shape[:2]
    fw = _face_width(landmarks_px)
    r = max(6.0, fw * 0.11)  # base region radius, relative to the face

    masks: dict[str, np.ndarray] = {}
    for name, idx in _REGION_POINTS.items():
        cx, cy = _centroid(landmarks_px, idx)
        # Cheeks/forehead are broader; eyes/glabella tighter.
        scale = 1.3 if name in ("left_cheek", "right_cheek", "forehead") else 1.0
        masks[name] = _ellipse_mask((h, w), cx, cy, r * scale, r * scale * 0.85)

    # Skin mask: convex hull of the face, minus eyes and mouth.
    hull = cv2.convexHull(landmarks_px[:, :2].astype(np.int32))
    skin = np.zeros((h, w), dtype=np.uint8)
    cv2.fillConvexPoly(skin, hull, 255)
    for grp in (_LEFT_EYE, _RIGHT_EYE, _MOUTH):
        poly = cv2.convexHull(landmarks_px[grp, :2].astype(np.int32))
        cv2.fillConvexPoly(skin, poly, 0)
    skin = cv2.erode(skin, np.ones((5, 5), np.uint8), iterations=1)
    masks["skin"] = skin

    # Reference "clean skin" patch: upper-mid cheek (blueprint §4.5), left side.
    cx, cy = _centroid(landmarks_px, [205, 50])
    masks["reference"] = _ellipse_mask((h, w), cx, cy - r * 0.3, r * 0.7, r * 0.6)
    return masks
