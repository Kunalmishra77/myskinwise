"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Camera, X } from "lucide-react";
import { assessImageQuality } from "@/lib/analysis/quality-gate";
import type { ScanResult } from "@/lib/skin/types";
import { Button } from "@/components/ui/button";
import { LiveCapture } from "@/components/scan/live-capture";
import { Analyzing } from "@/components/scan/analyzing";
import { LeadGate } from "@/components/analyzer/lead-gate";
import { ScanResultView } from "@/components/scan/scan-result";
import { getSession, patchSession } from "@/lib/consultation/session";
import { CONCERN_META } from "@/lib/skin/concern-content";

// Engine concern id → the consultation concern slug used for product combos.
const ENGINE_TO_CONSULT: Record<string, string> = {
  oiliness: "oily-skin",
  dark_circles: "dark-circles",
  pigmentation: "pigmentation",
  acne: "acne",
  wrinkles: "other-issues",
  pores: "other-issues",
  redness: "other-issues",
  texture: "other-issues",
};

/** Build the customer-safe scan summary the voice/chat handoff explains from. */
function buildScanSummary(result: ScanResult) {
  const notable = result.concerns
    .filter((c) => c.score !== null && c.id !== "acne" && c.severity && c.severity !== "clear")
    .slice()
    .sort((a, b) => (a.score ?? 999) - (b.score ?? 999));
  const features = notable.map((c) => ({
    label: CONCERN_META[c.id]?.label ?? c.id,
    certainty: c.severity === "significant" ? "clearly visible" : c.severity === "moderate" ? "visible" : "mild",
  }));
  return {
    top: notable[0]?.id,
    analysis: {
      imageQuality: "good",
      features: features.length ? features : [{ label: "clear, balanced skin", certainty: "overall" }],
      limitations: "This is a cosmetic read of the photo, not a medical diagnosis.",
    },
  };
}

/**
 * The NEW scan experience, powered by the deterministic engine on the VPS. It
 * lives alongside the existing /skin-check/analyzer (unchanged) so the live
 * scan is never at risk while this is validated. Reuses the lead gate + camera.
 */

const MAX_BYTES = 8 * 1024 * 1024;
type Stage = "lead" | "intro" | "preview" | "analyzing" | "result" | "quality" | "error";

/** ?debug=1 surfaces the exact engine failing-check on a reject (dev/testing). */
function isDebug(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
}

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
  // A one-line guidance shown at the top of the camera after a capture-quality
  // reject, so a retake is a guided correction, not a mystery.
  const [retryHint, setRetryHint] = React.useState<string | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (getSession().leadId) setStage("intro");
  }, []);

  async function handleImage(dataUrl: string, type: string, bytes: number, opts?: { skipQuality?: boolean }) {
    setMessage(null);
    setRetryHint(null);
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
        // Carry the scan into the session so the voice/chat handoff can EXPLAIN
        // it (concern + reference + customer-safe summary), instead of opening a
        // fresh greeting.
        const summary = buildScanSummary(data.result as ScanResult);
        patchSession({
          analysisReference: typeof data.reference === "string" ? data.reference : undefined,
          explainedRef: undefined, // a new scan should be explained afresh
          concern: summary.top ? ENGINE_TO_CONSULT[summary.top] : getSession().concern,
          scanAnalysis: summary.analysis,
        });
        setResult(data.result);
        setStage("result");
      } else if (res.status === 422) {
        // Capture-quality reject: DON'T dead-end. Send them straight back to the
        // live camera with the engine's one specific instruction ("Move back a
        // little", "Look straight at the camera"…) so they just adjust and the
        // camera re-captures. No jarring "analysing → fail" screen.
        let hint = data.failure?.user_message ?? "Let's retake that — hold steady and keep your whole face in the frame.";
        // In ?debug mode, append the exact failing check(s) + measured values, so
        // a reject is never a mystery during testing.
        if (isDebug()) {
          const failed = (data.failure?.quality?.checks ?? [])
            .filter((c: { passed: boolean }) => !c.passed)
            .map((c: { name: string; value: unknown; threshold: unknown }) => `${c.name}=${c.value}(need ${c.threshold})`)
            .join(", ");
          if (failed) hint += `  ·  [${data.failure?.reason_code}: ${failed}]`;
        }
        setPreview(null);
        setConsent(false);
        setRetryHint(hint);
        setStage("intro");
      } else if (res.status === 429) {
        setMessage("You've scanned a lot just now — please wait a little while.");
        setStage("error");
      } else {
        // A service/network problem — NOT the photo's fault. Keep the captured
        // image so the user can just retry the analysis, not the whole camera.
        setMessage(data.failure?.user_message ?? "We couldn't complete the analysis right now.");
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
    setRetryHint(null);
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
            {retryHint ? (
              <div role="status" className="mb-4 rounded-2xl border-l-4 border-rose-ink bg-blush/70 p-3.5">
                <p className="text-sm font-semibold text-rose-ink">Almost there — let&apos;s retake</p>
                <p className="mt-0.5 text-sm text-ink">{retryHint}</p>
              </div>
            ) : null}
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

        {stage === "analyzing" && preview && <Analyzing photo={preview.dataUrl} />}

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
              {/* Service/network failure (not the photo's fault) — retry the
                  SAME captured image instead of forcing a full re-capture. */}
              {stage === "error" && preview && (
                <Button size="lg" onClick={analyze}>Retry analysis</Button>
              )}
              <Button size="lg" variant="outline" onClick={reset}>Try another photo</Button>
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
