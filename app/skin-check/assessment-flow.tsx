"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, MessageCircle, Copy, AlertTriangle } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { QUESTIONS, questionsForConcern } from "@/content/assessment/questions";
import type { Question } from "@/content/assessment/types";
import { contactSchema } from "@/lib/assessment/schema";
import type { RegimenOutline } from "@/lib/assessment/recommend";
import { buildFallbackMessage, buildReference } from "@/lib/assessment/whatsapp";
import { productsForConcern } from "@/content/products";
import { CheckVsScan } from "@/components/features/check-vs-scan";
import { ProductCard } from "@/components/features/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const POLICY_VERSION = "2026-07-21";

type Answers = Record<string, string | string[]>;
type Phase = "questions" | "contact" | "submitting" | "result";
type Outcome =
  | { kind: "stored"; assessmentId: string; outline: RegimenOutline }
  | { kind: "fallback"; outline: RegimenOutline; message: string; reference: string };

/** Collapsible "why we ask" — the pattern carried over from the source quizzes. */
function WhyPanel({ why }: { why: string }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full py-1 text-sm font-semibold text-rose-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
      >
        Why we ask
        <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      <p id={id} hidden={!open} className="mt-2 text-sm text-ink-soft">
        {why}
      </p>
    </div>
  );
}

