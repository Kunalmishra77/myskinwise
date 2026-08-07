"""Raw metric -> 0..100 score (blueprint §5). Pure and unit-tested.

Piecewise-linear interpolation over the anchor table in ``anchors_v1.yaml``,
then fixed rounding at the boundary via ``Decimal`` ROUND_HALF_EVEN (rule R7) so
1e-12 float noise can never change a serialised score. ``direction`` is baked
into the anchor scores (lower_is_better tables already descend), so this function
is a plain monotone interpolation — no branching on direction.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_EVEN

from app import config


def _interp(raw: float, anchors: list[list[float]]) -> float:
    """Piecewise-linear map, clamped at both ends. anchors sorted by raw asc."""
    xs = [a[0] for a in anchors]
    ys = [a[1] for a in anchors]
    if raw <= xs[0]:
        return float(ys[0])
    if raw >= xs[-1]:
        return float(ys[-1])
    for i in range(1, len(xs)):
        if raw <= xs[i]:
            x0, x1, y0, y1 = xs[i - 1], xs[i], ys[i - 1], ys[i]
            t = (raw - x0) / (x1 - x0) if x1 != x0 else 0.0
            return float(y0 + t * (y1 - y0))
    return float(ys[-1])


def round_score(value: float) -> float:
    """1-decimal ROUND_HALF_EVEN at the boundary (rule R7)."""
    return float(Decimal(str(value)).quantize(Decimal("0.1"), rounding=ROUND_HALF_EVEN))


def score_for(concern: str, raw_value: float) -> float:
    anchors = config.get("anchors_v1", concern, "anchors")
    return round_score(_interp(float(raw_value), anchors))


def severity_for(score: float) -> str:
    """Coarse severity band from the final 0..100 score."""
    for threshold, label in config.get("anchors_v1", "severity_bands"):
        if score >= threshold:
            return label
    return "significant"
