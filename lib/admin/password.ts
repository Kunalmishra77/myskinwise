/**
 * Password hashing for expert accounts.
 *
 * PBKDF2-HMAC-SHA256 via the Web Crypto API, which is available in both the
 * Node and Edge runtimes and needs no dependency. bcrypt or argon2 would be
 * the textbook answer, but both are native modules: they cannot run in Edge,
 * they add a build-time compile step, and argon2 in particular is awkward on
 * serverless. PBKDF2 at a high iteration count is a legitimate choice that
 * OWASP still lists, and it keeps the whole auth path dependency-free.
 *
 * 600,000 iterations is the OWASP recommendation for PBKDF2-HMAC-SHA256.
 * It costs a few hundred milliseconds per login, which is invisible on an
 * action a person performs once a day and is the entire point of the
 * exercise — the cost is what makes an offline attack on a stolen hash
 * expensive.
 *
 * Stored format is a single self-describing string:
 *
 *   pbkdf2$<iterations>$<salt-b64url>$<hash-b64url>
 *
 * The iteration count travels with the hash so it can be raised later
 * without invalidating existing passwords: verification uses whatever the
 * stored record says, and `needsRehash` reports when a password should be
 * upgraded on next successful login.
 */

const ITERATIONS = 600_000;
const KEY_BITS = 256;
const SALT_BYTES = 16;

function b64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

/** Hashes a plaintext password for storage. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${b64urlEncode(salt)}$${b64urlEncode(hash)}`;
}

/** Constant-time comparison of two byte arrays. */
function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/**
 * Verifies a password against a stored hash.
 *
 * Returns false for any malformed record rather than throwing: a corrupt row
 * must read as "wrong password", never as a 500 that tells an attacker they
 * found a real account.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, iterStr, saltB64, hashB64] = stored.split("$");
    if (scheme !== "pbkdf2" || !iterStr || !saltB64 || !hashB64) return false;
    const iterations = Number(iterStr);
    if (!Number.isInteger(iterations) || iterations < 1000) return false;
    const expected = b64urlDecode(hashB64);
    const actual = await derive(password, b64urlDecode(saltB64), iterations);
    return safeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** True when a stored hash was made with weaker settings than we now use. */
export function needsRehash(stored: string): boolean {
  const iterations = Number(stored.split("$")[1]);
  return !Number.isInteger(iterations) || iterations < ITERATIONS;
}

/**
 * Minimum password policy.
 *
 * Length over composition rules: a 12-character passphrase is stronger than
 * "P@ssw0rd!" and far likelier to be remembered rather than written on a
 * sticky note. This console holds customer phone numbers and face photos, so
 * the floor is deliberately higher than a typical 8.
 */
export function passwordProblem(password: string): string | null {
  if (password.length < 12) return "Password must be at least 12 characters.";
  if (password.length > 200) return "Password must be under 200 characters.";
  if (/^\s|\s$/.test(password)) return "Password cannot start or end with a space.";
  return null;
}
