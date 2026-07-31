"use client";

import * as React from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/lib/voice/use-voice-conversation";

/**
 * Riya's presence — a soft rose orb that behaves like a living voice, not a
 * button that happens to be round. It IS the primary control (tap it to begin,
 * to end a turn, to interrupt), so the thing you look at and the thing you
 * press are the same, the way they are in a real conversation.
 *
 * Four honest states, so the person always knows what Riya is doing:
 *   idle       a slow breath
 *   listening  the orb swells with the sound of YOUR voice (real mic amplitude)
 *   thinking   a quiet rotating shimmer
 *   speaking   the orb pulses with the sound of HER voice (real TTS amplitude)
 *
 * `getLevel()` returns 0..1 live amplitude for the two audio-reactive states.
 * We read it once per animation frame and drive the transform on the DOM node
 * directly — never through React state — so a 60fps signal never re-renders the
 * tree. Under prefers-reduced-motion the orb holds still and only its colour
 * carries the state.
 */
export function VoiceAvatar({
  state,
  getLevel,
  onTap,
  disabled,
  label,
}: {
  state: VoiceState;
  getLevel: () => number;
  onTap: () => void;
  disabled?: boolean;
  label: string;
}) {
  const coreRef = React.useRef<HTMLSpanElement>(null);
  const stateRef = React.useRef(state);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    const media =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (media?.matches) return; // hold still; colour still conveys state

    let raf = 0;
    let t = 0;
    let cur = 1;
    const loop = () => {
      t += 0.045;
      const s = stateRef.current;
      let target = 1;
      if (s === "listening" || s === "speaking") {
        target = 1 + getLevel() * 0.4;
      } else if (s === "idle" || s === "error") {
        target = 1 + (Math.sin(t) + 1) * 0.02; // gentle breath
      }
      cur += (target - cur) * 0.22; // smooth toward target
      if (coreRef.current) coreRef.current.style.transform = `scale(${cur.toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [getLevel]);

  const active = state === "listening" || state === "speaking";
  const listening = state === "listening";

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-label={label}
      className="relative flex size-56 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-4 focus-visible:ring-offset-warm disabled:cursor-not-allowed sm:size-64"
    >
      {/* Ambient glow — brighter while active. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full blur-2xl transition-opacity duration-500",
          active ? "opacity-80" : "opacity-40",
          listening ? "bg-rose/60" : "bg-rose-ink/40",
        )}
      />
      {/* Concentric rings — a soft ping while listening, steady otherwise. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute rounded-full border border-rose-ink/20",
          "size-full",
          listening && "animate-ping motion-reduce:animate-none",
        )}
      />
      <span aria-hidden="true" className="absolute size-[82%] rounded-full border border-rose-ink/15" />

      {/* Thinking shimmer — a rotating conic sweep. */}
      {state === "thinking" && (
        <span
          aria-hidden="true"
          className="absolute size-[92%] animate-spin rounded-full opacity-70 motion-reduce:animate-none"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(168,80,106,0.5) 90deg, transparent 200deg)",
            animationDuration: "1.6s",
          }}
        />
      )}

      {/* The core orb — this is what the amplitude scales. */}
      <span
        ref={coreRef}
        className={cn(
          "relative flex size-40 items-center justify-center rounded-full text-white shadow-lift transition-colors duration-300 will-change-transform sm:size-44",
          listening ? "bg-rose-deep" : "bg-rose-ink",
        )}
        style={{
          backgroundImage:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45), transparent 55%)",
        }}
      >
        {state === "thinking" || state === "transcribing" ? (
          <Loader2 aria-hidden="true" className="size-10 animate-spin motion-reduce:animate-none" />
        ) : listening ? (
          <Square aria-hidden="true" className="size-9" />
        ) : (
          <Mic aria-hidden="true" className="size-11" />
        )}
      </span>
    </button>
  );
}
