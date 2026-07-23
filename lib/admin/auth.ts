import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Interim admin authentication for the internal expert workflow.
 *
 * There are no per-user accounts yet, and building full Supabase Auth for a
 * handful of internal staff before the workflow itself exists would be
 * premature. So access to every /admin route and /api/v1/admin endpoint is
 * gated by a single shared secret (`ADMIN_ACCESS_TOKEN`), exchanged once for
 * a signed, httpOnly session cookie.
 *
 * This is deliberately simple, and its limits are documented rather than
 * hidden: it authenticates "a member of the Skinwise team", not a specific
 * named expert, so the audit log records which expert *row* acted only
 * because the UI selects one — it cannot yet prove identity per person. The
 * upgrade path is per-expert Supabase Auth accounts, at which point this
 * file is replaced and the middleware checks a real session. Until then it
 * is a real server-side boundary (a signed cookie, verified on every
 * request), not frontend route-hiding.
 */

const COOKIE_NAME = "sw_admin";

function secret(): string | null {
  return process.env.ADMIN_ACCESS_TOKEN || null;
}

/** Constant-time comparison so a wrong token cannot be timing-probed. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** The value we set as the cookie once the shared token checks out. */
export function issueSessionValue(): string | null {
  const key = secret();
  if (!key) return null;
  // The cookie is HMAC(secret, "admin"): possessing it proves the holder
  // knew the secret, without the secret itself ever being stored client-side.
  return createHmac("sha256", key).update("admin").digest("hex");
}

export function isValidToken(candidate: string): boolean {
  const key = secret();
  return Boolean(key) && safeEqual(candidate, key!);
}

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const expected = issueSessionValue();
  return Boolean(expected) && safeEqual(cookieValue, expected!);
}

export const ADMIN_COOKIE = COOKIE_NAME;
