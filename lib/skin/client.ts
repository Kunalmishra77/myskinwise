import "server-only";
import type { ScanOutcome } from "@/lib/skin/types";

/**
 * Server-side client for the deterministic skin engine (skin-cv-service on the
 * VPS). The browser NEVER calls the engine directly — it goes through our
 * /api/v1/scan proxy, which uses this. The bearer token stays server-side.
 *
 * Config via env:
 *   SKIN_CV_URL   – e.g. http://scan-api.myskinwise.com  (or the sslip.io URL)
 *   SKIN_CV_TOKEN – the API_TOKEN the service expects
 */

export function skinEngineConfigured(): boolean {
  return Boolean(process.env.SKIN_CV_URL && process.env.SKIN_CV_TOKEN);
}

export function skinEngineBase(): string {
  return (process.env.SKIN_CV_URL ?? "").replace(/\/$/, "");
}

export async function analyzeScan(imageBase64: string, contentType: string): Promise<ScanOutcome> {
  const base = skinEngineBase();
  const token = process.env.SKIN_CV_TOKEN;
  if (!base || !token) {
    return { ok: false, status: 503, failure: { error: "not_configured", user_message: "The scanner isn't available right now." } };
  }

  const bytes = Buffer.from(imageBase64, "base64");
  const form = new FormData();
  const ext = contentType.includes("png") ? "png" : "jpg";
  form.append("image", new Blob([bytes], { type: contentType }), `scan.${ext}`);

  let res: Response;
  try {
    res = await fetch(`${base}/v1/analyze`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form,
      // The engine's own budget is ~2s; allow generous headroom for a cold call.
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return { ok: false, status: 504, failure: { error: "unreachable", user_message: "The scanner took too long. Please try again." } };
  }

  const data = await res.json().catch(() => null);
  if (res.status === 200 && data) {
    return { ok: true, result: data };
  }
  return {
    ok: false,
    status: res.status,
    failure: data ?? { error: "failed", user_message: "Something went wrong analysing that photo." },
  };
}
