import { NextResponse } from "next/server";
import { z } from "zod";
import { respond, type CustomerContext, type ChatTurn } from "@/lib/ai/assistant";
import { getCustomerStore } from "@/lib/consultation/customer";
import { contactSchema } from "@/lib/assessment/schema";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";
import { getAnalysisStore } from "@/lib/analysis/storage";
import { FEATURE_LABELS } from "@/lib/ai/vision-schema";

export const runtime = "nodejs";

// Chattier than form submission, so a slightly higher ceiling — but still
// low enough to stop a script running up an AI bill.
const chatLimiter = new MemoryRateLimiter(20, 5 * 60 * 1000);
const MAX_BODY_BYTES = 32 * 1024;

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const bodySchema = z.object({
  // Full short history so the model has conversational context; capped so a
  // caller cannot stuff the prompt.
  messages: z.array(turnSchema).min(1).max(20),
  // Optional: to personalise, the customer proves ownership the same way as
  // everywhere else — reference + phone. Absent = a general, un-personalised
  // conversation.
  reference: z.string().regex(/^SW-[A-HJ-NP-Z2-9]{8}$/).optional(),
  phone: z.string().optional(),
  // Optional Skin Analyzer reference. The analyzer runs without an account,
  // so its reference is the bearer token for its own (already customer-safe)
  // observation — the same model the customer used to view their result.
  analysisReference: z.string().regex(/^SW-[A-HJ-NP-Z2-9]{8}$/).optional(),
});

export async function POST(request: Request) {
  const limit = await chatLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json({ status: "rate_limited", retryAfter: limit.retryAfter }, { status: 429 });
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ status: "invalid" }, { status: 413 });
    }
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", errors: parsed.error.flatten() }, { status: 400 });
  }

  // Resolve customer context ONLY when a valid reference + phone pair is
  // given and ownership checks out. A guessed reference alone yields nothing,
  // and the context returned is already the customer-safe view (no internal
  // notes, verdict or ids) — the assistant never receives anything the
  // customer could not already see themselves.
  let context: CustomerContext | undefined;
  if (parsed.data.reference && parsed.data.phone) {
    const phone = contactSchema.shape.phone.safeParse(parsed.data.phone);
    const store = getCustomerStore();
    if (phone.success && store) {
      const view = await store.lookup(parsed.data.reference, phone.data);
      if (view) {
        context = {
          consultationStatus: view.status,
          hasPublishedRegimen: Boolean(view.regimen),
        };
      }
    }
  }

  // Attach a completed Skin Analyzer observation, if referenced. getByReference
  // returns ONLY the customer-safe observation (feature/certainty/note/
  // limitations) — no storage path, signed URL, image id or internal field
  // exists on that object, so nothing private can reach the model. A wrong or
  // unknown reference simply yields no context.
  if (parsed.data.analysisReference) {
    const view = await getAnalysisStore().getByReference(parsed.data.analysisReference);
    if (view?.status === "completed" && view.observation) {
      const o = view.observation;
      context = {
        ...(context ?? {}),
        analysis: {
          imageQuality: o.image_quality,
          features: o.features
            .filter((f) => f.certainty !== "unclear")
            .map((f) => ({ label: FEATURE_LABELS[f.feature], certainty: f.certainty })),
          limitations: o.limitations,
        },
      };
    }
  }

  const outcome = await respond(parsed.data.messages as ChatTurn[], context);
  return NextResponse.json({ status: "ok", ...outcome });
}
