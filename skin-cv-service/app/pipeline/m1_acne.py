"""M1 — Acne detection (blueprint §4.6 M1). ML, ONNX Runtime.

Loads a YOLOv11-nano ONNX model (trained separately, see training/) and detects
acne lesions. Deterministic (rule R2: single-threaded ORT; R5: deterministic
NMS). Detections whose centre falls OUTSIDE the skin mask are dropped (kills the
classic nostril/lip/hair false positives).

If the model file is absent, ``detect`` returns None and the orchestrator leaves
acne unscored — so the engine runs fine before the model is trained, and lights
up the moment models/acne_yolo11n_v1.onnx is added.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

_MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "models" / "acne_yolo11n_v1.onnx"
_INPUT = 640
_CONF = 0.25
_IOU = 0.45

_session = None
_loaded = False


def _get_session():
    global _session, _loaded
    if _loaded:
        return _session
    _loaded = True
    if not _MODEL_PATH.exists():
        _session = None
        return None
    try:
        import onnxruntime as ort

        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1  # R2 — deterministic float reductions
        opts.inter_op_num_threads = 1
        _session = ort.InferenceSession(str(_MODEL_PATH), opts, providers=["CPUExecutionProvider"])
    except Exception:
        _session = None
    return _session


def _letterbox(img, new=640):
    import cv2

    h, w = img.shape[:2]
    r = min(new / h, new / w)
    nh, nw = int(round(h * r)), int(round(w * r))
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR)
    canvas = np.full((new, new, 3), 114, dtype=np.uint8)
    top, left = (new - nh) // 2, (new - nw) // 2
    canvas[top : top + nh, left : left + nw] = resized
    return canvas, r, left, top


def _iou(a, b):
    x1 = max(a[0], b[0]); y1 = max(a[1], b[1])
    x2 = min(a[2], b[2]); y2 = min(a[3], b[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    area_a = (a[2] - a[0]) * (a[3] - a[1])
    area_b = (b[2] - b[0]) * (b[3] - b[1])
    denom = area_a + area_b - inter
    return inter / denom if denom > 0 else 0.0


def _nms(boxes):
    # Deterministic order: highest score first, ties broken by coordinates (R5).
    order = sorted(boxes, key=lambda d: (-d[4], d[0], d[1], d[2], d[3]))
    keep = []
    for d in order:
        if all(_iou(d, k) <= _IOU for k in keep):
            keep.append(d)
    return keep


# Half-face lesion count -> Hayashi-style severity (blueprint §4.6 M1).
def _severity(count: int) -> str:
    if count == 0:
        return "clear"
    if count <= 5:
        return "mild"
    if count <= 20:
        return "moderate"
    if count <= 50:
        return "severe"
    return "very_severe"


def detect(image_bgr, skin_mask, mm_per_px):
    """Return (raw, value, by_region, mask) or None if no model / no result.

    ``value`` (for scoring) is the lesion count. The blueprint scores acne from
    severity; the anchor table maps count -> 0..100.
    """
    session = _get_session()
    if session is None:
        return None
    import cv2

    h, w = image_bgr.shape[:2]
    lb, r, padx, pady = _letterbox(image_bgr, _INPUT)
    blob = lb[:, :, ::-1].astype(np.float32) / 255.0  # BGR->RGB, 0..1
    blob = np.transpose(blob, (2, 0, 1))[None]  # NCHW

    try:
        out = session.run(None, {session.get_inputs()[0].name: blob})[0]
    except Exception:
        return None

    # YOLOv11 export: [1, 4+nc, N] -> [N, 4+nc]. Single class => col 4 is score.
    pred = np.squeeze(out, 0)
    if pred.shape[0] < pred.shape[1]:
        pred = pred.T
    boxes = []
    for row in pred:
        score = float(row[4])
        if score < _CONF:
            continue
        cx, cy, bw, bh = row[0], row[1], row[2], row[3]
        # Undo letterbox back to original pixels.
        x1 = (cx - bw / 2 - padx) / r
        y1 = (cy - bh / 2 - pady) / r
        x2 = (cx + bw / 2 - padx) / r
        y2 = (cy + bh / 2 - pady) / r
        boxes.append([x1, y1, x2, y2, score])

    kept = _nms(boxes)

    mask = np.zeros((h, w), np.uint8)
    count = 0
    total_area_px = 0
    sel = skin_mask > 0
    for x1, y1, x2, y2, _s in kept:
        ccx, ccy = int((x1 + x2) / 2), int((y1 + y2) / 2)
        if not (0 <= ccy < h and 0 <= ccx < w and sel[ccy, ccx]):
            continue  # lesion centre outside the skin mask -> false positive
        count += 1
        xa, ya, xb, yb = max(0, int(x1)), max(0, int(y1)), min(w, int(x2)), min(h, int(y2))
        total_area_px += max(0, xb - xa) * max(0, yb - ya)
        cv2.rectangle(mask, (xa, ya), (xb, yb), 255, 2)

    area_mm2 = total_area_px * (mm_per_px ** 2) if mm_per_px > 0 else 0.0
    raw = {"lesion_count": count, "total_area_mm2": round(area_mm2, 1), "hayashi": _severity(count)}
    return raw, float(count), {}, mask
