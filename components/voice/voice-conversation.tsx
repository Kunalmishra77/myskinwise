"use client";

import * as React from "react";
import Link from "next/link";
import { Keyboard, X, Send, Mic } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { cn } from "@/lib/utils";
import { useVoiceConversation, type CtaKind } from "@/lib/voice/use-voice-conversation";
import { VoiceAvatar } from "@/components/voice/voice-avatar";
import { RecommendedCombo } from "@/components/products/recommended-combo";
import { useT } from "@/lib/i18n/provider";

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

/**
 * The voice-to-voice experience with Riya, shared by the floating overlay and
 * the full /voice page. The transcript rides along the TOP; the centre belongs
 * to Riya's orb — the thing you look at and press. Pass `onClose` to render the
 * X and behave as an overlay; omit it for the standalone page.
 */
export function VoiceConversation({ onClose }: { onClose?: () => void }) {
  const t = useT();
  const { state, turns, note, toggle, reset, sendText, getLevel } = useVoiceConversation({
    autoListen: true,
  });
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

  const statusText =
    state === "listening"
      ? t("voice.listening")
      : state === "transcribing"
        ? t("voice.gotIt")
        : state === "thinking"
          ? t("voice.thinking")
          : state === "speaking"
            ? t("voice.speaking")
            : state === "error"
              ? t("voice.tapToRetry")
              : turns.length
                ? t("voice.tapToSpeak")
                : t("voice.tapToTalk");

  const lastTurn = turns[turns.length - 1];
  const lastRecommend = !busy && lastTurn?.role === "assistant" ? lastTurn.recommendConcern : undefined;

  return (
    <div className="flex h-full flex-col bg-warm">
      {/* Persona header */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-rose-ink text-sm font-semibold text-white">
            {t("voice.persona").slice(0, 1)}
          </span>
          <div className="leading-tight">
            <p className="font-display text-base font-semibold text-ink">{t("voice.persona")}</p>
            <p className="text-xs text-ink-soft">{t("voice.personaTag")}</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("voice.close")}
            className="inline-flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-blush"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        )}
      </div>

      {/* Transcript — the upper band, capped so the orb keeps the centre. */}
      <div className="max-h-[34%] shrink-0 overflow-y-auto px-5 pt-3" aria-live="polite">
        {turns.length > 0 && (
          <ul className="flex flex-col gap-2">
            {turns.map((turn, i) => (
              <li key={i} className={cn("flex", turn.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    turn.role === "user" ? "bg-rose-ink text-white" : "bg-surface text-ink shadow-soft",
                  )}
                >
                  <p className="whitespace-pre-wrap">{turn.content}</p>
                  {turn.role === "assistant" &&
                    turn.cta &&
                    (turn.cta === "whatsapp" ? (
                      <a
                        href={CTA_HREF[turn.cta]}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="mt-2 inline-flex rounded-full bg-rose-ink px-3.5 py-1.5 text-xs font-semibold text-white"
                      >
                        {CTA_LABEL[turn.cta]}
                      </a>
                    ) : (
                      <Link
                        href={CTA_HREF[turn.cta]}
                        onClick={onClose}
                        className="mt-2 inline-flex rounded-full bg-rose-ink px-3.5 py-1.5 text-xs font-semibold text-white"
                      >
                        {CTA_LABEL[turn.cta]}
                      </Link>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {lastRecommend && (
          <div className="mt-3">
            <RecommendedCombo concern={lastRecommend} />
          </div>
        )}
        {note && (
          <p role="alert" className="mt-3 rounded-2xl bg-champagne/50 p-3 text-sm text-ink">
            {note}
          </p>
        )}
        <div ref={endRef} />
      </div>

      {/* Centre stage — Riya's orb + status. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5">
        <VoiceAvatar state={state} getLevel={getLevel} onTap={toggle} disabled={busy} label={statusText} />
        <p role="status" className="min-h-6 text-center text-sm font-medium text-ink-soft">
          {statusText}
        </p>
        {turns.length === 0 && state === "idle" && (
          <p className="max-w-xs text-center text-sm text-ink-soft/80">{t("voice.emptyHint")}</p>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-ink/10 bg-warm/95 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-md">
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
              placeholder={t("voice.typeMessage")}
              className="flex-1 rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
            />
            <button
              type="submit"
              disabled={busy || !typed.trim()}
              aria-label={t("voice.send")}
              className="inline-flex size-12 items-center justify-center rounded-2xl bg-rose-ink text-white disabled:opacity-40"
            >
              <Send aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setTextMode(false)}
              aria-label={t("voice.useVoice")}
              className="inline-flex size-12 items-center justify-center rounded-2xl border border-ink/15 text-rose-ink"
            >
              <Mic aria-hidden="true" className="size-5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-5">
            <button
              onClick={() => setTextMode(true)}
              className="inline-flex min-h-11 items-center gap-1.5 py-1 text-sm font-semibold text-rose-ink"
            >
              <Keyboard aria-hidden="true" className="size-4" />
              {t("voice.typeInstead")}
            </button>
            {turns.length > 0 && (
              <button
                onClick={reset}
                className="inline-flex min-h-11 items-center py-1 text-sm font-semibold text-ink-soft"
              >
                {t("voice.startOver")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
