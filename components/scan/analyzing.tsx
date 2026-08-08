"use client";

import * as React from "react";
import { Check } from "lucide-react";

/**
 * Premium "analyzing" screen. The engine runs a fixed pipeline — gate →
 * normalise → region segmentation → per-metric measurement → scoring — so these
 * stages are HONEST: each label names a real step the engine performs. A scan
 * line sweeps the user's own photo while it runs, so it reads as active analysis
 * rather than a generic spinner.
 */

const STAGES = [
  "Detecting your face",
  "Checking position & lighting",
  "Mapping skin regions",
  "Measuring each concern",
  "Scoring & building your report",
];

export function Analyzing({ photo }: { photo: string }) {
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    // Advance through the stages over ~4.5s (about the real end-to-end time).
    const timers = STAGES.map((_, i) => setTimeout(() => setStage(i + 1), 700 + i * 850));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="pt-2">
      <h1 className="font-display text-3xl font-semibold text-ink">Analysing your skin…</h1>

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
          const done = stage > i;
          const active = stage === i;
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
