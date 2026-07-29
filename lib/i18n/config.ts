/**
 * Bilingual foundation: English and Hindi.
 *
 * Locale is stored in a cookie, not the URL, so the entire existing route
 * tree keeps working unchanged — no `[locale]` segment retrofit across every
 * page and link. Server components read the cookie to render content in the
 * chosen language; the toggle writes the cookie and refreshes so server
 * content re-renders. This is the pragmatic path for adding a second language
 * to an app that was already built in one.
 */

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LANG_COOKIE = "sw_lang";

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  hi: "हिंदी",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "hi";
}
