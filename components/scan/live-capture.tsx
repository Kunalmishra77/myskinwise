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

const GREEN_FRAMES_TO_CAPTURE = 14; // ~0.9s of sustained "good" before the shutter
const DETECT_EVERY_MS = 90; // throttle detection to ~11fps

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
  const metricCanvas = React.useRef<HTMLCanvasElement | null>(null);
  const greenFrames = React.useRef(0);
  const lastDetect = React.useRef(0);
  const capturedRef = React.useRef(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [status, setStatus] = React.useState<"starting" | "live" | "blocked">("starting");
  const [hint, setHint] = React.useState("Getting the camera ready…");
  const [good, setGood] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [flash, setFlash] = React.useState(false);

  const stop = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const grab = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || capturedRef.current) return;
    capturedRef.current = true;
    setFlash(true);

    const w = video.videoWidth;
    const h = video.videoHeight;
    const full = document.createElement("canvas");
    full.width = w;
    full.height = h;
    const fctx = full.getContext("2d");
    const small = document.createElement("canvas");
    small.width = 200;
    small.height = 200;
    const sctx = small.getContext("2d", { willReadFrequently: true });

    // Burst: over ~250ms grab several frames and KEEP THE SHARPEST — so a
    // momentarily-soft frame (autofocus/hand shake) never gets captured.
    let bestUrl: string | null = null;
    let bestSharp = -1;
    for (let i = 0; i < 5 && fctx && sctx; i++) {
      fctx.drawImage(video, 0, 0, w, h); // un-mirrored: real orientation
      sctx.drawImage(full, 0, 0, 200, 200);
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
        bestUrl = full.toDataURL("image/jpeg", 0.92);
      }
      await new Promise((r) => setTimeout(r, 55));
    }

    const dataUrl = bestUrl ?? full.toDataURL("image/jpeg", 0.92);
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

  // Evaluate the current frame → one guidance hint + whether it's capture-ready.
  const evaluate = React.useCallback(
    (det: Detection | undefined, vw: number, vh: number): { ok: boolean; hint: string } => {
      if (!det?.boundingBox) return { ok: false, hint: "Center your face in the ring" };
      const bb = det.boundingBox;
      const cx = (bb.originX + bb.width / 2) / vw;
      const cy = (bb.originY + bb.height / 2) / vh;
      const size = bb.width / vw;

      if (size < 0.26) return { ok: false, hint: "Come a little closer" };
      if (size > 0.66) return { ok: false, hint: "Move back a little" };
      if (Math.abs(cx - 0.5) > 0.14) return { ok: false, hint: cx < 0.5 ? "Move a bit right" : "Move a bit left" };
      if (Math.abs(cy - 0.5) > 0.16) return { ok: false, hint: cy < 0.5 ? "Move down a little" : "Move up a little" };

      // Straightness from the two eye keypoints (0=right eye, 1=left eye).
      const kp = det.keypoints ?? [];
      if (kp[0] && kp[1] && kp[2]) {
        const dy = Math.abs(kp[0].y - kp[1].y);
        const dx = Math.abs(kp[0].x - kp[1].x) || 1e-3;
        if (dy / dx > 0.18) return { ok: false, hint: "Straighten your head" };
        // Yaw: nose should sit between the eyes.
        const mid = (kp[0].x + kp[1].x) / 2;
        const off = (kp[2].x - mid) / dx;
        if (off > 0.35) return { ok: false, hint: "Turn slightly right" };
        if (off < -0.35) return { ok: false, hint: "Turn slightly left" };
      }

      const { luma, sharp } = frameMetrics(videoRef.current!);
      if (luma < 55) return { ok: false, hint: "Find brighter, even light" };
      if (luma > 215) return { ok: false, hint: "Move out of direct glare" };
      if (sharp < 12) return { ok: false, hint: "Hold still…" };

      return { ok: true, hint: "Perfect — hold it!" };
    },
    [frameMetrics],
  );

  const start = React.useCallback(async () => {
    setStatus("starting");
    capturedRef.current = false;
    greenFrames.current = 0;
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
            const verdict = evaluate(res.detections?.[0], v.videoWidth, v.videoHeight);
            setHint(verdict.hint);
            setGood(verdict.ok);
            greenFrames.current = verdict.ok ? greenFrames.current + 1 : 0;
            setProgress(Math.min(1, greenFrames.current / GREEN_FRAMES_TO_CAPTURE));
            if (greenFrames.current >= GREEN_FRAMES_TO_CAPTURE) {
              grab();
              return;
            }
          } catch {
            /* skip this frame */
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setStatus("blocked");
    }
  }, [evaluate, grab]);

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

  // Progress-ring geometry (an ellipse with pathLength normalised to 100).
  const ringColor = good ? "#5bbf7b" : "#ffffff";

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
                  <ellipse cx="50" cy="60" rx="31" ry="40" fill="black" />
                </mask>
              </defs>
              <rect width="100" height="133" fill="rgba(35,22,25,0.45)" mask="url(#lc-hole)" />
              <ellipse cx="50" cy="60" rx="31" ry="40" fill="none" stroke={ringColor} strokeOpacity="0.5" strokeWidth="1.2" />
              <ellipse
                cx="50"
                cy="60"
                rx="31"
                ry="40"
                fill="none"
                stroke="#5bbf7b"
                strokeWidth="2.4"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100 - progress * 100}
                transform="rotate(-90 50 60)"
                style={{ transition: "stroke-dashoffset 120ms linear" }}
              />
            </svg>

            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <p className={`rounded-full px-4 py-1.5 text-sm font-semibold backdrop-blur ${good ? "bg-[#5bbf7b] text-white" : "bg-plum/70 text-white"}`}>
                {hint}
              </p>
            </div>

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
          <button type="button" onClick={grab} className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-ink px-6 py-3.5 font-semibold text-white transition active:scale-95">
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
