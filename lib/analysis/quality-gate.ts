/**
 * Client-side image quality gate — runs in the browser BEFORE a photo is
 * uploaded, so an obviously unusable image is caught without a network round
 * trip or an AI call.
 *
 * Scope, deliberately narrow (requirement §3): it answers only "is this
 * technically suitable for analysis?" — blur and exposure. It does NOT and
 * must not answer anything about skin conditions.
 *
 * On face detection: the architecture research identified MediaPipe Face
 * Landmarker (Apache-2.0, on-device WASM) as the right tool for face
 * presence / count / framing, but it needs a real per-device benchmark
 * before it is trusted, which cannot be done in this environment. So face
 * presence is currently confirmed by the vision model itself (it returns
 * `face_visible`), and MediaPipe is the documented next enhancement for a
 * purely on-device face check. See docs/status for the note. These two
 * deterministic checks (blur, exposure) ship now because they need no
 * dependency and no benchmark.
 */

export type QualityVerdict = {
  ok: boolean;
  reason?: "too_blurry" | "too_dark" | "too_bright";
  message?: string;
};

/**
 * Variance of the Laplacian — the standard cheap blur metric. A sharp image
 * has high edge energy (high variance); a blurred one is smooth (low
 * variance). The threshold is conservative so only clearly blurred images
 * are rejected.
 */
function laplacianVariance(gray: Float32Array, w: number, h: number): number {
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = 4 * gray[i]! - gray[i - 1]! - gray[i + 1]! - gray[i - w]! - gray[i + w]!;
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  if (n === 0) return 0;
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

const BLUR_THRESHOLD = 60; // below this reads as clearly out of focus
const DARK_THRESHOLD = 45; // mean luminance 0..255
const BRIGHT_THRESHOLD = 225;

/** Assesses an already-loaded image element. Downsamples for speed. */
export function assessImageQuality(source: CanvasImageSource, naturalWidth: number, naturalHeight: number): QualityVerdict {
  const target = 256;
  const scale = Math.min(1, target / Math.max(naturalWidth, naturalHeight));
  const w = Math.max(1, Math.round(naturalWidth * scale));
  const h = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: true }; // can't check → don't block; the server/model still gate

  ctx.drawImage(source, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const gray = new Float32Array(w * h);
  let lumaSum = 0;
  for (let p = 0, g = 0; p < data.length; p += 4, g++) {
    // Rec. 601 luma.
    const y = 0.299 * data[p]! + 0.587 * data[p + 1]! + 0.114 * data[p + 2]!;
    gray[g] = y;
    lumaSum += y;
  }
  const meanLuma = lumaSum / (w * h);

  if (meanLuma < DARK_THRESHOLD) {
    return { ok: false, reason: "too_dark", message: "This looks too dark. Try again in brighter, even light." };
  }
  if (meanLuma > BRIGHT_THRESHOLD) {
    return { ok: false, reason: "too_bright", message: "This looks overexposed. Move out of direct glare and try again." };
  }
  if (laplacianVariance(gray, w, h) < BLUR_THRESHOLD) {
    return { ok: false, reason: "too_blurry", message: "This looks blurry. Hold steady, let it focus, and try again." };
  }
  return { ok: true };
}
