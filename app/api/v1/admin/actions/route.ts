import { NextResponse } from "next/server";
import { z } from "zod";
import { getExpertStore } from "@/lib/expert/storage";

export const runtime = "nodejs";

/*
 * Single authenticated endpoint for every internal write. The middleware has
 * already verified the admin session before this runs, so it does not
 * re-check auth — but every branch still validates its own input, because a
 * valid session does not make a malformed payload safe.
 *
 * A `type`-discriminated body keeps the expert workflow's mutations in one
 * auditable place rather than scattered across a dozen routes.
 */

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("assign"), consultationId: z.string().uuid(), expertId: z.string().uuid() }),
  z.object({
    type: z.literal("review"),
    consultationId: z.string().uuid(),
    assessmentId: z.string().uuid(),
    expertId: z.string().uuid(),
    verdict: z.string().min(1).max(4000),
    notes: z.string().max(8000).optional(),
    agreedWithOutline: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("regimen"),
    consultationId: z.string().uuid(),
    assessmentId: z.string().uuid(),
    expertId: z.string().uuid(),
    durationDays: z.number().int().refine((n) => [15, 30, 45].includes(n)).optional(),
    customerSummary: z.string().max(4000).optional(),
    followUp: z.string().max(2000).optional(),
    items: z
      .array(
        z.object({
          timeOfDay: z.enum(["am", "pm", "both"]),
          formulationRef: z.string().min(1).max(200),
          instructions: z.string().max(1000).optional(),
          frequency: z.string().max(200).optional(),
        }),
      )
      .min(1)
      .max(12),
  }),
  z.object({ type: z.literal("publishRegimen"), regimenId: z.string().uuid(), consultationId: z.string().uuid(), expertId: z.string().uuid() }),
  z.object({ type: z.literal("createOrder"), consultationId: z.string().uuid(), regimenId: z.string().uuid(), expertId: z.string().uuid() }),
  z.object({ type: z.literal("orderStatus"), orderId: z.string().uuid(), status: z.string(), expertId: z.string().uuid() }),
]);

export async function POST(request: Request) {
  const store = getExpertStore();
  if (!store) return NextResponse.json({ status: "not_configured" }, { status: 503 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", errors: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  switch (body.type) {
    case "assign": {
      const ok = await store.assignExpert(body.consultationId, body.expertId);
      return NextResponse.json({ status: ok ? "ok" : "failed" }, { status: ok ? 200 : 409 });
    }
    case "review": {
      const ok = await store.saveReview(body.consultationId, body.assessmentId, body.expertId, {
        verdict: body.verdict,
        notes: body.notes,
        agreedWithOutline: body.agreedWithOutline,
      });
      return NextResponse.json({ status: ok ? "ok" : "failed" }, { status: ok ? 200 : 500 });
    }
    case "regimen": {
      const id = await store.createRegimen(body.consultationId, body.assessmentId, body.expertId, {
        durationDays: body.durationDays,
        customerSummary: body.customerSummary,
        followUp: body.followUp,
        items: body.items,
      });
      // Null means no completed review exists yet — a real precondition, so 409.
      return NextResponse.json({ status: id ? "ok" : "failed", regimenId: id }, { status: id ? 201 : 409 });
    }
    case "publishRegimen": {
      const ok = await store.publishRegimen(body.regimenId, body.consultationId, body.expertId);
      return NextResponse.json({ status: ok ? "ok" : "failed" }, { status: ok ? 200 : 409 });
    }
    case "createOrder": {
      const id = await store.createOrder(body.consultationId, body.regimenId, body.expertId);
      return NextResponse.json({ status: id ? "ok" : "failed", orderId: id }, { status: id ? 201 : 500 });
    }
    case "orderStatus": {
      const ok = await store.updateOrderStatus(body.orderId, body.status, body.expertId);
      return NextResponse.json({ status: ok ? "ok" : "failed" }, { status: ok ? 200 : 400 });
    }
  }
}
