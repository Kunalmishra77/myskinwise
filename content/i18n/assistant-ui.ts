/**
 * Customer-facing UI copy for the Consultation lookup and the text Assistant.
 *
 * Centralised here, away from the components, for one reason: the i18n
 * translator (scripts/translate-content.mjs) sources this file wholesale, so
 * every string below is picked up and translated into Hindi keyed by its exact
 * English text. Strings left inline in the .tsx components would not be.
 *
 * Keep this file pure data — no imports — so the translator's "extract every
 * string literal" mode can read it without pulling in module paths.
 *
 * Out of scope on purpose: anything the AI backend streams or returns (the
 * assistant's reply text, the server's status `message`), regimen content an
 * expert wrote (summary, per-item instructions, follow-up), reference numbers,
 * URLs and phone numbers. Those are not display chrome and stay English.
 */

export const CONSULTATION = {
  pageTitle: "Your consultation",
  pageIntro: "Enter the reference we sent you and the mobile number from your Skin Check.",

  // Status card — one label + body per consultation state.
  statusRequestedLabel: "Request received",
  statusRequestedBody:
    "Our team has your request and will message you on WhatsApp to arrange a time. A time is not booked yet.",
  statusScheduledLabel: "Time being arranged",
  statusScheduledBody: "We're confirming your consultation time with you on WhatsApp.",
  statusInReviewLabel: "With your expert",
  statusInReviewBody: "A Skinwise expert is reviewing your Skin Check.",
  statusReviewedLabel: "Reviewed",
  statusReviewedBody: "Your expert has reviewed your skin and is preparing your routine.",
  statusRegimenLabel: "Your routine is ready",
  statusRegimenBody: "Your personalised routine is below.",
  statusCompletedLabel: "Completed",
  statusCompletedBody: "This consultation is complete.",
  statusCancelledLabel: "Cancelled",
  statusCancelledBody: "This consultation was cancelled.",

  regimenTitle: "Your routine",
  regimenDisclaimer:
    "This routine was prepared by a Skinwise expert. It is guidance, not a medical diagnosis.",

  // Lookup form.
  referenceLabel: "Reference",
  mobileLabel: "Mobile number",
  checking: "Checking…",
  checkCta: "Check my consultation",

  // Runtime lookup errors (stored in state as these constants, translated at render).
  notFound: "We couldn't find that reference for this number.",
  lookupError: "Please check the reference and number and try again.",
} as const;

export const ASSISTANT = {
  // Concern picker. The label is the visible chip; the opener is sent as the
  // user's first message.
  concernAcneLabel: "Acne & breakouts",
  concernAcneOpener: "I'd like help with acne and breakouts.",
  concernPigmentationLabel: "Pigmentation & dark spots",
  concernPigmentationOpener: "I'd like help with pigmentation and dark spots.",
  concernScarsLabel: "Acne scars & marks",
  concernScarsOpener: "I'd like help with acne scars and marks.",
  concernDarkCirclesLabel: "Dark circles",
  concernDarkCirclesOpener: "I'd like help with dark circles under my eyes.",
  concernOilyLabel: "Oily & shiny skin",
  concernOilyOpener: "I'd like help with oily, shiny skin.",
  concernDryLabel: "Dry & tight skin",
  concernDryOpener: "I'd like help with dry, tight skin.",
  concernOtherLabel: "Texture, dullness or fine lines",
  concernOtherOpener: "I'd like help with texture, dullness or fine lines.",

  // Hard-coded suggestion chips.
  suggestionNiacinamide: "What does niacinamide do?",
  suggestionDifference: "How is Skinwise different?",

  // Call-to-action buttons the assistant can attach to a reply.
  ctaSkinCheck: "Start your Skin Check",
  ctaConsultation: "Talk to a Skinwise expert",
  ctaWhatsapp: "Message us on WhatsApp",
  ctaRegimen: "View my routine",

  // Empty state.
  heroTitle: "Talk to Skinwise AI",
  heroBody:
    "Questions about ingredients, concerns or routines — I'll help, and point you to a real expert when it matters.",
  textTitle: "Text",
  textBody: "Ask your skincare questions by typing. Start below.",
  voiceTitle: "Voice",
  voiceBody: "Talk naturally with Skinwise AI, hands-free.",
  voiceStart: "Start talking",
  concernPrompt: "What would you like help with?",
  askAnything: "Or just ask anything:",

  // Composer + live-region chrome.
  inputLabel: "Ask Skinwise a question",
  inputPlaceholder: "Ask about your skin…",
  voiceSwitchLabel: "Switch to talking with Skinwise AI",
  voiceSwitchTitle: "Talk instead",
  sendLabel: "Send",
  conversationLabel: "Conversation",
  typingLabel: "Skinwise is typing",
  disclaimer:
    "AI assistant · guidance, not medical diagnosis · a Skinwise expert makes the real decisions",

  // Runtime errors (stored in state as these constants, translated at render).
  errorRateLimit: "You're sending messages quickly — please wait a moment.",
  errorGeneric: "Something went wrong. Please try again, or message us on WhatsApp.",
} as const;
