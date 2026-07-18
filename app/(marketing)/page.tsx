import Image from "next/image";
import Link from "next/link";
import {
  HeartHandshake,
  Compass,
  Route,
  TrendingUp,
  Check,
  ShieldCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Hero } from "@/components/features/hero";
import { TrustBadgeStrip } from "@/components/features/trust-badge-strip";
import { ConcernCard } from "@/components/features/concern-card";
import { ProcessSteps } from "@/components/features/process-steps";
import { BeforeAfterCarousel } from "@/components/features/before-after-carousel";
import { FAQSection } from "@/components/features/faq-section";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { buildMetadata } from "@/config/seo";
import { IMAGES } from "@/content/assets";
import { FAQS } from "@/content/faqs";
import {
  heroContent,
  trustBadges,
  valueProps,
  whatDifference,
  researchSpotlight,
  concernCards,
  processHeading,
  processSteps,
  galleryImages,
  realResultsSlides,
  clinicalClaims,
  safetySection,
} from "@/content/home";

export const metadata = buildMetadata({
  title: "Skinwise — Personalized Skincare, Backed by Science",
  description:
    "Personalized pigmentation, acne, and skincare solutions backed by research and human expertise. Take a free skin quiz and get a routine tailored to you.",
  path: "/",
  // Brand-first title — bypass the root layout's "%s | Skinwise" template
  // so it doesn't double the brand name (see config/seo.ts).
  titleAbsolute: true,
});

// ---------------------------------------------------------------------------
// UI-only labels below (eyebrows, gallery/section headings, icon choices)
// are presentational scaffolding layered on top of the real, client-sourced
// copy in content/home.ts — no existing wording from that file is reworded.
// ---------------------------------------------------------------------------

/** One icon per value prop, in the same order as `valueProps`. */
const VALUE_PROP_ICONS: LucideIcon[] = [HeartHandshake, Compass, Route, TrendingUp];

// Hero trust note built from real, verbatim trust-badge strings (never
// hand-typed/invented) — just a shorter on-hero preview of the full strip.
const heroTrustNote = [trustBadges[1], trustBadges[2], trustBadges[3]].join(" · ");

/**
 * Marketing Home page — composed entirely from `content/home.ts` (real,
 * client-sourced copy from WEBSITE_CONTENT.md §1) plus shared components
 * from Tasks 13–15 / the pass-1 & pass-2 visual polish passes. Server
 * Component: no client-side data fetching needed (scroll-reveal motion is
 * isolated in the small `<Reveal>` client component).
 */
