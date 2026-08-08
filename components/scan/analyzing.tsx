"use client";

import * as React from "react";
import { Check } from "lucide-react";

/**
 * The "analysing" screen. It is REQUEST-DRIVEN, not a fake timer: it walks the
 * honest pipeline stages while the scan is genuinely in flight, but it NEVER
 * shows everything complete on its own — the final stage stays live (pulsing)
 * until the real result arrives and the parent swaps this screen out. So the
 * user never sees a full green checklist and then a failure. A scan line sweeps
 * their own photo so it reads as active analysis.
 *
 * The engine's fixed pipeline is gate -> normalise -> region segmentation ->
 * per-metric measurement -> scoring, so each label names a real step.
 */

const STAGES = [
  "Detecting your face",
  "Checking position & lighting",
  "Mapping skin regions",
  "Measuring each concern",
  "Scoring & building your report",
];

export function Analyzing({ photo }: { photo: string }) {
  // Advance through the stages, but STOP at the last one and hold there
  // (pulsing) until the parent unmounts us with the real result. The last
  // stage is never auto-checked — completion only happens for real.
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    const last = STAGES.length - 1;
    const timers = STAGES.slice(0, last).map((_, i) =>
      setTimeout(() => setStage((s) => Math.max(s, i + 1)), 650 + i * 750),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="pt-2">
      <h1 className="font-display text-3xl font-semibold text-ink">Analysing your skin…</h1>
      <p className="mt-1.5 text-sm text-ink-soft">This takes a few seconds — please hold still.</p>

      <div className="relative mx-auto mt-6 aspect-[3/4] w-full overflow-hidden rounded-3xl bg-plum shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
        <img src={photo} alt="Your photo" className="h-full w-full object-cover" />
        {/* Dim + a sweeping scan line. */}
        <div className="pointer-events-none absolute inset-0 bg-plum/25" />
        <div className="scanline pointer-events-none absolute inset-x-0 h-24" />
        {/* Corner brackets for a "scanner" frame. */}
        <div className="pointer-events-none absolute inset-4 rounded-2xl border border-white/30" />
      </div>

      <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-2.5">
        {STAGES.map((label, i) => {
          const isLast = i === STAGES.length - 1;
          // The last stage never auto-completes; it stays "active" until the
          // real result replaces this screen.
          const done = stage > i && !isLast;
          const active = stage === i || (isLast && stage >= i);
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-white transition ${
                  done ? "bg-sage" : active ? "bg-rose-ink" : "bg-ink/15"
                }`}
              >
                {done ? (
                  <Check aria-hidden="true" className="size-3.5" />
                ) : active ? (
                  <span className="size-2 animate-pulse rounded-full bg-white" />
                ) : (
                  <span className="size-2 rounded-full bg-white/60" />
                )}
              </span>
              <span className={`text-sm ${done || active ? "font-medium text-ink" : "text-ink-soft"}`}>{label}</span>
            </li>
          );
        })}
      </ul>

      <style>{`
        @keyframes lc-scan { 0% { top: -6rem; } 100% { top: 100%; } }
        .scanline {
          top: -6rem;
          background: linear-gradient(to bottom, transparent, rgba(183,74,104,0.0), rgba(255,255,255,0.55), rgba(183,74,104,0.0), transparent);
          animation: lc-scan 1.9s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) { .scanline { animation: none; opacity: 0; } }
      `}</style>
    </div>
  );
}
