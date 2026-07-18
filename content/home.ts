import { IMAGES, type ImageAsset } from "@/content/assets";
import { SITE, waHref } from "@/config/site";
import type { HeroCta } from "@/components/features/hero";
import type { ConcernCardProps } from "@/components/features/concern-card";
import type { ProcessStep } from "@/components/features/process-steps";
import type { BeforeAfterSlide } from "@/components/features/before-after-carousel";

/**
 * Home page content (WEBSITE_CONTENT.md §1, "Home Page" · post title
 * "New_Home_Page" · slug `home_page`). Transcribed from the client's WordPress
 * CSV export (plus the cross-checked PDF for the stats/FAQ/footer block that
 * §1's note explains is missing from the page's own `post_content` — likely
 * an Elementor Theme Builder global template).
 */

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * §1 only documents "Hero image carousel (3 banner images)" — the exact
 * on-banner headline/subheading text was not captured in the CSV export (the
 * banner copy lives baked into the carousel images, not in `post_content`).
 * The heading/subheading below are a close paraphrase of the real banner
 * image alt-text descriptions already in content/assets.ts
 * (`bannerLongterm`, `bannerScience`), not invented marketing copy from
 * scratch.
 * // TODO(client-confirm): exact verbatim Home hero banner headline/subheading text
 */
export const heroContent: {
  image: ImageAsset;
  heading: string;
  subheading: string;
  ctas: HeroCta[];
} = {
  image: IMAGES.heroModel,
  heading: "Tailor-Made Solutions for Long-Term Skin Problems",
  subheading: "Proven skin science that renews your skin — personalized, natural, and backed by research.",
  ctas: [
    { label: "Analyse your skin now", href: "/pigmentation", variant: "primary" },
    // Optional WhatsApp CTA — number sourced from config/site.ts (SITE.whatsapp), never hardcoded here.
    { label: "Chat on WhatsApp", href: waHref(SITE.whatsapp.e164), variant: "whatsapp" },
  ],
};

// ---------------------------------------------------------------------------
// Trust badge strip (§1: 9-badge marquee)
// ---------------------------------------------------------------------------

export const trustBadges: string[] = [
  "100% Natural Ingredients",
  "Toxin-Free",
  "Vegan-Friendly",
  "Dermatologically Tested",
  "Paraben-Free",
  "Non-Greasy Formula",
  "Sulfate-Free",
  "Cruelty-Free",
  "Safe for all skin types",
];

// ---------------------------------------------------------------------------
// Four value props (§1, verbatim titles — no supporting body copy was
// captured for these in the source export)
// ---------------------------------------------------------------------------

export interface ValueProp {
  title: string;
}

export const valueProps: ValueProp[] = [
  { title: "Your Problems, Our Priority" },
  { title: "Expert Guidance, Every Step of the Way" },
  { title: "Seamless Service, Happy Journey" },
  { title: "Results that Speak for Themselves" },
];

// ---------------------------------------------------------------------------
// "What Difference Does Skinwise bring?" section
// ---------------------------------------------------------------------------

/**
 * §1 records only this section's heading; no supporting body copy for it was
 * present in the `post_content` export, so none is invented here.
 */
export const whatDifference = {
  heading: "What Difference Does Skinwise bring?",
};

// ---------------------------------------------------------------------------
// "Research – Driven Results" founder/specialist spotlight
// ---------------------------------------------------------------------------

// note(client): Home spotlights "Ashu Sharma, Skin Specialist" while About Us
// names founder "Anant Sanadhya" — sourced as-is, see open items
export const researchSpotlight = {
  eyebrow: "Research – Driven Results",
  quote:
    "Ashu Sharma, Skin Specialist with a passion for Innovation. Ashu Sharma is a renowned skin specialist with extensive expertise in research and development in bioscience. At SkinWise, she and her team are committed to driving innovation, delivering accurate and lasting skin solutions with",
  readMore: { label: "Read More", href: "/about-us" },
};

// ---------------------------------------------------------------------------
// Three concern cards (§1: "Know Your Pigmentation" / "Know Your Acne" /
// "Know Your Face Issues"). Teaser copy is sourced verbatim from each
// concern's own landing-page intro paragraph (§3, §6, §9) since §1 itself
// only records the card titles, not standalone teaser sentences.
// ---------------------------------------------------------------------------

