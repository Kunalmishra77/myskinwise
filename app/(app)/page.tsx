import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, ScanFace, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { IMAGES } from "@/content/assets";
import { CONCERNS } from "@/content/concerns";
import { INGREDIENT_LIST } from "@/content/ingredients";
import { SKIN_TYPE_LIST } from "@/content/skin-types";
import { StartPaths } from "@/components/features/start-paths";
import { AnalyzerShowcase } from "@/components/features/analyzer-showcase";
import { FeaturedFormulations } from "@/components/features/featured-formulations";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { T } from "@/components/i18n/t";
import { HOME, JOURNEY, DIFFERENCE } from "@/content/i18n/home";

export const metadata: Metadata = {
  title: { absolute: "Skinwise — Personalised Skincare, Decided by Real Experts" },
  description:
    "Tell us about your skin and a Skinwise expert builds a routine around your concern — pigmentation, acne, texture and more. Free Skin Check, no account needed.",
  alternates: { canonical: SITE.url },
};

/*
 * Homepage. Every CTA on this page points at /skin-check or WhatsApp —
 * both of which exist and work today. There is deliberately no "Talk to
 * Skinwise AI" button: the assistant is Sub-project 4, and a CTA leading
 * to an unbuilt feature is the one thing this project explicitly forbids.
 *
 * No testimonials, no statistics, no clinical percentages appear here.
 * None have been verified, so none are shown — see the Stage 1 spec §4.4.
 */

// Icons for the AI-vs-human cards, zipped by index with DIFFERENCE from the
// content module (which holds the translatable prose, import-free).
const DIFFERENCE_ICONS = [Sparkles, UserCheck];

