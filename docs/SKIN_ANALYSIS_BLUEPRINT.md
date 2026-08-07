# Deterministic Skin Analysis Engine — Implementation Blueprint

**Version:** 1.0
**Target:** Replace existing skin-scan logic in the skincare web platform
**Owner:** Amandeep Singh
**Build method:** Claude Code, phased execution
**Core non-negotiable:** Same input image → byte-identical output, forever.

> Saved to the repo from the original brief. Implementation status lives in
> `docs/REMOVAL_AUDIT.md` (Phase 0) and the `skin-cv-service/` service. Run the
> phases in Section 9 in order.

---

## 0. Read This First

This document is written to be handed to Claude Code phase by phase. **Do not
paste the whole document into one prompt.** Each phase in Section 9 has its own
scoped prompt, its own acceptance test, and its own definition of done. Run them
in order. Do not start Phase N+1 until Phase N's acceptance test passes.

The single most important idea in this blueprint:

> **Skin analysis is a measurement problem, not a recognition problem.**

We are building a measuring instrument. A measuring instrument that gives
different readings for the same input is not an instrument — it is a random
number generator with a nice UI. Determinism is therefore treated as a
**correctness requirement**, not a nice-to-have.

---

## 1. Scope

### 1.1 What This System Does
Accepts a facial photograph, validates its quality, normalises it, measures
eight skin concerns using deterministic computer vision, produces per-region
numeric scores with pixel-accurate overlay masks, and generates a human-readable
report plus product recommendations.

### 1.2 What This System Does NOT Do
- It does not diagnose medical conditions.
- It does not detect skin cancer, melanoma, or any lesion requiring clinical attention.
- It does not replace a dermatologist.
- It does not use an LLM anywhere in the measurement path.

### 1.3 Measured Concerns (v1)

| # | Concern | Method | Output |
|---|---------|--------|--------|
| 1 | Acne / active breakouts | ML object detection (YOLO) | Lesion count, area %, severity grade |
| 2 | Pigmentation / dark spots | ITA° local deviation + adaptive threshold | Spot count, affected area %, score |
| 3 | Redness / erythema | Erythema index (a* channel) | Score, per-region map |
| 4 | Dark circles | ITA° delta (periorbital vs cheek) | Score, L/R asymmetry |
| 5 | Wrinkles / fine lines | Frangi ridge filter on L* | Ridge density per region |
| 6 | Pores | LoG blob detection, scale-normalised | Count per cm², score |
| 7 | Oiliness / shine | Specular-diffuse separation | Score per region |
| 8 | Texture / smoothness | GLCM contrast + local entropy | Score |

Skin type (oily / dry / combination / normal) and skin age are **derived** from
the above — they are not independently measured.

---

## 2. Determinism Contract

### 2.1 The Answer
**Same photo, twice → same result, if and only if every rule below is enforced.**

### 2.2 Hard Rules
- **R1 — No LLM in the measurement path.** The LLM is invoked once, at the end,
  only to convert an already-computed JSON score object into prose. Its output
  is stored separately and is explicitly allowed to vary.
- **R2 — Inference on ONNX Runtime, not PyTorch.** Fixed graph, fixed provider.
  `intra_op_num_threads = 1` and `inter_op_num_threads = 1` (parallel float
  reductions sum in a non-deterministic order and can flip a borderline result).
- **R3 — No test-time augmentation, no random crops, no dropout at inference.**
- **R4 — Fixed preprocessing.** `cv2.INTER_AREA` downscale, `cv2.INTER_LINEAR`
  upscale, letterbox pad value `(114,114,114)`.
- **R5 — Deterministic NMS.** Sort by `(-score, x1, y1, x2, y2)` before NMS.
  Fixed IoU threshold.
- **R6 — No float accumulation over unordered collections.** Never `sum()` over
  a `set`/`dict.values()`; sort keys first.
- **R7 — Fixed rounding at the boundary.** Scores rounded to 1 dp via `Decimal`
  `ROUND_HALF_EVEN` before serialisation.
- **R8 — Content-addressed result cache.** `cache_key = sha256(image_bytes) + ":" + PIPELINE_VERSION`.
- **R9 — Seeds pinned globally at process start** (`PYTHONHASHSEED=0`, `random.seed(0)`,
  `np.random.seed(0)`, `cv2.setRNGSeed(0)`, `cv2.setNumThreads(1)`).
