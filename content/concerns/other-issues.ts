import type { ConcernContent } from "@/content/concerns/types";
import { FAQS } from "@/content/faqs";

/**
 * Other Issues landing page content (WEBSITE_CONTENT.md §9, "Other Issues
 * — Landing Page", `other-issues`, LIVE version — not the more-developed
 * §9b `other-issues-all-skin-care-19-june` draft, per Finding #5 which
 * flags §9b as an unconfirmed, unpublished replacement). Transcribed
 * verbatim from the client's WordPress CSV export.
 *
 * Content-accuracy fix applied per §9's own finding:
 * - The source's "causes" accordion on this page is a copy-pasted reuse of
 *   the Acne page's "Reasons of Acne" block (Excess Oil, Bacterial Growth,
 *   Hormonal, Clogged Pores, Diet & Lifestyle, Harsh Skincare) — content
 *   that doesn't belong on a wrinkles/open-pores/dullness/dark-circles
 *   page. It is intentionally omitted here rather than carried over.
 * // TODO(client): other-issues-specific "causes" copy (source reused acne causes)
 *
 * §9 also has no distinct "### Hero" block the way §3 (Pigmentation) does.
 * Unlike Acne (§6), this page's real opening copy — "Understanding Common
 * Skin Concerns" and its paragraph — reads naturally as hero copy, so it is
 * reused verbatim below (and also, separately, as `whatIs`) rather than
 * inventing new headline text.
 */
export const otherIssues: ConcernContent = {
  slug: "other-issues",
  label: "Other Issues",
  // TODO(client-confirm): repurposed body copy used as Other Issues hero — confirm intended headline
  hero: {
    heading: "Understanding Common Skin Concerns",
    subheading:
      "Our skin constantly regenerates, adapting to internal and external factors. Wrinkles, open pores, dullness, and dark circles are common issues, but addressing their root causes is key. With advanced dermatological science and personalised skincare, these concerns can be effectively treated at a deeper level, restoring your skin's health and radiance.",
  },
  whatIs: {
    title: "Understanding Common Skin Concerns",
    body: "Our skin constantly regenerates, adapting to internal and external factors. Wrinkles, open pores, dullness, and dark circles are common issues, but addressing their root causes is key. With advanced dermatological science and personalised skincare, these concerns can be effectively treated at a deeper level, restoring your skin's health and radiance.",
  },
  // Authored specifically for the "other issues" umbrella (wrinkles, open
  // pores, dullness, dark circles). Deliberately factor-based and
  // appearance-led — no medical claim, no condition named — replacing the
  // earlier empty array left when the source's copy-pasted acne causes were
  // removed.
  causes: [
    {
      title: "Ageing and collagen loss",
      body: "As skin ages, it makes less collagen and elastin, so it loses firmness and fine lines and wrinkles start to show more.",
    },
    {
      title: "Sun exposure",
      body: "Unprotected UV over time breaks down collagen and drives uneven tone, dullness and earlier-looking lines — which is why daily sunscreen matters so much.",
    },
    {
      title: "Dehydration and a stressed barrier",
      body: "When skin is low on moisture or its barrier is under strain, it can look dull and tired, feel rough, and make fine lines look deeper than they are.",
    },
    {
      title: "Dead-skin buildup and slow renewal",
      body: "As cell turnover slows, dead cells sit on the surface. That reads as dullness and can make pores look larger and more noticeable.",
    },
    {
      title: "Sleep, stress and lifestyle",
      body: "Poor sleep, ongoing stress, long screen hours and diet often show first around the eyes — as dark circles and puffiness — and in an overall tired-looking complexion.",
    },
  ],
  types: [
    {
      name: "Wrinkles",
      body: "Deep lines that form due to aging, sun exposure, and loss of skin elasticity.",
    },
    {
      name: "Dark Spots",
      body: "Patches of skin that appear darker due to sun damage, acne scars, or pigmentation.",
    },
    {
      name: "Fine Lines",
      body: "Shallow lines that develop due to repeated facial movements & collagen loss.",
    },
    {
      name: "Dull Skin",
      body: "Skin looks tired and lifeless due to lack of hydration and dead skin buildup.",
    },
  ],
  // "The Science Behind SkinWise: Treating Skin Concerns Deep Within" — unlike
  // Pigmentation/Acne, §9 doesn't have a separate numbered science narrative;
  // this ingredient-grouped section is the only "science" content the source
  // provides, so it is transcribed here (narrative form) and again below in
  // `ingredientsByType` (tab-list form) for the tabbed ingredient UI.
  scienceSteps: [
    {
      title: "Wrinkles & Fine Lines",
      body: "Peptides & Retinoids, Hyaluronic Acid & Ceramides, Vitamin E & Antioxidants.",
    },
    {
      title: "Open Pores",
      body: "Niacinamide, Salicylic Acid & AHAs, Zinc & Green Tea Extract.",
    },
    {
      title: "Dull Skin",
      body: "Vitamin C & Ferulic Acid, AHAs/BHAs, Licorice & Kojic Acid.",
    },
    {
      title: "Dark Circles",
      body: "Caffeine & Arnica Extract, Vitamin K & Peptides, Hyaluronic Acid & Aloe Vera.",
    },
  ],
  ingredientsByType: [
    {
      tabLabel: "Wrinkles & Fine Lines",
      items: ["Peptides & Retinoids", "Hyaluronic Acid & Ceramides", "Vitamin E & Antioxidants"],
    },
    {
      tabLabel: "Open Pores",
      items: ["Niacinamide", "Salicylic Acid & AHAs", "Zinc & Green Tea Extract"],
    },
    {
      tabLabel: "Dull Skin",
      items: ["Vitamin C & Ferulic Acid", "AHAs/BHAs", "Licorice & Kojic Acid"],
    },
    {
      tabLabel: "Dark Circles",
      items: ["Caffeine & Arnica Extract", "Vitamin K & Peptides", "Hyaluronic Acid & Aloe Vera"],
    },
  ],
  process: [
    {
      title: "Expert Skin Analysis",
      body: "Take a quick quiz, and our expert will analyze your face concerns.",
    },
    {
      title: "Customized Solution",
      body: "A specially formulated product designed to effectively treat all your facial concerns, including acne.",
    },
    {
      title: "Root Cause Treatment",
      // TODO(client-confirm): claim rewrite pending sign-off — same reason as
      // the equivalent line in acne.ts. Sourced copy read "working to clear
      // them permanently for flawless skin"; both the permanence promise and
      // "flawless" are unsubstantiated outcome claims.
      body: "Your routine targets what is driving each concern rather than masking it, supporting clearer, healthier-looking skin over time.",
    },
    {
      title: "Continuous Support & Care",
      body: "A dedicated service team keeps tracking your results for long-lasting improvements.",
    },
  ],
  objectionFaqs: FAQS.otherIssuesObjections,
};
