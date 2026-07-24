/**
 * Creates or updates an expert login account.
 *
 *   node scripts/create-expert-account.mjs <email> [full name]
 *
 * Prints a generated password ONCE to stdout. There is no password recovery
 * in this console by design — resetting means running this again — because a
 * self-service reset flow on a system holding customer face photographs is a
 * bigger attack surface than a two-person team needs.
 *
 * Reads credentials from .env.local and talks to Supabase with the service
 * role, exactly like the app does. Nothing here is committed to the database
 * that the app cannot itself verify.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto as crypto } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function env(name) {
  const line = readFileSync(path.join(ROOT, ".env.local"), "utf-8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} missing from .env.local`);
  return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
}

const ITERATIONS = 600_000;

function b64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2$${ITERATIONS}$${b64url(salt)}$${b64url(new Uint8Array(bits))}`;
}

/**
 * A readable but strong password: five random words plus digits.
 * Length beats obscurity, and a password a person can retype without
 * mistyping it is a password they will not paste into a chat window.
 */
function generatePassword() {
  const words = [
    "amber","basil","cedar","dahlia","ember","fennel","ginger","harbour","indigo","juniper",
    "kelp","lotus","maple","nectar","opal","pepper","quartz","rosemary","saffron","thistle",
    "umber","violet","willow","xenon","yarrow","zephyr",
  ];
  const pick = () => words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];
  const digits = String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, "0");
  return `${pick()}-${pick()}-${pick()}-${digits}`;
}

const email = (process.argv[2] || "").trim().toLowerCase();
const fullName = process.argv[3] || "Skinwise Expert";
if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/create-expert-account.mjs <email> [full name]");
  process.exit(1);
}

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const key = env("SUPABASE_SERVICE_ROLE_KEY");
const headers = { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" };

const password = generatePassword();
const password_hash = await hashPassword(password);

// Update an existing expert with this email, otherwise create one.
const existing = await fetch(
  `${url}/rest/v1/experts?email=eq.${encodeURIComponent(email)}&select=id`,
  { headers },
).then((r) => r.json());

let id;
if (Array.isArray(existing) && existing.length > 0) {
  id = existing[0].id;
  const res = await fetch(`${url}/rest/v1/experts?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ password_hash, full_name: fullName, is_active: true }),
  });
  if (!res.ok) throw new Error(`update failed: ${await res.text()}`);
  console.log(`Updated existing account for ${email}`);
} else {
  const res = await fetch(`${url}/rest/v1/experts`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ full_name: fullName, email, password_hash, is_active: true, credentials: "" }),
  });
  if (!res.ok) throw new Error(`insert failed: ${await res.text()}`);
  id = (await res.json())[0].id;
  console.log(`Created account for ${email}`);
}

console.log(`\n  Email:    ${email}`);
console.log(`  Password: ${password}`);
console.log(`\nStore this in a password manager. It is not recoverable — re-run this script to reset it.`);
