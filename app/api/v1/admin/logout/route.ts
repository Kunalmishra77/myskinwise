import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin/auth";

export const runtime = "nodejs";

/**
 * Ends the session by clearing the cookie.
 *
 * There is no server-side session store to invalidate — the cookie is
 * self-contained and signed — so clearing it is the whole operation. The
 * signature covers a 12-hour expiry, which bounds how long a cookie captured
 * before logout could still be replayed. Shortening that window further would
 * mean a server-side revocation list, which is the right trade only once
 * there are enough staff for it to matter.
 */
export async function POST() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
