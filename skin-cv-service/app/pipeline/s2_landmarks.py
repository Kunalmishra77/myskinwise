"""Stage 2 — facial landmark extraction (blueprint §4.2).

MediaPipe FaceMesh with ``refine_landmarks=True`` gives 478 points including the
iris (indices 468–477), which we need for the interpupillary-distance scale
reference and for sclera sampling later. Runs in IMAGE mode (static), which is
deterministic for a given image.

cv2 / mediapipe are imported lazily so this module (and the rest of the package)
stays importable in environments where those heavy deps aren't installed — the
determinism/config tests don't need them.
"""

from __future__ import annotations

from typing import Any

import numpy as np

# The detector is expensive to build; construct once and reuse. It is stateless
# in IMAGE mode, so a single shared instance is safe and deterministic.
_face_mesh: Any = None


def _get_face_mesh(min_conf: float) -> Any:
    global _face_mesh
    if _face_mesh is None:
        import mediapipe as mp

        _face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=2,  # detect >1 so the gate can reject a crowd
            refine_landmarks=True,
            min_detection_confidence=min_conf,
        )
    return _face_mesh


def extract_landmarks(image_bgr: "np.ndarray", min_conf: float) -> list["np.ndarray"]:
    """Return one (478, 3) float32 array of PIXEL coordinates per detected face.

    Empty list = no face. The gate uses the count (0 / 1 / >1) and the first
    face's geometry. z is the raw MediaPipe depth (relative), kept for parity.
    """
    import cv2

    h, w = image_bgr.shape[:2]
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    result = _get_face_mesh(min_conf).process(rgb)
    if not result.multi_face_landmarks:
        return []

    faces: list[np.ndarray] = []
    for face in result.multi_face_landmarks:
        pts = np.array(
            [[lm.x * w, lm.y * h, lm.z * w] for lm in face.landmark],
            dtype=np.float32,
        )
        faces.append(pts)
    return faces
