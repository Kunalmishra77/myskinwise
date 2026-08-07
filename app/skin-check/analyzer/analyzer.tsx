"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Camera, X } from "lucide-react";
import { assessImageQuality } from "@/lib/analysis/quality-gate";
import { type Observation } from "@/lib/ai/vision-schema";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/analyzer/camera-capture";
import { CheckVsScan } from "@/components/features/check-vs-scan";
import { LeadGate } from "@/components/analyzer/lead-gate";
import { ScanResult } from "@/app/skin-check/analyzer/scan-result";
import { SCANNER } from "@/content/i18n/scanner";
import { useTContent } from "@/lib/i18n/use-content";
import { T } from "@/components/i18n/t";
import { getSession, patchSession } from "@/lib/consultation/session";
import { preloadFaceDetector } from "@/lib/analysis/face-detect";

const POLICY_VERSION = "2026-07-23";
const MAX_BYTES = 8 * 1024 * 1024;

type Stage = "lead" | "intro" | "preview" | "analyzing" | "result" | "quality" | "error";

async function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = dataUrl;
  });
  return img;
}

function toBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? "";
}

export function Analyzer() {
  const tc = useTContent();
  // Start on the lead gate; a scanner who already gave their details this
  // session skips straight to the scan. (Server render has no session, so it
  // renders the gate — matching the client's initial state, then the effect
  // advances a returning scanner.)
  const [stage, setStage] = React.useState<Stage>("lead");
  React.useEffect(() => {
    // Warm the face-detection model while the user frames their shot, so the
    // markers are ready the moment the analysis returns.
    preloadFaceDetector();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (getSession().leadId) setStage("intro");
  }, []);
  const [preview, setPreview] = React.useState<{ dataUrl: string; type: string; bytes: number } | null>(null);
  const [consent, setConsent] = React.useState(false);
  const [observation, setObservation] = React.useState<Observation | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  // Handles an image from either the live camera or an upload: validate,
  // run the on-device quality gate, then move to the confirm step. A rejected
  // photo leaves the user on the camera (which stays live) with a reason.
  async function handleImage(dataUrl: string, type: string, bytes: number) {
    setMessage(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(type)) {
      setMessage(SCANNER.badType);
      return;
    }
    if (bytes > MAX_BYTES) {
      setMessage(SCANNER.tooBig);
      return;
    }
    const img = await dataUrlToImage(dataUrl);
    const verdict = assessImageQuality(img, img.naturalWidth, img.naturalHeight);
    if (!verdict.ok) {
      setMessage(verdict.message ?? SCANNER.badPhoto);
      return;
    }
    setPreview({ dataUrl, type, bytes });
    setStage("preview");
  }

  async function analyze() {
    if (!preview || !consent) return;
    setStage("analyzing");
    try {
      const res = await fetch("/api/v1/analysis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          images: [{ base64: toBase64(preview.dataUrl), contentType: preview.type, bytes: preview.bytes, angle: "front" }],
          consentImageAnalysis: true,
          policyVersion: POLICY_VERSION,
          leadId: getSession().leadId,
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.status === "completed") {
        setObservation(data.observation);
        // Record the result in the unified session so Riya can read it back by
        // voice afterwards. A NEW scan clears any previous "already explained"
        // marker so the fresh result gets narrated.
        patchSession({ analysisReference: data.reference, explainedRef: undefined });
        setStage("result");
      } else if (res.status === 422) {
        setMessage(data.message);
        setStage("quality");
      } else if (res.status === 429) {
        setMessage(SCANNER.rateLimited);
        setStage("error");
      } else {
        setMessage(data.message ?? SCANNER.analyseFailed);
        setStage("error");
      }
    } catch {
      setMessage(SCANNER.unreachable);
      setStage("error");
    }
  }

  function reset() {
    setPreview(null);
    setObservation(null);
    setConsent(false);
    setMessage(null);
    setStage("intro");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-2 px-4 py-4">
        {/* Back to home, not to the Skin Check. The Scanner is its own
            experience; sending someone "back" into the questionnaire is a
            large part of why the two read as one thing. */}
        <Link href="/" aria-label={tc(SCANNER.back)} className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-blush">
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <span className="font-body text-sm font-semibold text-ink-soft"><T>{SCANNER.header}</T></span>
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-16">
        {stage === "lead" && <LeadGate onDone={() => setStage("intro")} />}

        {stage === "intro" && (
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink"><T>{SCANNER.introTitle}</T></h1>
            <p className="mt-2 text-sm text-ink-soft"><T>{SCANNER.introBody}</T></p>

            <div className="mt-5">
              <CameraCapture onCapture={handleImage} message={message} />
            </div>

            {/* Says plainly how the two assessments differ, and keeps the
                no-photo route visible for anyone who will not photograph
                their face. */}
            <div className="mt-8">
              <CheckVsScan current="analyzer" />
            </div>
          </div>
        )}

        {stage === "preview" && preview && (
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink"><T>{SCANNER.previewTitle}</T></h1>
            <div className="relative mt-5 overflow-hidden rounded-3xl bg-blush">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, never uploaded to next/image */}
              <img src={preview.dataUrl} alt={tc(SCANNER.previewAlt)} className="w-full object-cover" />
              <button
                onClick={reset}
                aria-label={tc(SCANNER.removePhoto)}
                className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-plum/70 text-white"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-surface p-4 shadow-soft">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[#a8506a]" />
                <span className="text-sm text-ink-soft"><T>{SCANNER.consent}</T></span>
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button size="lg" onClick={analyze} disabled={!consent}>
                <T>{SCANNER.analyseCta}</T>
              </Button>
              <Button size="lg" variant="outline" onClick={reset}>
                <Camera aria-hidden="true" className="size-4" />
                <T>{SCANNER.retake}</T>
              </Button>
            </div>
          </div>
        )}

        {stage === "analyzing" && (
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <div aria-hidden="true" className="size-10 animate-spin rounded-full border-2 border-blush border-t-rose-ink motion-reduce:animate-none" />
            <p role="status" className="mt-5 text-ink"><T>{SCANNER.analysing}</T></p>
          </div>
        )}

        {stage === "result" && observation && (
          <ScanResult observation={observation} photo={preview?.dataUrl ?? null} onRestart={reset} />
        )}

        {(stage === "quality" || stage === "error") && (
          <div className="pt-8">
            <h1 className="font-display text-3xl font-semibold text-ink">
              <T>{stage === "quality" ? SCANNER.qualityTitle : SCANNER.errorTitle}</T>
            </h1>
            {message ? <p className="mt-3 text-ink-soft"><T>{message}</T></p> : null}
            <div className="mt-8 flex flex-col gap-3">
              <Button size="lg" onClick={reset}><T>{SCANNER.tryAnother}</T></Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/skin-check"><T>{SCANNER.continueCheck}</T></Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
