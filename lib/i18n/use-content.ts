"use client";

import * as React from "react";
import { useLocale } from "@/lib/i18n/provider";
import { translateContent } from "@/lib/i18n/content";

/** Client-side content translator bound to the active locale. */
export function useTContent(): (text: string) => string {
  const locale = useLocale();
  return React.useCallback((text: string) => translateContent(locale, text), [locale]);
}
