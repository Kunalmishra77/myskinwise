/**
 * Phase 9 (repeatability) — how stable are a person's scores across repeat
 * photos? Reads every completed engine scan for one lead and reports, per
 * concern, the mean, standard deviation, and max spread.
 *
 * Usage:  node scripts/repeatability.mjs <leadId>
 * Pass criteria (blueprint §11.2): same-session SD <= 4, cross-lighting max
 * spread <= 8, on every concern.
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const leadId = process.argv[2];
if (!leadId) {
  console.error("Usage: node scripts/repeatability.mjs <leadId>");
  process.exit(1);
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data } = await db
  .from("skin_analyses")
  .select("engine_result, created_at")
  .eq("lead_id", leadId)
  .not("engine_result", "is", null)
  .order("created_at", { ascending: true });

const byConcern = {};
for (const row of data ?? []) {
  for (const c of row.engine_result?.concerns ?? []) {
    if (typeof c.score !== "number") continue;
    (byConcern[c.id] ??= []).push(c.score);
  }
}

const scans = data?.length ?? 0;
console.log(`\nLead ${leadId}: ${scans} scan(s)\n`);
if (scans < 2) {
  console.log("Need at least 2 scans to measure repeatability.");
  process.exit(0);
}

console.log("concern           mean    SD    spread   verdict(SD<=4)");
for (const [concern, arr] of Object.entries(byConcern)) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const sd = Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
  const spread = Math.max(...arr) - Math.min(...arr);
  const ok = sd <= 4 ? "PASS" : "FAIL";
  console.log(
    `${concern.padEnd(16)} ${mean.toFixed(1).padStart(5)} ${sd.toFixed(1).padStart(5)} ${spread.toFixed(1).padStart(7)}   ${ok}`,
  );
}
console.log("");
