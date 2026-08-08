"use client";

import * as React from "react";
import { ImageUp, Camera } from "lucide-react";

/**
 * Live, guided face capture — the Lenskart-style experience.
 *
 * Opens the front camera and, on each frame, runs on-device face detection
 * (MediaPipe BlazeFace, self-hosted WASM) plus cheap brightness/sharpness
 * metrics. It shows ONE instruction at a time ("Come closer", "Look straight",
 * "Hold still"…), turns the guide ring GREEN as the shot becomes good, fills a
 * progress ring while everything stays green, and AUTO-CAPTURES a clean frame —
 * so the user never fights a "blurry photo" rejection.
 *
 * Everything is best-effort: if the camera or the detector can't start, it falls
 * back to a manual capture button and a plain upload.
 */

const VALIDATE_FRAMES = 5; // ~0.45s of steady validation before the ring goes GREEN
const GREEN_FRAMES_TO_CAPTURE = 13; // ~1.2s of sustained, STILL "good" before the shutter
const DETECT_EVERY_MS = 90; // throttle detection to ~11fps

// Absolute floor for the burst's sharpness (Laplacian variance on the 200px
// downscale). If even the sharpest of the burst is below this, the frame is
// genuinely soft — don't ship it, keep guiding instead of surprising the user
// with a server blur reject.
const MIN_CAPTURE_SHARPNESS = 6;

type Verdict = {
  ok: boolean;
  hint: string;
  dbg: { size?: number; luma?: number; sharp?: number; yaw?: number; roll?: number };
};

// Guide-ring geometry lives in the SVG's 100×133 viewBox. This is where the ring
// rests before a face is found (and where it eases back to when one is lost).
const VB_W = 100;
const VB_H = 133;
const CONTAINER_AR = 3 / 4; // the preview box is aspect-[3/4] (width / height)
const DEFAULT_RING = { cx: 50, cy: 60, rx: 31, ry: 40 } as const;
type Ring = { cx: number; cy: number; rx: number; ry: number };

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Map a detector bounding box (normalised to the RAW video) to a guide ellipse in
 * the overlay's viewBox — so the ring tracks the actual face. Accounts for two
 * transforms the eye can't see: the video is CSS-mirrored (scaleX(-1)), and it is
 * `object-cover` cropped to the 3:4 preview, so the visible region is a centre
 * slice of the sensor frame. The ellipse is padded to a face-oval and clamped to
 * stay fully inside the frame.
 */
function ringFromBox(bb: NonNullable<Detection["boundingBox"]>, vw: number, vh: number): Ring {
  const nx = (bb.originX + bb.width / 2) / vw;
  const ny = (bb.originY + bb.height / 2) / vh;
  const nw = bb.width / vw;
  const nh = bb.height / vh;
  const vAspect = vw / vh;

  let fx: number, fy: number, fw: number, fh: number;
  if (vAspect > CONTAINER_AR) {
    // Video is wider than the box → cropped left/right.
    const visW = CONTAINER_AR / vAspect;
    fx = (nx - (1 - visW) / 2) / visW;
    fw = nw / visW;
    fy = ny;
    fh = nh;
  } else {
    // Video is taller than the box → cropped top/bottom.
    const visH = vAspect / CONTAINER_AR;
    fy = (ny - (1 - visH) / 2) / visH;
    fh = nh / visH;
    fx = nx;
    fw = nw;
  }
  fx = 1 - fx; // undo the mirror for display

  const rx = clamp((fw / 2) * VB_W * 1.18, 16, 44);
  const ry = clamp((fh / 2) * VB_H * 1.5, 22, 56);
  const cx = clamp(fx * VB_W, rx, VB_W - rx);
  const cy = clamp(fy * VB_H, ry, VB_H - ry);
  return { cx, cy, rx, ry };
}

/**
 * Project a normalised detector point (0..1 in the raw video) into the overlay
 * viewBox, applying the same mirror + object-cover crop the ring uses — so the
 * live tracking dots land exactly on the real facial landmarks.
 */
