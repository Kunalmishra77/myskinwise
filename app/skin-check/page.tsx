import Link from "next/link";
import { ArrowLeft, Clock, Lock, UserCheck } from "lucide-react";
import { buildMetadata } from "@/config/seo";
import { SITE, waHref } from "@/config/site";
import { CONCERNS } from "@/content/concerns";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata = buildMetadata({
  title: "Skin Check",
  description:
    "Tell us about your skin and a Skinwise expert will review it and recommend a personalised routine.",
  path: "/skin-check",
});

/*
 * Foundation-phase entry screen for the Skin Check.
 *
 * The guided multi-step assessment, photo capture and personalised result
 * are Sub-projects 2 and 5. This screen deliberately does NOT fake them: no
 * simulated analysis, no progress bar that leads nowhere, no "AI is
 * examining your skin" theatre. It states plainly what the Skin Check will
 * do, and routes to the paths that genuinely work today — reading about a
 * concern, or messaging a human on WhatsApp.
 *
 * Shipping an honest placeholder behind a prominent nav item is a real
 * trade-off; shipping a fake one on a health-adjacent product is not a
 * trade-off worth making.
 */

const WHAT_TO_EXPECT = [
  {
    icon: Clock,
    title: "About 3 minutes",
    body: "A short set of questions about your skin, your concern, and what you have already tried.",
  },
  {
    icon: UserCheck,
    title: "Reviewed by a real expert",
    body: "A Skinwise skin expert reads your answers personally. Nothing about your routine is decided by software alone.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Your answers are used to prepare your consultation and nothing else.",
  },
];

export default function SkinCheckPage() {
  const concerns = Object.values(CONCERNS);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-4 py-4">
        <Link
          href="/"
          aria-label="Back to home"
          className="-ml-2 inline-flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-blush"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <span className="font-body text-sm font-semibold text-ink-soft">Skin Check</span>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16">
        <Eyebrow index="01">Understand your skin</Eyebrow>
        <h1 className="mt-4 font-display text-display font-semibold text-ink">
          Let&rsquo;s understand your skin.
        </h1>
        <p className="mt-4 font-body text-ink-soft">
          The Skin Check is how a Skinwise expert gets to know your skin before recommending
          anything. We are building the guided version right now.
        </p>

        <ul className="mt-10 flex flex-col gap-6">
          {WHAT_TO_EXPECT.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blush text-rose-ink"
                >
                  <Icon className="size-5" />
                </span>
                <div>
                  <h2 className="font-body font-semibold text-ink">{item.title}</h2>
                  <p className="mt-1 font-body text-sm text-ink-soft">{item.body}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-12 rounded-3xl border border-ink/10 bg-surface p-6 shadow-soft">
          <h2 className="font-display text-2xl font-semibold text-ink">
            While we finish building it
          </h2>
          <p className="mt-2 font-body text-sm text-ink-soft">
            You can start the same conversation with our team directly, or read how we approach
            your concern.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <Button variant="whatsapp" asChild className="w-full">
              <a href={waHref(SITE.whatsapp.e164)} target="_blank" rel="noopener noreferrer">
                Message a skin expert on WhatsApp
              </a>
            </Button>
          </div>

          <ul className="mt-6 flex flex-col gap-2">
            {concerns.map((concern) => (
              <li key={concern.slug}>
                <Link
                  href={`/${concern.slug}`}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 font-body text-sm font-medium text-ink transition hover:bg-blush"
                >
                  {concern.label}
                  <span aria-hidden="true" className="text-rose-ink">
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
