"use client";

import * as React from "react";
import Link from "next/link";
import { Mic, Square, Keyboard, Loader2, X, Send } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { cn } from "@/lib/utils";
import { useVoiceConversation, type CtaKind, type VoiceState } from "@/lib/voice/use-voice-conversation";
import { RecommendedCombo } from "@/components/products/recommended-combo";

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

const STATUS: Record<VoiceState, string> = {
  idle: "Tap to speak",
  listening: "Listening…",
  transcribing: "Got it…",
  thinking: "Thinking…",
  speaking: "Speaking… tap to interrupt",
  error: "Tap to try again",
};

/**
 * The voice-to-voice experience, shared by the floating overlay and the full
 * /voice page so the hard part exists once. Pass `onClose` to render the X and
 * behave as an overlay; omit it for the standalone page.
 */
export function VoiceConversation({ onClose }: { onClose?: () => void }) {
  const { state, turns, note, toggle, reset, sendText } = useVoiceConversation({ autoListen: true });
  const [textMode, setTextMode] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, state]);

  // Escape closes the overlay.
  React.useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const busy = state === "transcribing" || state === "thinking";
  const active = state === "listening" || state === "speaking";
  // Show the combo under the newest reply only (see the chat for the same
  // single-card-follows-latest rationale).
  const lastTurn = turns[turns.length - 1];
  const lastRecommend = !busy && lastTurn?.role === "assistant" ? lastTurn.recommendConcern : undefined;

  return (
    <div className="flex h-full flex-col">
      {onClose && (
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="font-display text-lg font-semibold text-ink">Skinwise Voice</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close voice assistant"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-blush"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
        {turns.length === 0 ? (
          <div className="flex flex-col items-center pt-6 text-center">
            <h2 className="font-display text-2xl font-semibold text-ink">Talk to Skinwise</h2>
            <p className="mt-2 max-w-xs text-sm text-ink-soft">
              Tap the mic and ask anything about your skin — ingredients, routines, or what to do
              next. I&rsquo;ll answer out loud, and keep listening so you can just talk.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {turns.map((t, i) => (
              <li key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-3xl px-4 py-2.5",
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
                        onClick={onClose}
                        className="mt-2 inline-flex rounded-full bg-rose-ink px-4 py-2 text-sm font-semibold text-white"
                      >
                        {CTA_LABEL[t.cta]}
                      </a>
                    ) : (
                      <Link
                        href={CTA_HREF[t.cta]}
                        onClick={onClose}
                        className="mt-2 inline-flex rounded-full bg-rose-ink px-4 py-2 text-sm font-semibold text-white"
                      >
                        {CTA_LABEL[t.cta]}
                      </Link>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {lastRecommend && (
          <div className="mt-4">
            <RecommendedCombo concern={lastRecommend} />
          </div>
        )}
        {note && (
          <p role="alert" className="mt-4 rounded-2xl bg-champagne/50 p-3 text-sm text-ink">
            {note}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-ink/10 bg-warm/95 px-5 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] backdrop-blur-md">
        {textMode ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) {
                sendText(typed.trim());
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
              aria-label="Send"
              className="inline-flex size-12 items-center justify-center rounded-2xl bg-rose-ink text-white disabled:opacity-40"
            >
              <Send aria-hidden="true" className="size-5" />
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
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex size-24 items-center justify-center">
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
                onClick={toggle}
                disabled={busy}
                aria-label={
                  state === "listening"
                    ? "Stop and send"
                    : state === "speaking"
                      ? "Interrupt and speak"
                      : "Start speaking"
                }
                className={cn(
                  "relative flex size-20 items-center justify-center rounded-full text-white shadow-lift transition-transform disabled:opacity-60",
                  state === "listening" ? "bg-rose-deep" : "bg-rose-ink active:scale-95",
                )}
              >
                {busy ? (
                  <Loader2 aria-hidden="true" className="size-8 animate-spin motion-reduce:animate-none" />
                ) : state === "listening" ? (
                  <Square aria-hidden="true" className="size-7" />
                ) : (
                  <Mic aria-hidden="true" className="size-9" />
                )}
              </button>
            </div>

            <p role="status" className="text-sm font-medium text-ink-soft">
              {STATUS[state]}
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setTextMode(true)}
                className="inline-flex min-h-11 items-center gap-1.5 py-1 text-sm font-semibold text-rose-ink"
              >
                <Keyboard aria-hidden="true" className="size-4" />
                Type instead
              </button>
              {turns.length > 0 && (
                <button
                  onClick={reset}
                  className="inline-flex min-h-11 items-center py-1 text-sm font-semibold text-ink-soft"
                >
                  Start over
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
