export type FaqItem = { id: string; question: string; answer: string };

/**
 * The 5 shared general FAQs, used on Home (WEBSITE_CONTENT.md §1) and
 * repeated verbatim on the Pigmentation / Acne / Other Issues landing
 * pages (§3, §6, §9).
 */
const generalFaqs: FaqItem[] = [
  {
    id: "general-results-timing",
    question: "How soon will I see results for pigmentation and acne?",
    answer:
      "Results vary based on skin type and condition, but many customers notice visible improvements within a few weeks.",
  },
  {
    id: "general-product-effectiveness",
    question: "Do your products work on all types of pigmentation and acne?",
    answer:
      "Our expert-formulated solutions target various skin concerns for effective results. However, effectiveness may vary depending on individual skin conditions.",
  },
  {
    id: "general-how-to-get-treatment",
    question: "How can I get a customized treatment for acne or pigmentation?",
    answer:
      "Simply fill out our form with details about your skin concerns, and our experts will create a personalized skincare solution for you.",
  },
  {
    id: "general-consultation-fee",
    question: "Is there a consultation fee for product customization?",
    answer:
      "No, our expert consultation for personalized skincare solutions is completely free of charge.",
  },
  {
    id: "general-after-submission",
    question: "What happens after I submit the customization form?",
    answer:
      "Our expert will contact you within 24 hours to assess your concerns. After evaluation, you can proceed with placing your order.",
  },
];

/**
 * Pigmentation objection-handling FAQs (WEBSITE_CONTENT.md §3, "FAQ —
 * Objection handling").
 */
const pigmentationObjections: FaqItem[] = [
  {
    id: "pigmentation-tried-many-products",
    question: "I've tried many products, but nothing works. How is Skinwise different?",
    answer:
      "We listen to your concerns, analyze your skin deeply, and create a personalized formula to target the root cause of pigmentation—not just the surface.",
  },
  {
    id: "pigmentation-feel-conscious",
    question: "My pigmentation makes me feel conscious. Can this really help?",
    answer:
      "Absolutely! Our treatments are designed to deliver visible results, helping you feel more confident in your skin again.",
  },
  {
    id: "pigmentation-dont-know-skin-type",
    question: "I don't know my skin type. Can I still get treatment?",
    answer:
      "Yes! Our experts will guide you through a quick skin quiz and consultation to understand your skin and its needs.",
  },
  {
    id: "pigmentation-busy-routine",
    question: "I have a busy routine. Will this treatment be hard to follow?",
    answer:
      "Not at all! We keep it simple and effective, with easy steps that fit into your daily routine without any hassle.",
  },
  {
    id: "pigmentation-no-results",
    question: "What if I don't see results? Will someone assist me?",
    answer:
      "We track your progress closely and adjust your formula if needed, ensuring your journey to clear skin is supported at every step.",
  },
];

/**
 * Acne objection-handling FAQs (WEBSITE_CONTENT.md §6, "FAQ — Objection
 * handling (acne-specific)").
 */
const acneObjections: FaqItem[] = [
  {
    id: "acne-tried-multiple-treatments",
    question: "I've tried multiple acne treatments, but nothing seems to work. How is Skinwise different?",
    answer:
      "Skinwise analyzes your skin type and acne triggers to create a personalized solution that targets the root cause, not just the symptoms.",
  },
  {
    id: "acne-scars-and-breakouts",
    question: "Will this treatment help with old acne scars and new breakouts both?",
    answer:
      "Yes! Our formulations are designed to heal active acne while fading scars and preventing future breakouts.",
  },
  {
    id: "acne-sensitive-skin",
    question: "I have sensitive skin. Can I still use this treatment?",
    answer:
      "Absolutely! Our formulations are free from harsh chemicals and carefully selected to suit your skin's sensitivity.",
  },
  {
    id: "acne-how-long-results",
    question: "How long will it take to see results?",
    answer:
      "While results vary, most people notice visible improvements within 4-6 weeks of consistent use.",
  },
  {
    id: "acne-keeps-coming-back",
    question: "My acne keeps coming back. Will this treatment prevent future breakouts?",
    answer:
      "Yes! Our treatments regulate oil production, clear clogged pores, and strengthen your skin barrier to reduce recurring acne.",
  },
];

