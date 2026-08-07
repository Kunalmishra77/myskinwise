/**
 * Customer-facing copy for the AI Skin Scanner flow.
 *
 * Centralised here, away from the components, for one reason: the i18n
 * translator (scripts/translate-content.mjs) sources this file wholesale, so
 * every string below is picked up and translated into Hindi keyed by its exact
 * English text. Strings left inline in the .tsx components would not be.
 *
 * Keep this file pure data — no imports — so the translator's "extract every
 * string literal" mode can read it without pulling in module paths.
 *
 * Note on the label maps: FEATURE_LABELS / CERTAINTY_LABELS also exist in
 * lib/ai/vision-schema.ts, which is the source of truth for the *model and the
 * expert console* (both of which stay in English). These are the *customer*
 * display copies — same English words today, but deliberately a separate
 * surface so the customer wording can be translated without touching what the
 * model is grounded on.
 */

export const SCANNER = {
  header: "AI Skin Scanner",
  back: "Back",

  introTitle: "Scan your skin.",
  introBody:
    "Line your face up and capture a clear, well-lit photo. Our AI describes what is visible — shine, redness, texture, tone — and marks the areas on your photo. It is a starting point, not a diagnosis.",

  // Lead-capture gate, shown once before the first scan of a session.
  leadTitle: "Where should we send your results?",
  leadBody:
    "Pop in your name and mobile number so a Skinwise skin expert can follow up on your scan and help with a routine. One quick step, then your scan.",
  leadName: "Your name",
  leadNamePlaceholder: "e.g. Aisha",
  leadMobile: "Mobile number",
  leadMobilePlaceholder: "10-digit mobile",
  leadLocation: "Location",
  leadLocationPlaceholder: "City or area (e.g. Mumbai)",
  leadBadLocation: "Please enter your city or area.",
  leadConsent:
    "I agree to Skinwise contacting me about my skin results. My details are stored securely and never shared.",
  leadCta: "Continue to my scan",
  leadSaving: "Saving…",
  leadBadName: "Please enter your name.",
  leadBadMobile: "Please enter a valid 10-digit mobile number.",
  leadFailed: "We couldn't save your details just now. Please try again.",

  previewTitle: "Look good?",
  previewAlt: "Your photo preview",
  removePhoto: "Remove photo",
  consent:
    "I understand my photo will be analysed by AI for a non-diagnostic observation, stored securely, and deleted within 90 days. It is not a medical diagnosis.",
  analyseCta: "Analyse my photo",
  retake: "Retake or upload another",

  analysing: "Looking at your photo…",

  qualityTitle: "Let's try that photo again",
  errorTitle: "That didn't work",
  tryAnother: "Try another photo",
  continueCheck: "Continue with the Skin Check",

  // Runtime validation / failure messages.
  badType: "Please choose a JPG, PNG or WebP image.",
  tooBig: "That image is over 8MB. Please choose a smaller one.",
  badPhoto: "That photo won't work — please try another.",
  rateLimited: "You've run a few analyses just now — please wait a little while.",
  analyseFailed: "We couldn't analyse that photo.",
  unreachable: "We couldn't reach the analyser. Please check your connection and try again.",
} as const;

export const CAMERA = {
  starting: "Starting camera…",
  align: "Line your face up with the oval",
  blocked:
    "We couldn't open the camera. Allow camera access and try again, or upload a photo instead.",
  retryCamera: "Try the camera again",
  capture: "Capture photo",
  uploadInstead: "Upload instead",
  flip: "Flip camera",
} as const;

export const RESULT = {
  eyebrow: "AI visual analysis",
  title: "What the AI noticed.",
  photoAlt: "The photo you submitted",
  markerCaption: "Tap a marker to see what it is. Markers show the areas we looked at, not a diagnosis.",
  observationSingular: "observation",
  observationPlural: "observations",
  clearlyVisible: "clearly visible.",
  nonDiagnostic: "An AI visual observation — what the photo shows, not a medical diagnosis or a severity score. A Skinwise expert reads the full picture.",
  prominence: "Visual prominence",
  prominenceHint: "How noticeable it looks in this photo — not a severity or medical rating.",
  photoQuality: "Photo quality",
  mostNoticeable: "Most noticeable in your photo",
  disclaimer:
    "These are visible characteristics only — an AI observation, not a medical diagnosis. A photo cannot tell the whole story; a Skinwise expert can.",
  whatThisMayMean: "What this may mean",
  recommendProfessional:
    "Some of what is visible is worth having a person look at. We would suggest a Skinwise expert — or a doctor if it is bothering you.",
  nothingClear:
    "Nothing stood out clearly from this photo. That is common — a Skin Check tells us far more than a single image can.",
  whatNext: "What next?",
  ctaSkinCheck: "Get a personalised Skin Check",
  ctaAssistant: "Ask Skinwise about these observations",
  ctaVoice: "Hear your results from Dr. Vivek",
  ctaScanAnother: "Scan another photo",
} as const;

