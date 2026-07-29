"use client";

import { LOCALES, LOCALE_LABEL } from "@/lib/i18n/config";
import { useLocale, useSetLocale } from "@/lib/i18n/provider";

/**
 * English / हिंदी switch. Writes the locale cookie and refreshes so every
 * server component re-renders in the chosen language.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center rounded-full border border-ink/15 p-0.5 text-sm ${className ?? ""}`}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => l !== locale && setLocale(l)}
          aria-pressed={l === locale}
          className={`rounded-full px-2.5 py-1 font-medium transition ${
            l === locale ? "bg-rose-ink text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          {l === "hi" ? "हिं" : "EN"}
          <span className="sr-only"> — {LOCALE_LABEL[l]}</span>
        </button>
      ))}
    </div>
  );
}
