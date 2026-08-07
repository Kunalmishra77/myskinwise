"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Camera, X } from "lucide-react";
import { assessImageQuality } from "@/lib/analysis/quality-gate";
import type { ScanResult } from "@/lib/skin/types";
import { Button } from "@/components/ui/button";
import { LiveCapture } from "@/components/scan/live-capture";
import { LeadGate } from "@/components/analyzer/lead-gate";
import { ScanResultView } from "@/components/scan/scan-result";
import { getSession } from "@/lib/consultation/session";

/**
 * The NEW scan experience, powered by the deterministic engine on the VPS. It
 * lives alongside the existing /skin-check/analyzer (unchanged) so the live
 * scan is never at risk while this is validated. Reuses the lead gate + camera.
 */

const MAX_BYTES = 8 * 1024 * 1024;
type Stage = "lead" | "intro" | "preview" | "analyzing" | "result" | "quality" | "error";

function toBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? "";
}
async function toImage(dataUrl: string): Promise<HTMLImageElement> {
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = dataUrl;
  });
  return img;
}

export function ScanFlow() {
  const [stage, setStage] = React.useState<Stage>("lead");
  const [preview, setPreview] = React.useState<{ dataUrl: string; type: string; bytes: number } | null>(null);
  const [consent, setConsent] = React.useState(false);
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (getSession().leadId) setStage("intro");
  }, []);

  async function handleImage(dataUrl: string, type: string, bytes: number, opts?: { skipQuality?: boolean }) {
    setMessage(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(type)) return setMessage("Please choose a JPG, PNG or WebP image.");
    if (bytes > MAX_BYTES) return setMessage("That image is over 8MB. Please choose a smaller one.");
    // A live auto-captured frame is already vetted by the on-camera gate — only
    // re-check uploads (and even then, leniently; the server gate is authority).
    if (!opts?.skipQuality) {
      const img = await toImage(dataUrl);
      const verdict = assessImageQuality(img, img.naturalWidth, img.naturalHeight);
      if (!verdict.ok) return setMessage(verdict.message ?? "Let's try a clearer photo.");
    }
    setPreview({ dataUrl, type, bytes });
    setStage("preview");
  }

  async function analyze() {
    if (!preview || !consent) return;
    setStage("analyzing");
    try {
      const res = await fetch("/api/v1/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64: toBase64(preview.dataUrl),
          contentType: preview.type,
          consentImageAnalysis: true,
          leadId: getSession().leadId,
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.status === "completed") {
        setResult(data.result);
        setStage("result");
      } else if (res.status === 422) {
        setMessage(data.failure?.user_message ?? "That photo needs a retake.");
        setStage("quality");
      } else if (res.status === 429) {
        setMessage("You've scanned a lot just now — please wait a little while.");
        setStage("error");
      } else {
        setMessage(data.failure?.user_message ?? "Something went wrong. Please try again.");
        setStage("error");
      }
    } catch {
      setMessage("We couldn't reach the scanner. Please check your connection and try again.");
      setStage("error");
    }
  }

  function reset() {
    setPreview(null);
    setResult(null);
    setConsent(false);
    setMessage(null);
    setStage("intro");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-2 px-4 py-4">
        <Link href="/" aria-label="Back" className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-blush">
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <span className="font-body text-sm font-semibold text-ink-soft">AI Skin Analysis</span>
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-16">
        {stage === "lead" && <LeadGate onDone={() => setStage("intro")} />}

        {stage === "intro" && (
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Scan your skin.</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Capture a clear, evenly lit, straight-on photo. Our engine measures shine, redness,
              tone, texture, pores and more — and shows you exactly where.
            </p>
            <div className="mt-5">
              <LiveCapture
                onCapture={(url, type, bytes) => handleImage(url, type, bytes, { skipQuality: true })}
                onUpload={(url, type, bytes) => handleImage(url, type, bytes)}
              />
            </div>
            {message && (
              <p role="alert" className="mt-4 rounded-2xl bg-champagne/60 p-3 text-sm text-ink">{message}</p>
            )}
          </div>
        )}

        {stage === "preview" && preview && (
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Look good?</h1>
            <div className="relative mt-5 overflow-hidden rounded-3xl bg-blush">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
              <img src={preview.dataUrl} alt="Your photo preview" className="w-full object-cover" />
              <button onClick={reset} aria-label="Remove photo" className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-plum/70 text-white">
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <div className="mt-6 rounded-2xl bg-surface p-4 shadow-soft">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[#b74a68]" />
                <span className="text-sm text-ink-soft">
                  I understand my photo is analysed to measure visible skin attributes, is processed
                  securely, and this is not a medical diagnosis.
                </span>
              </label>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Button size="lg" onClick={analyze} disabled={!consent}>Analyse my photo</Button>
              <Button size="lg" variant="outline" onClick={reset}>
                <Camera aria-hidden="true" className="size-4" />
                Retake or upload another
              </Button>
            </div>
          </div>
        )}

        {stage === "analyzing" && (
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <div aria-hidden="true" className="size-10 animate-spin rounded-full border-2 border-blush border-t-rose-ink motion-reduce:animate-none" />
            <p role="status" className="mt-5 text-ink">Measuring your skin…</p>
          </div>
        )}

        {stage === "result" && result && preview && (
          <ScanResultView result={result} photo={preview.dataUrl} onRestart={reset} />
        )}

        {(stage === "quality" || stage === "error") && (
          <div className="pt-8">
            <h1 className="font-display text-3xl font-semibold text-ink">
              {stage === "quality" ? "Let's try that photo again" : "That didn't work"}
            </h1>
            {message ? <p className="mt-3 text-ink-soft">{message}</p> : null}
            <div className="mt-8 flex flex-col gap-3">
              <Button size="lg" onClick={reset}>Try another photo</Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/skin-check">Continue with the Skin Check</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
