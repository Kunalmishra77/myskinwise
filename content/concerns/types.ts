import type { FaqItem } from "@/content/faqs";

/**
 * Shared shape for the three concern landing pages (Pigmentation, Acne,
 * Other Issues — WEBSITE_CONTENT.md §3, §6, §9). Task 19 consumes
 * `CONCERNS` (content/concerns/index.ts) to render each concern page.
 */
export type ConcernSlug = "pigmentation" | "acne" | "other-issues";

export type ConcernContent = {
  slug: ConcernSlug;
  /** Display name, e.g. "Hyperpigmentation". */
  label: string;
  hero: { heading: string; subheading?: string };
  whatIs: { title: string; body: string };
  /** Deduped — the source repeats this block twice with different accordion IDs. */
  causes: { title: string; body: string }[];
  /** "Which one looks like yours" — the visual sub-type picker. */
  types: { name: string; body: string }[];
  /**
   * "The Science Behind Treating…" steps. (Renamed from the plan's
   * `science` field for clarity.)
   */
  scienceSteps: { title: string; body: string }[];
  /** Research-driven ingredients, grouped as tabs (one tab per sub-type/skin-type). */
  ingredientsByType: { tabLabel: string; items: string[] }[];
  /** "From Assessment to Results" — always 4 steps. */
  process: { title: string; body: string }[];
  /** Reference into content/faqs.ts — never re-transcribed here. */
  objectionFaqs: FaqItem[];
};
