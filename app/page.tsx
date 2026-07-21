import type { Metadata } from "next";
import { SITE } from "@/config/site";
import { cn } from "@/lib/utils";
import { ScrollProgress } from "@/components/home/effects/scroll-progress";
import { FilmGrain } from "@/components/home/effects/film-grain";
import { CursorGlow } from "@/components/home/effects/cursor-glow";
import { GradientMesh } from "@/components/home/effects/gradient-mesh";
import { Nav } from "@/components/home/sections/nav";
import { Footer } from "@/components/home/sections/footer";
import { Button } from "@/components/home/ui/button";
import { MagneticButton } from "@/components/home/ui/magnetic-button";
import { Pill } from "@/components/home/ui/pill";
import { Card, GlassCard } from "@/components/home/ui/card";
import { SectionEyebrow } from "@/components/home/ui/section-eyebrow";
import { RevealOnScroll } from "@/components/home/ui/reveal-on-scroll";
import { Marquee } from "@/components/home/ui/marquee";
import { CountUp } from "@/components/home/ui/count-up";

// Brand-first title, bypassing the root layout's "%s | Skinwise" template
// (via `title: { absolute }`) so it never doubles the brand name — see
// config/seo.ts's `buildMetadata` for the same pattern used elsewhere.
export const metadata: Metadata = {
  title: { absolute: "Skinwise — AI-Powered Personalised Skincare" },
  description:
    "Skinwise pairs AI-powered skin analysis with real dermatology expertise to build a personalised routine for your exact concern — hyperpigmentation, acne, and beyond.",
  alternates: { canonical: SITE.url },
};

const TRUST_PILLS = [
  "100% Natural Ingredients",
  "Toxin-Free",
  "Vegan-Friendly",
  "Dermatologically Tested",
  "Paraben-Free",
  "Non-Greasy Formula",
  "Sulfate-Free",
  "Cruelty-Free",
  "Safe for all skin types",
];

type PlaceholderTone = "warm" | "surface" | "blush" | "champagne";

const TONE_CLASSES: Record<PlaceholderTone, string> = {
  warm: "bg-warm",
  surface: "bg-surface",
  blush: "bg-blush",
  champagne: "bg-champagne",
};

/**
 * Stage-1 placeholder section: eyebrow + heading, scroll-reveal wrapped, on
 * the given background tone. Real section content (the working quiz, chat
 * UI, process cards, concern cards, results panel...) lands in Stage 2/3 —
 * this only proves the id exists as a nav/anchor target and exercises the
 * foundation primitives end-to-end inside the real Next build.
 */
function PlaceholderSection({
  id,
  index,
  eyebrow,
  heading,
  tone,
  children,
}: {
  id: string;
  index?: string;
  eyebrow: string;
  heading: string;
  tone: PlaceholderTone;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8", TONE_CLASSES[tone])}>
      <RevealOnScroll className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <SectionEyebrow index={index}>{eyebrow}</SectionEyebrow>
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-5xl">
          {heading}
        </h2>
      </RevealOnScroll>
      {children && <div className="mt-10">{children}</div>}
    </section>
  );
}

export default function Home() {
  return (
    <div className="font-body bg-warm text-ink">
      <ScrollProgress />
      <FilmGrain />
      <CursorGlow />
      <Nav />

      <main>
        {/* Hero placeholder — the full hero (portrait, scan-line sweep,
            floating glass stat cards) is built in Stage 2. This proves the
            foundation's text/gradient/button/pill primitives together. */}
        <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 md:pt-24 lg:px-8">
          <GradientMesh className="opacity-70" />
          <RevealOnScroll className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <Pill dot>AI-Powered Skin Analysis</Pill>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.015em] text-ink sm:text-6xl md:text-7xl">
              Understand your skin.{" "}
              <span className="block bg-gradient-to-r from-rose via-rose-deep to-rose-ink bg-clip-text italic text-transparent">
                Then transform it.
              </span>
            </h1>
            <p className="max-w-xl text-base text-ink-soft sm:text-lg">
              Skinwise pairs AI-powered analysis with real human experts to build a customised routine for your
              exact concern — hyperpigmentation, acne, and beyond. No guesswork. Just skin science, made personal.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <MagneticButton>
                <Button asChild size="lg">
                  <a href="#analyzer">Analyze My Skin →</a>
                </Button>
              </MagneticButton>
              <Button asChild variant="glass" size="lg">
                <a href="#chat">Try AI Chat</a>
              </Button>
            </div>
            <p className="text-sm text-ink-mute">
              The full hero visual, scan animation and floating stat cards land in Stage 2.
            </p>
          </RevealOnScroll>
        </section>

        {/* Trust marquee placeholder — proves the Marquee primitive; the
            styled strip with icons arrives with the real section content. */}
        <section aria-label="Trust signals" className="border-y border-ink/5 bg-surface py-6">
          <Marquee speed={30}>
            {TRUST_PILLS.map((label) => (
              <Pill key={label}>{label}</Pill>
            ))}
          </Marquee>
        </section>

        <PlaceholderSection
          id="analyzer"
          index="01"
          eyebrow="The AI Skin Analyzer"
          tone="warm"
          heading="A dermatology-grade read of your skin in seconds."
        >
          <Card className="mx-auto max-w-md text-center">
            <p className="text-sm text-ink-soft">
              The working multi-step quiz card (skin close-up scan + 4-step form) is built in Stage 2/3.
            </p>
          </Card>
        </PlaceholderSection>

        <PlaceholderSection
          id="chat"
          index="02"
          eyebrow="Skinwise AI Chat"
          tone="blush"
          heading="Ask anything. Get skin answers, instantly."
        >
          <GlassCard className="mx-auto max-w-md text-center">
            <p className="text-sm text-ink-soft">
              The full chat UI (suggested questions + message thread) is built in Stage 2/3.
            </p>
          </GlassCard>
        </PlaceholderSection>

        <PlaceholderSection
          id="how-it-works"
          index="03"
          eyebrow="How It Works"
          tone="warm"
          heading="Four gentle steps to healthier skin."
        >
          <p className="mx-auto max-w-md text-center text-sm text-ink-soft">
            The four connected process cards are built in Stage 2/3.
          </p>
        </PlaceholderSection>

        <PlaceholderSection
          id="concerns"
          index="06"
          eyebrow="Concerns"
          tone="surface"
          heading="Built for your exact concern."
        >
          <p className="mx-auto max-w-md text-center text-sm text-ink-soft">
            Hyperpigmentation / Acne &amp; breakouts / Ageing &amp; texture cards are built in Stage 2/3.
          </p>
        </PlaceholderSection>

        <PlaceholderSection id="results" eyebrow="Results" tone="surface" heading="Skin journeys that speak for themselves.">
          <div className="mx-auto flex max-w-md flex-col items-center gap-1 text-center">
            <p className="font-display text-4xl font-semibold text-ink">
              <CountUp value={2000} suffix="+" />
            </p>
            <p className="text-sm text-ink-soft">skin journeys started*</p>
          </div>
          <p className="mt-6 text-center text-xs text-ink-mute">
            *Placeholder stat — replace with verified figures before launch. The full stats + results panel is built
            in Stage 2/3.
          </p>
        </PlaceholderSection>
      </main>

      <Footer />
    </div>
  );
}
