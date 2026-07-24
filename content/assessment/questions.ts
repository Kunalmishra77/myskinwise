import type { Question } from "@/content/assessment/types";

/**
 * The Skinwise assessment, migrated from the three WordPress quizzes
 * ("New Pigmentation Questions", "New Acne Questions", "New No Issue
 * Questions" — see Assets/WEBSITE_CONTENT.md §4, §7, §10).
 *
 * Two deliberate changes from the source, both documented in the Stage 2
 * report:
 *
 * 1. Contact details move from the FIRST screen to the last. The source
 *    quizzes opened by asking for name, email, age, WhatsApp and gender
 *    before the user had received anything at all, which is the most
 *    reliable way to lose people. Value first, contact after.
 * 2. Photos become optional. They were mandatory in the source ("Upload
 *    your face image*"), which turns a nice-to-have into a hard blocker
 *    for anyone not somewhere they can take a selfie.
 *
 * Nothing else has been dropped. Every question below traces to a numbered
 * question in the source content, including the safety-critical pregnancy
 * and hormonal ones.
 *
 * The `why` copy is written fresh in plain language — the source explainers
 * were only partially captured in the export — but each states a real,
 * defensible reason for asking. None claims a clinical outcome.
 */
export const QUESTIONS: Question[] = [
  {
    id: "concern",
    prompt: "What would you most like to work on?",
    why: "Your main concern decides which questions we ask next, so we only ask what is actually relevant to you.",
    kind: "single",
    options: [
      { value: "pigmentation", label: "Dark spots and uneven tone" },
      { value: "acne", label: "Breakouts and congestion" },
      { value: "other-issues", label: "Texture, dullness or fine lines" },
    ],
  },
  {
    id: "skin_type",
    prompt: "How does your skin usually behave?",
    why: "The same ingredient can suit one skin type and irritate another. This is the single biggest factor in what we suggest.",
    kind: "single",
    options: [
      { value: "dry", label: "Dry", hint: "Feels tight, can flake" },
      { value: "oily", label: "Oily", hint: "Shiny within a few hours" },
      { value: "combination", label: "Combination", hint: "Oily T-zone, drier cheeks" },
      { value: "sensitive", label: "Sensitive", hint: "Stings or reddens easily" },
      { value: "unsure", label: "I am not sure" },
    ],
  },
  {
    id: "duration",
    prompt: "How long has this been going on?",
    why: "Something that appeared last month is usually approached differently from something you have lived with for years.",
    kind: "single",
    options: [
      { value: "lt-3m", label: "Less than 3 months" },
      { value: "3-12m", label: "3 to 12 months" },
      { value: "1-3y", label: "1 to 3 years" },
      { value: "gt-3y", label: "More than 3 years" },
    ],
  },
  {
    id: "severity",
    prompt: "How noticeable is it to you?",
    why: "How much it affects you matters as much as how it looks to someone else. It helps your expert judge where to start.",
    kind: "single",
    options: [
      { value: "mild", label: "Mild", hint: "I notice it, others probably do not" },
      { value: "moderate", label: "Moderate", hint: "Visible, and it bothers me" },
      { value: "significant", label: "Significant", hint: "It affects my confidence daily" },
    ],
  },
  {
    id: "acne_type",
    prompt: "What do your breakouts usually look like?",
    why: "Blackheads, inflamed spots and deeper painful bumps respond to different ingredients.",
    kind: "multi",
    concerns: ["acne"],
    options: [
      { value: "blackheads", label: "Blackheads and whiteheads" },
      { value: "papules", label: "Small red bumps" },
      { value: "pustules", label: "Spots with a white head" },
      { value: "nodules", label: "Deep, painful lumps" },
      { value: "unsure", label: "I am not sure" },
    ],
  },
  {
    id: "acne_scarring",
    prompt: "Do your breakouts leave marks behind?",
    why: "Marks left after a spot heals need different care from the spots themselves.",
    kind: "single",
    concerns: ["acne"],
    options: [
      { value: "none", label: "No, they fade cleanly" },
      { value: "dark-marks", label: "Yes, dark marks" },
      { value: "textured", label: "Yes, indents or raised scars" },
      { value: "both", label: "Both" },
    ],
  },
  {
    id: "sun_exposure",
    prompt: "How much direct sun do you get on a normal day?",
    why: "Sun exposure is the biggest single factor in how dark spots behave. It also decides how realistic a timeline we can give you.",
    kind: "single",
    concerns: ["pigmentation"],
    options: [
      { value: "minimal", label: "Barely any, I am mostly indoors" },
      { value: "moderate", label: "Some, commuting or errands" },
      { value: "high", label: "A lot, I am outdoors daily" },
    ],
  },
  {
    id: "sunscreen",
    prompt: "Do you wear sunscreen?",
    why: "Brightening work is undone without it. If you are not using any, that is usually the first thing to change.",
    kind: "single",
    concerns: ["pigmentation"],
    options: [
      { value: "daily", label: "Every day" },
      { value: "sometimes", label: "Sometimes" },
      { value: "never", label: "Rarely or never" },
    ],
  },
  {
    id: "tried_before",
    prompt: "Have you tried anything for this already?",
    why: "So we do not send you back to something that has already let you down.",
    kind: "single",
    options: [
      { value: "nothing", label: "Nothing yet" },
      { value: "otc", label: "Over-the-counter products" },
      { value: "prescription", label: "Something prescribed to me" },
      { value: "professional", label: "Clinic treatments" },
    ],
    followUp: {
      id: "tried_before_detail",
      prompt: "Which ones? Even a rough name helps.",
      optional: true,
    },
  },
  {
    id: "seen_dermatologist",
    prompt: "Have you seen a dermatologist about this?",
    why: "If you already have a diagnosis, your expert works with it rather than around it.",
    kind: "single",
    options: [
      { value: "no", label: "No" },
      { value: "yes-past", label: "Yes, in the past" },
      { value: "yes-current", label: "Yes, currently under care" },
    ],
  },
  {
    id: "pregnancy",
    prompt: "Are you pregnant or breastfeeding?",
    why: "This genuinely changes what is safe to recommend. Several common skincare ingredients are avoided during pregnancy.",
    kind: "single",
    options: [
      { value: "no", label: "No" },
      { value: "pregnant", label: "Pregnant" },
      { value: "breastfeeding", label: "Breastfeeding" },
      { value: "prefer-not", label: "Prefer not to say" },
    ],
  },
  {
    id: "cycle_changes",
    prompt: "Does your skin change around your menstrual cycle?",
    why: "A monthly pattern points to a hormonal driver, which is treated differently.",
    kind: "single",
    optional: true,
    options: [
      { value: "yes", label: "Yes, noticeably" },
      { value: "slightly", label: "A little" },
      { value: "no", label: "No" },
      { value: "na", label: "Not applicable" },
    ],
  },
  {
    id: "hormonal_treatment",
    prompt: "Are you taking any hormonal medication?",
    why: "Things like birth control can change how skin behaves, in both directions.",
    kind: "single",
    optional: true,
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
      { value: "prefer-not", label: "Prefer not to say" },
    ],
  },
  {
    id: "shaving",
    prompt: "Do shaving or beard care cause you problems?",
    why: "Razor irritation and grooming products are a common trigger that gets missed, and the fix is often a technique change rather than a product.",
    kind: "single",
    concerns: ["acne"],
    optional: true,
    options: [
      { value: "no", label: "No" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "na", label: "I do not shave" },
    ],
  },
  {
    id: "stress",
    prompt: "How often would you say you are stressed?",
    why: "Stress shows up on skin. Knowing about it helps your expert set a realistic pace.",
    kind: "single",
    optional: true,
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "constantly", label: "Almost constantly" },
    ],
  },
  {
    id: "routine",
    prompt: "What does your current routine look like?",
    why: "Your expert builds on what you already do rather than handing you a routine you will not keep up.",
    kind: "single",
    options: [
      { value: "none", label: "I do not really have one" },
      { value: "basic", label: "Cleanser and moisturiser" },
      { value: "moderate", label: "A few steps, including actives" },
      { value: "extensive", label: "A full multi-step routine" },
    ],
  },
  {
    id: "notes",
    prompt: "Anything else we should know?",
    why: "Allergies, reactions, something that has been worrying you — anything you write here goes straight to your expert.",
    kind: "text",
    optional: true,
  },
];

/** Questions that apply to a given concern, in order. */
export function questionsForConcern(concern: string): Question[] {
  return QUESTIONS.filter((q) => !q.concerns || q.concerns.includes(concern as never));
}
