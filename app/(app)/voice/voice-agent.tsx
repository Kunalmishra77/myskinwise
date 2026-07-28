"use client";

import * as React from "react";
import Link from "next/link";
import { Mic, Square, Keyboard, Loader2 } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { cn } from "@/lib/utils";

type CtaKind = "skin_check" | "consultation" | "whatsapp" | "regimen";
type Turn = { role: "user" | "assistant"; content: string; cta?: CtaKind | null };
type State = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "error";

const CTA_LABEL: Record<CtaKind, string> = {
  skin_check: "Start your Skin Check",
  consultation: "Talk to a Skinwise expert",
  whatsapp: "Message us on WhatsApp",
  regimen: "View my routine",
};
const CTA_HREF: Record<CtaKind, string> = {
  skin_check: "/skin-check",
  consultation: "/skin-check",
  whatsapp: waHref(SITE.whatsapp.e164),
  regimen: "/consultation",
};

const STATUS: Record<State, string> = {
  idle: "Tap to speak",
  listening: "Listening… tap to stop",
  transcribing: "Got it…",
  thinking: "Thinking…",
  speaking: "Speaking… tap to interrupt",
  error: "Tap to try again",
};

/**
 * Voice-to-voice skincare assistant.
 *
 * Every clip is recorded with MediaRecorder and transcribed server-side by
 * ElevenLabs Scribe. The previous version made the browser's Web Speech API
 * the primary path, which is effectively Chrome-desktop-only and failed
 * silently everywhere else — that was the "voice doesn't work" report. There
 * is no Web Speech API here at all now; one reliable path for every device.
 *
 * The brain is unchanged and deliberately so: audio → /api/v1/voice → the
 * SAME grounded respond() orchestrator that powers the text assistant, with
 * its safety escalation and claim-scrubbing → ElevenLabs voice. The voice
 * agent is a transport around that one brain, never a second one.
 */
