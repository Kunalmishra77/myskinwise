import { Accordion } from "@/components/ui/accordion";
import { Section } from "@/components/ui/section";
import type { FaqItem } from "@/content/faqs";
import { JsonLd } from "@/components/features/json-ld";
import { T } from "@/components/i18n/t";

function faqPageSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export interface FAQSectionProps {
  title: string;
  items: FaqItem[];
  /** Emit an FAQPage JSON-LD script alongside the accordion. */
  emitSchema?: boolean;
}

export function FAQSection({ title, items, emitSchema = false }: FAQSectionProps) {
  // The Accordion translates each item's question/answer on the client; the
  // JSON-LD schema keeps the original English so search engines index a
  // stable, canonical FAQ regardless of the viewer's language.
  return (
    <Section>
      <h2 className="mb-6 text-2xl font-semibold text-ink md:text-3xl">
        <T>{title}</T>
      </h2>
      <Accordion items={items} />
      {emitSchema && <JsonLd data={faqPageSchema(items)} />}
    </Section>
  );
}
