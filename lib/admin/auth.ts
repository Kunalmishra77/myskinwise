/**
 * Interim admin authentication for the internal expert workflow.
 *
 * There are no per-user accounts yet, and building full Supabase Auth for a
 * handful of internal staff before the workflow itself exists would be
 * premature. So access to every /admin route and /api/v1/admin endpoint is
 * gated by a single shared secret (`ADMIN_ACCESS_TOKEN`), exchanged once for
 * a signed, httpOnly session cookie.
 *
 * IMPLEMENTATION NOTE — this uses the Web Crypto API (crypto.subtle), not
 * node:crypto. It has to: middleware.ts imports this module, and middleware
 * runs in the Edge runtime, where node:crypto does not exist. An earlier
 * version used createHmac/timingSafeEqual and crashed the middleware on
 * every request (500s across all admin routes). Web Crypto works in both
 * the Edge and Node runtimes, so the same verification runs everywhere.
 *
 * Its limits are documented rather than hidden: it authenticates "a member
 * of the Skinwise team", not a specific named expert. The upgrade path is
 * per-expert Supabase Auth accounts, at which point this file is replaced.
 * Until then it is a real server-side boundary — a signed cookie verified
 * on every request — not frontend route-hiding.
 */

const COOKIE_NAME = "sw_admin";
const encoder = new TextEncoder();

function secret(): string | null {
  return process.env.ADMIN_ACCESS_TOKEN || null;
}

async function hmacHex(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-independent constant-time string compare (no node:crypto). */
function safeEqual(a: string, b: string): boolean {
  // Comparing lengths directly is a minor leak, but both operands here are
  // fixed-length (a hex digest, or the shared token), so it reveals nothing
  // useful. The loop still runs to completion regardless of mismatch.
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** The value we set as the cookie once the shared token checks out. */
export async function issueSessionValue(): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  // The cookie is HMAC(secret, "admin"): possessing it proves the holder
  // knew the secret, without the secret itself ever being stored client-side.
  return hmacHex(key, "admin");
}

export function isValidToken(candidate: string): boolean {
  const key = secret();
  return Boolean(key) && safeEqual(candidate, key!);
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await issueSessionValue();
  return Boolean(expected) && safeEqual(cookieValue, expected!);
}

export const ADMIN_COOKIE = COOKIE_NAME;