/**
 * Other Issues objection-handling FAQs. Per WEBSITE_CONTENT.md §9, the
 * live Other Issues page reuses the acne-flavored objection-handling FAQs
 * verbatim (a content-accuracy gap called out in the source doc, since the
 * answers reference "acne" on a page about wrinkles/dullness/dark circles).
 * Transcribed as-is below, pending client-written, other-issues-specific
 * copy.
 *
 * // TODO(client): other-issues-specific objection FAQs (source reuses acne copy)
 */
const otherIssuesObjections: FaqItem[] = [
  {
    id: "other-issues-tried-multiple-treatments",
    question: "I've tried multiple acne treatments, but nothing seems to work. How is Skinwise different?",
    answer:
      "Skinwise analyzes your skin type and acne triggers to create a personalized solution that targets the root cause, not just the symptoms.",
  },
  {
    id: "other-issues-scars-and-breakouts",
    question: "Will this treatment help with old acne scars and new breakouts both?",
    answer:
      "Yes! Our formulations are designed to heal active acne while fading scars and preventing future breakouts.",
  },
  {
    id: "other-issues-sensitive-skin",
    question: "I have sensitive skin. Can I still use this treatment?",
    answer:
      "Absolutely! Our formulations are free from harsh chemicals and carefully selected to suit your skin's sensitivity.",
  },
  {
    id: "other-issues-how-long-results",
    question: "How long will it take to see results?",
    answer:
      "While results vary, most people notice visible improvements within 4-6 weeks of consistent use.",
  },
  {
    id: "other-issues-keeps-coming-back",
    question: "My acne keeps coming back. Will this treatment prevent future breakouts?",
    answer:
      "Yes! Our treatments regulate oil production, clear clogged pores, and strengthen your skin barrier to reduce recurring acne.",
  },
];

/**
 * Objection FAQs for the four newer first-class concerns. Written claim-safe:
 * appearance-based, never "cure/heal/permanent/guaranteed", no medical promise.
 */
const darkCirclesObjections: FaqItem[] = [
  {
    id: "dark-circles-genetic",
    question: "My dark circles are genetic. Can anything really help?",
    answer:
      "Some of what you see may be inherited, but a lot of it — dullness, puffiness, dehydration and pigmentation around the eyes — can still look brighter with the right routine. Our experts set honest expectations for your specific under-eye.",
  },
  {
    id: "dark-circles-tried-everything",
    question: "I've tried lots of eye creams and nothing changed. Why would this be different?",
    answer:
      "Under-eye darkness has more than one cause — pigment, visible vessels, hollowing, tiredness — and a single generic cream rarely matches yours. We look at what is actually driving it and build the routine around that.",
  },
  {
    id: "dark-circles-need-more",
    question: "What if my dark circles need more than skincare?",
    answer:
      "If the shadow is mostly structural (hollowing), skincare can support the look but won't reshape the area — and we'll tell you that plainly rather than overpromise, and point you to a professional if it's the right call.",
  },
];

const acneScarsObjections: FaqItem[] = [
  {
    id: "acne-scars-old-marks",
    question: "My acne is gone but the marks stayed. Can they still fade?",
    answer:
      "Flat marks left behind by past breakouts — brown or red — commonly fade with consistency and daily sunscreen. We build a routine around helping them look more even over time.",
  },
  {
    id: "acne-scars-pitted",
    question: "Are pitted, indented scars the same as dark marks?",
    answer:
      "No — indented (textural) scars sit deeper than flat marks. Skincare can support overall skin quality, but genuine pitted scars often need a professional procedure, and we're honest about that difference rather than overselling.",
  },
  {
    id: "acne-scars-sunscreen",
    question: "Do I really need sunscreen for scars?",
    answer:
      "Yes — unprotected sun makes post-acne marks look darker and last longer, so daily SPF is one of the most useful things you can do while marks fade.",
  },
];

