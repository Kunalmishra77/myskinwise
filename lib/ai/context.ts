import type { CustomerContext } from "@/lib/ai/assistant";
import { getCustomerStore } from "@/lib/consultation/customer";
import { getAnalysisStore } from "@/lib/analysis/storage";
import { contactSchema } from "@/lib/assessment/schema";
import { FEATURE_LABELS } from "@/lib/ai/vision-schema";

export type ContextRefs = {
  reference?: string;
  phone?: string;
  analysisReference?: string;
};

/**
 * Resolves the customer-safe context for the AI, from the same reference +
 * phone / analysis-reference model the whole funnel uses.
 *
 * Extracted so the text assistant and the voice agent share ONE
 * implementation of the privacy boundary — voice can never be handed
 * anything the text assistant wouldn't be. Everything returned here is
 * already customer-safe: consultation status, whether a regimen is
 * published, and the analyzer's visible-feature summary. Nothing internal
 * (expert notes, verdicts, audit, storage paths, signed URLs, image ids)
 * exists on any object this touches.
 *
 * A wrong phone, an unknown reference, or a not-yet-completed analysis all
 * simply contribute no context — never an error, never a leak.
 */
export async function resolveCustomerContext(refs: ContextRefs): Promise<CustomerContext | undefined> {
  let context: CustomerContext | undefined;

  if (refs.reference && refs.phone) {
    const phone = contactSchema.shape.phone.safeParse(refs.phone);
    const store = getCustomerStore();
    if (phone.success && store) {
      const view = await store.lookup(refs.reference, phone.data);
      if (view) {
        context = {
          consultationStatus: view.status,
          hasPublishedRegimen: Boolean(view.regimen),
        };
      }
    }
  }

  if (refs.analysisReference) {
    const view = await getAnalysisStore().getByReference(refs.analysisReference);
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

  return context;
}
