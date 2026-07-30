/**
 * Section headings, CTAs and standing copy for the editorial hub pages
 * (Skin Types and Ingredients).
 *
 * Same rationale as content/i18n/scanner.ts: this copy lives inline in the
 * page components, where the i18n translator can't reach it. Centralised here
 * as pure data (no imports) so the translator's "*" mode sources every string
 * and produces Hindi keyed by the exact English.
 *
 * The per-item body prose (a skin type's characteristics, an ingredient's
 * considerations, etc.) is NOT here — that is real content in
 * content/skin-types and content/ingredients, and the translator sources those
 * files directly. Only the page's own chrome lives in this file.
 */

export const SKIN_TYPE_PAGE = {
  eyebrow: "Skin type",
  hubEyebrow: "Skin types",
  hubTitle: "Which of these sounds like your skin?",
  hubIntro:
    "Most routines fail because they were built for somebody else's skin. Start by recognising your own.",
  howItShows: "How it usually shows up",
  whatsDifficult: "What tends to be difficult",
  routineAim: "What a routine for this skin type aims to do",
  ingredientsAround: "The ingredients we build it around",
  routineDisclaimer:
    "Your own routine is decided by a Skinwise expert after your Skin Check — this is the starting point, not the prescription.",
  commonMistakes: "Common mistakes",
  ctaTitle: "Think this is your skin type?",
  ctaBody: "A Skin Check confirms it properly, and puts your answers in front of a real expert.",
  otherTypes: "Other skin types",
} as const;

export const INGREDIENT_PAGE = {
  hubEyebrow: "Ingredients",
  hubTitle: "The ingredients we build routines around.",
  hubIntro:
    "Six ingredients do most of the work in the routines our experts put together. Here is what each one actually does, who it suits, and what to watch out for — without the marketing.",
  whatItIs: "What it is",
  usedFor: "What it's used for",
  whoSuits: "Who it suits",
  appearsIn: "Appears in our routines for",
  worthKnowing: "Things worth knowing",
  guidanceDisclaimer:
    "This is general guidance, not personal advice. If you are unsure whether an ingredient suits you, a Skin Check puts it in front of a Skinwise expert.",
  whereItFits: "Where it fits in a routine",
  relatesTo: "Concerns it relates to",
  ctaTitle: "Not sure if this ingredient is right for you?",
  ctaBody:
    "Tell us about your skin and a Skinwise expert will tell you what actually belongs in your routine.",
  otherIngredients: "Other ingredients",
} as const;

/** Small strings shared by both hubs. */
export const PAGE_COMMON = {
  startSkinCheck: "Start your Skin Check",
  readMore: "Read more",
} as const;

/**
 * Literal section headings the concern-page template passes as props to shared
 * components (Hero CTA, IngredientScience, ProcessSteps). Those components
 * translate their heading/label props via <T>, so the English just needs to be
 * sourced here.
 */
export const CONCERN_PAGE = {
  analyseCta: "Analyse your skin",
  ingredientsHeading: "Research-Driven Ingredients",
  processHeading: "From Assessment to Results",
} as const;