function projectPoint(nx: number, ny: number, vw: number, vh: number): { x: number; y: number } {
  const vAspect = vw / vh;
  let fx: number, fy: number;
  if (vAspect > CONTAINER_AR) {
    const visW = CONTAINER_AR / vAspect;
    fx = (nx - (1 - visW) / 2) / visW;
    fy = ny;
  } else {
    const visH = vAspect / CONTAINER_AR;
    fy = (ny - (1 - visH) / 2) / visH;
    fx = nx;
  }
  fx = 1 - fx; // mirror
  return { x: fx * VB_W, y: fy * VB_H };
}

type FaceDetectorLike = {
  detectForVideo: (v: HTMLVideoElement, ts: number) => { detections: Detection[] };
};
type Detection = {
  boundingBox?: { originX: number; originY: number; width: number; height: number };
  keypoints?: { x: number; y: number }[];
};

export function LiveCapture({
  onCapture,
  onUpload,
}: {
  onCapture: (dataUrl: string, type: string, bytes: number) => void;
  onUpload: (dataUrl: string, type: string, bytes: number) => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const detectorRef = React.useRef<FaceDetectorLike | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const loopRef = React.useRef<(() => void) | null>(null);
  const metricCanvas = React.useRef<HTMLCanvasElement | null>(null);
  const greenFrames = React.useRef(0);
  const lastDetect = React.useRef(0);
  const capturedRef = React.useRef(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const ringRef = React.useRef<Ring>({ ...DEFAULT_RING });
  const targetRef = React.useRef<Ring>({ ...DEFAULT_RING });
  // Latest detected face box in RAW video pixels — the crop in grab() frames to
  // this, so the analysis image is always a face close-up, never the viewport.
  const lastDetRef = React.useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const lastCentreRef = React.useRef<{ x: number; y: number } | null>(null);

  const [status, setStatus] = React.useState<"starting" | "live" | "blocked">("starting");
  const [hint, setHint] = React.useState("Getting the camera ready…");
  const [good, setGood] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [flash, setFlash] = React.useState(false);
  const [ring, setRing] = React.useState<Ring>({ ...DEFAULT_RING });
  // Live tracking dots on the real detected landmarks (eyes/nose/mouth/ears) —
  // in overlay-viewBox coords. Empty when no face is detected.
  const [marks, setMarks] = React.useState<{ x: number; y: number }[]>([]);
  // Dev diagnostics (?debug=1): live metrics + the verdict, so a failing capture
  // is never a mystery.
  const [debugOn] = React.useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"),
  );
  const [dbg, setDbg] = React.useState<Verdict["dbg"] & { hint?: string; ok?: boolean }>({});

  const stop = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const grab = React.useCallback(async (manual = false) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || capturedRef.current) return;
    const det = lastDetRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // We CROP to the detected face — never the whole viewport. That gives the
    // engine a proper close-up (no random background) AND makes the face's pixel
    // geometry consistent, so the capture gate passes reliably instead of
    // rejecting a too-close/too-far full-frame shot. Without a face we can't
    // frame a crop, so we guide instead of shipping a background photo.
    if (!det) {
      if (manual) setHint("Let's get your face in the frame first");
      return;
    }
    capturedRef.current = true;
    setFlash(true);

    // Face-relative 3:4 portrait crop with generous padding (forehead → chin +
    // margin). cropW = 2.2× the face box, so the face fills ~45% of the output
    // at ANY distance → interpupillary distance lands ~165px in the sent image,
    // safely inside the engine gate's 90–260px band. Clamped to the frame.
    const fcx = det.x + det.w / 2;
    const fcy = det.y + det.h / 2;
    let cropW = Math.min(det.w * 2.2, vw);
    let cropH = Math.min(cropW * (4 / 3), vh);
    // Keep the intended aspect if height got clamped by re-deriving width.
    cropW = Math.min(cropW, cropH * (3 / 4));
    cropH = cropW * (4 / 3);
    let cropX = fcx - cropW / 2;
    let cropY = fcy - cropH * 0.46; // face a touch above centre (more forehead)
    cropX = Math.max(0, Math.min(cropX, vw - cropW));
    cropY = Math.max(0, Math.min(cropY, vh - cropH));

    const OUT_W = 768;
    const OUT_H = Math.round(OUT_W * (cropH / cropW));
    const out = document.createElement("canvas");
    out.width = OUT_W;
    out.height = OUT_H;
    const octx = out.getContext("2d");
    const small = document.createElement("canvas");
    small.width = 200;
    small.height = 200;
    const sctx = small.getContext("2d", { willReadFrequently: true });

    // Burst: over ~250ms grab several cropped frames and KEEP THE SHARPEST.
    let bestUrl: string | null = null;
    let bestSharp = -1;
    for (let i = 0; i < 5 && octx && sctx; i++) {
      // Crop + scale the real (un-mirrored) video straight into the output.
      octx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, OUT_W, OUT_H);
      sctx.drawImage(out, 0, 0, 200, 200);
      const { data } = sctx.getImageData(0, 0, 200, 200);
      const g = new Float32Array(200 * 200);
      for (let p = 0, k = 0; p < data.length; p += 4, k++) {
        g[k] = 0.299 * data[p]! + 0.587 * data[p + 1]! + 0.114 * data[p + 2]!;
      }
      let sum = 0;
      let sq = 0;
      let n = 0;
      for (let y = 1; y < 199; y++) {
        for (let x = 1; x < 199; x++) {
          const idx = y * 200 + x;
          const lap = 4 * g[idx]! - g[idx - 1]! - g[idx + 1]! - g[idx - 200]! - g[idx + 200]!;
          sum += lap;
          sq += lap * lap;
          n++;
        }
      }
      const sharp = sq / n - (sum / n) ** 2;
      if (sharp > bestSharp) {
        bestSharp = sharp;
        bestUrl = out.toDataURL("image/jpeg", 0.92);
      }
      await new Promise((r) => setTimeout(r, 55));
    }

    // If even the sharpest frame is genuinely soft, don't ship it — resume the
    // guided scan so the user gets a sharp shot instead of a server blur reject.
    if (bestSharp >= 0 && bestSharp < MIN_CAPTURE_SHARPNESS) {
      capturedRef.current = false;
      setFlash(false);
      greenFrames.current = 0;
      setProgress(0);
      setGood(false);
      setHint("Hold steady — let's get a sharper shot");
      if (loopRef.current) rafRef.current = requestAnimationFrame(loopRef.current);
      return;
    }

    const dataUrl = bestUrl ?? out.toDataURL("image/jpeg", 0.92);
    const bytes = Math.round((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75);
    stop();
    onCapture(dataUrl, "image/jpeg", bytes);
  }, [onCapture, stop]);

  // Cheap frame metrics on a small canvas: mean luma + Laplacian variance.
  const frameMetrics = React.useCallback((video: HTMLVideoElement) => {
    let c = metricCanvas.current;
    if (!c) {
      c = document.createElement("canvas");
      c.width = 160;
      c.height = 160;
      metricCanvas.current = c;
    }
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { luma: 128, sharp: 999 };
    ctx.drawImage(video, 0, 0, 160, 160);
    const { data } = ctx.getImageData(0, 0, 160, 160);
    const gray = new Float32Array(160 * 160);
    let lumaSum = 0;
    for (let p = 0, g = 0; p < data.length; p += 4, g++) {
      const y = 0.299 * data[p]! + 0.587 * data[p + 1]! + 0.114 * data[p + 2]!;
      gray[g] = y;
      lumaSum += y;
    }
    let sum = 0;
    let sumSq = 0;
    let n = 0;
    for (let y = 1; y < 159; y++) {
      for (let x = 1; x < 159; x++) {
        const i = y * 160 + x;
        const lap = 4 * gray[i]! - gray[i - 1]! - gray[i + 1]! - gray[i - 160]! - gray[i + 160]!;
        sum += lap;
        sumSq += lap * lap;
        n++;
      }
    }
    const mean = sum / n;
    return { luma: lumaSum / (160 * 160), sharp: sumSq / n - mean * mean };
  }, []);

  // Evaluate the current frame → one guidance hint + whether it's capture-ready,
  // plus the raw metrics (for the ?debug overlay). Because grab() CROPS to the
  // face, the absolute interpupillary distance in the SENT image is fixed by the
  // crop, so here we only need a sensible FACE-SIZE band (big enough to track
  // reliably, small enough to leave padding room for the crop) — not an absolute
  // IPD gate. Frontality is checked from real keypoints; the server gate (now
  // recalibrated) is the final authority.
  const evaluate = React.useCallback(
    (det: Detection | undefined, vw: number, vh: number): Verdict => {
      if (!det?.boundingBox) return { ok: false, hint: "Center your face in the frame", dbg: {} };
      const bb = det.boundingBox;
      const cx = (bb.originX + bb.width / 2) / vw;
      const cy = (bb.originY + bb.height / 2) / vh;
      const size = bb.width / vw;
      const kp = det.keypoints ?? [];
      const { luma, sharp } = frameMetrics(videoRef.current!);
      const dbg: Verdict["dbg"] = { size: +size.toFixed(2), luma: Math.round(luma), sharp: Math.round(sharp) };

      // NOTE: the guide oval is object-cover-zoomed, so a face that visually
      // fills it is a SMALLER fraction of the raw video frame — hence a low floor.
      // The crop normalises framing and the server gate is the real authority, so
      // this only needs to catch a roughly-good frontal face and fire.
      if (size < 0.16) return { ok: false, hint: "Come a little closer", dbg };
      if (size > 0.5) return { ok: false, hint: "Move back a little", dbg };
      if (Math.abs(cx - 0.5) > 0.2) return { ok: false, hint: cx < 0.5 ? "Move a bit right" : "Move a bit left", dbg };
      if (Math.abs(cy - 0.5) > 0.22) return { ok: false, hint: cy < 0.5 ? "Move down a little" : "Move up a little", dbg };

      // Straightness / yaw from the two eye keypoints (0=right eye, 1=left eye,
      // 2=nose). Kept loose so a natural selfie isn't over-gated here.
      if (kp[0] && kp[1] && kp[2]) {
        const dy = Math.abs(kp[0].y - kp[1].y);
        const dx = Math.abs(kp[0].x - kp[1].x) || 1e-3;
        dbg.roll = +(dy / dx).toFixed(2);
        if (dy / dx > 0.28) return { ok: false, hint: "Keep your head straight", dbg };
        const mid = (kp[0].x + kp[1].x) / 2;
        const off = (kp[2].x - mid) / dx;
        dbg.yaw = +off.toFixed(2);
        if (off > 0.55) return { ok: false, hint: "Turn slightly right", dbg };
        if (off < -0.55) return { ok: false, hint: "Turn slightly left", dbg };
      }

      if (luma < 50) return { ok: false, hint: "Find brighter, even light", dbg };
      if (luma > 220) return { ok: false, hint: "Move out of direct glare", dbg };
      if (sharp < 10) return { ok: false, hint: "Hold still…", dbg };

      return { ok: true, hint: "Perfect — hold it!", dbg };
    },
    [frameMetrics],
  );

  const start = React.useCallback(async () => {
    setStatus("starting");
    capturedRef.current = false;
    greenFrames.current = 0;
    lastCentreRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
      setStatus("live");

      // Build the detector (best-effort; without it we still allow manual capture).
      try {
        const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
        detectorRef.current = (await FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "/mediapipe/blaze_face_short_range.tflite" },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        })) as unknown as FaceDetectorLike;
      } catch {
        detectorRef.current = null;
        setHint("Line your face up and tap Capture.");
      }

      const loop = () => {
        const v = videoRef.current;
        if (!v || capturedRef.current) return;
        const now = performance.now();
        if (detectorRef.current && v.videoWidth && now - lastDetect.current >= DETECT_EVERY_MS) {
          lastDetect.current = now;
          try {
            const res = detectorRef.current.detectForVideo(v, now);
            const det = res.detections?.[0];
            const verdict = evaluate(det, v.videoWidth, v.videoHeight);
            if (debugOn) setDbg({ ...verdict.dbg, hint: verdict.hint, ok: verdict.ok });
            // Remember the face box (raw video px) so grab() can crop to it.
            lastDetRef.current = det?.boundingBox
              ? { x: det.boundingBox.originX, y: det.boundingBox.originY, w: det.boundingBox.width, h: det.boundingBox.height }
              : null;
            // Aim the guide ring at the face (or ease back to centre when lost).
            targetRef.current = det?.boundingBox
              ? ringFromBox(det.boundingBox, v.videoWidth, v.videoHeight)
              : { ...DEFAULT_RING };
            // Live tracking dots on the real landmarks the detector returns.
            setMarks(
              det?.keypoints?.length
                ? det.keypoints.map((k) => projectPoint(k.x, k.y, v.videoWidth, v.videoHeight))
                : [],
            );
            // STABILITY GATE — only count "good" frames while the face is also
            // HOLDING STILL. If it moved since the last frame, the shot isn't
            // stable yet, so the hold restarts. This is what stops the scanner
            // firing mid-movement; capture needs ~1s of steady, valid framing.
            const centre = det?.boundingBox
              ? { x: (det.boundingBox.originX + det.boundingBox.width / 2) / v.videoWidth, y: (det.boundingBox.originY + det.boundingBox.height / 2) / v.videoHeight }
              : null;
            const prev = lastCentreRef.current;
            const moved = prev && centre ? Math.hypot(centre.x - prev.x, centre.y - prev.y) : 1;
            lastCentreRef.current = centre;
            const stable = moved < 0.018; // < ~1.8% of the frame between detections
            if (verdict.ok && stable) {
              greenFrames.current += 1;
            } else {
              greenFrames.current = 0;
            }
            // GREEN only after a real validation period of steady, valid framing
            // (RED = still validating), so it can't snap green the instant a face
            // appears. Then a further hold confirms a stable frame before capture.
            const verified = greenFrames.current >= VALIDATE_FRAMES;
            setGood(verified);
            setHint(
              verified
                ? "Perfect — hold still"
                : verdict.ok && !stable
                  ? "Almost there — hold still"
                  : verdict.ok
                    ? "Checking…"
                    : verdict.hint,
            );
            setProgress(Math.min(1, greenFrames.current / GREEN_FRAMES_TO_CAPTURE));
            if (greenFrames.current >= GREEN_FRAMES_TO_CAPTURE) {
              grab();
              return;
            }
          } catch {
            /* skip this frame */
          }
        }
        // Ease the ring toward its target every frame for a smooth 60fps follow,
        // independent of the throttled detection cadence.
        const t = targetRef.current;
        const r = ringRef.current;
        const next: Ring = {
          cx: r.cx + (t.cx - r.cx) * 0.25,
          cy: r.cy + (t.cy - r.cy) * 0.25,
          rx: r.rx + (t.rx - r.rx) * 0.25,
          ry: r.ry + (t.ry - r.ry) * 0.25,
        };
        ringRef.current = next;
        setRing(next);
        rafRef.current = requestAnimationFrame(loop);
      };
      loopRef.current = loop; // so grab() can resume the scan after a soft frame
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setStatus("blocked");
    }
  }, [evaluate, grab, debugOn]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onPick(file: File | undefined) {
    if (!file) return;
    const dataUrl = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(file);
    });
    stop();
    onUpload(dataUrl, file.type || "image/jpeg", file.size);
  }

  // RED until every check passes and the face is held still; GREEN = validated
  // and ready. So the colour is an honest readiness signal, not "a face exists".
  const ringColor = good ? "#5bbf7b" : "#e0687a";

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" hidden onChange={(e) => onPick(e.target.files?.[0])} />

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-plum">
        {status !== "blocked" ? (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover [transform:scaleX(-1)]" />

            {/* Guide + progress ring. */}
            <svg aria-hidden="true" viewBox="0 0 100 133" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
              <defs>
                <mask id="lc-hole">
                  <rect width="100" height="133" fill="white" />
                  <ellipse cx={ring.cx} cy={ring.cy} rx={ring.rx} ry={ring.ry} fill="black" />
                </mask>
                <clipPath id="lc-ring-clip">
                  <ellipse cx={ring.cx} cy={ring.cy} rx={ring.rx} ry={ring.ry} />
                </clipPath>
                <linearGradient id="lc-scan-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#5bbf7b" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#8fe0a6" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#5bbf7b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect width="100" height="133" fill="rgba(35,22,25,0.45)" mask="url(#lc-hole)" />

              {/* Scan line sweeping the face while it's locked on — clipped to the
                  guide so it reads as "scanning your skin now". */}
              {good && (
                <g clipPath="url(#lc-ring-clip)">
                  <rect className="lc-scanline" x="0" width="100" height="7" y="-7" fill="url(#lc-scan-grad)" />
                </g>
              )}

              {/* Live tracking dots on the real detected landmarks. */}
              {marks.map((m, i) => (
                <circle key={i} cx={m.x} cy={m.y} r={good ? 0.9 : 0.75} fill={good ? "#8fe0a6" : "#ffffff"} opacity="0.9" />
              ))}

              <ellipse cx={ring.cx} cy={ring.cy} rx={ring.rx} ry={ring.ry} fill="none" stroke={ringColor} strokeOpacity="0.5" strokeWidth="1.2" />
              <ellipse
                cx={ring.cx}
                cy={ring.cy}
                rx={ring.rx}
                ry={ring.ry}
                fill="none"
                stroke="#5bbf7b"
                strokeWidth="2.4"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100 - progress * 100}
                transform={`rotate(-90 ${ring.cx} ${ring.cy})`}
                style={{ transition: "stroke-dashoffset 120ms linear" }}
              />
            </svg>
            <style>{`
              @keyframes lc-sweep { 0% { transform: translateY(0); } 100% { transform: translateY(140px); } }
              .lc-scanline { animation: lc-sweep 1.5s ease-in-out infinite; }
              @media (prefers-reduced-motion: reduce) { .lc-scanline { animation: none; opacity: 0; } }
            `}</style>

            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <p className={`rounded-full px-4 py-1.5 text-sm font-semibold backdrop-blur ${good ? "bg-[#5bbf7b] text-white" : "bg-plum/70 text-white"}`}>
                {hint}
              </p>
            </div>

            {debugOn && (
              <div className="absolute left-2 top-2 rounded-lg bg-black/70 px-2 py-1 font-mono text-[10px] leading-tight text-white">
                <div>face:{dbg.size ?? "-"} luma:{dbg.luma ?? "-"} sharp:{dbg.sharp ?? "-"}</div>
                <div>yaw:{dbg.yaw ?? "-"} roll:{dbg.roll ?? "-"} → {dbg.ok ? "READY" : dbg.hint}</div>
              </div>
            )}

            {flash && <div className="absolute inset-0 animate-[pulse_300ms_ease-out] bg-white" />}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <Camera aria-hidden="true" className="size-10 text-white/80" />
            <p className="mt-3 text-sm text-white/90">{"We couldn't open your camera. You can upload a photo instead."}</p>
            <button type="button" onClick={() => start()} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink">
              Try the camera again
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {status === "live" && (
          <button type="button" onClick={() => grab(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-ink px-6 py-3.5 font-semibold text-white transition active:scale-95">
            <Camera aria-hidden="true" className="size-5" />
            Capture now
          </button>
        )}
        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold text-rose-ink">
          <ImageUp aria-hidden="true" className="size-4" />
          Upload a photo instead
        </button>
      </div>
    </div>
  );
}
