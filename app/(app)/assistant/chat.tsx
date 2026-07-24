"use client";

import * as React from "react";
import Link from "next/link";
import { Send, Sparkles, Mic } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { cn } from "@/lib/utils";

type CtaKind = "skin_check" | "consultation" | "whatsapp" | "regimen";
type Msg = { role: "user" | "assistant"; content: string; cta?: CtaKind | null };

const SUGGESTIONS = [
  "What does niacinamide do?",
  "I have oily skin and breakouts — where do I start?",
  "How is Skinwise different?",
  "What's the difference between AM and PM routines?",
];

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

function Cta({ kind }: { kind: CtaKind }) {
  const external = kind === "whatsapp";
  const className =
    "mt-3 inline-flex items-center gap-2 rounded-full bg-rose-ink px-5 py-2.5 text-sm font-semibold text-white";
  if (external) {
    return (
      <a href={CTA_HREF[kind]} target="_blank" rel="noopener noreferrer" className={className}>
        {CTA_LABEL[kind]}
      </a>
    );
  }
  return (
    <Link href={CTA_HREF[kind]} className={className}>
      {CTA_LABEL[kind]}
    </Link>
  );
}

export function AssistantChat() {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
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
        }),
      });
      if (res.status === 429) {
        setError("You're sending messages quickly — please wait a moment.");
        setBusy(false);
        return;
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.text, cta: data.cta }]);
    } catch {
      setError("Something went wrong. Please try again, or message us on WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-2xl flex-col px-4 lg:min-h-[calc(100dvh-4rem)]">
      <div className="flex-1 overflow-y-auto py-6" aria-live="polite" aria-label="Conversation">
        {empty ? (
          <div className="flex flex-col items-center pt-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-blush text-rose-ink">
              <Sparkles aria-hidden="true" className="size-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold text-ink">Ask Skinwise</h1>
            <p className="mt-2 max-w-sm text-ink-soft">
              Questions about ingredients, concerns or routines — I&rsquo;ll help, and point you to a
              real expert when it matters.
            </p>
            <ul className="mt-8 flex w-full flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    onClick={() => send(s)}
                    className="w-full rounded-2xl border border-ink/10 bg-surface px-4 py-3 text-left text-sm text-ink transition hover:border-rose-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
            <Link
              href="/voice"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rose-ink"
            >
              <Mic aria-hidden="true" className="size-4" />
              Prefer to talk? Use the voice assistant
            </Link>
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
                <div className="rounded-3xl bg-surface px-4 py-3 shadow-soft" role="status" aria-label="Skinwise is typing">
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
            {error}
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
            Ask Skinwise a question
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
            placeholder="Ask about your skin…"
            className="max-h-32 flex-1 resize-none rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-ink text-white disabled:opacity-40"
          >
            <Send aria-hidden="true" className="size-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-ink-soft">
          AI assistant · guidance, not medical diagnosis · a Skinwise expert makes the real decisions
        </p>
      </form>
    </div>
  );
}
