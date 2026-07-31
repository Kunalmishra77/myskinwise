import type { ConcernContent } from "@/content/concerns/types";
import { FAQS } from "@/content/faqs";

/**
 * Oily Skin landing page content (concern route `oily-skin`).
 *
 * This is the concern/management page — it is deliberately routine-led
 * (how to build and stick to a balancing routine) so it complements, rather
 * than duplicates, the more educational /skin-types/oily guide (which covers
 * characteristics, the aim, and the brand's per-type ingredient table).
 *
 * Copy authored to the regulated-cosmetic claim rules: appearance-based
 * language only, no diagnosis, no permanence or guaranteed-outcome promises.
 * The throughline is BALANCE, not stripping — controlling shine while
 * keeping the barrier supported, since over-cleansed skin often rebounds
 * with more oil.
 */
export const oilySkin: ConcernContent = {
  slug: "oily-skin",
  label: "Oily Skin",
  hero: {
    heading: "Balance Oily Skin — Control Shine Without Stripping",
    subheading:
      "Oily skin makes more sebum than it needs, so shine, visible pores and congestion keep coming back — especially across the T-zone. The aim isn't to strip your skin dry but to keep oil in balance while supporting the barrier, so your complexion looks fresher for longer.",
  },
  whatIs: {
    title: "What Is Oily Skin",
    body: "Oily skin is a skin type where the sebaceous glands produce more oil (sebum) than the skin needs. It commonly looks shiny within a few hours of cleansing, particularly across the forehead, nose and chin, with pores that look more enlarged and a tendency towards blackheads and congestion. Because stripping the skin can prompt it to make even more oil, a balanced routine tends to work better than a harsh one.",
  },
  causes: [
    {
      title: "Overactive sebaceous glands and genetics",
      body: "Some people are simply born with larger, more active oil glands. If oily skin runs in your family, your skin may keep producing sebum regardless of how carefully you cleanse.",
    },
    {
      title: "Hormones",
      body: "Hormonal shifts during puberty, the menstrual cycle, pregnancy or conditions like PCOS can raise oil production, which is why shine and congestion often come and go in cycles.",
    },
    {
      title: "Heat and humidity",
      body: "Warm, humid weather stimulates the glands and thins out sebum, so skin looks and feels far oilier in summer and in tropical climates than it does in cooler, drier air.",
    },
    {
      title: "Over-washing and harsh products",
      body: "Frequent cleansing with stripping, high-alcohol or strongly foaming products removes surface oil for a while, but skin can react by making more — a rebound that leaves it oilier than before.",
    },
    {
      title: "Skipping moisturiser",
      body: "Leaving oily skin unmoisturised can backfire. When skin reads as dehydrated it may push out extra oil to compensate, so a lightweight moisturiser often helps oil look more balanced, not worse.",
    },
  ],
  types: [
    {
      name: "All-over oily",
      body: "Shine and visible pores across the whole face — forehead, nose, cheeks and chin — rather than in one zone. Skin can look greasy again within a few hours of cleansing.",
    },
    {
      name: "Combination (oily T-zone)",
      body: "An oily forehead, nose and chin with normal or drier cheeks. Congestion tends to concentrate in the T-zone while the rest of the face stays comfortable.",
    },
    {
      name: "Oily but dehydrated",
      body: "Skin that looks shiny yet feels tight, rough or looks dull underneath. It is low on water even while high on oil, so it often needs lightweight hydration rather than more stripping.",
    },
    {
      name: "Oily and congested",
      body: "Oiliness alongside recurring blackheads, bumpy texture and enlarged-looking pores, usually where sebum and dead skin collect around the nose and chin.",
    },
  ],
  scienceSteps: [
    {
      title: "Problem: Excess sebum and congestion",
      body: "Overactive glands leave the surface shiny, while sebum and dead skin collect inside pores — making them look larger and setting up blackheads and rough texture.",
    },
    {
      title: "Action: Balance and gently decongest",
      body: "Gentle gel cleansing, a BHA like salicylic acid to keep pores clear, and niacinamide to help regulate the look of oil — paired with lightweight hydration so the barrier stays supported rather than stripped.",
    },
    {
      title: "Result: A fresher, more balanced look",
      body: "With consistent, non-stripping care, skin can look less shiny through the day, pores can appear more refined, and congestion may become easier to keep in check.",
    },
  ],
  ingredientsByType: [
    {
      tabLabel: "Control Oil & Shine",
      items: ["Niacinamide", "Zinc PCA", "Green Tea Extract"],
    },
    {
      tabLabel: "Clear Congestion & Pores",
      items: ["Salicylic Acid (BHA)", "Kaolin Clay", "Bentonite Clay"],
    },
    {
      tabLabel: "Hydrate Without Heaviness",
      items: ["Hyaluronic Acid", "Panthenol", "Aloe Vera"],
    },
    {
      tabLabel: "Cleanse Gently",
      items: ["Gentle Gel Cleanser", "Cocamidopropyl Betaine", "Salicylic Acid (BHA)"],
    },
  ],
  process: [
    {
      title: "Expert Skin Analysis",
      body: "Take a quick quiz, and our expert will look at how oily your skin is, where it shines most, and how congested it tends to get.",
    },
    {
      title: "Customized Oil-Balancing Routine",
      body: "A routine built around your skin — gentle cleansing, the right actives for oil and congestion, and lightweight hydration matched to your T-zone and cheeks.",
    },
    {
      title: "Root Cause Approach",
      body: "Rather than stripping the surface, your routine works to keep oil in balance and pores clearer over time, so your skin has the best chance to look fresh and shine-free with continued care.",
    },
    {
      title: "Continuous Support & Care",
      body: "A dedicated service team keeps checking in on how your skin is responding and adjusts your routine so improvements can last.",
    },
  ],
  objectionFaqs: FAQS.oilySkinObjections,
};
