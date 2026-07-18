import type { ConcernContent } from "@/content/concerns/types";
import { FAQS } from "@/content/faqs";

/**
 * Pigmentation landing page content (WEBSITE_CONTENT.md §3, "Pigmentation
 * — Landing Page", slug `pigmentation`). Transcribed verbatim from the
 * client's WordPress CSV export.
 *
 * Content-accuracy fixes applied per §3's own findings:
 * - `causes` is deduped: the source repeats the "Reasons of Hyperpigmentation"
 *   block twice with different accordion IDs. Each cause appears once here.
 * - The recurring source-wide "pigmetnation" typo (see §4/§5) does not appear
 *   in this page's own copy, but is guarded against by concerns.test.ts.
 */
export const pigmentation: ConcernContent = {
  slug: "pigmentation",
  label: "Hyperpigmentation",
  hero: {
    heading: "Customized hyper-pigmentation solution — Start your skin analysis",
    subheading: "Tell Us About Your Skin – We'll Fix the Hyper-pigmentation.",
  },
  whatIs: {
    title: "What is Hyperpigmentation",
    body: "Hyperpigmentation is a common skin condition where certain areas of the skin become darker than the surrounding skin due to excess melanin production. It can appear as dark spots, patches or uneven skin tone.",
  },
  causes: [
    {
      title: "Genetic factors",
      body: "Some pigmentation disorders, like vitiligo or freckles, run in families and affect skin tone.",
    },
    {
      title: "Harsh skincare",
      body: "Overuse of strong products or frequent exfoliation can trigger inflammation and pigmentation.",
    },
    {
      title: "Sun damage",
      body: "Prolonged UV exposure stimulates excess melanin, leading to stubborn dark spots and uneven skin tone.",
    },
    {
      title: "Hormonal changes",
      body: "Pregnancy, PCOS or birth control pills can disrupt melanin production, leading to melasma.",
    },
  ],
  types: [
    {
      name: "Melasma",
      body: "Patchy brown or grayish spots, usually on the face, triggered by hormones or sun exposure.",
    },
    {
      name: "Sunspots",
      body: "Dark patches caused by prolonged sun exposure, commonly appearing on the face.",
    },
    {
      name: "Freckles",
      body: "Small, light-brown spots that darken with sun exposure, often seen in people with fair skin.",
    },
    {
      name: "Hyperpigmentation (PIH)",
      body: "Dark marks left behind after acne, cuts, burns, skin inflammation, or hyperpigmentation.",
    },
  ],
  scienceSteps: [
    {
      title: "Exfoliation & cellular renewal",
      body: "Removes dead skin cells and accelerates cell turnover, revealing fresher, healthier skin with a natural glow.",
    },
    {
      title: "Targeted pigment correction",
      body: "Active ingredients penetrate deep into melanin-producing cells, regulating melanin production and reducing dark spots.",
    },
    {
      title: "Enhanced even skin tone",
      body: "Supports skin regeneration at a cellular level, gradually fading pigmentation and restoring a balanced, radiant complexion.",
    },
  ],
  ingredientsByType: [
    {
      tabLabel: "Melasma",
      items: [
        "Tranexamic Acid (controls excess melanin)",
        "Niacinamide (strengthens barrier, reduces hyperpigmentation)",
        "Kojic Acid (inhibits melanin formation)",
      ],
    },
    {
      tabLabel: "Sunspots",
      items: [
        "Vitamin C (neutralizes sun damage, brightens)",
        "Alpha Arbutin (targets pigmentation, evens tone)",
        "Retinol (speeds cell turnover)",
      ],
    },
    {
      tabLabel: "Freckles",
      items: [
        "Azelaic Acid (reduces melanin overproduction)",
        "Licorice Extract (naturally lightens pigmentation)",
        "Sunscreen SPF 50+ (prevents darkening)",
      ],
    },
    {
      tabLabel: "Post-Inflammatory Hyperpigmentation (PIH)",
      items: [
        "Mandelic Acid (mild exfoliation)",
        "Centella Asiatica (heals, reduces inflammation)",
        "Green Tea Extract (soothes, prevents further darkening)",
      ],
    },
  ],
  process: [
    {
      title: "Skin Quiz & Expert Assessment",
      body: "Take a quick quiz, and our expert will analyze your pigmentation concerns.",
    },
    {
      title: "Personalized Formulation",
      body: "We create a custom blend of active ingredients to treat your pigmentation.",
    },
    {
      title: "Deep Action & Skin Repair",
      body: "The treatment reduces excess melanin and repairs skin at deeper levels.",
    },
    {
      title: "Progress Tracking",
      body: "We monitor results and adjust treatment for long-lasting improvements.",
    },
  ],
  objectionFaqs: FAQS.pigmentationObjections,
};
