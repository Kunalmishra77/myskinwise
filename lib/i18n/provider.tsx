"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, type Locale } from "@/lib/i18n/config";
import { translate, type MessageKey } from "@/lib/i18n/dictionary";

const LocaleContext = React.createContext<Locale>("en");

/**
 * Seeds client components with the request's locale (read on the server and
 * passed down), so a client component renders the same language the server
 * did — no flash, no hydration mismatch.
 */
export function LanguageProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return React.useContext(LocaleContext);
}

/** A translator bound to the current locale. */
export function useT(): (key: MessageKey) => string {
  const locale = useLocale();
  return React.useCallback((key: MessageKey) => translate(locale, key), [locale]);
}

/**
 * Switches language: writes the cookie and refreshes so every server component
 * re-renders in the new language. A full navigation is avoided; router.refresh
 * re-fetches server content in place.
 */
export function useSetLocale(): (next: Locale) => void {
  const router = useRouter();
  return React.useCallback(
    (next: Locale) => {
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );
}
