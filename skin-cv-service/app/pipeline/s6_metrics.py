"""Stage 6 — the seven classical metric extractors (blueprint §4.6, M2–M8).

Each returns ``(raw: dict, value: float, by_region: dict)`` where ``value`` is the
single raw number the scorer maps to 0..100. All operate on the photometrically
normalised image, over the region masks from Stage 5, in physical units via
``mm_per_px``. Deterministic (no RNG). Acne (M1) is ML and lands in Phase 5.

Faithful to the blueprint's methods: ITA° pigmentation, a* erythema, ITA° delta
dark circles, Frangi ridges for wrinkles, LoG blobs for pores, GLCM for texture.
Oiliness uses a bright-desaturated-highlight proxy for specular shine (the full
dichromatic separation is a later refinement).
"""

from __future__ import annotations

import numpy as np


def lab_channels(image_bgr: "np.ndarray") -> tuple["np.ndarray", "np.ndarray", "np.ndarray"]:
    import cv2

    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB).astype(np.float64)
    L = lab[:, :, 0] * (100.0 / 255.0)
    a = lab[:, :, 1] - 128.0
    b = lab[:, :, 2] - 128.0
    return L, a, b


def _ita(L: "np.ndarray", b: "np.ndarray") -> "np.ndarray":
    return np.degrees(np.arctan2(L - 50.0, np.where(np.abs(b) < 1e-3, 1e-3, b)))


def _area_cm2(mask: "np.ndarray", mm_per_px: float) -> float:
    px = float((mask > 0).sum())
    return px * (mm_per_px ** 2) / 100.0 if mm_per_px > 0 else 0.0


def _sel(mask: "np.ndarray") -> "np.ndarray":
    return mask > 0


# --------------------------------------------------------------------------- #

