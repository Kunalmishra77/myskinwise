import type { ConcernContent } from "@/content/concerns/types";
import { FAQS } from "@/content/faqs";

/**
 * Acne landing page content (WEBSITE_CONTENT.md §6, "Acne — Landing Page",
 * slug `acne`). Transcribed verbatim from the client's WordPress CSV
 * export.
 *
 * Content-accuracy fixes applied per §6's own findings:
 * - `causes` is deduped: the source repeats the "Reasons of Acne" block
 *   twice with different accordion IDs. Each cause appears once here.
 *
 * §6 has no distinct "### Hero" block the way §3 (Pigmentation) does — the
 * `hero.heading` below is assembled from real verbatim fragments captured
 * elsewhere on this same page (the CTA button text "Analyse your skin" and
 * the Process step 2 title "Customized Acne Solution"), not invented copy.
 * // TODO(client-confirm): exact verbatim Acne landing-page hero headline (no distinct Hero block was captured in the CSV export)
 */
export const acne: ConcernContent = {
  slug: "acne",
  label: "Acne",
  hero: {
    heading: "Customized Acne Solution — Analyse your skin",
  },
  whatIs: {
    title: "What Is Acne",
    body: "Acne is a common skin condition that occurs when hair follicles get clogged with oil, dead skin cells and bacteria, leading to pimples, blackheads, and inflammation.",
  },
  causes: [
    {
      title: "Excess oil",
      body: "Overactive sebaceous glands lead to clogged pores.",
    },
    {
      title: "Bacterial growth",
      body: "Propionibacterium acnes (P. acnes) bacteria cause inflammation and breakouts.",
    },
    {
      title: "Hormonal changes",
      body: "Fluctuations in hormones, especially during puberty, pregnancy or PCOS can trigger acne.",
    },
    {
      title: "Clogged pores",
      body: "Dead skin cells and oil buildup contribute to breakouts.",
    },
    {
      title: "Diet & lifestyle",
      body: "High-sugar and dairy-rich diets can exacerbate acne in some individuals.",
    },
    {
      title: "Harsh skincare",
      body: "Overuse of strong products or frequent exfoliation can trigger acne.",
    },
  ],
  types: [
    {
      name: "Comedonal",
      body: "Includes whiteheads and blackheads (open clogged pores) caused by excess oil and dead skin buildup.",
    },
    {
      name: "Inflammatory",
      body: "Includes papules (red, swollen bumps) and pustules (pus-filled pimples) caused by bacteria and inflammation.",
    },
    {
      name: "Nodular",
      body: "Large, painful, hard lumps deep under the skin caused by severe bacterial infection and inflammation.",
    },
    {
      name: "Cystic",
      body: "The most severe type, with deep, pus-filled cysts that can lead to scarring if left untreated.",
    },
  ],
  scienceSteps: [
    {
      title: "Problem: Clogged Pores & Excess Oil",
      body: "Dead skin, excess sebum and bacteria trap dirt inside pores, leading to breakouts and inflammation.",
    },
    {
      title: "Action: Targeted Treatment",
      body: "Powerful actives like salicylic acid, benzoyl peroxide, and retinoids penetrate deep, unclog pores, control oil and kill bacteria.",
    },
    {
      title: "Solution: Clearer, Healthier Skin",
      body: "With consistent treatment, skin heals, inflammation reduces, and breakouts fade, preventing future acne and scarring.",
    },
  ],
  ingredientsByType: [
    {
      tabLabel: "Comedonal Acne (Whiteheads & Blackheads)",
      items: ["Salicylic Acid", "Niacinamide", "Green Tea Extract"],
    },
    {
      tabLabel: "Inflammatory Acne (Papules & Pustules)",
      items: ["Benzoyl Peroxide", "Tea Tree Oil", "Centella Asiatica"],
    },
    {
      tabLabel: "Severe Acne (Nodular & Cystic)",
      items: ["Isotretinoin", "Retinoids", "Azelaic Acid"],
    },
  ],
  process: [
    {
      title: "Expert Skin Analysis",
      body: "Take a quick quiz, and our expert will analyze your acne concerns.",
    },
    {
      title: "Customized Acne Solution",
      body: "A specially formulated product designed to treat your acne effectively.",
    },
    {
      title: "Root Cause Treatment",
      // TODO(client-confirm): claim rewrite pending sign-off. The sourced
      // copy read "works on the root cause of acne to clear it permanently".
      // A permanent-cure claim for a cosmetic product is the exact category
      // ASCI acted on across 500+ beauty brands in 2025-26, and "cure"
      // language also risks reclassifying a cosmetic as a drug under the
      // Drugs & Cosmetics Act. Rewritten to describe what the routine does
      // without promising permanence. See the platform architecture spec §8.2.
      body: "Your routine targets what is driving your breakouts, not just the surface — so your skin has the best chance to stay clear with continued care.",
    },
    {
      title: "Continuous Support & Care",
      body: "A dedicated service team keeps tracking your results for long-lasting improvements.",
    },
  ],
  objectionFaqs: FAQS.acneObjections,
};
