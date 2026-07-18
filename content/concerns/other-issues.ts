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
  hero: {
    heading: "Understanding Common Skin Concerns",
    subheading:
      "Our skin constantly regenerates, adapting to internal and external factors. Wrinkles, open pores, dullness, and dark circles are common issues, but addressing their root causes is key. With advanced dermatological science and personalised skincare, these concerns can be effectively treated at a deeper level, restoring your skin's health and radiance.",
  },
  whatIs: {
    title: "Understanding Common Skin Concerns",
    body: "Our skin constantly regenerates, adapting to internal and external factors. Wrinkles, open pores, dullness, and dark circles are common issues, but addressing their root causes is key. With advanced dermatological science and personalised skincare, these concerns can be effectively treated at a deeper level, restoring your skin's health and radiance.",
  },
  // TODO(client): other-issues-specific "causes" copy (source reused acne causes — see file header note)
  causes: [],
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
      body: "The product targets the root cause of all your facial concerns, working to clear them permanently for flawless skin.",
    },
    {
      title: "Continuous Support & Care",
      body: "A dedicated service team keeps tracking your results for long-lasting improvements.",
    },
  ],
  objectionFaqs: FAQS.otherIssuesObjections,
};
