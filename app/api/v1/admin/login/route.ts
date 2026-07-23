import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidToken, issueSessionValue } from "@/lib/admin/auth";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Tighter than the public limiter: password guessing is the threat here.
const loginLimiter = new MemoryRateLimiter(8, 10 * 60 * 1000);

export async function POST(request: Request) {
  const limit = await loginLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json({ status: "rate_limited", retryAfter: limit.retryAfter }, { status: 429 });
  }

  let token = "";
  try {
    token = String(((await request.json()) as { token?: unknown }).token ?? "");
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  if (!isValidToken(token)) {
    return NextResponse.json({ status: "invalid" }, { status: 401 });
  }

  const value = issueSessionValue();
  if (!value) {
    return NextResponse.json({ status: "not_configured" }, { status: 500 });
  }

  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