export const concernCards: ConcernCardProps[] = [
  {
    slug: "pigmentation",
    label: "Know Your Pigmentation",
    teaser:
      "Hyperpigmentation is a common skin condition where certain areas of the skin become darker than the surrounding skin due to excess melanin production. It can appear as dark spots, patches or uneven skin tone.",
    image: IMAGES.concernBlemishes,
  },
  {
    slug: "acne",
    label: "Know Your Acne",
    teaser:
      "Acne is a common skin condition that occurs when hair follicles get clogged with oil, dead skin cells and bacteria, leading to pimples, blackheads, and inflammation.",
    image: IMAGES.concernPores,
  },
  {
    slug: "other-issues",
    label: "Know Your Face Issues",
    teaser:
      "Our skin constantly regenerates, adapting to internal and external factors. Wrinkles, open pores, dullness, and dark circles are common issues, but addressing their root causes is key.",
    image: IMAGES.concernTexture,
  },
];

// ---------------------------------------------------------------------------
// "Four Steps to Healthy Skin" process (§1, verbatim step body copy).
// The source only numbers these steps; it doesn't give each one a separate
// short title, so "Step N" is used as the title and the body is transcribed
// verbatim.
// ---------------------------------------------------------------------------

export const processHeading = "Four Steps to Healthy Skin";

export const processSteps: ProcessStep[] = [
  {
    title: "Step 1",
    body: "Take us through your skin journey for us to understand what you have been going through and how we can help.",
  },
  {
    title: "Step 2",
    body: "Our trained personnel will listen to your concerns and guide you with the right solutions for your skin issues.",
  },
  {
    title: "Step 3",
    body: "We develop a skin treatment routine to treat your problems and get it delivered at your doorstep.",
  },
  {
    title: "Step 4",
    body: "Follow routine and experience actual improvements in your skin. Do share your feedback too.",
  },
];

// ---------------------------------------------------------------------------
// Gallery strip (§1: "Image gallery strip (7 numbered images)" — the source
// export doesn't preserve 7 distinct numbered gallery assets, so this picks
// the real gallery/model images available in content/assets.ts.)
//
// Curated to the more aspirational lifestyle/editorial shots (model
// portraits, banners, the launch event, the blog header) rather than the
// clinical close-up "concern" macro photography, which reads as a diagnostic
// tool elsewhere on the concern pages but is jarring in a browsing gallery.
// ---------------------------------------------------------------------------

export const galleryImages: ImageAsset[] = [
  IMAGES.model1,
  IMAGES.bannerLongterm,
  IMAGES.bannerScience,
  IMAGES.galleryLaunchEvent,
  IMAGES.blogSkincareHabits,
];

// ---------------------------------------------------------------------------
// "Real Customers Real Results" before/after carousel
// ---------------------------------------------------------------------------

/**
 * No genuine before/after image pairs exist yet (see
 * BeforeAfterCarousel's own doc comment). Kept empty and typed so the
 * carousel renders its branded "coming soon" placeholder instead of
 * fabricated before/after pairs.
 * // TODO(client): real before/after images pending
 */
export const realResultsSlides: BeforeAfterSlide[] = [];

// ---------------------------------------------------------------------------
// Clinical claims ("Our Results Are Powered By Science, Human Expertise &
// Supported By Data"). §1 confirms the live site currently renders buggy
// "0%/2%" stat-counter values for these — real percentages were never
// captured anywhere in the export/PDF, so only the claim sentences and the
// disclaimer are rendered as text, with NO invented numbers.
// TODO(client): real clinical-study percentages pending (live site shows
// buggy 0%); do not fabricate efficacy numbers
// ---------------------------------------------------------------------------

export const clinicalClaims = {
  heading: "Our Results Are Powered By Science, Human Expertise & Supported By Data",
  subheading: "Skinwise provides solutions you can trust.",
  claims: [
    "Agreed that their dark spots visibly reduced.",
    "Agreed that their skin tone looks even.",
    "Agreed that their skin appears brighter and healthier.",
    "Agreed that their skin feels smooth and hydrated.",
  ],
  disclaimer:
    "According to an independent, third-party clinical study conducted over a period of 28 days.",
};

// ---------------------------------------------------------------------------
// "Your Safety Is Our Top Most Priority" trust section — reuses the same
// 9-badge list as the top-of-page trust strip (§1 describes it as another
// trust-badge section, not a distinct badge set).
// ---------------------------------------------------------------------------

export const safetySection = {
  heading: "Your Safety Is Our Top Most Priority",
  badges: trustBadges,
};
