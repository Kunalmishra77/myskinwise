import { NextResponse } from "next/server";
import { z } from "zod";
import { saveVerdict } from "@/lib/expert/reviews";

export const runtime = "nodejs";

// Under /api/v1/admin — the admin-session middleware has already run.
const bodySchema = z.object({
  id: z.string().uuid(),
  verdict: z.record(z.string().max(40), z.enum(["accurate", "partial", "wrong"])),
});

export async function POST(request: Request) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ status: "invalid" }, { status: 400 });

  const ok = await saveVerdict(parsed.data.id, parsed.data.verdict);
  return NextResponse.json({ status: ok ? "ok" : "failed" }, { status: ok ? 200 : 500 });
}
