"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mic, MessageCircle, ArrowRight } from "lucide-react";
import { IMAGES } from "@/content/assets";
import { HOME } from "@/content/i18n/home";
import { T } from "@/components/i18n/t";

/**
 * The AI-first landing hero: the first thing a visitor meets is the question
 * "How can I help you?" and two ways to answer it — Talk to Riya (primary) or
 * Chat. An ambient carousel of the brand banners crossfades behind a scrim so
 * the invitation always reads, whatever slide is showing.
 *
 * Voice is the primary CTA per the brief; chat is the clear alternative; a
 * scan link is the quiet third door. Everything stays inside the site — no
 * external links.
 */
const SLIDES = [
  IMAGES.brandHeroLeafLongterm,
  IMAGES.brandHeroLeafScience,
  IMAGES.bannerLongterm,
  IMAGES.bannerScience,
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
    <section className="relative isolate flex min-h-[38rem] items-center overflow-hidden lg:min-h-[40rem]">
      {/* Ambient carousel */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}
        {/* Scrim: dark enough at the bottom-left for white text over any slide. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/55 to-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/20 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-24">
        <div className="max-w-xl">
          <p className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-rose">
            <T>{HOME.aiHeroEyebrow}</T>
          </p>
          <h1 className="mt-4 font-display text-display font-semibold text-white">
            <T>{HOME.aiHeroTitle}</T>
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/85">
            <T>{HOME.aiHeroBody}</T>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {/* Primary: Talk to Riya. */}
            <Link
              href="/voice"
              className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-rose-ink px-7 py-4 font-semibold text-white shadow-lift transition hover:bg-rose-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <Mic aria-hidden="true" className="size-5" />
              <T>{HOME.aiHeroTalk}</T>
            </Link>
            {/* Alternative: Chat. */}
            <Link
              href="/assistant"
              className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full border border-white/40 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <MessageCircle aria-hidden="true" className="size-5" />
              <T>{HOME.aiHeroChat}</T>
            </Link>
          </div>

          <Link
            href="/skin-check/analyzer"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 underline underline-offset-4 transition hover:text-white"
          >
            <T>{HOME.aiHeroScan}</T>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>

      {/* Slide dots */}
      <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