const oilySkinObjections: FaqItem[] = [
  {
    id: "oily-skin-strip",
    question: "Won't washing more often fix the oiliness?",
    answer:
      "Usually the opposite — stripping the skin can push it to make even more oil to compensate. A balanced routine that cleans gently and hydrates lightly often calms shine better than over-washing.",
  },
  {
    id: "oily-skin-moisturiser",
    question: "My skin is oily — do I even need a moisturiser?",
    answer:
      "Yes. Skipping moisturiser can leave skin dehydrated, which can drive more oil. A lightweight, non-greasy formula keeps skin balanced without adding shine.",
  },
  {
    id: "oily-skin-pores",
    question: "Can I make my pores smaller?",
    answer:
      "Pore size is largely structural, so no routine truly shrinks them — but keeping them clear and reducing oil can make them look far less noticeable.",
  },
];

const drySkinObjections: FaqItem[] = [
  {
    id: "dry-skin-drink-water",
    question: "I drink plenty of water — why is my skin still dry?",
    answer:
      "Dryness is often about the skin's barrier and its oil, not just how much you drink. Supporting the barrier with the right ingredients usually helps more than water alone.",
  },
  {
    id: "dry-skin-vs-dehydrated",
    question: "What's the difference between dry and dehydrated skin?",
    answer:
      "Dry skin makes less oil; dehydrated skin lacks water — and skin can be both, even oily-dehydrated. The routine differs, which is why we check which one you're dealing with.",
  },
  {
    id: "dry-skin-actives",
    question: "Can I still use actives if my skin is dry and sensitive?",
    answer:
      "Often yes, but introduced gently and paired with barrier support. Our experts pace actives to what your skin can comfortably take, rather than all at once.",
  },
];

/**
 * Contact page FAQs (WEBSITE_CONTENT.md §13). The source lists 3 real
 * answers (no questions were captured alongside them in the export, so
 * matching questions are inferred from the shared pigmentation/acne
 * objection-handling copy they were lifted from) plus a 4th answer that
 * was a live Lorem-Ipsum placeholder ("In to am attended desirous
 *
 * // TODO(client-review): confirm inferred contact-page FAQ questions (1-3) match intended copy
 * raptures declared..."). That placeholder is replaced below with
 * on-brand copy pending client sign-off.
 */
const contactFaqs: FaqItem[] = [
  {
    id: "contact-how-is-skinwise-different",
    question: "I've tried many products, but nothing works. How is Skinwise different?",
    answer:
      "We listen to your concerns, analyze your skin deeply, and create a personalized formula to target the root cause of pigmentation—not just the surface.",
  },
  {
    id: "contact-dont-know-skin-type",
    question: "I don't know my skin type. Can I still get treatment?",
    answer:
      "Yes! Our experts will guide you through a quick skin quiz and consultation to understand your skin and its needs.",
  },
  {
    id: "contact-busy-routine",
    question: "I have a busy routine. Will this treatment be hard to follow?",
    answer:
      "Not at all! We keep it simple and effective, with easy steps that fit into your daily routine without any hassle.",
  },
  {
    id: "contact-no-results",
    question: "What if I don't see results? Will someone assist me?",
    // Real answer was a live Lorem-Ipsum placeholder on the WordPress site
    // ("In to am attended desirous raptures declared..."). Replaced with
    // on-brand copy below.
    // TODO(client-review): replace placeholder answer with client-approved copy
    answer:
      "We track your progress closely and adjust your formula if needed, so your journey to healthier skin is supported at every step.",
  },
];

export const FAQS = {
  generalFaqs,
  pigmentationObjections,
  acneObjections,
  otherIssuesObjections,
  darkCirclesObjections,
  acneScarsObjections,
  oilySkinObjections,
  drySkinObjections,
  contactFaqs,
};
