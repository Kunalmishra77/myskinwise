"use client";

import * as React from "react";
import Link from "next/link";
import { Mic, Square, Keyboard, Sparkles } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { cn } from "@/lib/utils";

type CtaKind = "skin_check" | "consultation" | "whatsapp" | "regimen";
type Turn = { role: "user" | "assistant"; content: string; cta?: CtaKind | null };
type State = "idle" | "listening" | "processing" | "thinking" | "speaking" | "error";

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

/* Minimal typing for the still-non-standard Web Speech API. */
type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceAgent() {
  const [state, setState] = React.useState<State>("idle");
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [textMode, setTextMode] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [note, setNote] = React.useState<string | null>(null);

  const recRef = React.useRef<SpeechRec | null>(null);
  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  // Computed once; kept in state (not a ref) so it can be read during render.
  const [speechSupported] = React.useState(() => Boolean(getSpeechRecognition()));

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, state]);

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  /** Send a transcript (from either STT path) through the shared pipeline. */
  async function send(transcript: string) {
    stopSpeaking();
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    setTurns((prev) => [...prev, { role: "user", content: transcript }]);
    setState("thinking");
    try {
      const res = await fetch("/api/v1/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ history, transcript, wantAudio: true }),
      });
      if (res.status === 429) {
        setNote("You've spoken a lot just now — please wait a little while.");
        setState("error");
        return;
      }
      const data = await res.json();
      if (data.status !== "ok") {
        setNote(data.message ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setTurns((prev) => [...prev, { role: "assistant", content: data.text, cta: data.cta }]);
      // Speak the FINAL text: server TTS if available, else browser fallback.
      if (data.audioBase64) {
        setState("speaking");
        const audio = new Audio(`data:${data.audioMimeType};base64,${data.audioBase64}`);
        audioRef.current = audio;
        audio.onended = () => setState("idle");
        audio.onerror = () => setState("idle");
        void audio.play().catch(() => setState("idle"));
      } else if (typeof window !== "undefined" && window.speechSynthesis) {
        setState("speaking");
        const u = new SpeechSynthesisUtterance(data.text);
        u.onend = () => setState("idle");
        window.speechSynthesis.speak(u);
      } else {
        setState("idle");
      }
    } catch {
      setNote("We couldn't reach the assistant. Please check your connection and try again.");
      setState("error");
    }
  }

  /** Primary STT: browser Web Speech API. */
  function startBrowserSTT() {
    const Rec = getSpeechRecognition();
    if (!Rec) return startRecorderSTT();
    stopSpeaking();
    const rec = new Rec();
    recRef.current = rec;
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.continuous = false;
    setNote(null);
    setState("listening");
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript?.trim();
      if (transcript) void send(transcript);
      else setState("idle");
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setNote("Microphone access was blocked. You can allow it in your browser, or type instead.");
        setTextMode(true);
      } else {
        setNote("I didn't catch that. Try again, or type instead.");
      }
      setState("idle");
    };
    rec.onend = () => setState((s) => (s === "listening" ? "idle" : s));
    try {
      rec.start();
    } catch {
      startRecorderSTT();
    }
  }

  /** Fallback STT: record audio, send to the server transcription route. */
  async function startRecorderSTT() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setState("processing");
        const base64 = await blobToBase64(blob);
        const history = turns.map((t) => ({ role: t.role, content: t.content }));
        const res = await fetch("/api/v1/voice", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ history, audioBase64: base64, audioMimeType: blob.type, wantAudio: true }),
        }).then((r) => r.json()).catch(() => null);
        if (!res || res.status === "stt_failed" || res.status !== "ok") {
          setNote(res?.message ?? "I couldn't catch that — please try again or type instead.");
          setState("error");
          setTextMode(true);
          return;
        }
        setTurns((prev) => [...prev, { role: "assistant", content: res.text, cta: res.cta }]);
        if (res.audioBase64) {
          setState("speaking");
          const audio = new Audio(`data:${res.audioMimeType};base64,${res.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setState("idle");
          void audio.play().catch(() => setState("idle"));
        } else setState("idle");
      };
      setState("listening");
      mr.start();
    } catch {
      setNote("We couldn't use your microphone. Please type your message instead.");
      setTextMode(true);
      setState("idle");
    }
  }

  function onMicTap() {
    if (state === "listening") {
      // Stop recording / recognition.
      recRef.current?.stop();
      if (mediaRef.current?.state === "recording") mediaRef.current.stop();
      return;
    }
    if (state === "speaking") {
      // Barge-in: stop the assistant and immediately listen.
      stopSpeaking();
      setState("idle");
    }
    startBrowserSTT();
  }

  const busy = state === "processing" || state === "thinking";

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-2xl flex-col px-4 lg:min-h-[calc(100dvh-4rem)]">
      <div className="flex-1 overflow-y-auto py-6" aria-live="polite">
        {turns.length === 0 ? (
          <div className="flex flex-col items-center pt-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-blush text-rose-ink">
              <Sparkles aria-hidden="true" className="size-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold text-ink">Talk to Skinwise</h1>
            <p className="mt-2 max-w-sm text-ink-soft">
              Tap the mic and tell me what you&rsquo;re experiencing with your skin. It&rsquo;s the same
              guidance as the chat — hands-free.
            </p>
            {!speechSupported && (
              <p className="mt-4 text-sm text-ink-soft">
                Your browser may record audio for us to transcribe, or you can type instead.
              </p>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {turns.map((t, i) => (
              <li key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-3xl px-4 py-3", t.role === "user" ? "bg-rose-ink text-white" : "bg-surface text-ink shadow-soft")}>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{t.content}</p>
                  {t.role === "assistant" && t.cta && (
                    t.cta === "whatsapp" ? (
                      <a href={CTA_HREF[t.cta]} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full bg-rose-ink px-5 py-2.5 text-sm font-semibold text-white">
                        {CTA_LABEL[t.cta]}
                      </a>
                    ) : (
                      <Link href={CTA_HREF[t.cta]} className="mt-3 inline-flex rounded-full bg-rose-ink px-5 py-2.5 text-sm font-semibold text-white">
                        {CTA_LABEL[t.cta]}
                      </Link>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {note && <p role="alert" className="mt-4 rounded-2xl bg-champagne/50 p-3 text-sm text-ink">{note}</p>}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 border-t border-ink/10 bg-warm/95 py-4 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {textMode ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) {
                void send(typed.trim());
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
            <button type="submit" disabled={busy || !typed.trim()} className="rounded-2xl bg-rose-ink px-5 py-3 font-semibold text-white disabled:opacity-40">
              Send
            </button>
            <button type="button" onClick={() => setTextMode(false)} aria-label="Use voice" className="rounded-2xl border border-ink/15 p-3 text-ink">
              <Mic aria-hidden="true" className="size-5" />
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={onMicTap}
              disabled={busy}
              aria-label={state === "listening" ? "Stop listening" : "Start speaking"}
              className={cn(
                "flex size-20 items-center justify-center rounded-full text-white shadow-lift transition-transform disabled:opacity-50",
                state === "listening" ? "bg-rose-deep animate-pulse" : "bg-rose-ink active:scale-95",
              )}
            >
              {state === "listening" ? <Square aria-hidden="true" className="size-7" /> : <Mic aria-hidden="true" className="size-8" />}
            </button>
            <p role="status" className="text-sm font-medium text-ink-soft">
              {state === "idle" && "Tap to speak"}
              {state === "listening" && "Listening… tap to stop"}
              {state === "processing" && "Transcribing…"}
              {state === "thinking" && "Thinking…"}
              {state === "speaking" && "Speaking… tap mic to interrupt"}
              {state === "error" && "Tap to try again"}
            </p>
            <button onClick={() => setTextMode(true)} className="inline-flex min-h-11 items-center gap-1.5 py-1 text-sm font-semibold text-rose-ink">
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