- **R10 — Pin every dependency to an exact version.** A dependency bump is a
  `PIPELINE_VERSION` bump.

### 2.3 Acceptance Test (in CI)
For each of 50 fixture images: `analyze` twice in-process and once in a cold
subprocess; all three JSONs (sorted keys) must be identical. Run the suite 20×,
zero tolerance for a diff. Plus a **golden-file test**: committed
`fixtures/expected/*.json`; any change to a golden must be a reviewed decision
with a `PIPELINE_VERSION` bump.

### 2.4 The Harder Problem — Repeatability
Determinism (same file → same result) is easy. **Repeatability** (same person,
photo tomorrow → similar result) is the hard, trust-defining problem. Attacked
via: sclera-referenced white balance (§4.3), L* normalisation (§4.3), IPD scale
normalisation (§4.4), canonical pose alignment (§4.4), and a strict capture gate
(§4.1). **Target:** same subject, 5 photos, same session, indoor light → every
score within **±8 on a 0–100 scale**.

### 2.5 Honest Limitations (put in product copy)
1. 0–100 scores are **relative, not absolute** until calibrated (label "Beta").
2. Acne accuracy depends entirely on training-data quality.
3. Underperforms on darker Fitzpatrick types (V–VI) unless the sets over-sample them.
4. No clinical validation = no clinical claims.

---

## 3. Architecture

- **Next.js app (existing):** `/scan` → CaptureGate (client MediaPipe WASM, live
  checks, auto-capture) → `POST /api/scan/analyze` (proxies to the CV service).
- **skin-cv-service (Python):** FastAPI + OpenCV + ONNX Runtime. Stages: gate →
  normalise → region-mask → 8 metric extractors → scoring/calibration → mask
  render → `ScanResult` JSON.
- **Report layer (Node, LLM):** scores JSON → prose + products (non-deterministic
  by design, stored separately).

Separate Python service because MediaPipe, OpenCV (Frangi/GLCM/LoG) and ONNX
Runtime thread control are first-class in Python. Client-side MediaPipe WASM is
used ONLY for the live capture UX, never for measurement.

### 3.2 Technology Pins
Python 3.11 · FastAPI+Uvicorn 0.115.x · opencv-python-headless 4.10.0.84 (exact)
· mediapipe 0.10.14 (exact) · onnxruntime 1.19.x (exact) · numpy 1.26.x ·
colour-science 0.4.4 · Pillow 10.4.x · (training only: ultralytics + torch,
dev-only) · container `python:3.11-slim`. `requirements.txt` = exact pins only.

---

## 4. Pipeline Specification

### 4.1 Stage 1 — Capture Quality Gate
The single highest-leverage component (~80% of "wrong result" complaints trace
to a bad photo). Runs in-browser for live feedback and again server-side as the
authoritative check.

| Check | Method | Pass | Message |
|---|---|---|---|
| Face present | FaceMesh confidence | ≥0.80, exactly 1 | "Move your face into the frame" |
| Blur | Variance of Laplacian on L* | ≥120 | "Hold steady — photo is blurry" |
| Exposure | Mean L* of skin | 40–78 | "Too dark" / "Too bright" |
| Clipping | % pixels any channel ≥250 | ≤2% | "Move away from direct light" |
| Yaw | Landmarks 1,33,263 | \|yaw\|≤8° | "Look straight at the camera" |
| Pitch | Landmarks 10,152,1 | \|pitch\|≤8° | "Keep your head level" |
| Roll | Eye-line angle | \|roll\|≤6° | "Straighten your head" |
| Distance | IPD in px | 90–260 | "Come closer" / "Move back" |
| Lighting evenness | L* left vs right cheek | Δ≤12 | "Light is uneven" |
| Occlusion | Landmark visibility + glasses | none | "Remove glasses / clear forehead" |
| Colour cast | Sclera chromaticity vs D65 | Δ≤threshold | "Lighting is too coloured" |

Auto-capture: all green for **8 consecutive frames**. Show ONE instruction at a
time, largest problem first. Server re-validates every check; failure → `422`
with a structured reason code.