def pigmentation(bgr, L, a, b, masks, mm_per_px):
    import cv2

    skin = masks["skin"]
    sel = _sel(skin)
    if sel.sum() < 50:
        return {"spot_count": 0, "affected_area_pct": 0.0, "mean_delta_ita": 0.0}, 0.0, {}
    ita = _ita(L, b)
    base = float(np.median(ita[sel]))
    delta = np.where(sel, base - ita, 0.0)  # positive = locally darker
    spot = ((delta > 8.0) & sel).astype(np.uint8)
    spot = cv2.morphologyEx(spot, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

    n, _, stats, _ = cv2.connectedComponentsWithStats(spot, connectivity=8)
    min_mm2, max_mm2 = 0.3, 40.0
    kept_area = 0
    count = 0
    px_to_mm2 = (mm_per_px ** 2) if mm_per_px > 0 else 0.0
    for i in range(1, n):
        area_px = int(stats[i, cv2.CC_STAT_AREA])
        area_mm2 = area_px * px_to_mm2
        if px_to_mm2 and not (min_mm2 <= area_mm2 <= max_mm2):
            continue
        count += 1
        kept_area += area_px
    skin_px = float(sel.sum())
    affected = 100.0 * kept_area / skin_px if skin_px else 0.0
    mean_delta = float(delta[spot > 0].mean()) if (spot > 0).any() else 0.0
    return (
        {"spot_count": count, "affected_area_pct": round(affected, 2), "mean_delta_ita": round(mean_delta, 1)},
        affected,
        {},
    )


def redness(bgr, L, a, b, masks, mm_per_px):
    skin = masks["skin"]
    sel = _sel(skin)
    if sel.sum() < 50:
        return {"red_area_pct": 0.0, "a_p75": 0.0}, 0.0, {}
    med = float(np.median(a[sel]))
    red = (a > med + 6.0) & sel
    red_pct = 100.0 * float(red.sum()) / float(sel.sum())
    by_region = {}
    for name in ("left_cheek", "right_cheek", "nose", "chin", "forehead"):
        m = _sel(masks.get(name, np.zeros_like(skin)))
        if m.sum() > 20:
            by_region[name] = round(float(np.percentile(a[m], 75)), 1)
    return {"red_area_pct": round(red_pct, 2), "a_p75": round(float(np.percentile(a[sel], 75)), 1)}, red_pct, by_region


def dark_circles(bgr, L, a, b, masks, mm_per_px):
    ref = _sel(masks["reference"])
    if ref.sum() < 20:
        return {"dc_delta_left": 0.0, "dc_delta_right": 0.0, "asymmetry": 0.0, "subtype": "none"}, 0.0, {}
    ita = _ita(L, b)
    ref_ita = float(ita[ref].mean())
    ref_b = float(b[ref].mean())

    def region_delta(name):
        m = _sel(masks.get(name, np.zeros_like(masks["reference"])))
        if m.sum() < 20:
            return 0.0, 0.0
        return ref_ita - float(ita[m].mean()), float(b[m].mean()) - ref_b

    dl, db_l = region_delta("left_periorbital")
    dr, db_r = region_delta("right_periorbital")
    mean_delta = max(0.0, (dl + dr) / 2.0)
    asym = abs(dl - dr)
    db = (db_l + db_r) / 2.0
    subtype = "vascular" if db < -2 else "pigmented" if db > 2 else "mixed"
    return (
        {"dc_delta_left": round(dl, 1), "dc_delta_right": round(dr, 1), "asymmetry": round(asym, 1), "subtype": subtype},
        mean_delta,
        {},
    )


def wrinkles(bgr, L, a, b, masks, mm_per_px):
    from skimage.filters import frangi
    from skimage.morphology import skeletonize

    region = np.zeros(L.shape, dtype=np.uint8)
    for name in ("forehead", "glabella", "left_periorbital", "right_periorbital"):
        region = np.maximum(region, masks.get(name, np.zeros_like(region)))
    sel = _sel(region)
    if sel.sum() < 50 or mm_per_px <= 0:
        return {"ridge_density": 0.0}, 0.0, {}

    Ln = (L / 100.0).astype(np.float64)
    ridges = frangi(Ln, sigmas=[1.0, 1.6, 2.5, 4.0], black_ridges=True)
    binary = (ridges > 0.35) & sel
    skel = skeletonize(binary)
    ridge_len_mm = float(skel.sum()) * mm_per_px
    area_cm2 = _area_cm2(region, mm_per_px)
    density = ridge_len_mm / area_cm2 if area_cm2 > 0 else 0.0
    return {"ridge_density": round(density, 2)}, density, {}


def pores(bgr, L, a, b, masks, mm_per_px):
    from skimage.feature import blob_log

    region = np.maximum(masks.get("nose", np.zeros(L.shape, np.uint8)),
                        np.maximum(masks.get("left_cheek", np.zeros(L.shape, np.uint8)),
                                   masks.get("right_cheek", np.zeros(L.shape, np.uint8))))
    sel = _sel(region)
    if sel.sum() < 50 or mm_per_px <= 0:
        return {"pores_per_cm2": 0.0, "count": 0}, 0.0, {}

    # Pores are small dark spots → detect bright blobs on the inverted L.
    inv = np.where(sel, 1.0 - (L / 100.0), 0.0)
    min_sigma = max(0.5, (0.1 / mm_per_px) / 2.0)
    max_sigma = max(min_sigma + 0.5, (0.5 / mm_per_px) / 2.0)
    blobs = blob_log(inv, min_sigma=min_sigma, max_sigma=max_sigma, num_sigma=4, threshold=0.05)
    count = int(blobs.shape[0])
    area_cm2 = _area_cm2(region, mm_per_px)
    per_cm2 = count / area_cm2 if area_cm2 > 0 else 0.0
    return {"pores_per_cm2": round(per_cm2, 1), "count": count}, per_cm2, {}


def oiliness(bgr, L, a, b, masks, mm_per_px):
    chroma = np.sqrt(a ** 2 + b ** 2)

    def shine(mask):
        m = _sel(mask)
        if m.sum() < 20:
            return 0.0
        highlight = m & (L > 75.0) & (chroma < 15.0)
        return 100.0 * float(highlight.sum()) / float(m.sum())

    tzone = np.maximum(masks.get("forehead", np.zeros(L.shape, np.uint8)), masks.get("nose", np.zeros(L.shape, np.uint8)))
    cheeks = np.maximum(masks.get("left_cheek", np.zeros(L.shape, np.uint8)), masks.get("right_cheek", np.zeros(L.shape, np.uint8)))
    tzone_shine = shine(tzone)
    cheek_shine = shine(cheeks)
    return (
        {"shine_ratio_pct": round(tzone_shine, 1), "tzone_shine": round(tzone_shine, 1), "cheek_shine": round(cheek_shine, 1)},
        tzone_shine,
        {"tzone": round(tzone_shine, 1), "cheeks": round(cheek_shine, 1)},
    )


def texture(bgr, L, a, b, masks, mm_per_px, exclude=None):
    from skimage.feature import graycomatrix, graycoprops

    region = np.maximum(masks.get("left_cheek", np.zeros(L.shape, np.uint8)), masks.get("right_cheek", np.zeros(L.shape, np.uint8)))
    sel = _sel(region)
    if exclude is not None:
        sel = sel & (~_sel(exclude))
    if sel.sum() < 100:
        return {"glcm_contrast": 0.0, "glcm_homogeneity": 0.0}, 0.0, {}

    # Crop to the region's bounding box so background pixels don't dominate the
    # co-occurrence counts (the ellipse fills ~78% of its box).
    ys, xs = np.where(sel)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    q = np.clip((L / 100.0 * 31).astype(np.uint8), 0, 31)[y0:y1, x0:x1]
    glcm = graycomatrix(q, distances=[1, 2, 4], angles=[0, np.pi / 4, np.pi / 2, 3 * np.pi / 4],
                        levels=32, symmetric=True, normed=True)
    contrast = float(np.mean(graycoprops(glcm, "contrast")))
    homogeneity = float(np.mean(graycoprops(glcm, "homogeneity")))
    return {"glcm_contrast": round(contrast, 1), "glcm_homogeneity": round(homogeneity, 3)}, contrast, {}
