"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mic, MessageCircle, ArrowRight } from "lucide-react";
import { IMAGES } from "@/content/assets";
import { HOME } from "@/content/i18n/home";
import { T } from "@/components/i18n/t";

/**
 * The landing hero.
 *
 * The brand banners already carry their own headline and model, so they are
 * shown AS-IS in a full-width carousel rather than buried under an overlay that
 * would fight their baked-in text. Directly beneath, on a clean branded band,
 * is the AI-first invitation — "How can I help you?" with Talk to AI (primary)
 * and Chat with AI — so the promotional imagery and the way to start a
 * consultation both read clearly, on every screen size.
 */
const SLIDES = [
  IMAGES.bannerLongterm,
  IMAGES.bannerScience,
  IMAGES.brandHeroLeafLongterm,
  IMAGES.brandHeroLeafScience,
];

export function HomeHero() {
  const [index, setIndex] = React.useState(0);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (m?.matches) setReduced(true);
  }, []);

  React.useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setIndex((n) => (n + 1) % SLIDES.length), 5500);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <section>
      {/* Banner carousel — a SLIDING track (not a crossfade): these banners
          each carry their own headline, so one must be fully visible at a time
          or the texts blur together. Shown at the banners' own wide ratio on
          desktop, a gentler crop toward the model on small screens so it never
          becomes a thin, unreadable strip. */}
      <div className="relative w-full overflow-hidden bg-blush">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              className="relative aspect-[3/2] w-full shrink-0 sm:aspect-[21/9] lg:aspect-[1920/720]"
            >
              <Image
                src={slide.src}
                alt={slide.alt ?? ""}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-[68%_center] lg:object-center"
              />
            </div>
          ))}
        </div>
        {/* Dots */}
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full shadow-sm transition-all ${
                i === index ? "w-6 bg-rose-ink" : "w-1.5 bg-white/80 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </div>

      {/* AI-first invitation. Branded, high-contrast, centred — the front door. */}
      <div className="bg-gradient-to-b from-blush/70 via-warm to-warm">
        <div className="mx-auto max-w-3xl px-5 py-10 text-center lg:py-14">
          <p className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-rose-ink">
            <T>{HOME.aiHeroEyebrow}</T>
          </p>
          <h1 className="mt-3 font-display text-display font-semibold text-ink">
            <T>{HOME.aiHeroTitle}</T>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">
            <T>{HOME.aiHeroBody}</T>
          </p>

          <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/voice"
              className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-rose-ink px-7 py-4 font-semibold text-white shadow-lift transition hover:bg-rose-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
            >
              <Mic aria-hidden="true" className="size-5" />
              <T>{HOME.aiHeroTalk}</T>
            </Link>
            <Link
              href="/assistant"
              className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full border border-rose-ink/25 bg-surface px-7 py-4 font-semibold text-ink transition hover:border-rose-ink/50 hover:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
            >
              <MessageCircle aria-hidden="true" className="size-5 text-rose-ink" />
              <T>{HOME.aiHeroChat}</T>
            </Link>
          </div>

          <Link
            href="/skin-check/analyzer"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-ink underline underline-offset-4 transition hover:no-underline"
          >
            <T>{HOME.aiHeroScan}</T>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
