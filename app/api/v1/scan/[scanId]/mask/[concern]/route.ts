import { skinEngineBase } from "@/lib/skin/client";

export const runtime = "nodejs";

/**
 * Same-origin proxy for a concern's evidence-mask PNG. The browser loads the
 * mask via THIS route (same origin as the app), so it sidesteps cross-origin
 * image blocking and never talks to the VPS directly. The mask carries no face
 * pixels — only a coloured overlay — so this is safe to serve.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string; concern: string }> },
) {
  const { scanId, concern: rawConcern } = await params;
  // The route segment includes the .png extension (…/mask/pigmentation.png) —
  // strip it before validating and forwarding.
  const concern = rawConcern.replace(/\.png$/i, "");
  const base = skinEngineBase();
  if (!base) return new Response("not configured", { status: 503 });

  // Guard the path segments so nothing but an id/concern token can be injected.
  if (!/^scn_[a-z0-9]+$/i.test(scanId) || !/^[a-z_]+$/i.test(concern)) {
    return new Response("bad request", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/v1/scans/${scanId}/masks/${concern}.png`, {
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return new Response("unreachable", { status: 504 });
  }
  if (!upstream.ok) return new Response("not found", { status: upstream.status });

  const buf = await upstream.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: { "content-type": "image/png", "cache-control": "public, max-age=3600" },
  });
}
