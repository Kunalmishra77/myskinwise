"""Stage 4 — geometric scale (blueprint §4.4).

Interpupillary distance from the two iris-centre landmarks gives a physical
scale: assuming a 63mm population-mean IPD, ``mm_per_px = 63 / ipd_px``. Every
spatial metric (pore count per cm², spot size, wrinkle length) is then reported
in physical units, so it is comparable between a photo at arm's length and one
at 20cm.

(The full similarity-transform warp to a 1024x1024 canonical frame is a later
refinement; the scale factor alone already makes the spatial metrics
distance-invariant, which is what the scores need.)
"""

from __future__ import annotations

import numpy as np

from app import config

_LEFT_IRIS = 468
_RIGHT_IRIS = 473


def mm_per_px(landmarks_px: "np.ndarray") -> float:
    ref_ipd_mm = float(config.get("pipeline_v1", "reference_ipd_mm"))
    a = landmarks_px[_LEFT_IRIS, :2]
    b = landmarks_px[_RIGHT_IRIS, :2]
    ipd_px = float(np.linalg.norm(a - b))
    if ipd_px < 1.0:
        return 0.0
    return ref_ipd_mm / ipd_px