/** Customer display labels for each visible feature (see note above). */
export const FEATURE_LABELS_DISPLAY: Record<string, string> = {
  visible_shine_or_oiliness: "Shine or oiliness",
  visible_dryness_or_flaking: "Dryness or flaking",
  visible_redness: "Redness",
  visible_uneven_tone: "Uneven tone",
  visible_dark_spots: "Dark spots",
  visible_blemishes: "Blemishes",
  visible_texture_irregularity: "Texture",
  visible_pores: "Visible pores",
};

export const CERTAINTY_LABELS_DISPLAY: Record<string, string> = {
  observed: "Clearly visible",
  possible: "Possibly present",
  unclear: "Hard to tell from this photo",
};

/** Words for a prominence band (see prominenceLabel in vision-schema). */
export const PROMINENCE_WORDS: Record<string, string> = {
  Subtle: "Subtle",
  Noticeable: "Noticeable",
  Prominent: "Prominent",
};

/** Words for the photo-quality bands. */
export const QUALITY_WORDS: Record<string, string> = {
  good: "Good",
  fair: "Fair",
  poor: "Low",
  unusable: "Unreadable",
};

export const QUALITY_NOTE: Record<string, string> = {
  good: "Good photo quality",
  fair: "Fair photo quality",
  poor: "Low photo quality — these findings are less reliable",
  unusable: "This photo was hard to read",
};

/**
 * Appearance-based context for each controlled feature. Every line stays
 * observational: it explains what the look commonly relates to, and never
 * asserts a cause or a diagnosis.
 */
export const MAY_MEAN: Record<string, string> = {
  visible_shine_or_oiliness:
    "Skin can look shinier when it is producing more oil, or when a routine is stripping it and it compensates. A routine can be balanced for this.",
  visible_dryness_or_flaking:
    "Dry-looking or flaky areas often point to the skin barrier needing more support rather than more active ingredients.",
  visible_redness:
    "Visible redness can follow irritation, a product that does not suit you, or simply a warm room. Redness that persists is worth having a person look at.",
  visible_uneven_tone:
    "Tone can look uneven after sun exposure, or as marks left behind by past breakouts fade at different rates.",
  visible_dark_spots:
    "Darker patches commonly follow sun exposure, or heal slowly after a spot has cleared. They usually respond to consistency rather than intensity.",
  visible_blemishes:
    "Individual spots are normal and come and go. It is a pattern of them, rather than any one, that a routine is built around.",
  visible_texture_irregularity:
    "Texture differences show up strongly in raking light, and are usually about hydration and gentle renewal rather than scrubbing.",
  visible_pores:
    "Pore visibility is largely structural and varies by area of the face. A routine can affect how they look, not how many there are.",
};

export const CHECK_VS_SCAN = {
  fromCheck:
    "The Skin Check asks about your skin in your own words. The Skin Analyzer looks at a photo. You can do either, or both — together they give an expert the fullest picture.",
  fromAnalyzer:
    "The Skin Analyzer makes visual observations from your photo. The Skin Check asks about your skin, your routine and your history. You can do either, or both — together they give an expert the fullest picture.",
  analyzerEyebrow: "Or upload a photo",
  analyzerTitle: "AI Skin Analyzer",
  analyzerBody:
    "Take or upload a clear photo and get AI-powered visual observations in seconds. A Skinwise expert reviews them before any routine is made.",
  analyzerAction: "Scan your skin",
  checkEyebrow: "Or answer questions",
  checkTitle: "Skin Check",
  checkBody:
    "A few guided questions about your skin, routine and history — no photo needed. This is the route that reaches a Skinwise expert.",
  checkAction: "Start your Skin Check",
} as const;