export default function HomePage() {
  return (
    <>
      <Hero
        image={heroContent.image}
        heading={heroContent.heading}
        subheading={heroContent.subheading}
        ctas={heroContent.ctas}
        eyebrow="SKINWISE — DERMATOLOGY-LED CARE"
        trustNote={heroTrustNote}
      />

      <TrustBadgeStrip badges={trustBadges} />

      {/* Four value props. Visually this grid has no heading of its own
          (each card's title *is* the visible content), but going straight
          from the Hero's h1 to a bare h3 per card skips a heading level
          (fails the heading-order a11y check for screen-reader users
          navigating by heading). A visually-hidden h2 restores a valid
          h1 -> h2 -> h3 outline; a visible Eyebrow paragraph (not a
          heading) gives sighted users the same visual cue. */}
      <Section tone="canvas">
        <h2 className="sr-only">Why choose Skinwise</h2>
        <Reveal className="mb-10 flex justify-center">
          <Eyebrow>Why Skinwise</Eyebrow>
        </Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((prop, index) => {
            const Icon = VALUE_PROP_ICONS[index];
            return (
              <Reveal key={prop.title} delay={index * 0.08}>
                <Card className="flex h-full flex-col items-center gap-4 text-center">
                  {Icon && (
                    <span
                      aria-hidden="true"
                      className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blush text-accent-ink"
                    >
                      <Icon className="size-7" />
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-ink">{prop.title}</h3>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* "What Difference Does Skinwise bring?" — the source export only
          captured this heading, no supporting body copy, so it's paired
          with real imagery (not invented body text) in an editorial split
          instead of being left as a bare heading over empty space. */}
      <Section tone="surface">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative order-1">
            <div
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_50%_35%,rgba(227,138,158,0.28),transparent_70%)] blur-2xl"
            />
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-lift">
              <Image
                src={IMAGES.bannerScience.src}
                alt={IMAGES.bannerScience.alt}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="order-2 flex flex-col gap-4 text-center lg:text-left">
            <Eyebrow className="justify-center lg:justify-start">The Skinwise Difference</Eyebrow>
            <h2 className="text-h2 font-semibold text-ink">{whatDifference.heading}</h2>
          </Reveal>
        </div>
      </Section>

      {/* Three concern cards */}
      <Section tone="canvas">
        <Reveal className="mb-4 flex justify-center">
          <Eyebrow>Skin Concerns</Eyebrow>
        </Reveal>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {concernCards.map((card, index) => (
            <Reveal key={card.slug} delay={index * 0.08}>
              <ConcernCard {...card} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Research – Driven Results (Ashu Sharma spotlight) — editorial split
          instead of a centered paragraph in a void. All body text below is
          verbatim `researchSpotlight` copy; "Meet The Specialist" is a
          short UI-only eyebrow label, and the visible heading reuses the
          real `researchSpotlight.eyebrow` string verbatim rather than
          inventing new heading text. */}
      <Section tone="blush">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-2 flex flex-col gap-4 text-center lg:order-1 lg:text-left">
            <Eyebrow className="justify-center lg:justify-start">Meet The Specialist</Eyebrow>
            <h2 className="text-h2 font-semibold text-ink">{researchSpotlight.eyebrow}</h2>
            <p className="text-lg text-ink/80">{researchSpotlight.quote}</p>
            <Link
              href={researchSpotlight.readMore.href}
              className="inline-flex w-fit items-center gap-1.5 self-center text-sm font-medium text-accent-ink underline-offset-4 hover:underline lg:self-start"
            >
              {researchSpotlight.readMore.label}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Reveal>
          <Reveal delay={0.1} className="relative order-1 lg:order-2">
            <div
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_50%_35%,rgba(227,138,158,0.32),transparent_70%)] blur-2xl"
            />
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-lift">
              <Image
                src={IMAGES.model1.src}
                alt={IMAGES.model1.alt}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Section>

      <ProcessSteps heading={processHeading} steps={processSteps} />

      {/* Gallery strip — curated to aspirational lifestyle/editorial shots
          (see content/home.ts galleryImages), laid out as a tidy asymmetric
          editorial grid rather than a uniform strip of thumbnails. */}
      <Section tone="surface">
        <Reveal className="mb-10 flex flex-col items-center gap-3 text-center">
          <Eyebrow>Gallery</Eyebrow>
          <h2 className="text-h2 font-semibold text-ink">Moments From The Skinwise Journey</h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {galleryImages.map((image, index) => (
            <Reveal
              key={image.src}
              delay={index * 0.06}
              className="relative aspect-square overflow-hidden rounded-2xl"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 ease-out hover:scale-105"
              />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Real Customers Real Results — no genuine before/after photo pairs
          exist yet, so BeforeAfterCarousel's own branded placeholder is
          kept (no fabricated images), now given a proper section frame
          instead of floating in white space. */}
      <Section tone="blush">
        <Reveal className="mb-10 flex flex-col items-center gap-3 text-center">
          <Eyebrow>Results</Eyebrow>
          <h2 className="text-h2 font-semibold text-ink">Real Customers Real Results</h2>
        </Reveal>
        <Reveal delay={0.1} className="mx-auto max-w-2xl">
          <BeforeAfterCarousel slides={realResultsSlides} />
        </Reveal>
      </Section>

      {/* Clinical claims — text only, no fabricated percentages. Rendered
          as an elegant checklist rather than plain centered text; the
          claim sentences and disclaimer below are unchanged verbatim. */}
      <Section tone="blush">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <Reveal className="flex flex-col items-center gap-3">
            <Eyebrow>Science &amp; Data</Eyebrow>
            <h2 className="text-h2 font-semibold text-ink">{clinicalClaims.heading}</h2>
            <p className="text-lg text-muted">{clinicalClaims.subheading}</p>
          </Reveal>
          <Reveal delay={0.1} className="w-full">
            <ul className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
              {clinicalClaims.claims.map((claim) => (
                <li
                  key={claim}
                  className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-soft"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-ink text-white"
                  >
                    <Check className="size-3.5" />
                  </span>
                  <span className="text-base text-ink">{claim}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <p className="text-xs text-muted">{clinicalClaims.disclaimer}</p>
        </div>
      </Section>

      <FAQSection title="We've got answers" items={FAQS.generalFaqs} emitSchema />

      {/* Safety trust section */}
      <Section tone="surface" className="pb-0 md:pb-0">
        <Reveal className="mb-6 flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-full bg-blush text-accent-ink"
          >
            <ShieldCheck className="size-6" />
          </span>
          <Eyebrow>Safety First</Eyebrow>
          <h2 className="text-h2 font-semibold text-ink">{safetySection.heading}</h2>
        </Reveal>
      </Section>
      <TrustBadgeStrip badges={safetySection.badges} />
    </>
  );
}
