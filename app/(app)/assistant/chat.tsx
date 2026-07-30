"use client";

import * as React from "react";
import Link from "next/link";
import { Send, Sparkles, Mic } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/provider";
import { ASSISTANT } from "@/content/i18n/assistant-ui";
import { useTContent } from "@/lib/i18n/use-content";
import { T } from "@/components/i18n/t";

type CtaKind = "skin_check" | "consultation" | "whatsapp" | "regimen";
type Msg = { role: "user" | "assistant"; content: string; cta?: CtaKind | null };

type ConcernSlug = "acne" | "pigmentation" | "other-issues";

/**
 * The concern picker that makes the chat condition-specific. Choosing one
 * sends an opening line AND tags every later message with the concern, so the
 * server steers a focused conversation (concern-specific questions + content)
 * rather than the same generic answers for everyone.
 */
const CONCERN_STARTERS: { slug: ConcernSlug; label: string; opener: string }[] = [
  { slug: "acne", label: ASSISTANT.concernAcneLabel, opener: ASSISTANT.concernAcneOpener },
  {
    slug: "pigmentation",
    label: ASSISTANT.concernPigmentationLabel,
    opener: ASSISTANT.concernPigmentationOpener,
  },
  {
    slug: "other-issues",
    label: ASSISTANT.concernOtherLabel,
    opener: ASSISTANT.concernOtherOpener,
  },
];

const GENERAL_SUGGESTIONS = [ASSISTANT.suggestionNiacinamide, ASSISTANT.suggestionDifference];

const CTA_LABEL: Record<CtaKind, string> = {
  skin_check: ASSISTANT.ctaSkinCheck,
  consultation: ASSISTANT.ctaConsultation,
  whatsapp: ASSISTANT.ctaWhatsapp,
  regimen: ASSISTANT.ctaRegimen,
};

const CTA_HREF: Record<CtaKind, string> = {
  skin_check: "/skin-check",
  consultation: "/skin-check",
  whatsapp: waHref(SITE.whatsapp.e164),
  regimen: "/consultation",
};

function Cta({ kind }: { kind: CtaKind }) {
  const external = kind === "whatsapp";
  const className =
    "mt-3 inline-flex items-center gap-2 rounded-full bg-rose-ink px-5 py-2.5 text-sm font-semibold text-white";
  if (external) {
    return (
      <a href={CTA_HREF[kind]} target="_blank" rel="noopener noreferrer" className={className}>
        <T>{CTA_LABEL[kind]}</T>
      </a>
    );
  }
  return (
    <Link href={CTA_HREF[kind]} className={className}>
      <T>{CTA_LABEL[kind]}</T>
    </Link>
  );
}

