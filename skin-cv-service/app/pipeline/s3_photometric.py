"""Stage 3 — photometric normalisation (blueprint §4.3).

Makes today's photo comparable to tomorrow's — the core of repeatability.

  3a White balance: Shades-of-Grey (Minkowski p=6) over the SKIN region, in
     linear light, toward a neutral grey. (The blueprint prefers a sclera
     reference; Shades-of-Grey over skin is its specified fallback and is robust
     and deterministic — the sclera method is a later refinement. The method
     used is recorded on the result.)
  3b Luminance: convert to CIELAB, take the median L* over skin, and apply a
     scalar OFFSET (never a gain, which would distort a*/b*) so median L* = 60,
     clamped to ±18.

Returns the normalised BGR image and the method label.
"""

from __future__ import annotations

import numpy as np

_TARGET_MEDIAN_L = 60.0
_L_OFFSET_CLAMP = 18.0
_MINKOWSKI_P = 6


def _srgb_to_linear(x: "np.ndarray") -> "np.ndarray":
    a = 0.055
    return np.where(x <= 0.04045, x / 12.92, ((x + a) / (1 + a)) ** 2.4)


def _linear_to_srgb(x: "np.ndarray") -> "np.ndarray":
    a = 0.055
    x = np.clip(x, 0.0, 1.0)
    return np.where(x <= 0.0031308, x * 12.92, (1 + a) * (x ** (1 / 2.4)) - a)


def white_balance(image_bgr: "np.ndarray", skin_mask: "np.ndarray") -> tuple["np.ndarray", str]:
    """Shades-of-Grey white balance in linear light over the skin region."""
    import cv2

    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB).astype(np.float64) / 255.0
    lin = _srgb_to_linear(rgb)
    sel = skin_mask > 0
    if sel.sum() < 50:
        return image_bgr, "none"

    # Minkowski-norm illuminant estimate per channel over skin.
    px = lin[sel]  # (N,3)
    illum = (np.mean(px ** _MINKOWSKI_P, axis=0)) ** (1.0 / _MINKOWSKI_P)
    illum = np.where(illum < 1e-6, 1e-6, illum)
    gain = illum.mean() / illum  # normalise so overall brightness is preserved
    gain = np.clip(gain, 0.7, 1.4)  # refuse wild corrections (blueprint §4.3)

    out_lin = lin * gain
    out = _linear_to_srgb(out_lin) * 255.0
    out_bgr = cv2.cvtColor(out.astype(np.uint8), cv2.COLOR_RGB2BGR)
    return out_bgr, "shades_of_grey"


def normalise_luminance(image_bgr: "np.ndarray", skin_mask: "np.ndarray") -> "np.ndarray":
    """Shift L* so the skin median is 60 (offset only, clamped ±18)."""
    import cv2

    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB).astype(np.float64)
    l = lab[:, :, 0] * (100.0 / 255.0)  # real L* units
    sel = skin_mask > 0
    if sel.sum() < 50:
        return image_bgr
    median_l = float(np.median(l[sel]))
    offset = float(np.clip(_TARGET_MEDIAN_L - median_l, -_L_OFFSET_CLAMP, _L_OFFSET_CLAMP))
    l_new = np.clip(l + offset, 0.0, 100.0) * (255.0 / 100.0)
    lab[:, :, 0] = l_new
    return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)


def normalise(image_bgr: "np.ndarray", skin_mask: "np.ndarray") -> tuple["np.ndarray", str]:
    balanced, method = white_balance(image_bgr, skin_mask)
    return normalise_luminance(balanced, skin_mask), method
