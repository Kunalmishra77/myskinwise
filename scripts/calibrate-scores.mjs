/**
 * Phase 9 (calibration) — turn the "Beta" anchor scores into data-driven ones.
 *
 * Reads every completed engine scan from Supabase (skin_analyses.engine_result),
 * and for each concern computes the DISTRIBUTION of its raw metric across the
 * real user population. It then prints a ready-to-paste `anchors_v1.yaml` block
 * per concern, where the raw value at each population percentile maps to a
 * score — i.e. score ≈ 100 − percentile_rank (blueprint §5.2 Phase B).
 *
 * Usage:  node scripts/calibrate-scores.mjs
 * Reads Supabase creds from .env.local. The blueprint wants ~5,000 scans before
 * trusting this; the script tells you how many it found so you don't calibrate
 * on noise. Review the output, paste into skin-cv-service/config/anchors_v1.yaml,
 * and bump PIPELINE_VERSION.
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

// concern -> the raw metric the score is derived from (matches anchors_v1.yaml).
const METRIC = {
  acne: "lesion_count",
  pigmentation: "affected_area_pct",
  redness: "red_area_pct",
  dark_circles: "mean_delta_ita",
  wrinkles: "ridge_density",
  pores: "pores_per_cm2",
  oiliness: "shine_ratio_pct",
  texture: "glcm_contrast",
};
// Percentile breakpoints -> the score each maps to (lower_is_better concerns).
const PCTS = [0, 15, 35, 55, 80, 100];
const SCORES = [100, 85, 65, 45, 20, 0];

function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.round((p / 100) * (sortedAsc.length - 1))));
  return sortedAsc[idx];
}

async function main() {
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await db
    .from("skin_analyses")
    .select("engine_result")
    .not("engine_result", "is", null)
    .eq("status", "completed")
    .limit(20000);
  if (error) {
    console.error("query failed:", error.message);
    process.exit(1);
  }

  const values = Object.fromEntries(Object.keys(METRIC).map((k) => [k, []]));
  for (const row of data ?? []) {
    for (const c of row.engine_result?.concerns ?? []) {
      const m = METRIC[c.id];
      const v = m ? c.raw?.[m] : undefined;
      if (typeof v === "number" && Number.isFinite(v)) values[c.id].push(v);
    }
  }

  const n = data?.length ?? 0;
  console.log(`\nScans read: ${n}${n < 5000 ? "  (⚠️  blueprint recommends ~5,000 before trusting calibration)" : ""}\n`);
  console.log("# Paste per-concern blocks into skin-cv-service/config/anchors_v1.yaml, then bump PIPELINE_VERSION.\n");

  for (const [concern, arr] of Object.entries(values)) {
    if (arr.length < 20) {
      console.log(`# ${concern}: only ${arr.length} samples — skipped (need more data).`);
      continue;
    }
    arr.sort((a, b) => a - b);
    const anchors = PCTS.map((p, i) => `[${percentile(arr, p).toFixed(2)}, ${SCORES[i]}]`);
    console.log(`${concern}:`);
    console.log(`  metric: ${METRIC[concern]}`);
    console.log(`  direction: lower_is_better`);
    console.log(`  anchors: [${anchors.join(", ")}]   # from ${arr.length} scans\n`);
  }
}

main();
