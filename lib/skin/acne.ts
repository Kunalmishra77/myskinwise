import "server-only";

/**
 * Acne detection via a pre-trained Roboflow model (Phase 5, Beta).
 *
 * Done on the Next.js side (not the deterministic engine) so it needs no engine
 * redeploy and no work from the operator — the key + model live in Vercel env.
 * It's a hosted-inference call, so it's the one non-self-hosted, external part
 * of a scan; acne is ML/Beta anyway, and a failure degrades to "no acne score",
 * never breaking the scan.
 *
 *   ROBOFLOW_API_KEY  – the private API key
 *   ROBOFLOW_MODEL    – e.g. "acne-gan/2"
 */

// Matches skin-cv-service/config/anchors_v1.yaml `acne` (lesion_count -> score).
const ANCHORS: [number, number][] = [
  [0, 100],
  [2, 82],
  [6, 62],
  [12, 45],
  [25, 22],
  [50, 0],
];
const CONF_MIN = 0.3;

function interp(v: number): number {
  if (v <= ANCHORS[0]![0]) return ANCHORS[0]![1];
  if (v >= ANCHORS[ANCHORS.length - 1]![0]) return ANCHORS[ANCHORS.length - 1]![1];
  for (let i = 1; i < ANCHORS.length; i++) {
    const [x1, y1] = ANCHORS[i]!;
    if (v <= x1) {
      const [x0, y0] = ANCHORS[i - 1]!;
      const t = x1 !== x0 ? (v - x0) / (x1 - x0) : 0;
      return Math.round((y0 + t * (y1 - y0)) * 10) / 10;
    }
  }
  return ANCHORS[ANCHORS.length - 1]![1];
}

function severity(count: number): string {
  if (count === 0) return "clear";
  if (count <= 5) return "mild";
  if (count <= 20) return "moderate";
  return "significant";
}

export function acneConfigured(): boolean {
  return Boolean(process.env.ROBOFLOW_API_KEY && process.env.ROBOFLOW_MODEL);
}

export type AcneResult = { score: number; severity: string; confidence: number; raw: Record<string, unknown> };

export async function detectAcne(imageBase64: string): Promise<AcneResult | null> {
  const key = process.env.ROBOFLOW_API_KEY;
  const model = process.env.ROBOFLOW_MODEL;
  if (!key || !model) return null;

  try {
    const res = await fetch(`https://detect.roboflow.com/${model}?api_key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: imageBase64,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const preds = (data?.predictions ?? []).filter((p: { confidence?: number }) => (p.confidence ?? 0) >= CONF_MIN);
    const count = preds.length;
    return {
      score: interp(count),
      severity: severity(count),
      confidence: 0.6, // Beta model — modest confidence
      raw: { lesion_count: count, source: "roboflow", model },
    };
  } catch {
    return null;
  }
}
