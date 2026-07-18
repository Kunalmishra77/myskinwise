import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/features/hero";
import { TrustBadgeStrip } from "@/components/features/trust-badge-strip";
import { ConcernCard } from "@/components/features/concern-card";
import { ProcessSteps } from "@/components/features/process-steps";
import { BeforeAfterCarousel } from "@/components/features/before-after-carousel";
import { FAQSection } from "@/components/features/faq-section";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { buildMetadata } from "@/config/seo";
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

/**
 * Marketing Home page — composed entirely from `content/home.ts` (real,
 * client-sourced copy from WEBSITE_CONTENT.md §1) plus shared components
 * from Tasks 13–15. Server Component: no client-side data fetching needed.
 */
export default function HomePage() {
  return (
    <>
      <Hero
        image={heroContent.image}
        heading={heroContent.heading}
        subheading={heroContent.subheading}
        ctas={heroContent.ctas}
      />

      <TrustBadgeStrip badges={trustBadges} />

      {/* Four value props. Visually this grid has no heading of its own
          (each card's title *is* the visible content), but going straight
          from the Hero's h1 to a bare h3 per card skips a heading level
          (fails the heading-order a11y check for screen-reader users
          navigating by heading). A visually-hidden h2 restores a valid
          h1 -> h2 -> h3 outline without changing anything visible. */}
      <Section>
        <h2 className="sr-only">Why choose Skinwise</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((prop) => (
            <Card key={prop.title} className="text-center">
              <h3 className="text-lg font-semibold text-ink">{prop.title}</h3>
            </Card>
          ))}
        </div>
      </Section>

      {/* "What Difference Does Skinwise bring?" */}
      <Section className="bg-surface">
        <h2 className="text-center text-2xl font-semibold text-ink md:text-3xl">
          {whatDifference.heading}
        </h2>
      </Section>

      {/* Research – Driven Results spotlight */}
      <Section>
        <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
          {/* `text-accent` directly as body-text color is only ~2.5:1
              against white/canvas (fails AA); `text-accent-ink` keeps the
              rose hue while reaching a safe contrast margin. */}
          <p className="text-sm font-medium uppercase tracking-wide text-accent-ink">
            {researchSpotlight.eyebrow}
          </p>
          <p className="text-lg text-muted">
            {researchSpotlight.quote}{" "}
            <Link href={researchSpotlight.readMore.href} className="font-medium text-accent-ink underline">
              {researchSpotlight.readMore.label}
            </Link>
          </p>
        </div>
      </Section>

      {/* Three concern cards */}
      <Section>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {concernCards.map((card) => (
            <ConcernCard key={card.slug} {...card} />
          ))}
        </div>
      </Section>

      <ProcessSteps heading={processHeading} steps={processSteps} />

      {/* Gallery strip */}
      <Section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {galleryImages.map((image) => (
            <div key={image.src} className="relative aspect-square overflow-hidden rounded-xl">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Real Customers Real Results */}
      <Section>
        <h2 className="mb-8 text-center text-2xl font-semibold text-ink md:text-3xl">
          Real Customers Real Results
        </h2>
        <div className="mx-auto max-w-2xl">
          <BeforeAfterCarousel slides={realResultsSlides} />
        </div>
      </Section>

      {/* Clinical claims — text only, no fabricated percentages */}
      <Section className="bg-surface">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
          <h2 className="text-2xl font-semibold text-ink md:text-3xl">{clinicalClaims.heading}</h2>
          <p className="text-lg text-muted">{clinicalClaims.subheading}</p>
          <ul className="flex flex-col gap-3 text-left sm:mx-auto sm:w-fit">
            {clinicalClaims.claims.map((claim) => (
              <li key={claim} className="text-base text-ink">
                {claim}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">{clinicalClaims.disclaimer}</p>
        </div>
      </Section>

      <FAQSection title="We've got answers" items={FAQS.generalFaqs} emitSchema />

      {/* Safety trust section */}
      <Section className="pb-0 md:pb-0">
        <h2 className="mb-6 text-center text-2xl font-semibold text-ink md:text-3xl">
          {safetySection.heading}
        </h2>
      </Section>
      <TrustBadgeStrip badges={safetySection.badges} />
    </>
  );
}
