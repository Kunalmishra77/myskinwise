import type { ConcernContent } from "@/content/concerns/types";
import { FAQS } from "@/content/faqs";

/**
 * Dry Skin concern landing page content.
 *
 * Authored to complement — not duplicate — the educational /skin-types/dry
 * guide (content/skin-types/index.ts, `dry`). That page explains what dry
 * skin IS and the mistakes to avoid; this concern page is routine- and
 * management-oriented: how to layer hydration and support a compromised
 * moisture barrier day to day.
 *
 * A running distinction is drawn between DRY skin (naturally low in oil) and
 * DEHYDRATED skin (low in water) — the two need different emphasis and skin
 * can be both at once, even oily-dehydrated.
 *
 * Claim discipline (regulated cosmetic brand): appearance-based language
 * only, "may help" / "supports the barrier" / "helps skin hold on to
 * moisture" — no cure/treat/heal/permanent/flawless/clinically-proven, no
 * diagnosis, no invented stats. The `process` root-cause step is worded
 * without any permanence or "flawless" promise.
 */
export const drySkin: ConcernContent = {
  slug: "dry-skin",
  label: "Dry Skin",
  hero: {
    heading: "A Routine Built to Rehydrate and Support Your Skin Barrier",
    subheading:
      "Dry skin can feel tight, look dull, and flake in rough patches — often because its moisture barrier is under strain. A considered layering routine may help skin hold on to moisture and look softer, smoother and more comfortable over time.",
  },
  whatIs: {
    title: "What Dry Skin Feels Like",
    body: "Dry skin tends to feel tight — especially after cleansing — and can look dull or papery, with flaking or rough patches around the nose and cheeks. Makeup often clings to those dry areas, and fine lines can look deeper when skin is short on moisture. It helps to know the difference between dry and dehydrated: dry skin lacks oil, while dehydrated skin lacks water, and skin can be both at once. Both respond to the same principle — supporting the skin barrier so it can hold on to moisture.",
  },
  causes: [
    {
      title: "Naturally low oil production",
      body: "Some skin simply makes less sebum, so it holds less of the natural oil that helps slow moisture loss. This tends to be a lifelong trait rather than a passing phase.",
    },
    {
      title: "A weakened moisture barrier",
      body: "When the skin's outer barrier is compromised, water escapes more easily and irritants get in more readily — which is why dry skin can also feel reactive and rough.",
    },
    {
      title: "Harsh cleansers and hot water",
      body: "Stripping face washes and very hot water remove the oils skin needs, leaving it tighter and drier straight after washing.",
    },
    {
      title: "Cold, dry weather and air-conditioning",
      body: "Low humidity, winter air, heating and air-conditioning all pull moisture from the skin, so dryness and flaking often worsen seasonally.",
    },
    {
      title: "Over-exfoliation and stripping actives",
      body: "Scrubbing too often or overusing strong acids and other harsh actives can wear down the barrier, leaving skin drier and more sensitive than before.",
    },
    {
      title: "Age",
      body: "As skin matures it naturally produces less oil and retains less water, so dryness and a feeling of tightness commonly become more noticeable over time.",
    },
  ],
  types: [
    {
      name: "Dry & Flaky",
      body: "Visible flaking and rough patches with a persistent tight feeling — usually a sign the barrier needs richer, more occlusive support to seal in moisture.",
    },
    {
      name: "Dry & Sensitive",
      body: "Dryness paired with stinging, redness or reactivity. Gentle, fragrance-light hydration and barrier-supporting ingredients tend to suit this best.",
    },
    {
      name: "Dry & Dull",
      body: "Skin that looks tired and lacklustre because a rough, moisture-starved surface reflects light unevenly. Consistent hydration can help it look smoother and more radiant.",
    },
    {
      name: "Dehydrated (even oily-dehydrated)",
      body: "Skin that lacks water rather than oil — it can feel tight yet still look shiny in places. Even oily skin can be dehydrated, and it benefits from water-binding hydration without heavy oils.",
    },
  ],
  scienceSteps: [
    {
      title: "Problem: Moisture Loss & a Stressed Barrier",
      body: "When the barrier is weakened, water evaporates from the skin faster than it is replaced, leaving it tight, flaky and dull-looking.",
    },
    {
      title: "Action: Layer Hydration, Then Seal It In",
      body: "Water-binding humectants like Hyaluronic Acid and Glycerin draw in moisture, while barrier-supporting Ceramides and occlusives such as Squalane help hold it there.",
    },
    {
      title: "Solution: Softer, More Comfortable Skin",
      body: "With consistent, gentle care, skin commonly looks smoother and more radiant and feels less tight — with flaking and rough patches becoming less noticeable.",
    },
  ],
  ingredientsByType: [
    {
      tabLabel: "Dry & Flaky",
      items: ["Ceramides", "Squalane", "Shea Butter", "Panthenol"],
    },
    {
      tabLabel: "Dry & Sensitive",
      items: ["Ceramides", "Glycerin", "Niacinamide", "Centella Asiatica"],
    },
    {
      tabLabel: "Dry & Dull",
      items: ["Hyaluronic Acid", "Glycerin", "Niacinamide", "Vitamin E (Tocopherol)"],
    },
    {
      tabLabel: "Dehydrated Skin",
      items: ["Hyaluronic Acid", "Glycerin", "Panthenol", "Niacinamide"],
    },
  ],
  process: [
    {
      title: "Expert Skin Analysis",
      body: "Take a quick quiz, and our expert will look at how dry, dehydrated or barrier-stressed your skin is.",
    },
    {
      title: "Customized Hydration Routine",
      body: "A routine built around gentle cleansing and layered hydration, chosen to suit how your skin loses and holds on to moisture.",
    },
    {
      title: "Barrier-First Approach",
      body: "Your routine focuses on what is driving the dryness — a compromised moisture barrier — rather than only softening the surface, giving skin the best chance to stay comfortable and hydrated with continued care.",
    },
    {
      title: "Continuous Support & Care",
      body: "A dedicated service team keeps tracking how your skin responds and adjusts the routine over time.",
    },
  ],
  objectionFaqs: FAQS.drySkinObjections,
};
