"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { AI_LANGUAGES } from "@/lib/i18n/languages";
import { getSession, patchSession } from "@/lib/consultation/session";
import { useLocale } from "@/lib/i18n/provider";

/**
 * Picks the language Riya converses in — she listens, understands, and replies
 * in the chosen Indian language (the LLM + voice do the work at runtime; the
 * website chrome stays as-is). The choice is stored on the consultation session
 * so it carries across Voice and Chat.
 *
 * Changing it calls `onChange`, which the voice UI uses to restart the
 * conversation so the next thing Riya says is in the new language.
 */
export function LanguagePicker({ onChange }: { onChange?: (code: string) => void }) {
  const locale = useLocale();
  const [value, setValue] = React.useState<string>("en");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(getSession().aiLang ?? locale);
  }, [locale]);

  return (
    <label className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft">
      <Languages aria-hidden="true" className="size-3.5 text-rose-ink" />
      <span className="sr-only">Conversation language</span>
      <select
        value={value}
        onChange={(e) => {
          const code = e.target.value;
          setValue(code);
          patchSession({ aiLang: code });
          onChange?.(code);
        }}
        className="bg-transparent pr-1 focus-visible:outline-none"
      >
        {AI_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
