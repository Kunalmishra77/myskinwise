/**
 * Fills content/i18n/hi.json with Hindi for the English display strings used
 * across the content layer.
 *
 *   node scripts/translate-content.mjs
 *
 * Idempotent and additive: it extracts human-readable strings from the source
 * files listed below, and asks OpenAI to translate only the ones not already
 * in the map. Re-run it after adding or changing content; existing
 * translations are left untouched (delete a key to force a retranslation).
 *
 * What it deliberately does NOT translate: values, ids, prices, references,
 * and proper nouns. The prompt instructs the model to keep product names,
 * ingredient (INCI) names, brand names and numbers exactly as written, so a
 * regulated label or a SKU can never be mangled by translation.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAP_PATH = path.join(ROOT, "content", "i18n", "hi.json");

/**
 * Source files and the object keys whose string values are display prose.
 * Extend this list to translate more of the content layer.
 */
const SOURCES = [
  { file: "content/assessment/questions.ts", keys: ["prompt", "why", "label", "hint"] },
  // Concern pages — all prose is in `key: "value"` object form (no bulleted
  // string arrays), so the regex captures it cleanly.
  { file: "content/concerns/pigmentation.ts", keys: ["heading", "subheading", "title", "body", "name", "question", "answer", "label"] },
  { file: "content/concerns/acne.ts", keys: ["heading", "subheading", "title", "body", "name", "question", "answer", "label"] },
  { file: "content/concerns/other-issues.ts", keys: ["heading", "subheading", "title", "body", "name", "question", "answer", "label"] },
  // FAQs.
  { file: "content/faqs.ts", keys: ["question", "answer"] },
  // Products — DESCRIPTION prose only. Names and ingredient (INCI) lists are
  // deliberately excluded: they are brand/regulated label text.
  { file: "content/products/index.ts", keys: ["tagline", "description", "directions"] },
  // Skin Scanner UI copy. This file is pure data (no imports) and holds only
  // display prose, so we extract EVERY string literal ("*") rather than name
  // each key.
  { file: "content/i18n/scanner.ts", keys: "*" },
  // Skin-type and ingredient page chrome (headings, CTAs). Also pure data.
  { file: "content/i18n/pages.ts", keys: "*" },
  // Skin-type body content. `name` is a plain descriptor ("Dry skin") so it is
  // translated; the `ingredients` array is INCI/proper names and is excluded.
  {
    file: "content/skin-types/index.ts",
    keys: ["name", "summary", "aim", "characteristics", "challenges", "mistakes"],
  },
  // Ingredient body content. `name` is an INCI/proper name and is excluded so
  // it stays exactly as printed; everything else is explanatory prose.
  {
    file: "content/ingredients/index.ts",
    keys: ["role", "summary", "whatItIs", "suitedTo", "routineNote", "commonlyUsedFor", "considerations"],
  },
];

function env(name) {
  const line = readFileSync(path.join(ROOT, ".env.local"), "utf-8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} missing from .env.local`);
  return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
}

/**
 * Pull display strings from a source file.
 *
 * With a list of `keys`, matches both `key: "value"` scalars AND
 * `key: ["a", "b", ...]` string arrays (the content files use both forms).
 * With keys === "*", matches EVERY double-quoted string literal in the file —
 * use only for pure-data files that hold nothing but display prose, or you
 * will translate identifiers and paths.
 */
function extractStrings(source, keys) {
  const out = new Set();
  const add = (raw) => {
    const value = raw.replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
    // Skip trivial or non-prose values.
    if (value.length > 1 && /[a-zA-Z]/.test(value)) out.add(value);
  };

  if (keys === "*") {
    const re = /"((?:[^"\\]|\\.)*)"/g;
    let m;
    while ((m = re.exec(source))) add(m[1]);
    return out;
  }

  // key: "value"
  const scalar = new RegExp(`(?:${keys.join("|")}):\\s*"((?:[^"\\\\]|\\\\.)*)"`, "g");
  let m;
  while ((m = scalar.exec(source))) add(m[1]);

  // key: [ "a", "b", ... ] — pull each string element. Content arrays never
  // contain a literal "]", so a non-greedy match to the first bracket is safe.
  const arrays = new RegExp(`(?:${keys.join("|")}):\\s*\\[([\\s\\S]*?)\\]`, "g");
  const elem = /"((?:[^"\\]|\\.)*)"/g;
  while ((m = arrays.exec(source))) {
    let e;
    while ((e = elem.exec(m[1]))) add(e[1]);
    elem.lastIndex = 0;
  }
  return out;
}

async function translateBatch(apiKey, strings) {
  const system =
    "You translate short skincare UI strings from English to natural, simple, warm Hindi (Devanagari script), the way you'd speak to a customer in India. Rules: keep product names, ingredient names, brand names and any proper nouns EXACTLY as written in English; keep all numbers, units and symbols; do not add or remove meaning; do not add quotes. Return ONLY a JSON object mapping each input string to its Hindi translation.";
  const user = JSON.stringify(strings);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Translate each of these to Hindi:\n${user}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

const apiKey = env("OPENAI_API_KEY");
const map = JSON.parse(readFileSync(MAP_PATH, "utf-8"));

// Collect every display string across the sources.
const all = new Set();
for (const { file, keys } of SOURCES) {
  const source = readFileSync(path.join(ROOT, file), "utf-8");
  for (const s of extractStrings(source, keys)) all.add(s);
}

const missing = [...all].filter((s) => !(s in map));
console.log(`${all.size} strings found, ${missing.length} need translation.`);

const CHUNK = 40;
for (let i = 0; i < missing.length; i += CHUNK) {
  const batch = missing.slice(i, i + CHUNK);
  const translated = await translateBatch(apiKey, batch);
  for (const s of batch) {
    if (translated[s]) map[s] = translated[s];
    else console.warn(`  (no translation returned for: ${s.slice(0, 50)})`);
  }
  console.log(`  translated ${Math.min(i + CHUNK, missing.length)}/${missing.length}`);
}

// Sort keys for a stable, reviewable diff.
const sorted = Object.fromEntries(Object.keys(map).sort().map((k) => [k, map[k]]));
writeFileSync(MAP_PATH, JSON.stringify(sorted, null, 2) + "\n");
console.log(`Wrote ${Object.keys(sorted).length} entries to content/i18n/hi.json`);
