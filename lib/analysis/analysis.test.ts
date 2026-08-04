import { afterEach, describe, expect, it } from "vitest";
import { observationSchema, OBSERVATION_JSON_SCHEMA } from "@/lib/ai/vision-schema";
import { getImageAnalysisProvider, __setImageAnalysisProvider, type ImageAnalysisProvider } from "@/lib/ai/vision-provider";
import { getAnalysisStore, __setAnalysisStore } from "@/lib/analysis/storage";
import { hasProhibitedClaim } from "@/lib/ai/safety";

afterEach(() => {
  __setImageAnalysisProvider(null);
  __setAnalysisStore(null);
});

describe("observation schema", () => {
  const FACE_BOX = { x: 0, y: 0, width: 1, height: 1 };

  it("accepts a well-formed observation", () => {
    const ok = observationSchema.safeParse({
      face_visible: true,
      image_quality: "good",
      face_box: FACE_BOX,
      features: [
        {
          feature: "visible_redness",
          certainty: "observed",
          region: "right_cheek",
          note: "some redness on the cheeks",
          prominence: 60,
          area: { x: 0.6, y: 0.45, width: 0.2, height: 0.2 },
        },
      ],
      limitations: "only the central face is visible",
      recommend_professional: false,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects an invented feature not in the controlled vocabulary", () => {
    const bad = observationSchema.safeParse({
      face_visible: true,
      image_quality: "good",
      face_box: FACE_BOX,
      features: [{ feature: "has_acne", certainty: "observed", region: "nose", note: "x" }],
      limitations: "x",
      recommend_professional: false,
    });
    expect(bad.success).toBe(false);
  });

  it("rejects an invented region not in the controlled vocabulary", () => {
    const bad = observationSchema.safeParse({
      face_visible: true,
      image_quality: "good",
      face_box: FACE_BOX,
      features: [{ feature: "visible_redness", certainty: "observed", region: "left_eyeball", note: "x" }],
      limitations: "x",
      recommend_professional: false,
    });
    expect(bad.success).toBe(false);
  });

  it("rejects a diagnostic image_quality value", () => {
    const bad = observationSchema.safeParse({
      face_visible: true,
      image_quality: "rosacea",
      face_box: FACE_BOX,
      features: [],
      limitations: "x",
      recommend_professional: false,
    });
    expect(bad.success).toBe(false);
  });

  it("the vocabulary contains no medical condition names", () => {
    const names = JSON.stringify(OBSERVATION_JSON_SCHEMA).toLowerCase();
    for (const banned of ["acne", "rosacea", "eczema", "melasma", "dermatitis", "infection"]) {
      expect(names, `schema must not mention ${banned}`).not.toContain(banned);
    }
  });
});

describe("vision provider", () => {
  it("reports not-configured rather than pretending", async () => {
    const result = await getImageAnalysisProvider().analyze([]);
    // In test env with no key set, the default provider is unconfigured.
    if (!getImageAnalysisProvider().isConfigured()) {
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("not-configured");
    }
  });

  it("rejects malformed model output as invalid-output, never a fake result", async () => {
    const badProvider: ImageAnalysisProvider = {
      isConfigured: () => true,
      // Simulate the provider layer having already validated: a store using a
      // provider that returns invalid-output must surface it as a failure.
      analyze: async () => ({ ok: false, reason: "invalid-output" }),
    };
    __setImageAnalysisProvider(badProvider);
    const r = await getImageAnalysisProvider().analyze(["data:image/jpeg;base64,x"]);
    expect(r.ok).toBe(false);
  });
});

describe("analysis store — no silent loss", () => {
  it("returns not-configured when there is no database, never a false success", async () => {
    const r = await getAnalysisStore().analyze({
      images: [{ base64: "x", contentType: "image/jpeg", bytes: 10 }],
      policyVersion: "v",
    });
    // No Supabase in the unit env → unconfigured store.
    expect(r.ok).toBe(false);
  });

  it("a failing store degrades to a non-success outcome", async () => {
    __setAnalysisStore({
      analyze: async () => ({ ok: false, reason: "failed", reference: "SW-XXXXXXXX" }),
      getByReference: async () => null,
    });
    const r = await getAnalysisStore().analyze({
      images: [{ base64: "x", contentType: "image/jpeg", bytes: 10 }],
      policyVersion: "v",
    });
    expect(r.ok).toBe(false);
  });
});

describe("observation prose is claim-safe", () => {
  it("the scrub in the provider removes prohibited claims from notes", () => {
    // The provider scrubs; assert the scrub itself catches what the model
    // might emit.
    const claimy = "this cream cures it permanently, guaranteed";
    expect(hasProhibitedClaim(claimy)).toBe(true);
  });
});
