import { Accordion } from "@/components/ui/accordion";
import { Section } from "@/components/ui/section";
import type { FaqItem } from "@/content/faqs";
import { JsonLd } from "@/components/features/json-ld";

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
  return (
    <Section>
      <h2 className="mb-6 text-2xl font-semibold text-ink md:text-3xl">{title}</h2>
      <Accordion items={items} />
      {emitSchema && <JsonLd data={faqPageSchema(items)} />}
    </Section>
  );
}
