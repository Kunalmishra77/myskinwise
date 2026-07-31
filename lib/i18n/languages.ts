/**
 * The languages Riya (Voice + Chat) can converse in.
 *
 * This is the AI *conversation* language layer, distinct from the static-UI
 * locale (which is English/Hindi). The website chrome stays EN/HI; this lets
 * the LLM understand and reply, and the TTS speak, in the customer's own Indian
 * language at runtime — no page needs re-translating for a new language.
 *
 * Coverage is "wherever the providers allow it": the LLM handles all of these;
 * ElevenLabs' multilingual voice covers a subset well (Hindi, Tamil, English,
 * …) and does its best on the rest, with the browser voice as a fallback so a
 * reply is always spoken or shown. `nativeLabel` is what the picker displays,
 * `englishName` is what the model is told to reply in.
 */
export const AI_LANGUAGES = [
  { code: "en", nativeLabel: "English", englishName: "English" },
  { code: "hi", nativeLabel: "हिन्दी", englishName: "Hindi" },
  { code: "bn", nativeLabel: "বাংলা", englishName: "Bengali" },
  { code: "ta", nativeLabel: "தமிழ்", englishName: "Tamil" },
  { code: "te", nativeLabel: "తెలుగు", englishName: "Telugu" },
  { code: "mr", nativeLabel: "मराठी", englishName: "Marathi" },
  { code: "gu", nativeLabel: "ગુજરાતી", englishName: "Gujarati" },
  { code: "kn", nativeLabel: "ಕನ್ನಡ", englishName: "Kannada" },
  { code: "ml", nativeLabel: "മലയാളം", englishName: "Malayalam" },
  { code: "pa", nativeLabel: "ਪੰਜਾਬੀ", englishName: "Punjabi" },
  { code: "or", nativeLabel: "ଓଡ଼ିଆ", englishName: "Odia" },
  { code: "as", nativeLabel: "অসমীয়া", englishName: "Assamese" },
] as const;

export type AiLang = (typeof AI_LANGUAGES)[number]["code"];

export const AI_LANG_CODES = AI_LANGUAGES.map((l) => l.code) as readonly AiLang[];

export function isAiLang(v: string | undefined): v is AiLang {
  return !!v && (AI_LANG_CODES as readonly string[]).includes(v);
}

/** The English name the model is instructed to reply in. */
export function englishName(code: AiLang): string {
  return AI_LANGUAGES.find((l) => l.code === code)?.englishName ?? "English";
}

/** The native label shown in the language picker. */
export function nativeLabel(code: AiLang): string {
  return AI_LANGUAGES.find((l) => l.code === code)?.nativeLabel ?? code;
}
