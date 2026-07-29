import hiMap from "@/content/i18n/hi.json";
import type { Locale } from "@/lib/i18n/config";

/**
 * Translates a piece of DISPLAY content (as opposed to a fixed UI string,
 * which lives in the typed dictionary).
 *
 * Content is translated by lookup against a generated map keyed by the exact
 * English text — `content/i18n/hi.json`, produced by
 * scripts/translate-content.mjs. This is what lets the whole content layer
 * (concern pages, ingredients, FAQs, questions, product copy) be translated
 * without adding a Hindi field to every data type: a render site wraps the
 * English text in translateContent()/useTContent() and, when the map has a
 * Hindi entry, gets it back; otherwise it falls back to English, so nothing is
 * ever blank.
 *
 * Values, ids, prices, references and proper nouns are never passed through
 * this — only human-readable prose.
 */
const MAP = hiMap as Record<string, string>;

export function translateContent(locale: Locale, text: string): string {
  if (locale !== "hi" || !text) return text;
  return MAP[text.trim()] ?? text;
}
