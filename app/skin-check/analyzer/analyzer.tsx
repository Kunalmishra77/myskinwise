"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Camera, ImageUp, X } from "lucide-react";
import { assessImageQuality } from "@/lib/analysis/quality-gate";
import { type Observation } from "@/lib/ai/vision-schema";
import { Button } from "@/components/ui/button";
import { CheckVsScan } from "@/components/features/check-vs-scan";
import { ScanResult } from "@/app/skin-check/analyzer/scan-result";
import { Eyebrow } from "@/components/ui/eyebrow";

const POLICY_VERSION = "2026-07-23";
const MAX_BYTES = 8 * 1024 * 1024;

type Stage = "intro" | "preview" | "analyzing" | "result" | "quality" | "error";

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    return img;
  } finally {
    // Revoke after load; the dataURL below is what we keep.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function toBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? "";
}

export function Analyzer() {
  const [stage, setStage] = React.useState<Stage>("intro");
  const [preview, setPreview] = React.useState<{ dataUrl: string; type: string; bytes: number } | null>(null);
  const [consent, setConsent] = React.useState(false);
  const [observation, setObservation] = React.useState<Observation | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage("That image is over 8MB. Please choose a smaller one.");
      return;
    }
    const img = await fileToImage(file);
    const verdict = assessImageQuality(img, img.naturalWidth, img.naturalHeight);
    const dataUrl = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(file);
    });
    if (!verdict.ok) {
      setMessage(verdict.message ?? "That photo won't work — please try another.");
      return;
    }
    setPreview({ dataUrl, type: file.type, bytes: file.size });
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
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.status === "completed") {
        setObservation(data.observation);
        setStage("result");
      } else if (res.status === 422) {
        setMessage(data.message);
        setStage("quality");
      } else if (res.status === 429) {
        setMessage("You've run a few analyses just now — please wait a little while.");
        setStage("error");
      } else {
        setMessage(data.message ?? "We couldn't analyse that photo.");
        setStage("error");
      }
    } catch {
      setMessage("We couldn't reach the analyser. Please check your connection and try again.");
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
        <Link href="/" aria-label="Back" className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-blush">
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <span className="font-body text-sm font-semibold text-ink-soft">AI Skin Scanner</span>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        hidden
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-16">
        {stage === "intro" && (
          <div>
            <Eyebrow index="01">AI-assisted look</Eyebrow>
            <h1 className="mt-4 font-display text-display font-semibold text-ink">A closer look at your skin.</h1>
            <p className="mt-4 text-ink-soft">
              Add a clear, front-facing photo in good light. Our AI describes what&rsquo;s{" "}
              <em>visible</em> — shine, redness, texture, tone. It&rsquo;s a starting point, not a
              diagnosis, and a Skinwise expert makes the real decisions.
            </p>

            <ul className="mt-6 flex flex-col gap-2 text-sm text-ink-soft">
              {["Natural, even light", "Face centred and in focus", "No heavy makeup or filters"].map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-ink" />
                  {t}
                </li>
              ))}
            </ul>

            {message && <p role="alert" className="mt-5 rounded-2xl bg-champagne/50 p-3 text-sm text-ink">{message}</p>}

            <div className="mt-8 flex flex-col gap-3">
              <Button size="lg" onClick={() => fileRef.current?.click()}>
                <Camera aria-hidden="true" className="size-4" />
                Take or choose a photo
              </Button>
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
            <h1 className="font-display text-3xl font-semibold text-ink">Look good?</h1>
            <div className="relative mt-5 overflow-hidden rounded-3xl bg-blush">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, never uploaded to next/image */}
              <img src={preview.dataUrl} alt="Your photo preview" className="w-full object-cover" />
              <button
                onClick={reset}
                aria-label="Remove photo"
                className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-plum/70 text-white"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-surface p-4 shadow-soft">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[#a8506a]" />
                <span className="text-sm text-ink-soft">
                  I understand my photo will be analysed by AI for a non-diagnostic observation, stored
                  securely, and deleted within 90 days. It is not a medical diagnosis.
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button size="lg" onClick={analyze} disabled={!consent}>
                Analyse my photo
              </Button>
              <Button size="lg" variant="outline" onClick={() => fileRef.current?.click()}>
                <ImageUp aria-hidden="true" className="size-4" />
                Choose a different photo
              </Button>
            </div>
          </div>
        )}

        {stage === "analyzing" && (
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <div aria-hidden="true" className="size-10 animate-spin rounded-full border-2 border-blush border-t-rose-ink motion-reduce:animate-none" />
            <p role="status" className="mt-5 text-ink">Looking at your photo&hellip;</p>
          </div>
        )}

        {stage === "result" && observation && (
          <ScanResult observation={observation} photo={preview?.dataUrl ?? null} onRestart={reset} />
        )}

        {(stage === "quality" || stage === "error") && (
          <div className="pt-8">
            <h1 className="font-display text-3xl font-semibold text-ink">
              {stage === "quality" ? "Let's try that photo again" : "That didn't work"}
            </h1>
            <p className="mt-3 text-ink-soft">{message}</p>
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