export function AssistantChat() {
  const tc = useTContent();
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [concern, setConcern] = React.useState<ConcernSlug | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const locale = useLocale();

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string, chosenConcern?: ConcernSlug) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    // A concern chosen now applies to this message and every one after it;
    // state updates async, so use the explicit value for this request.
    const activeConcern = chosenConcern ?? concern;
    if (chosenConcern) setConcern(chosenConcern);
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/v1/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          ...(activeConcern ? { concern: activeConcern } : {}),
          lang: locale,
        }),
      });
      if (res.status === 429) {
        setError(ASSISTANT.errorRateLimit);
        setBusy(false);
        return;
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.text, cta: data.cta }]);
    } catch {
      setError(ASSISTANT.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-2xl flex-col px-4 lg:min-h-[calc(100dvh-4rem)]">
      <div className="flex-1 overflow-y-auto py-6" aria-live="polite" aria-label={tc(ASSISTANT.conversationLabel)}>
        {empty ? (
          <div className="flex flex-col items-center pt-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-blush text-rose-ink">
              <Sparkles aria-hidden="true" className="size-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold text-ink">
              <T>{ASSISTANT.heroTitle}</T>
            </h1>
            <p className="mt-2 max-w-sm text-ink-soft">
              <T>{ASSISTANT.heroBody}</T>
            </p>

            {/*
              Text and voice presented as two peer choices rather than a chat
              box with a link buried under it. The voice agent previously had
              exactly one entry point on the entire site — a small text link
              here, which also disappeared the moment a conversation started.
              Someone who prefers speaking had no way to discover that they
              could.
            */}
            <div className="mt-7 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col items-start rounded-3xl border-2 border-rose-ink/25 bg-surface p-5 text-left">
                <span className="flex size-10 items-center justify-center rounded-xl bg-blush text-rose-ink">
                  <Send aria-hidden="true" className="size-5" />
                </span>
                <h2 className="mt-3 font-display text-lg font-semibold text-ink"><T>{ASSISTANT.textTitle}</T></h2>
                <p className="mt-1 text-sm text-ink-soft">
                  <T>{ASSISTANT.textBody}</T>
                </p>
              </div>

              <Link
                href="/voice"
                className="group flex flex-col items-start rounded-3xl bg-rose-ink p-5 text-left text-white shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
                  <Mic aria-hidden="true" className="size-5" />
                </span>
                <h2 className="mt-3 font-display text-lg font-semibold"><T>{ASSISTANT.voiceTitle}</T></h2>
                <p className="mt-1 text-sm text-white">
                  <T>{ASSISTANT.voiceBody}</T>
                </p>
                <span className="mt-3 text-sm font-semibold underline underline-offset-4 group-hover:no-underline">
                  <T>{ASSISTANT.voiceStart}</T>
                </span>
              </Link>
            </div>

            {/* Concern picker — the heart of the condition-specific chat.
                Choosing one starts a focused conversation for that concern. */}
            <div className="mt-8 w-full text-left">
              <p className="text-sm font-semibold text-ink"><T>{ASSISTANT.concernPrompt}</T></p>
              <ul className="mt-3 flex w-full flex-col gap-2">
                {CONCERN_STARTERS.map((c) => (
                  <li key={c.slug}>
                    <button
                      onClick={() => send(c.opener, c.slug)}
                      className="flex w-full items-center justify-between rounded-2xl border border-ink/10 bg-surface px-4 py-3.5 text-left text-sm font-medium text-ink transition hover:border-rose-ink/40 hover:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
                    >
                      <T>{c.label}</T>
                      <span aria-hidden="true" className="text-rose-ink">
                        &rarr;
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-sm text-ink-soft"><T>{ASSISTANT.askAnything}</T></p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {GENERAL_SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => send(s)}
                      className="rounded-full border border-ink/10 bg-surface px-3.5 py-2 text-sm text-ink-soft transition hover:border-rose-ink/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
                    >
                      <T>{s}</T>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <li key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-3xl px-4 py-3",
                    m.role === "user" ? "bg-rose-ink text-white" : "bg-surface text-ink shadow-soft",
                  )}
                >
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
                  {m.role === "assistant" && m.cta && <Cta kind={m.cta} />}
                </div>
              </li>
            ))}
            {busy && (
              <li className="flex justify-start">
                <div className="rounded-3xl bg-surface px-4 py-3 shadow-soft" role="status" aria-label={tc(ASSISTANT.typingLabel)}>
                  <span className="flex gap-1">
                    <span className="size-2 animate-bounce rounded-full bg-rose-ink/60 [animation-delay:-0.2s]" />
                    <span className="size-2 animate-bounce rounded-full bg-rose-ink/60 [animation-delay:-0.1s]" />
                    <span className="size-2 animate-bounce rounded-full bg-rose-ink/60" />
                  </span>
                </div>
              </li>
            )}
          </ul>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-champagne/50 p-3 text-sm text-ink">
            <T>{error}</T>
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="sticky bottom-0 border-t border-ink/10 bg-warm/95 py-3 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
      >
        <div className="flex items-end gap-2">
          <label htmlFor="ask" className="sr-only">
            <T>{ASSISTANT.inputLabel}</T>
          </label>
          <textarea
            id="ask"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder={tc(ASSISTANT.inputPlaceholder)}
            className="max-h-32 flex-1 resize-none rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
          />
          {/*
            Switching to voice has to stay reachable mid-conversation, not
            only from the empty state. Someone who starts typing on the move
            is exactly the person who then wants to speak instead.
          */}
          <Link
            href="/voice"
            aria-label={tc(ASSISTANT.voiceSwitchLabel)}
            title={tc(ASSISTANT.voiceSwitchTitle)}
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-ink/15 bg-surface text-rose-ink transition hover:border-rose-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
          >
            <Mic aria-hidden="true" className="size-5" />
          </Link>
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label={tc(ASSISTANT.sendLabel)}
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-ink text-white disabled:opacity-40"
          >
            <Send aria-hidden="true" className="size-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-ink-soft">
          <T>{ASSISTANT.disclaimer}</T>
        </p>
      </form>
    </div>
  );
}
