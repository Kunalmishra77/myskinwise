/**
 * Per-expert authentication for the internal workspace.
 *
 * This replaces a single shared `ADMIN_ACCESS_TOKEN` that every team member
 * typed. That token was a real server-side boundary — a signed httpOnly
 * cookie verified on every request, not route-hiding — but it authenticated
 * "a member of the Skinwise team" and nothing more, which had three
 * consequences worth naming:
 *
 *   - The audit log recorded which expert acted, but the *client* supplied
 *     that id in the request body. Anyone signed in could attribute an action
 *     to any colleague. Identity now comes from the session, server-side, and
 *     the client's value is ignored.
 *   - Removing one person's access meant changing the secret for everyone.
 *   - A secret shared over WhatsApp is leaked permanently, with no way to
 *     tell whether it had been.
 *
 * The session cookie is `<payload>.<signature>`, where payload is base64url
 * JSON carrying the expert id and an expiry, and the signature is
 * HMAC-SHA256 over that payload. Everything needed to validate a request
 * lives inside the cookie, which matters because middleware runs in the Edge
 * runtime and cannot reach the database — verification is pure crypto with no
 * round trip, on every request.
 *
 * IMPLEMENTATION NOTE — Web Crypto (crypto.subtle), never node:crypto.
 * middleware.ts imports this module and the Edge runtime has no node:crypto.
 * An earlier version used createHmac and crashed middleware on every request.
 */

const COOKIE_NAME = "sw_admin";
const SESSION_HOURS = 12;
const encoder = new TextEncoder();

export type AdminSession = {
  /** experts.id — the real, server-derived identity of the signed-in user. */
  expertId: string;
  name: string;
  /** Unix seconds. */
  exp: number;
};

/**
 * Key used to sign sessions.
 *
 * Falls back to ADMIN_ACCESS_TOKEN so a deployment that has not yet been
 * given a SESSION_SECRET keeps working. A dedicated SESSION_SECRET is
 * preferable, because it lets the signing key rotate — invalidating every
 * live session — independently of anything else.
 */
function signingKey(): string | null {
  return process.env.SESSION_SECRET || process.env.ADMIN_ACCESS_TOKEN || null;
}

function b64urlEncode(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
}

async function sign(payload: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time compare. Both operands are fixed-length hex digests. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Builds a signed session cookie value for a specific expert. */
export async function issueSession(expertId: string, name: string): Promise<string | null> {
  const key = signingKey();
  if (!key) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  const payload = b64urlEncode(JSON.stringify({ expertId, name, exp } satisfies AdminSession));
  return `${payload}.${await sign(payload, key)}`;
}

/**
 * Verifies a cookie and returns the session it encodes, or null.
 *
 * Order matters: the signature is checked before the payload is trusted for
 * anything at all, including the expiry. Reading `exp` out of an unverified
 * payload would let anyone mint a session that never expires.
 */
export async function readSession(cookieValue: string | undefined): Promise<AdminSession | null> {
  if (!cookieValue) return null;
  const key = signingKey();
  if (!key) return null;

  const dot = cookieValue.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = cookieValue.slice(0, dot);
  const signature = cookieValue.slice(dot + 1);

  if (!safeEqual(signature, await sign(payload, key))) return null;

  try {
    const session = JSON.parse(b64urlDecode(payload)) as AdminSession;
    if (!session.expertId || typeof session.exp !== "number") return null;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

/** Convenience for middleware, which only needs a yes/no. */
export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  return (await readSession(cookieValue)) !== null;
}

export const ADMIN_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE = SESSION_HOURS * 3600;
