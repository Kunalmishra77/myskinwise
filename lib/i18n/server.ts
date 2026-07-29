import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LANG_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";
import { translate, type MessageKey } from "@/lib/i18n/dictionary";

/** The active locale for this request, from the cookie. Server components only. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** A bound translator for a server component: `const t = await getT(); t("nav.home")`. */
export async function getT(): Promise<(key: MessageKey) => string> {
  const locale = await getLocale();
  return (key: MessageKey) => translate(locale, key);
}
