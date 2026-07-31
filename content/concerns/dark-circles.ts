import type { ConcernContent } from "@/content/concerns/types";
import { FAQS } from "@/content/faqs";

/**
 * Dark Circles landing page content (revamp roadmap 2026-07, "+4 concerns"
 * wave). Authored specifically for the under-eye area — under-eye darkness,
 * shadowing and puffiness — rather than reusing the acne/other-issues copy.
 *
 * Claim discipline (regulated cosmetic brand): every line is
 * appearance-based and uses hedged, non-outcome language ("may help",
 * "helps reduce the look of", "commonly used for"). No cure/treat/heal,
 * no permanence, no "flawless", no invented statistics — same rules the
 * `process` "Root Cause" step follows in acne.ts and other-issues.ts.
 */
export const darkCircles: ConcernContent = {
  slug: "dark-circles",
  label: "Dark Circles",
  hero: {
    heading: "Brighter, Fresher-Looking Under-Eyes — Analyse Your Skin",
    subheading:
      "Dark circles and under-eye shadows can make you look tired even when you're rested. A personalised, gentle under-eye routine can support a brighter, more refreshed look around the eyes over time.",
  },
  whatIs: {
    title: "What Are Dark Circles",
    body: "Dark circles are areas of darkness, discolouration or shadowing under the eyes. Because the skin around the eyes is some of the thinnest on the face, underlying blood vessels, pigmentation and hollowing show through easily — which can give the under-eye area a tired, dull or sunken look.",
  },
  causes: [
    {
      title: "Genetics and heredity",
      body: "For many people, a tendency toward under-eye darkness or pigmentation runs in the family, so circles can appear early and persist regardless of how well-rested you are.",
    },
    {
      title: "Lack of sleep and fatigue",
      body: "Poor or broken sleep and general tiredness can make the under-eye area look darker and more sunken, and often make existing circles more noticeable.",
    },
    {
      title: "Thin skin and visible blood vessels",
      body: "The skin under the eyes is very thin, so the blood vessels beneath it can show through as a bluish or purple tint — a look that can become more obvious with age as skin thins further.",
    },
    {
      title: "Pigmentation around the eyes",
      body: "Excess melanin in the under-eye area, sometimes linked to sun exposure or eye rubbing, can leave brownish discolouration that reads as persistent darkness.",
    },
    {
      title: "Dehydration and screen strain",
      body: "Low hydration, long screen hours and frequent eye rubbing can leave the under-eye area looking dull, shadowed and puffy, emphasising the appearance of circles.",
    },
  ],
  types: [
    {
      name: "Pigmented (brown)",
      body: "A brownish tint caused by excess melanin around the eyes, often more noticeable with sun exposure or frequent eye rubbing.",
    },
    {
      name: "Vascular (bluish/purple)",
      body: "A blue or purple tint that shows through thin under-eye skin from the blood vessels beneath, sometimes with a puffy look.",
    },
    {
      name: "Structural (hollowing/shadows)",
      body: "Shadows cast by the natural contour under the eyes — hollowing or a tear-trough dip — that can look like darkness even without pigment.",
    },
    {
      name: "Mixed",
      body: "A combination of pigment, visible vessels and shadowing together, which is the most common presentation and usually benefits from a layered approach.",
    },
  ],
  scienceSteps: [
    {
      title: "Problem: Thin, Shadowed Under-Eye Skin",
      body: "Delicate under-eye skin lets pigment, blood vessels and hollowing show through, while tiredness and dehydration can make the area look darker and puffier.",
    },
    {
      title: "Action: Targeted Under-Eye Care",
      body: "Gentle actives commonly used for the eye area — such as caffeine, vitamin K, peptides and vitamin C — are applied to help reduce the look of darkness and support a fresher appearance.",
    },
    {
      title: "Action: Brighten, Hydrate and Support",
      body: "Hydrating and brightening ingredients like hyaluronic acid and niacinamide can help plump and smooth the under-eye area, so shadows and dullness look less pronounced.",
    },
    {
      title: "Solution: A Brighter, Refreshed Look",
      body: "With consistent, gentle care, the under-eye area can look more even-toned, hydrated and rested over time.",
    },
  ],
  ingredientsByType: [
    {
      tabLabel: "Pigmented Circles (Brown)",
      items: ["Vitamin C", "Niacinamide", "Vitamin K"],
    },
    {
      tabLabel: "Vascular Circles (Bluish/Purple)",
      items: ["Caffeine", "Vitamin K", "Arnica"],
    },
    {
      tabLabel: "Shadows & Puffiness",
      items: ["Peptides", "Hyaluronic Acid", "Caffeine"],
    },
    {
      tabLabel: "Overall Under-Eye Renewal",
      items: ["Retinol (gentle)", "Peptides", "Niacinamide"],
    },
  ],
  process: [
    {
      title: "Expert Skin Analysis",
      body: "Take a quick quiz, and our expert will analyse your under-eye concerns and the type of dark circles you're seeing.",
    },
    {
      title: "Customized Under-Eye Solution",
      body: "A specially formulated, gentle under-eye routine designed around your specific dark-circle concern.",
    },
    {
      title: "Root Cause Care",
      body: "Your routine targets what is driving your under-eye darkness — pigment, visible vessels, dehydration or shadowing — rather than just masking it, so the area has the best chance to look brighter with continued care.",
    },
    {
      title: "Continuous Support & Care",
      body: "A dedicated service team keeps tracking your results for long-lasting improvements.",
    },
  ],
  objectionFaqs: FAQS.darkCirclesObjections,
};
