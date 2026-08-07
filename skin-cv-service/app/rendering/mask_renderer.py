"""Overlay mask rendering (blueprint §4.6 rendering, §5.3).

Turns a per-concern binary evidence mask into a transparent, colour-coded PNG
that the UI lays over the user's own photo — the *evidence* behind each score.
The PNG carries NO face pixels, only the coloured region + a soft outline, so it
is safe to serve without leaking the photo.
"""

from __future__ import annotations

import numpy as np

# Distinct per-concern colours (RGB), matching what the UI legend will show.
CONCERN_COLOURS: dict[str, tuple[int, int, int]] = {
    "pigmentation": (150, 90, 50),
    "redness": (220, 60, 60),
    "dark_circles": (120, 80, 160),
    "wrinkles": (40, 160, 160),
    "pores": (60, 120, 220),
    "oiliness": (230, 200, 60),
    "texture": (90, 180, 90),
    "acne": (230, 90, 90),
}

_FILL_ALPHA = 110
_EDGE_ALPHA = 230


def render_overlay(mask_u8: "np.ndarray", colour_rgb: tuple[int, int, int]) -> bytes:
    """Colour-fill the mask with a crisper outline; return PNG (BGRA) bytes."""
    import cv2

    h, w = mask_u8.shape
    bgra = np.zeros((h, w, 4), dtype=np.uint8)
    sel = mask_u8 > 0
    r, g, b = colour_rgb
    # cv2 stores BGRA.
    bgra[sel, 0] = b
    bgra[sel, 1] = g
    bgra[sel, 2] = r
    bgra[sel, 3] = _FILL_ALPHA

    # Outline so small marks (spots, pores) stay visible over a photo.
    contours, _ = cv2.findContours(mask_u8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(bgra, contours, -1, (b, g, r, _EDGE_ALPHA), 2)

    ok, buf = cv2.imencode(".png", bgra)
    return buf.tobytes() if ok else b""