export function AssessmentFlow() {
  const [phase, setPhase] = React.useState<Phase>("questions");
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Answers>({});
  const [contact, setContact] = React.useState({ name: "", phone: "", email: "" });
  const [consent, setConsent] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [outcome, setOutcome] = React.useState<Outcome | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const concern = typeof answers.concern === "string" ? answers.concern : null;
  const steps: Question[] = React.useMemo(
    () => (concern ? questionsForConcern(concern) : [QUESTIONS[0]!]),
    [concern],
  );
  const current = steps[index];
  const total = steps.length + 1; // + contact step
  const progress = Math.round(((index + (phase === "contact" ? 1 : 0)) / total) * 100);

  // Move focus to the new question heading on every step change, so a
  // screen-reader user is told where they are instead of being silently
  // left at the top of the document.
  React.useEffect(() => {
    if (phase === "questions" || phase === "contact") headingRef.current?.focus();
  }, [index, phase]);

  function setAnswer(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    // Clear every error, not just this field's. Answering the concern
    // question rebuilds the whole step list, so the question that raised an
    // error can be a different object by the time this runs — keying the
    // cleanup on `id` left a stale "please choose an answer" visible above
    // an answer the user had just given. One question is on screen at a
    // time, so there is never another error worth preserving.
    setErrors({});
  }

  function goNext() {
    if (!current) return;
    const value = answers[current.id];
    const empty = value === undefined || (Array.isArray(value) ? value.length === 0 : value === "");
    if (!current.optional && empty) {
      setErrors({ [current.id]: "Please choose an answer to continue." });
      headingRef.current?.focus();
      return;
    }
    if (index + 1 < steps.length) setIndex(index + 1);
    else setPhase("contact");
  }

  function goBack() {
    if (phase === "contact") {
      setPhase("questions");
      setIndex(steps.length - 1);
      return;
    }
    if (index > 0) setIndex(index - 1);
  }

  async function submit() {
    const parsed = contactSchema.safeParse({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || undefined,
    });
    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const [field, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (msgs?.[0]) nextErrors[field] = msgs[0];
      }
    }
    if (!consent) nextErrors.consent = "Please confirm we can contact you about your results.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setPhase("submitting");

    try {
      const res = await fetch("/api/v1/assessments/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          concern,
          answers,
          contact: { name: contact.name, phone: contact.phone, email: contact.email || undefined },
          consent: { contactConsent: true, policyVersion: POLICY_VERSION },
        }),
      });
      const data = await res.json();

      if (res.status === 400) {
        // Server validation is authoritative. Return the user to the flow
        // with every answer intact rather than resetting anything.
        setSubmitError("Some answers need another look. Please check and try again.");
        setPhase("contact");
        return;
      }

      if (data.status === "stored") {
        setOutcome({ kind: "stored", assessmentId: data.assessmentId, outline: data.outline });
      } else {
        const reference = buildReference(new Date());
        setOutcome({
          kind: "fallback",
          outline: data.outline,
          reference,
          message: buildFallbackMessage({
            contact: { name: contact.name, phone: contact.phone, email: contact.email || undefined },
            answers,
            outline: data.outline,
            reference,
          }),
        });
      }
      setPhase("result");
    } catch {
      // Network failure. Keep every answer and let them retry — losing a
      // completed assessment to a dropped connection is unacceptable.
      setSubmitError(
        "We couldn't reach our server. Your answers are safe — please check your connection and try again.",
      );
      setPhase("contact");
    }
  }

  /* ---------------------------------------------------------------- result */
  if (phase === "result" && outcome) {
    const { outline } = outcome;
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-10">
        <span className="eyebrow">Your Skinwise guidance</span>
        <h1 className="mt-3 font-display text-display font-semibold text-ink">
          Here&rsquo;s what we understand about your skin.
        </h1>

        {outcome.kind === "fallback" && (
          <div
            role="status"
            className="mt-6 flex gap-3 rounded-2xl border border-champagne bg-champagne/40 p-5"
          >
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink" />
            <div>
              <p className="font-semibold text-ink">Your Skin Check is ready — but not yet saved.</p>
              <p className="mt-1 text-sm text-ink-soft">
                We couldn&rsquo;t save it to our system just now. Send it to our team on WhatsApp and
                they will pick it up straight away. Your reference is{" "}
                <strong className="text-ink">{outcome.reference}</strong>.
              </p>
            </div>
          </div>
        )}

        <section className="mt-8 rounded-3xl bg-surface p-6 shadow-soft">
          <h2 className="font-display text-2xl font-semibold text-ink">Your skin profile</h2>
          <dl className="mt-4 flex flex-col gap-2 text-ink-soft">
            <div className="flex gap-2">
              <dt className="font-semibold text-ink">Main concern:</dt>
              <dd>{outline.concernLabel}</dd>
            </div>
            {outline.skinTypeLabel && (
              <div className="flex gap-2">
                <dt className="font-semibold text-ink">Skin type:</dt>
                <dd>{outline.skinTypeLabel}</dd>
              </div>
            )}
          </dl>
        </section>

        {outline.ingredients.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-2xl font-semibold text-ink">
              What we&rsquo;d look at first
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {outline.ingredients.map((i) => (
                <li key={i.slug} className="rounded-2xl bg-blush p-4">
                  <Link href={`/ingredients/${i.slug}`} className="font-semibold text-rose-ink underline underline-offset-4">
                    {i.name}
                  </Link>
                  <p className="mt-1 text-sm text-ink-soft">{i.because}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {outline.excluded.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-2xl font-semibold text-ink">What we&rsquo;d avoid for now</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {outline.excluded.map((e) => (
                <li key={e.name} className="text-ink-soft">
                  <strong className="text-ink">{e.name}</strong> &mdash; {e.because}
                </li>
              ))}
            </ul>
          </section>
        )}

        {outline.guidance.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-2xl font-semibold text-ink">Worth knowing</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {outline.guidance.map((g) => (
                <li key={g} className="text-ink-soft">
                  {g}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/*
          The formulations an expert would typically build from for this
          concern. Deliberately framed as "may build from", not "your routine":
          nobody has reviewed this person yet, and the actual compound is the
          expert's decision. Suppressed entirely when the answers point to
          seeing a doctor — leading with products there would be crass.
        */}
        {!outline.recommendProfessional && concern && productsForConcern(concern).length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Formulations an expert may build from
            </h2>
            <p className="mt-2 text-ink-soft">
              These are our base formulations for {outline.concernLabel.toLowerCase()}. Each one is
              customised for the person it&rsquo;s made for, so yours is decided after an expert
              reviews your answers.
            </p>
            <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {productsForConcern(concern).map((product) => (
                <li key={product.slug}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {outline.recommendProfessional && outline.professionalReason && (
          <section className="mt-6 rounded-2xl border-l-4 border-rose-ink bg-surface p-5">
            <h2 className="font-display text-xl font-semibold text-ink">See a doctor about this</h2>
            <p className="mt-2 text-ink-soft">{outline.professionalReason}</p>
          </section>
        )}

        <p className="mt-8 rounded-2xl bg-surface p-5 text-sm text-ink-soft">
          This is general guidance based on your answers, not a medical diagnosis, and no one has
          examined your skin yet. A Skinwise expert will go through it with you.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button asChild variant="whatsapp" size="lg">
            <a
              href={
                outcome.kind === "fallback"
                  ? `${waHref(SITE.whatsapp.e164)}?text=${encodeURIComponent(outcome.message)}`
                  : waHref(SITE.whatsapp.e164)
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              {outcome.kind === "fallback" ? "Send this to our team" : "Talk to a Skinwise expert"}
            </a>
          </Button>

          {outcome.kind === "fallback" && (
            <>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(outcome.message);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-6 py-3 font-body text-sm font-semibold text-ink transition hover:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
              >
                <Copy aria-hidden="true" className="size-4" />
                Copy my answers instead
              </button>
              <p role="status" className="text-center text-sm text-ink-soft">
                {copied
                  ? "Copied. Paste it to us on WhatsApp, or email " + SITE.email + "."
                  : `If WhatsApp doesn't open, copy your answers and email them to ${SITE.email}.`}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------ submitting */
  if (phase === "submitting") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <div
          aria-hidden="true"
          className="size-10 animate-spin rounded-full border-2 border-blush border-t-rose-ink motion-reduce:animate-none"
        />
        <p role="status" className="mt-5 font-body text-ink">
          Putting your guidance together&hellip;
        </p>
      </div>
    );
  }

  /* --------------------------------------------------------------- contact */
  if (phase === "contact") {
    return (
      <div className="flex flex-1 flex-col">
        <ProgressHeader progress={progress} onBack={goBack} label={`Last step`} />
        <div className="mx-auto w-full max-w-md flex-1 px-5 pb-40">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-semibold text-ink outline-none">
            Where should we send your guidance?
          </h1>
          <p className="mt-3 text-ink-soft">
            We use your details to share your Skinwise guidance and to help you continue from here.
            Nothing else.
          </p>

          {submitError && (
            <p role="alert" className="mt-5 rounded-2xl bg-champagne/50 p-4 text-sm text-ink">
              {submitError}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-5">
            <Field
              id="name"
              label="Your name"
              value={contact.name}
              error={errors.name}
              onChange={(v) => setContact((c) => ({ ...c, name: v }))}
              autoComplete="name"
            />
            <Field
              id="phone"
              label="WhatsApp number"
              value={contact.phone}
              error={errors.phone}
              onChange={(v) => setContact((c) => ({ ...c, phone: v }))}
              inputMode="tel"
              autoComplete="tel"
            />
            <Field
              id="email"
              label="Email (optional)"
              value={contact.email}
              error={errors.email}
              onChange={(v) => setContact((c) => ({ ...c, email: v }))}
              inputMode="email"
              autoComplete="email"
            />

            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby={errors.consent ? "consent-error" : undefined}
                  className="mt-1 size-5 shrink-0 accent-[#a8506a]"
                />
                <span className="text-sm text-ink-soft">
                  Skinwise can contact me about my Skin Check answers and my results.
                </span>
              </label>
              {errors.consent && (
                <p id="consent-error" role="alert" className="mt-2 text-sm font-medium text-rose-ink">
                  {errors.consent}
                </p>
              )}
            </div>
          </div>
        </div>

        <StickyBar>
          <Button size="lg" className="w-full" onClick={submit}>
            See my guidance
          </Button>
        </StickyBar>
      </div>
    );
  }

  /* ------------------------------------------------------------- questions */
  if (!current) return null;
  const value = answers[current.id];
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div className="flex flex-1 flex-col">
      <ProgressHeader
        progress={progress}
        onBack={index > 0 ? goBack : undefined}
        label={`Question ${index + 1} of ${steps.length}`}
      />

      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-40">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-3xl font-semibold text-ink outline-none"
        >
          {current.prompt}
        </h1>
        {current.optional && <p className="mt-2 text-sm text-ink-soft">Optional</p>}
        <WhyPanel why={current.why} />

        {errors[current.id] && (
          <p role="alert" className="mt-4 rounded-2xl bg-champagne/50 p-4 text-sm font-medium text-ink">
            {errors[current.id]}
          </p>
        )}

        {current.kind === "text" ? (
          <textarea
            aria-label={current.prompt}
            rows={5}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(current.id, e.target.value)}
            className="mt-6 w-full rounded-2xl border border-ink/15 bg-surface p-4 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
          />
        ) : (
          <fieldset className="mt-6">
            <legend className="sr-only">{current.prompt}</legend>
            <div className="flex flex-col gap-3">
              {(current.options ?? []).map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      if (current.kind === "multi") {
                        setAnswer(
                          current.id,
                          isSelected
                            ? selected.filter((v) => v !== option.value)
                            : [...selected, option.value],
                        );
                      } else {
                        setAnswer(current.id, option.value);
                      }
                    }}
                    className={cn(
                      "flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl border-2 px-5 py-4 text-left transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2",
                      isSelected
                        ? "border-rose-ink bg-blush"
                        : "border-ink/10 bg-surface hover:border-rose-ink/40",
                    )}
                  >
                    <span>
                      <span className="block font-body font-semibold text-ink">{option.label}</span>
                      {option.hint && (
                        <span className="mt-0.5 block text-sm text-ink-soft">{option.hint}</span>
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                        isSelected ? "border-rose-ink bg-rose-ink text-white" : "border-ink/20",
                      )}
                    >
                      {isSelected && <Check className="size-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {current.followUp && selected.length > 0 && (
          <div className="mt-6">
            <label htmlFor="follow-up" className="font-body text-sm font-semibold text-ink">
              {current.followUp.prompt}
            </label>
            <input
              id="follow-up"
              type="text"
              value={typeof answers[current.followUp.id] === "string" ? (answers[current.followUp.id] as string) : ""}
              onChange={(e) => setAnswer(current.followUp!.id, e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
            />
          </div>
        )}

        {/* First question only. Someone deciding whether to start needs to
            know the photo analyzer exists and how it differs; someone three
            questions deep does not need a competing route. */}
        {index === 0 && (
          <div className="mt-10">
            <CheckVsScan current="skin-check" />
          </div>
        )}
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={goNext}>
          {index + 1 === steps.length ? "Continue" : "Next"}
        </Button>
      </StickyBar>
    </div>
  );
}

function ProgressHeader({
  progress,
  onBack,
  label,
}: {
  progress: number;
  onBack?: () => void;
  label: string;
}) {
  return (
    <header className="sticky top-0 z-10 bg-warm/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-5 py-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back to the previous question"
            className="-ml-2 inline-flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
        ) : (
          <Link
            href="/"
            aria-label="Leave the Skin Check"
            className="-ml-2 inline-flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-blush"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>
        )}
        <span className="font-body text-sm font-semibold text-ink-soft">{label}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Skin Check progress"
        className="mx-auto h-1 w-full max-w-md overflow-hidden rounded-full bg-ink/10"
      >
        <div className="h-full bg-rose-ink transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}

/** Sticky action bar, clear of the iOS home indicator. */
function StickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-ink/10 bg-warm/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-md px-5 py-4">{children}</div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  inputMode?: "tel" | "email";
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="font-body text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "mt-2 w-full rounded-2xl border bg-surface px-4 py-3.5 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink",
          error ? "border-rose-ink" : "border-ink/15",
        )}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm font-medium text-rose-ink">
          {error}
        </p>
      )}
    </div>
  );
}
