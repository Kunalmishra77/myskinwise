/**
 * About Us page content (WEBSITE_CONTENT.md §2, "About Us" · slug `about-us`).
 * Transcribed verbatim from the client's WordPress CSV export. Nothing here
 * is invented — where the source only records a title/label (e.g. the core
 * value names), the one-line description that accompanies it in the source
 * is transcribed as-is.
 */

// ---------------------------------------------------------------------------
// Heading
// ---------------------------------------------------------------------------

export const heading = "About Us";
export const subheading = "OUR EXPERTISE - OUR MISSION, VISION AND CORE VALUES";

// ---------------------------------------------------------------------------
// Mission / Vision
// ---------------------------------------------------------------------------

export const mission: string =
  "To provide personalized skincare solutions that seamlessly blend natural ingredients with scientific innovation, benefiting those suffering from prolonged skin related problems. We promise effective results that help to gain and maintain healthy and radiant skin while promoting overall well-being.";

export const vision: string =
  "Skinwise is going to be the destination for those seeking a solution to their skin ailments and thus enjoy the confidence of those who found long-term remedy from neglected skin health.";

// ---------------------------------------------------------------------------
// Core Values (5, verbatim titles + one-line descriptions)
// ---------------------------------------------------------------------------

export interface CoreValue {
  title: string;
  description: string;
}

export const coreValues: CoreValue[] = [
  { title: "Personalization", description: "Tailored skincare solutions for every unique skin type." },
  { title: "Integrity", description: "Transparent, ethical, and safe skincare you can trust." },
  { title: "Sustainability", description: "Eco-friendly ingredients and packaging for a greener future." },
  { title: "Innovation", description: "Science-backed formulas for visible and lasting results." },
  { title: "Community", description: "Empowering lives through health, education, and sustainability." },
];

// ---------------------------------------------------------------------------
// Founder's Story (verbatim, 3 paragraphs)
// ---------------------------------------------------------------------------

export interface FounderStory {
  name: string;
  paragraphs: string[];
}

export const founderStory: FounderStory = {
  name: "Anant Sanadhya",
  paragraphs: [
    "Hi, I'm Anant Sanadhya, the founder of Skinwise. I started this brand with a simple belief: skincare should be as unique as your skin. Too often, people struggle with concerns like pigmentation, acne and fine lines while using products that don't truly work for them. That's why Skinwise is all about understanding your skin and choosing wisely.",
    "At Skinwise, we create personalized treatments with expert-backed formulations, ensuring that every product is suited to your specific skin needs. It's not just about skincare—it's about making informed choices that bring real results.",
    "My journey with Skinwise is fueled by a passion for helping people feel confident in their own skin. Through continuous learning and innovation, I'm committed to making skincare effective, personal, and truly transformative.",
  ],
};

// ---------------------------------------------------------------------------
// Our Approach (3 pillars, verbatim)
// ---------------------------------------------------------------------------

export interface ApproachPillar {
  title: string;
  body: string;
}

export const approach: ApproachPillar[] = [
  {
    title: "Customised Solutions for Persistent Skin Problems",
    body: "Effective treatments for acne, pigmentation, and wrinkles, delivering lasting, visible results.",
  },
  {
    title: "Guided by Proven Expertise",
    body: "Years of research and dermatological care ensure reliable, science-backed results.",
  },
  {
    title: "Commitment to Nature-Based Active Ingredients",
    body: "At Skinwise, your experience will be without any unnecessary procedures as our team ensures that you get the best of what nature and science have to offer.",
  },
];
