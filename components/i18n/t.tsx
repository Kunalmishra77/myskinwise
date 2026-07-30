"use client";

import { useTContent } from "@/lib/i18n/use-content";

/**
 * Translates a single content string on the client.
 *
 * Server components stay synchronous — they render `<T>{content.body}</T>`
 * and this tiny client component does the lookup. That avoids making deep
 * server trees async (which cannot be unit-rendered), and it means the
 * translation reacts to the language context directly. Without a
 * LanguageProvider (e.g. in a unit test) it falls back to the English child,
 * so existing render tests are unaffected.
 */
export function T({ children }: { children: string }) {
  const tc = useTContent();
  return <>{tc(children)}</>;
}