export default function HomePage() {
  const concerns = Object.values(CONCERNS);

  return (
    <>
      {/* 1 — HERO. Headline, subcopy and the primary CTA all sit within the
          first viewport at 320px; the portrait follows below on mobile and
          moves alongside from lg. */}
      <section className="px-5 pt-8 lg:pt-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow><T>{HOME.heroEyebrow}</T></Eyebrow>
            <h1 className="mt-4 font-display text-display font-semibold text-ink">
              <T>{HOME.heroTitle}</T>
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink-soft">
              <T>{HOME.heroBody}</T>
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/skin-check"><T>{HOME.startSkinCheck}</T></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={waHref(SITE.whatsapp.e164)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" className="size-4" />
                  <T>{HOME.messageExpert}</T>
                </a>
              </Button>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
              <li className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-4 text-rose-ink" />
                <T>{HOME.heroPointFree}</T>
              </li>
              <li className="flex items-center gap-2">
                <UserCheck aria-hidden="true" className="size-4 text-rose-ink" />
                <T>{HOME.heroPointReviewed}</T>
              </li>
            </ul>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-blush lg:aspect-[4/4.4]">
            <Image
              src={IMAGES.heroModelPortrait.src}
              alt={IMAGES.heroModelPortrait.alt}
              fill
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2 — WHAT YOU CAN DO HERE. Immediately below the hero, because an
          audit found the Skin Analyzer had no inbound links anywhere on the
          site and the voice agent had one. A visitor could not discover two of
          the four primary features without guessing a URL. */}
      <StartPaths />

      {/* 3 — SKIN ANALYSIS showcase. The differentiator gets a section of its
          own with real imagery, right after the feature choices. */}
      <AnalyzerShowcase />

      {/* 4 — CONCERNS. Horizontal scroll on mobile so cards stay thumb-sized
          rather than shrinking to fit three across a 320px screen. */}
      <section className="mt-20 lg:mt-28" aria-labelledby="concerns-heading">
        <div className="mx-auto w-full max-w-6xl px-5">
          <Reveal>
            <Eyebrow index="01"><T>{HOME.concernsEyebrow}</T></Eyebrow>
            <h2
              id="concerns-heading"
              className="mt-3 max-w-xl font-display text-h2 font-semibold text-ink"
            >
              <T>{HOME.concernsTitle}</T>
            </h2>
          </Reveal>
        </div>

        <ul className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-3 lg:overflow-visible">
          {concerns.map((concern) => (
            <li key={concern.slug} className="w-[78vw] shrink-0 snap-start sm:w-[52vw] lg:w-auto">
              <Link
                href={`/${concern.slug}`}
                className="group flex h-full flex-col rounded-3xl bg-surface p-6 shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
              >
                <h3 className="font-display text-2xl font-semibold text-ink"><T>{concern.label}</T></h3>
                <p className="mt-3 flex-1 text-sm text-ink-soft">
                  {concern.whatIs.body.slice(0, 150)}&hellip;
                </p>
                <span
                  aria-hidden="true"
                  className="mt-5 font-body text-sm font-semibold text-rose-ink"
                >
                  <T>{HOME.understandThis}</T> &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 — HOW IT WORKS */}
      <section
        className="mt-20 bg-surface py-20 lg:mt-28 lg:py-28"
        aria-labelledby="journey-heading"
      >
        <div className="mx-auto w-full max-w-3xl px-5">
          <Reveal>
            <Eyebrow index="02"><T>{HOME.journeyEyebrow}</T></Eyebrow>
            <h2 id="journey-heading" className="mt-3 font-display text-h2 font-semibold text-ink">
              <T>{HOME.journeyTitle}</T>
            </h2>
          </Reveal>

          <ol className="mt-10 flex flex-col">
            {JOURNEY.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 0.04} className="flex gap-5 pb-8 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blush font-display text-sm font-semibold text-rose-ink">
                    {i + 1}
                  </span>
                  {i < JOURNEY.length - 1 && (
                    <span aria-hidden="true" className="mt-2 w-px flex-1 bg-ink/10" />
                  )}
                </div>
                <div className="pt-1">
                  <h3 className="font-display text-xl font-semibold text-ink"><T>{step.title}</T></h3>
                  <p className="mt-1.5 text-ink-soft"><T>{step.body}</T></p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 4 — AI + HUMAN EXPERT */}
      <section className="mt-20 lg:mt-28" aria-labelledby="difference-heading">
        <div className="mx-auto w-full max-w-5xl px-5">
          <Reveal>
            <Eyebrow index="03"><T>{HOME.differenceEyebrow}</T></Eyebrow>
            <h2
              id="difference-heading"
              className="mt-3 max-w-xl font-display text-h2 font-semibold text-ink"
            >
              <T>{HOME.differenceTitle}</T>
            </h2>
            <p className="mt-4 max-w-xl text-ink-soft">
              <T>{HOME.differenceBody}</T>
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {DIFFERENCE.map((item, i) => {
              const Icon = DIFFERENCE_ICONS[i]!;
              return (
                <Reveal key={item.title} delay={i * 0.06}>
                  <div className="h-full rounded-3xl bg-surface p-7 shadow-soft">
                    <span
                      aria-hidden="true"
                      className="flex size-11 items-center justify-center rounded-2xl bg-blush text-rose-ink"
                    >
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 font-display text-xl font-semibold text-ink">
                      <T>{item.title}</T>
                    </h3>
                    <p className="mt-2 text-ink-soft"><T>{item.body}</T></p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUCTS — a glimpse of the catalogue, linking through to shop. */}
      <FeaturedFormulations />

      {/* 5 — SKIN CHECK CTA */}
      <section className="mt-20 lg:mt-28" aria-labelledby="skincheck-heading">
        <div className="mx-auto w-full max-w-5xl px-5">
          <div className="rounded-[2rem] bg-plum px-6 py-12 lg:px-14 lg:py-16">
            <Eyebrow tone="dark" index="04">
              <T>{HOME.skinCheckEyebrow}</T>
            </Eyebrow>
            <h2
              id="skincheck-heading"
              className="mt-3 max-w-lg font-display text-h2 font-semibold text-white"
            >
              <T>{HOME.skinCheckTitle}</T>
            </h2>

            <dl className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <dt className="font-body text-sm font-semibold text-rose"><T>{HOME.skinCheckDoTerm}</T></dt>
                <dd className="mt-1.5 text-white/80">
                  <T>{HOME.skinCheckDoBody}</T>
                </dd>
              </div>
              <div>
                <dt className="font-body text-sm font-semibold text-rose"><T>{HOME.skinCheckGetTerm}</T></dt>
                <dd className="mt-1.5 text-white/80">
                  <T>{HOME.skinCheckGetBody}</T>
                </dd>
              </div>
              <div>
                <dt className="font-body text-sm font-semibold text-rose"><T>{HOME.skinCheckCostTerm}</T></dt>
                <dd className="mt-1.5 text-white/80">
                  <T>{HOME.skinCheckCostBody}</T>
                </dd>
              </div>
            </dl>

            <Button asChild size="lg" className="mt-10">
              <Link href="/skin-check">
                <ScanFace aria-hidden="true" className="size-4" />
                <T>{HOME.startSkinCheck}</T>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 6 — LEARN */}
      <section className="mt-20 lg:mt-28" aria-labelledby="learn-heading">
        <div className="mx-auto w-full max-w-5xl px-5">
          <Reveal>
            <Eyebrow index="05"><T>{HOME.learnEyebrow}</T></Eyebrow>
            <h2
              id="learn-heading"
              className="mt-3 max-w-xl font-display text-h2 font-semibold text-ink"
            >
              <T>{HOME.learnTitle}</T>
            </h2>
          </Reveal>

          <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Reveal>
              <Link
                href="/concerns"
                className="flex h-full flex-col rounded-3xl bg-surface p-6 shadow-soft transition-shadow hover:shadow-lift"
              >
                <h3 className="font-display text-xl font-semibold text-ink"><T>{HOME.learnConcernsTitle}</T></h3>
                <p className="mt-2 flex-1 text-sm text-ink-soft">
                  <T>{HOME.learnConcernsBody}</T>
                </p>
                <span aria-hidden="true" className="mt-4 text-sm font-semibold text-rose-ink">
                  {concerns.length} <T>{HOME.guides}</T> &rarr;
                </span>
              </Link>
            </Reveal>
            <Reveal delay={0.06}>
              <Link
                href="/skin-types"
                className="flex h-full flex-col rounded-3xl bg-surface p-6 shadow-soft transition-shadow hover:shadow-lift"
              >
                <h3 className="font-display text-xl font-semibold text-ink"><T>{HOME.learnTypesTitle}</T></h3>
                <p className="mt-2 flex-1 text-sm text-ink-soft">
                  <T>{HOME.learnTypesBody}</T>
                </p>
                <span aria-hidden="true" className="mt-4 text-sm font-semibold text-rose-ink">
                  {SKIN_TYPE_LIST.length} <T>{HOME.guides}</T> &rarr;
                </span>
              </Link>
            </Reveal>
            <Reveal delay={0.12}>
              <Link
                href="/ingredients"
                className="flex h-full flex-col rounded-3xl bg-surface p-6 shadow-soft transition-shadow hover:shadow-lift"
              >
                <h3 className="font-display text-xl font-semibold text-ink"><T>{HOME.learnIngredientsTitle}</T></h3>
                <p className="mt-2 flex-1 text-sm text-ink-soft">
                  <T>{HOME.learnIngredientsBody}</T>
                </p>
                <span aria-hidden="true" className="mt-4 text-sm font-semibold text-rose-ink">
                  {INGREDIENT_LIST.length} <T>{HOME.guides}</T> &rarr;
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7 — TRUST. Process transparency and the founder's own words. */}
      <section className="mt-20 lg:mt-28" aria-labelledby="trust-heading">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-5 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-blush lg:aspect-square">
            <Image
              src={IMAGES.productBottlesPink.src}
              alt={IMAGES.productBottlesPink.alt}
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal>
            <Eyebrow index="06"><T>{HOME.trustEyebrow}</T></Eyebrow>
            <h2 id="trust-heading" className="mt-3 font-display text-h2 font-semibold text-ink">
              <T>{HOME.trustTitle}</T>
            </h2>
            <blockquote className="mt-5 border-l-2 border-rose-ink/30 pl-5 text-ink-soft">
              <p>
                <T>{HOME.founderQuote}</T>
              </p>
              <footer className="mt-3 text-sm font-semibold text-ink">
                Anant Sanadhya, Founder
              </footer>
            </blockquote>
            <p className="mt-5 text-ink-soft">
              <T>{HOME.trustBody}</T>
            </p>
          </Reveal>
        </div>
      </section>

      {/* 8 — FINAL CTA */}
      <section className="mt-20 pb-8 lg:mt-28 lg:pb-16">
        <div className="mx-auto w-full max-w-2xl px-5 text-center">
          <h2 className="font-display text-h2 font-semibold text-ink">
            <T>{HOME.finalTitle}</T>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">
            <T>{HOME.finalBody}</T>
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link href="/skin-check"><T>{HOME.startSkinCheck}</T></Link>
          </Button>
        </div>
      </section>
    </>
  );
}