### 4.2 Stage 2 — Landmark Extraction
MediaPipe FaceMesh, `refine_landmarks=True` → 478 points incl. iris. Store the
raw landmark array with the scan for reproducibility.

### 4.3 Stage 3 — Photometric Normalisation
- **3a White balance via sclera reference:** extract sclera, erode 2px, take
  60th–90th percentile luminance, von Kries diagonal correction toward D65, clamp
  gains [0.7,1.4] (else reject as too coloured). Fallback: Shades-of-Grey
  (Minkowski p=6) over the skin mask; record which method was used.
- **3b Luminance normalisation:** CIELAB (D65, sRGB); median L* over skin → apply
  a scalar **offset** (not gain) so median L*=60; clamp ±18.
- **3c Colour space:** all metrics in **CIELAB, D65, sRGB**. Never HSV/raw RGB.

### 4.4 Stage 4 — Geometric Normalisation
- **Scale:** IPD from iris centres; assume 63mm population mean → `mm_per_px`.
  Report spatial metrics in physical units. Note ~11% absolute error (constant
  per person, so longitudinal tracking is unaffected).
- **Pose:** similarity transform (4 DOF, not affine/perspective) to a fixed
  **1024×1024** canonical frame via iris centres + nose base; `cv2.INTER_LINEAR`.
  All measurement in this frame; masks inverse-warped only for display.

### 4.5 Stage 5 — Region Segmentation
`skin_mask = face_oval − eyes − eyebrows − lips − nostrils − hair_band(12px)`.
Nine sub-regions (forehead, glabella, nose, L/R cheek, perioral, chin, L/R
periorbital). Erode each 4px. RLE-encode masks. Define a fixed "clean skin"
reference patch (upper-mid cheek) for delta metrics.

### 4.6 Stage 6 — Metric Extractors
Each is a pure function `(canonical_lab, region_masks, mm_per_px) → RawMetric`,
own module, own unit tests.

- **M1 Acne (ML):** YOLOv11-nano, 1 class, 640px, ONNX opset 17. Train on ACNE04
  then fine-tune on own data. conf 0.25, IoU 0.45, deterministic NMS; discard
  detections whose centroid is outside the skin mask. Severity (half-face count):
  0 Clear · 1–5 Mild · 6–20 Moderate · 21–50 Severe · >50 Very severe.
- **M2 Pigmentation:** `ITA° = arctan((L*−50)/b*)·180/π`. Median ITA° = skin tone
  (report separately, NOT a problem). Threshold `ΔITA>8°`; morphological open;
  connected components 0.3–40mm²; reject eccentricity>0.92. Relative ΔITA works
  across all Fitzpatrick types — the key design decision.
- **M3 Redness:** Erythema index = a*. Per region: 75th pct of a*, and fraction
  above `median_a*+6`. Exclude lip/nostril margins.
- **M4 Dark circles:** `ITA°(cheek_ref) − ITA°(infraorbital)`, L and R; report
  mean + asymmetry + subtype (pigmented/vascular/mixed via b* delta).
- **M5 Wrinkles:** Frangi vesselness on L*, σ∈{1.0,1.6,2.5,4.0}px after IPD
  normalisation; β=0.5, c=0.5·max Hessian norm; threshold 0.35, skeletonise,
  ridge length mm per region (glabella/forehead/periorbital). Mask hairline+jaw.
- **M6 Pores:** LoG blob on L*, physical 0.1–0.5mm; dark blobs contrast ≥4 L*;
  reject blobs coinciding with acne; count per cm². Primary: nose, medial cheeks.
- **M7 Oiliness:** dichromatic reflection; specular-free image (Yoon); shine ratio
  = fraction where specular>12. T-zone vs cheek → derived skin type. Time-of-day
  caveat to the user.
- **M8 Texture:** GLCM on L* (after removing acne/spot regions); d∈{1,2,4},
  θ∈{0,45,90,135}, 32 levels; mean contrast+homogeneity; + local entropy 9×9.

---

## 5. Scoring & Calibration
- **Phase A (launch):** anchor-based — per-metric anchor points from literature +
  expert review, piecewise-linear to 0–100, in a versioned `anchors_v1.yaml`.
