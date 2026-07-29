import type { ConcernContent } from "@/content/concerns/types";
import { FAQS } from "@/content/faqs";
import { IMAGES } from "@/content/assets";
import { Breadcrumb } from "@/components/features/breadcrumb";
import { Hero } from "@/components/features/hero";
import { Accordion } from "@/components/ui/accordion";
import { IngredientScience } from "@/components/features/ingredient-science";
import { RecommendedCombo } from "@/components/products/recommended-combo";
import { ProcessSteps } from "@/components/features/process-steps";
import { BeforeAfterCarousel } from "@/components/features/before-after-carousel";
import { FAQSection } from "@/components/features/faq-section";
import { Section } from "@/components/ui/section";
import { Card, CardBody } from "@/components/ui/card";

export interface ConcernPageTemplateProps {
  content: ConcernContent;
}

/**
 * Shared template for the three skin-concern landing pages (Pigmentation,
 * Acne, Other Issues — WEBSITE_CONTENT.md §3, §6, §9). Server component:
 * every section is composed straight from `content`, no client-side data
 * fetching needed.
 *
 * Section order: Breadcrumb → Hero → "What is" → causes accordion (only
 * when `content.causes` is non-empty — Other Issues has no causes copy,
 * see content/concerns/other-issues.ts) → types gallery → ingredient
 * science tabs → science steps → process steps → before/after carousel →
 * general FAQs (emits the page's one FAQPage schema) → objection FAQs.
 */
export function ConcernPageTemplate({ content }: ConcernPageTemplateProps) {
  return (
    <>
      <Section className="py-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: content.label, href: `/${content.slug}` },
          ]}
        />
      </Section>

      <Hero
        image={IMAGES.heroModel}
        heading={content.hero.heading}
        subheading={content.hero.subheading}
        ctas={[{ label: "Analyse your skin", href: "/skin-check", variant: "primary" }]}
      />

      <Section className="bg-surface">
        <h2 className="text-2xl font-semibold text-ink md:text-3xl">{content.whatIs.title}</h2>
        <p className="mt-4 text-lg text-ink-soft">{content.whatIs.body}</p>
      </Section>

      {/*
        Other Issues has no causes copy (the source only reused the Acne
        page's "Reasons of Acne" block, which was intentionally dropped —
        see content/concerns/other-issues.ts). Rendering an empty
        <Accordion> would show a heading over nothing, so the whole section
        is skipped when there's no content.
      */}
      {content.causes.length > 0 && (
        <Section>
          <h2 className="mb-6 text-2xl font-semibold text-ink md:text-3xl">
            Reasons of {content.label}
          </h2>
          <Accordion
            items={content.causes.map((cause, index) => ({
              id: `cause-${index}`,
              question: cause.title,
              answer: cause.body,
            }))}
          />
        </Section>
      )}

      <Section className="bg-surface">
        <h2 className="mb-8 text-center text-2xl font-semibold text-ink md:text-3xl">
          Which one looks like yours
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.types.map((type) => (
            <Card key={type.name}>
              <CardBody>
                <h3 className="text-lg font-semibold text-ink">{type.name}</h3>
                <p className="mt-2 text-sm text-ink-soft">{type.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <IngredientScience
          groups={content.ingredientsByType}
          heading="Research-Driven Ingredients"
        />
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl">
          <RecommendedCombo concern={content.slug} />
        </div>
      </Section>

      <Section className="bg-surface">
        <h2 className="mb-8 text-2xl font-semibold text-ink md:text-3xl">
          The Science Behind Treating {content.label}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {content.scienceSteps.map((step) => (
            <div key={step.title}>
              <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{step.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <ProcessSteps steps={content.process} heading="From Assessment to Results" />

      <Section>
        <BeforeAfterCarousel slides={[]} />
      </Section>

      <FAQSection title="Frequently Asked Questions" items={FAQS.generalFaqs} emitSchema />

      <FAQSection title="Still have questions?" items={content.objectionFaqs} />
    </>
  );
}
