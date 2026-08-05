"use client";

/**
 * The unified consultation session — the thread that ties Voice, Chat and the
 * Skin Analyzer into ONE journey instead of three separate tools.
 *
 * It is deliberately tiny and sessionStorage-backed: the Analyzer lives on its
 * own full-screen route outside the app shell, so React state cannot survive
 * the navigation between "talking to Riya" and "scanning your face". This
 * carries the few things that must cross that boundary:
 *
 *   concern           — what the user told Voice/Chat they want help with, so a
 *                        scan started from a conversation stays on-topic.
 *   analysisReference  — the Skin Analyzer result id (SW-XXXXXXXX), so Riya can
 *                        read the scan back and explain it by voice afterwards.
 *   explainedRef       — which analysis Riya has already narrated, so she
 *                        explains a scan once, not every time the overlay opens.
 *
 * It holds NO personal data — just a concern slug and an opaque reference — and
 * clears with the browser session.
 */

const KEY = "sw_consult";

export type ConsultSession = {
  concern?: string;
  analysisReference?: string;
  explainedRef?: string;
  /**
   * The language Riya converses in (voice + chat). It TRACKS the language the
   * user is actually speaking — updated from speech detection every turn — so
   * it stays correct across the whole session, including after the face scan.
   */
  aiLang?: string;
  /**
   * True only when the user EXPLICITLY picked a language from the picker. Then
   * `aiLang` is a hard lock and speech detection must not override it. When
   * false/absent, `aiLang` is a soft, auto-detected value that each turn may
   * refine — which is what keeps a Hindi conversation in Hindi even if the very
   * first word was mis-detected as English.
   */
  aiLangPinned?: boolean;
};

export function getSession(): ConsultSession {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

export function patchSession(patch: Partial<ConsultSession>): void {
  if (typeof window === "undefined") return;
  const next = { ...getSession(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / disabled — the journey still works, just without memory */
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") sessionStorage.removeItem(KEY);
}
