"use client";

import * as React from "react";
import { Camera, ImageUp, SwitchCamera } from "lucide-react";
import { CAMERA } from "@/content/i18n/scanner";
import { useTContent } from "@/lib/i18n/use-content";

/**
 * Live front-camera capture for the Skin Scanner.
 *
 * Opens the camera directly (a live preview with a face-framing guide) rather
 * than the old hidden file input, which on desktop just opened a file picker.
 * The preview is mirrored so it feels like a mirror, but the captured frame is
 * drawn un-mirrored — the real orientation — so the AI and the region markers
 * agree with reality.
 *
 * getUserMedia can fail (no camera, permission denied, or a browser that needs
 * a gesture first). Every one of those falls back to a plain photo upload, so
 * the scanner always has a way forward.
 */
export function CameraCapture({
  onCapture,
  message,
}: {
  onCapture: (dataUrl: string, type: string, bytes: number) => void;
  message?: string | null;
}) {
  const tc = useTContent();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [status, setStatus] = React.useState<"starting" | "live" | "blocked">("starting");
  const [facing, setFacing] = React.useState<"user" | "environment">("user");

  const stop = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = React.useCallback(async (mode: "user" | "environment") => {
    setStatus("starting");
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus("live");
    } catch {
      setStatus("blocked");
    }
  }, [stop]);

  React.useEffect(() => {
    // Open the camera as soon as the scanner mounts. start() sets status,
    // which the render depends on; that is the intended behaviour here, and it
    // must run once on mount, not whenever start/stop/facing identity changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void start(facing);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Draw the raw (un-mirrored) frame, so the saved image matches reality.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const bytes = Math.round((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75);
    // Deliberately do NOT stop the stream here: if the parent's quality gate
    // rejects the shot, the camera must still be live to retake. The stream is
    // released by this component's unmount cleanup once a shot is accepted and
    // the flow advances past the camera.
    onCapture(dataUrl, "image/jpeg", bytes);
  }

  async function onPick(file: File | undefined) {
    if (!file) return;
    const dataUrl = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(file);
    });
    onCapture(dataUrl, file.type || "image/jpeg", file.size);
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        hidden
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-plum">
        {status !== "blocked" ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover [transform:scaleX(-1)]"
            />
            {/* Face framing guide. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[74%] w-[62%] rounded-[50%] border-2 border-white/70 shadow-[0_0_0_9999px_rgba(35,22,25,0.35)]" />
            </div>
            <p className="absolute inset-x-0 bottom-3 text-center text-sm font-medium text-white/90">
              {tc(status === "starting" ? CAMERA.starting : CAMERA.align)}
            </p>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <Camera aria-hidden="true" className="size-10 text-white/80" />
            <p className="mt-3 text-sm text-white/90">{tc(CAMERA.blocked)}</p>
            <button
              type="button"
              onClick={() => start(facing)}
              className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink"
            >
              {tc(CAMERA.retryCamera)}
            </button>
          </div>
        )}
      </div>

      {message && (
        <p role="alert" className="mt-4 rounded-2xl bg-champagne/60 p-3 text-sm text-ink">
          {tc(message)}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {status === "live" && (
          <button
            type="button"
            onClick={capture}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-ink px-6 py-3.5 font-semibold text-white transition active:scale-95"
          >
            <Camera aria-hidden="true" className="size-5" />
            {tc(CAMERA.capture)}
          </button>
        )}
        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-rose-ink"
          >
            <ImageUp aria-hidden="true" className="size-4" />
            {tc(CAMERA.uploadInstead)}
          </button>
          {status === "live" && (
            <button
              type="button"
              onClick={() => {
                const next = facing === "user" ? "environment" : "user";
                setFacing(next);
                void start(next);
              }}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-soft"
            >
              <SwitchCamera aria-hidden="true" className="size-4" />
              {tc(CAMERA.flip)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
