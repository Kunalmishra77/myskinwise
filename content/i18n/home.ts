/**
 * Customer-facing copy for the homepage and its showcase components
 * (start-paths, analyzer-showcase, featured-formulations).
 *
 * Same rationale as content/i18n/scanner.ts and content/i18n/pages.ts: this
 * copy lives inline in the page/section components, where the i18n translator
 * (scripts/translate-content.mjs) can't reach it. Centralised here as pure
 * data — no imports — so the translator's "extract every string literal" mode
 * sources every string below and produces Hindi keyed by the exact English.
 *
 * Icon/component references (Sparkles, UserCheck, product slugs, etc.) stay in
 * the .tsx and are zipped in by index — they must NOT appear here, so this file
 * stays import-free and holds nothing but display prose.
 */

export const HOME = {
  // AI-first hero — the first thing a visitor meets.
  aiHeroEyebrow: "Skinwise AI",
  aiHeroTitle: "How can I help you?",
  aiHeroBody:
    "Tell Riya about your skin — by voice or chat — and get personalised guidance in minutes. Every recommendation is reviewed by a real Skinwise expert.",
  aiHeroTalk: "Talk to AI",
  aiHeroChat: "Chat with AI",
  aiHeroScan: "Or scan your skin instead",
  aiHeroTalkHint: "Speak naturally, hands-free",
  aiHeroChatHint: "Prefer to type? Chat with Riya",

  // Hero.
  heroEyebrow: "Personalised skincare",
  heroTitle: "Skincare made for your skin. Not everyone's.",
  heroBody:
    "Tell us what your skin is doing. A Skinwise expert reads your answers personally and builds a routine around your concern.",
  startSkinCheck: "Start your Skin Check",
  messageExpert: "Message an expert",
  heroPointFree: "Free, and no account needed",
  heroPointReviewed: "Reviewed by a real expert",

  // Concerns.
  concernsEyebrow: "Where to start",
  concernsTitle: "What is your skin doing right now?",
  understandThis: "Understand this",

  // How it works.
  journeyEyebrow: "How Skinwise works",
  journeyTitle: "From your first answer to a routine that is yours.",

  // AI + human expert.
  differenceEyebrow: "Where the decisions are made",
  differenceTitle: "Technology helps. A person decides.",
  differenceBody:
    "Plenty of skincare now runs on software alone. Ours does not. Software is good at organising and checking; it is not the thing that should be deciding what goes on your face.",

  // Skin Check CTA.
  skinCheckEyebrow: "The Skin Check",
  skinCheckTitle: "Three minutes now, instead of another year of guessing.",
  skinCheckDoTerm: "What you do",
  skinCheckDoBody: "Answer questions about your skin. Add photos if you want to.",
  skinCheckGetTerm: "What you get",
  skinCheckGetBody: "A Skinwise expert's reading of your skin and what they suggest.",
  skinCheckCostTerm: "What it costs",
  skinCheckCostBody: "Nothing. There is no payment anywhere in the Skin Check.",

  // Learn.
  learnEyebrow: "Learn",
  learnTitle: "Understand your skin before anyone sells you anything.",
  learnConcernsTitle: "Skin concerns",
  learnConcernsBody: "What is actually happening with pigmentation, acne and texture.",
  learnTypesTitle: "Skin types",
  learnTypesBody: "Dry, oily, combination, sensitive — and what each one actually needs.",
  learnIngredientsTitle: "Ingredients",
  learnIngredientsBody: "Niacinamide, retinol, salicylic acid — what they do, in plain language.",
  guides: "guides",

  // Trust.
  trustEyebrow: "Why we work this way",
  trustTitle: "Made for one person at a time.",
  founderQuote:
    "\"Too often, people struggle with concerns like pigmentation, acne and fine lines while using products that don't truly work for them. That's why Skinwise is all about understanding your skin and choosing wisely.\"",
  trustBody:
    "Every formulation is put together after an expert has spoken to you. That is slower than picking something off a shelf, and it is the entire point.",

  // Final CTA.
  finalTitle: "Ready to understand your skin?",
  finalBody:
    "Start with the Skin Check. It is free, it takes about three minutes, and a real person reads every answer.",
} as const;

/** How-it-works steps. Zipped by index with the numbered markers in the .tsx. */
export const JOURNEY = [
  {
    title: "Tell us about your skin",
    body: "A few questions about your concern, your skin type, and what you have already tried.",
  },
  {
    title: "Complete your Skin Check",
    body: "Around three minutes. You can add photos if you want a closer look — they are optional.",
  },
  {
    title: "Get personalised guidance",
    body: "You see what we noticed and what we would suggest, before anyone asks you for anything.",
  },
  {
    title: "Talk to a real expert",
    body: "A Skinwise skin expert reviews your answers personally and speaks with you directly.",
  },
  {
    title: "Receive your routine",
    body: "A formulation put together for your skin, rather than pulled off a shelf.",
  },
  {
    title: "Keep going, with support",
    body: "Skin changes. We stay in touch and adjust your routine as it does.",
  },
] as const;

/** AI-vs-human cards. Zipped by index with the icons in the .tsx. */
export const DIFFERENCE = [
  {
    title: "What our technology does",
    body: "It helps you describe your skin properly, checks your photos are usable, and organises everything so nothing about your case gets lost.",
  },
  {
    title: "What a person does",
    body: "A qualified Skinwise expert reviews your case, speaks to you, and decides your routine. Every recommendation you receive has been through a human being.",
  },
] as const;

/** components/features/start-paths.tsx */
export const START_PATHS = {
  heading: "Three ways to start.",
  intro:
    "Use whichever suits you — or all three. Every route ends with a qualified expert reading your skin before anything is recommended.",
  preferToSpeak: "Prefer to speak?",
  voiceLink: "Talk to Skinwise AI out loud",
  handsFree: "— hands-free, in your own words.",
  // Each entry is zipped by index with { href, Icon, primary } in the .tsx.
  paths: [
    {
      eyebrow: "Answer questions",
      title: "Check your skin",
      body: "A few guided questions about your skin, your routine and your history. An expert reviews your answers and builds your routine.",
      action: "Start your Skin Check",
    },
    {
      eyebrow: "Upload a photo",
      title: "Scan your skin with AI",
      body: "Take or upload a clear photo of your face and get AI-powered visual observations in seconds. Reviewed by a Skinwise expert before any routine is made.",
      action: "Open the Skin Analyzer",
    },
    {
      eyebrow: "Type or talk",
      title: "Ask Skinwise AI",
      body: "Ask anything about ingredients, routines or your own regimen. Type your question, or talk to it out loud.",
      action: "Ask a question",
    },
  ],
} as const;

/** components/features/analyzer-showcase.tsx */
export const ANALYZER_SHOWCASE = {
  eyebrow: "AI Skin Scanner",
  title: "See your skin, clearly.",
  body:
    "Take or upload a photo and our AI reads what's visible — shine, redness, tone, texture — and marks the areas right on your face, in seconds. It's a starting point, not a diagnosis, and a Skinwise expert reviews it before any routine is made.",
  scanCta: "Scan your skin",
  answerCta: "Or answer a few questions",
} as const;

/** components/features/featured-formulations.tsx */
export const FEATURED = {
  eyebrow: "Our formulations",
  title: "Made for your skin, not everyone's.",
  viewAll: "View all formulations",
} as const;
