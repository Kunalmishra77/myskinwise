import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, issueSession, SESSION_MAX_AGE } from "@/lib/admin/auth";
import { getAccountStore } from "@/lib/admin/accounts";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

/*
 * Tighter than any public limiter: password guessing is the threat here, and
 * this endpoint is the only way in. Keyed on IP rather than on the submitted
 * email, so an attacker cannot lock a colleague out by hammering their
 * address.
 */
const loginLimiter = new MemoryRateLimiter(8, 10 * 60 * 1000);

const bodySchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const limit = await loginLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { status: "rate_limited", retryAfter: limit.retryAfter },
      { status: 429 },
    );
  }

  const store = getAccountStore();
  if (!store) return NextResponse.json({ status: "not_configured" }, { status: 503 });

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }
  if (!parsed.success) {
    // Deliberately identical to a failed login. Telling an attacker that an
    // address was malformed rather than unknown is a free hint.
    return NextResponse.json({ status: "invalid" }, { status: 401 });
  }

  const account = await store.authenticate(parsed.data.email, parsed.data.password);
  if (!account) {
    // One response for wrong email and wrong password alike. Distinguishing
    // them turns this endpoint into a staff directory.
    return NextResponse.json({ status: "invalid" }, { status: 401 });
  }

  const value = await issueSession(account.id, account.fullName);
  if (!value) return NextResponse.json({ status: "not_configured" }, { status: 500 });

  const response = NextResponse.json({ status: "ok", name: account.fullName });
  response.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
