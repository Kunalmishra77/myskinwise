import { NextResponse } from "next/server";
import { purgeExpiredPhotos, makeServiceClient } from "@/lib/analysis/retention";

export const runtime = "nodejs";

/**
 * Scheduled photo-retention purge. Deletes storage objects + rows for any
 * skin analysis whose 90-day retention has expired. Idempotent and safe to
 * retry (see lib/analysis/retention.ts).
 *
 * AUTH: protected by a bearer secret (CRON_SECRET). Vercel Cron sends it as
 * `Authorization: Bearer <CRON_SECRET>` automatically; a manual call must
 * present the same header. Without the secret configured, the route refuses
 * to run rather than exposing an unauthenticated deletion endpoint.
 *
 * SCHEDULE: wired via vercel.json → crons (daily 03:00 UTC). On a
 * non-Vercel host, call this URL from any scheduler with the bearer header.
 *
 * The response reports counts and any failures. It never logs storage paths,
 * keys or customer identifiers.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ status: "not_configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  const db = makeServiceClient();
  if (!db) return NextResponse.json({ status: "not_configured" }, { status: 503 });

  const report = await purgeExpiredPhotos(db, new Date());
  return NextResponse.json(
    {
      status: report.ok ? "ok" : "partial",
      analysesExpired: report.analysesExpired,
      objectsDeleted: report.objectsDeleted,
      rowsDeleted: report.rowsDeleted,
      failureCount: report.failures.length,
    },
    { status: report.ok ? 200 : 207 },
  );
}
