import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidSession } from "@/lib/admin/auth";

/**
 * Server-side gate for the internal workflow. Runs before any /admin page or
 * /api/v1/admin handler renders, so protection does not depend on the client
 * choosing to hide a route.
 *
 * The login page and the login API are exempt, otherwise there would be no
 * way in. Everything else under those prefixes requires a valid signed
 * session cookie; API calls get a 401, page requests get redirected to the
 * login screen.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLogin = pathname === "/admin/login" || pathname === "/api/v1/admin/login";
  if (isLogin) return NextResponse.next();

  const authed = await isValidSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (authed) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/v1/admin/:path*"],
};