export function VoiceAgent() {
  const [state, setState] = React.useState<State>("idle");
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [textMode, setTextMode] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [note, setNote] = React.useState<string | null>(null);

  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, state]);

  // Stop any in-flight playback or recording when the screen goes away, so a
  // reply cannot keep talking after the user has navigated on.
  React.useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (mediaRef.current?.state === "recording") mediaRef.current.stop();
    };
  }, []);

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  function speak(text: string, audioBase64?: string, mimeType?: string) {
    if (audioBase64) {
      setState("speaking");
      const audio = new Audio(`data:${mimeType ?? "audio/mpeg"};base64,${audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("idle");
      void audio.play().catch(() => setState("idle"));
      return;
    }
    // Only reached if server TTS failed. Better than silence.
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setState("speaking");
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => setState("idle");
      window.speechSynthesis.speak(u);
    } else {
      setState("idle");
    }
  }

  /** Shared handler for both a recorded clip and typed text. */
  async function submit(body: Record<string, unknown>, optimisticUser?: string) {
    if (optimisticUser) setTurns((prev) => [...prev, { role: "user", content: optimisticUser }]);
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    setState("thinking");
    try {
      const res = await fetch("/api/v1/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ history, wantAudio: true, ...body }),
      });
      if (res.status === 429) {
        setNote("You've spoken a lot just now — please wait a little while.");
        setState("error");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!data || data.status === "stt_failed") {
        setNote(data?.message ?? "I couldn't catch that — please try again, or type instead.");
        setState("error");
        return;
      }
      if (data.status !== "ok") {
        setNote(data.message ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      // When we sent audio, the server transcript is the real user turn.
      if (!optimisticUser && data.transcript) {
        setTurns((prev) => [...prev, { role: "user", content: data.transcript }]);
      }
      setTurns((prev) => [...prev, { role: "assistant", content: data.text, cta: data.cta }]);
      speak(data.text, data.audioBase64, data.audioMimeType);
    } catch {
      setNote("We couldn't reach the assistant. Please check your connection and try again.");
      setState("error");
    }
  }

  async function startListening() {
    stopSpeaking();
    setNote(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        // A clip under ~1KB is almost always an accidental tap with no speech.
        if (blob.size < 1200) {
          setState("idle");
          return;
        }
        setState("transcribing");
        const base64 = await blobToBase64(blob);
        await submit({ audioBase64: base64, audioMimeType: blob.type });
      };
      setState("listening");
      mr.start();
    } catch {
      setNote("We couldn't use your microphone. Please allow access, or type instead.");
      setTextMode(true);
      setState("idle");
    }
  }

  function onMicTap() {
    if (state === "listening") {
      if (mediaRef.current?.state === "recording") mediaRef.current.stop();
      return;
    }
    // Barge-in: interrupt a reply and start listening immediately.
    if (state === "speaking") stopSpeaking();
    void startListening();
  }

  const busy = state === "transcribing" || state === "thinking";
  const active = state === "listening" || state === "speaking";

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-2xl flex-col px-4 lg:min-h-[calc(100dvh-4rem)]">
      {/* Conversation transcript. Kept readable even in a voice UI: noisy
          rooms, hard-of-hearing users, and anyone who wants to re-read. */}
      <div className="flex-1 overflow-y-auto py-6" aria-live="polite">
        {turns.length === 0 ? (
          <div className="flex flex-col items-center pt-10 text-center">
            <h1 className="font-display text-3xl font-semibold text-ink">Talk to Skinwise</h1>
            <p className="mt-3 max-w-sm text-ink-soft">
              Tap the mic and ask anything about your skin — ingredients, routines, or what to do
              next. I&rsquo;ll answer out loud. It&rsquo;s the same guidance as the chat, hands-free.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {turns.map((t, i) => (
              <li key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-3xl px-4 py-3",
                    t.role === "user" ? "bg-rose-ink text-white" : "bg-surface text-ink shadow-soft",
                  )}
                >
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{t.content}</p>
                  {t.role === "assistant" &&
                    t.cta &&
                    (t.cta === "whatsapp" ? (
                      <a
                        href={CTA_HREF[t.cta]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex rounded-full bg-rose-ink px-5 py-2.5 text-sm font-semibold text-white"
                      >
                        {CTA_LABEL[t.cta]}
                      </a>
                    ) : (
                      <Link
                        href={CTA_HREF[t.cta]}
                        className="mt-3 inline-flex rounded-full bg-rose-ink px-5 py-2.5 text-sm font-semibold text-white"
                      >
                        {CTA_LABEL[t.cta]}
                      </Link>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {note && (
          <p role="alert" className="mt-4 rounded-2xl bg-champagne/50 p-3 text-sm text-ink">
            {note}
          </p>
        )}
        <div ref={endRef} />
      </div>

      {/* Mic dock. */}
      <div className="sticky bottom-0 border-t border-ink/10 bg-warm/95 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] backdrop-blur-md">
        {textMode ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) {
                void submit({ transcript: typed.trim() }, typed.trim());
                setTyped("");
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type your message…"
              className="flex-1 rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
            />
            <button
              type="submit"
              disabled={busy || !typed.trim()}
              className="rounded-2xl bg-rose-ink px-5 py-3 font-semibold text-white disabled:opacity-40"
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => setTextMode(false)}
              aria-label="Use voice instead"
              className="inline-flex size-12 items-center justify-center rounded-2xl border border-ink/15 text-rose-ink"
            >
              <Mic aria-hidden="true" className="size-5" />
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex size-28 items-center justify-center">
              {/*
                A single soft ring, animated only while listening or speaking.
                Restrained on purpose — the brief asked for a clear mic, not a
                light show — and it respects prefers-reduced-motion.
              */}
              {active && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 rounded-full motion-reduce:hidden",
                    state === "listening" ? "animate-ping bg-rose-ink/20" : "animate-pulse bg-rose/30",
                  )}
                />
              )}
              <button
                onClick={onMicTap}
                disabled={busy}
                aria-label={
                  state === "listening"
                    ? "Stop listening"
                    : state === "speaking"
                      ? "Interrupt and speak"
                      : "Start speaking"
                }
                className={cn(
                  "relative flex size-24 items-center justify-center rounded-full text-white shadow-lift transition-transform disabled:opacity-60",
                  state === "listening" ? "bg-rose-deep" : "bg-rose-ink active:scale-95",
                )}
              >
                {busy ? (
                  <Loader2 aria-hidden="true" className="size-9 animate-spin motion-reduce:animate-none" />
                ) : state === "listening" ? (
                  <Square aria-hidden="true" className="size-8" />
                ) : (
                  <Mic aria-hidden="true" className="size-10" />
                )}
              </button>
            </div>

            <p role="status" className="text-sm font-medium text-ink-soft">
              {STATUS[state]}
            </p>

            <button
              onClick={() => setTextMode(true)}
              className="inline-flex min-h-11 items-center gap-1.5 py-1 text-sm font-semibold text-rose-ink"
            >
              <Keyboard aria-hidden="true" className="size-4" />
              Type instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onloadend = () => res((r.result as string).split(",")[1] ?? "");
    r.readAsDataURL(blob);
  });
}
