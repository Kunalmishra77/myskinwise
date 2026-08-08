# Acne model — self-train & deploy (step-by-step)

Acne is the one concern the engine can't measure yet: it needs a trained
detector. You chose to **self-train** it. Everything is ready — you just run one
Colab notebook and send back the file. Acne stays hidden in the app until the
model is in and validated, so nothing untrustworthy is shown in the meantime.

**What you need:** a free Google account (for Colab) and a free Roboflow account.
Your Roboflow API key is already in the project: `izv00uPcTBTpu1K1M3C6`.

---

## Step 1 — Open the notebook in Colab
1. Go to https://colab.research.google.com → **File → Upload notebook**.
2. Upload `skin-cv-service/training/train_acne_colab.ipynb` from this repo.
3. **Runtime → Change runtime type → T4 GPU** (free).

## Step 2 — Point it at an acne dataset
The notebook's cell 3 needs a dataset. Easiest path:
1. Go to https://universe.roboflow.com/search?q=acne%20detection
2. Pick an **object-detection** acne dataset (bounding boxes around lesions — not
   classification). Good starter datasets have 1k–5k labelled images.
3. On the dataset page: **Download → YOLOv11 → "show download code"** and copy the
   snippet. Paste it over the placeholder in **cell 3** (use your key
   `izv00uPcTBTpu1K1M3C6` if it asks).

> Prefer your own data? Upload a YOLO-format folder and set `DATA_YAML` to its
> `data.yaml`. Your own labelled customer photos give the best accuracy —
> especially over-sampling darker skin tones (Fitzpatrick IV–VI).

## Step 3 — Run all
**Runtime → Run all.** It trains YOLOv11-nano (~15–30 min on the free GPU),
exports **`acne_yolo11n_v1.onnx`** (opset 17, single class, 640px — exactly what
the engine expects), prints its **sha256**, and downloads the file to your
computer.

## Step 4 — Send it back
Send me two things:
- the `acne_yolo11n_v1.onnx` file, and
- the **sha256** it printed, plus which dataset you used and its val mAP@50.

## Step 5 — I wire it in (my side)
1. Drop the file at `skin-cv-service/models/acne_yolo11n_v1.onnx` and commit it
   (`git add -f`, ~10 MB).
2. Record its sha256 + provenance in `skin-cv-service/models/MODELS.md` and bump
   `PIPELINE_VERSION`.
3. You **redeploy the engine on Coolify** — `app/pipeline/m1_acne.py` picks the
   model up automatically (deterministic ORT, skin-mask filtering that drops
   nostril/lip/hair false positives).
4. I **un-hide acne** in the results UI (remove `"acne"` from `HIDDEN_CONCERNS`
   in `components/scan/scan-result.tsx`) and add the on-face acne mask, once I've
   validated the detector on a few real photos.

---

## Honest expectations
- A public dataset gives a **Beta** detector: decent on clear cases, weaker on
  darker tones and subtle lesions. We'll label it "Beta" and keep a Skinwise
  expert in the loop.
- Real production accuracy comes from labelling your **own** customer photos over
  time. That's a Phase-B effort, same as the ~5k-scan calibration for the other
  concerns.
- I will not claim acne is "accurate" until it's validated on real faces.