- **Phase B (after 5,000 scans):** percentile-based vs own population, stratified
  by age band + Fitzpatrick. `Score = 100 − percentile_rank`.

Presentation: never a single headline "overall score"; always show the score
**with its overlay mask** (the evidence); show confidence; for repeat scans show
the delta with an explicit noise band, suppress sub-band changes.

---

## 6. API Contract
`POST /v1/analyze` (multipart image) → `200` ScanResult:
`{ scan_id, pipeline_version, image_sha256, cached, processing_ms, quality{...},
skin_tone{median_ita_deg, fitzpatrick_estimate, note}, concerns[{id, score,
severity, confidence, raw{}, by_region{}, mask_url}], derived{skin_type,
skin_age_estimate, skin_age_confidence} }`. Gate failure → `422 { error,
reason_code, user_message, detail, retryable }`.

Other: `GET /v1/scans/{id}` · `GET /v1/scans/{id}/masks/{concern}.png` ·
`POST /v1/scans/{id}/report` (LLM, separate, non-deterministic) ·
`GET /v1/compare?a=&b=` · `GET /healthz` (pipeline_version + model hashes).
`/analyze` returns measurement only; `/report` is a separate call so the
determinism boundary is architecturally visible.

---

## 7. Data Model
`scans` (id, user_id, created_at, image_sha256, image_storage_key,
pipeline_version, quality JSONB, landmarks BYTEA, concerns JSONB, derived JSONB,
consent_version, deleted_at) with a unique index on `(image_sha256,
pipeline_version)`. `scan_reports` separate (non-deterministic). Retention: keep
the original image only with explicit consent; else store the canonical crop and
delete the original. Log consent version per scan.

---

## 9. Phased Build Plan
- **Phase 0** — Audit & (later) removal. Keep route paths; new `ScanResult` type.
- **Phase 1** — Service scaffold + determinism harness (built BEFORE the pipeline).
- **Phase 2** — Capture gate (highest leverage; server + client HUD).
- **Phase 3** — Normalisation & regions.
- **Phase 4** — Classical metrics M2–M8 (no training data needed).
- **Phase 5** — Acne model (needs annotated data).
- **Phase 6** — Scoring & masks + content-addressed cache.
- **Phase 7** — Frontend result experience.
- **Phase 8** — Report layer (LLM), scores-only in, never writes `scans`.
- **Phase 9** — Validation.

**Sequencing (§10):** Phases 1–4 + 6–7 give a working, deterministic, launchable
product with 7 of 8 concerns and no ML. Do not compress Phase 2 or 3.

---

## 11. Validation Protocol
- **Determinism** (automated, CI) — §2.3, blocking.
- **Repeatability** (manual) — 25 people spanning Fitzpatrick II–VI; same-session
  SD ≤4, cross-lighting max dev ≤8; stratify by type.
- **Face validity** (manual) — dermatologist reviews 100 outputs blind; ≥70%
  accurate, ≤10% wrong. Not a clinical study.
- **Adversarial set** — makeup, beard, sunglasses, printed/screen face, backlight,
  two faces, non-face — all must be REJECTED by the gate.

---

## 12. Compliance & Positioning
Language: never diagnosis/treatment/cure/medical/"detects [condition]/you have";
use assessment/analysis/routine/care/cosmetic/"measures visible attribute".
Required: per-result disclaimer; explicit consent (storage + model-improvement
opt-in separate); real user-initiated hard delete from object storage (DPDP);
high-severity → dermatologist referral prompt.

---

## 13. Deployment & Cost
Single Python image (~1.1GB, ONNX CPU, no torch), 2 vCPU / 4GB. Latency budget
~1.9s total. Stateless, horizontally scalable: `WEB_CONCURRENCY = vCPU`, keep
`intra_op_num_threads = 1` per worker. No GPU. ~350KB per scan.

---

## 14. Definition of Done
Determinism + golden CI green · repeatability passed (stratified) · dermatologist
face-validity ≥70% · adversarial set 100% rejected · every threshold in versioned
config · `PIPELINE_VERSION` bumped + cache invalidation verified · deps exactly
pinned · `models/MODELS.md` complete · compliance copy reviewed · consent + hard
delete implemented · high-severity referral live · old implementation removed,
legacy data archived.
