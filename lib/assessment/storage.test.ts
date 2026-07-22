import { afterEach, describe, expect, it } from "vitest";
import {
  __setAssessmentStorage,
  getAssessmentStorage,
  type AssessmentStorage,
} from "@/lib/assessment/storage";
import { buildRegimenOutline } from "@/lib/assessment/recommend";
import type { SubmitAssessmentInput } from "@/lib/assessment/schema";

const input: SubmitAssessmentInput = {
  concern: "acne",
  answers: { concern: "acne", skin_type: "oily", severity: "mild" },
  contact: { name: "Test Person", phone: "9876543210" },
  consent: { contactConsent: true, policyVersion: "2026-07-21" },
};

/** Stands in for the Supabase adapter until real credentials exist. */
class FakeStoredStorage implements AssessmentStorage {
  isConfigured() {
    return true;
  }
  async save() {
    return {
      ok: true as const,
      assessment: { id: "asmt_test_123", createdAt: new Date(0).toISOString() },
    };
  }
}

class FailingStorage implements AssessmentStorage {
  isConfigured() {
    return true;
  }
  async save() {
    return { ok: false as const, reason: "failed" as const };
  }
}

afterEach(() => __setAssessmentStorage(null));

describe("storage adapter", () => {
  it("reports not-configured rather than pretending to store", async () => {
    const result = await getAssessmentStorage().save(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not-configured");
  });

  it("never reports success when it cannot persist", async () => {
    // The defect this whole design exists to prevent: the live WordPress
    // funnel returns HTTP 200 while capturing nothing. A storage layer must
    // never resolve `ok: true` without something actually being written.
    for (const storage of [new FailingStorage(), getAssessmentStorage()]) {
      __setAssessmentStorage(storage);
      const result = await getAssessmentStorage().save(input);
      expect(result.ok).toBe(false);
    }
  });

  it("returns an assessment id on the persisted path", async () => {
    __setAssessmentStorage(new FakeStoredStorage());
    const result = await getAssessmentStorage().save(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.assessment.id).toBeTruthy();
      expect(result.assessment.createdAt).toBeTruthy();
    }
  });
});

describe("the two submission paths stay distinct", () => {
  // Mirrors the route handler's branch so the contract is asserted even
  // without booting a server: `stored` carries an id, `fallback` never does.
  function decide(result: Awaited<ReturnType<AssessmentStorage["save"]>>) {
    const outline = buildRegimenOutline(input);
    return result.ok
      ? { status: "stored" as const, assessmentId: result.assessment.id, outline }
      : { status: "fallback" as const, reason: result.reason, outline };
  }

  it("produces a result outline on BOTH paths, so the user is never left empty-handed", async () => {
    const stored = decide(await new FakeStoredStorage().save());
    const fallback = decide(await getAssessmentStorage().save(input));

    expect(stored.outline.ingredients.length).toBeGreaterThan(0);
    expect(fallback.outline.ingredients.length).toBeGreaterThan(0);
  });

  it("only the stored path carries an assessment id", async () => {
    const stored = decide(await new FakeStoredStorage().save());
    const fallback = decide(await getAssessmentStorage().save(input));

    expect(stored.status).toBe("stored");
    expect("assessmentId" in stored && stored.assessmentId).toBeTruthy();

    expect(fallback.status).toBe("fallback");
    expect("assessmentId" in fallback).toBe(false);
  });

  it("a persistence failure degrades to fallback, never to a false success", async () => {
    __setAssessmentStorage(new FailingStorage());
    const outcome = decide(await getAssessmentStorage().save(input));
    expect(outcome.status).toBe("fallback");
  });
});
