import { NextResponse } from "next/server";
import { getExpertStore } from "@/lib/expert/storage";

export const runtime = "nodejs";

/**
 * Serves a Skin Analyzer photo to an authenticated expert.
 *
 * The middleware has already verified the admin session before this runs, so
 * the endpoint is expert-only. It mints a short-lived (2-minute) signed URL
 * server-side and 302-redirects to it — meaning the expert's <img src>
 * points at THIS endpoint, and the transient signed URL never appears in the
 * page HTML, the DOM, or any persisted state. A customer, an unauthenticated
 * user, or an unrelated admin request never reaches this code (401 from the
 * middleware), and the bucket itself denies any unsigned access.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const { imageId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(imageId)) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const store = getExpertStore();
  if (!store) return NextResponse.json({ status: "not_configured" }, { status: 503 });

  const url = await store.signImageUrl(imageId);
  if (!url) return NextResponse.json({ status: "not_found" }, { status: 404 });

  // 307 keeps it a GET; no-store so the redirect (and thus the signed URL)
  // is never cached by an intermediary.
  return NextResponse.redirect(url, { status: 307, headers: { "cache-control": "no-store" } });
}
