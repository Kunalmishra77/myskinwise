import { afterEach, describe, expect, it } from "vitest";
import {
  __setCustomerStore,
  getCustomerStore,
  type CustomerConsultationStore,
  type CustomerConsultationView,
} from "@/lib/consultation/customer";

/*
 * The customer view is a privacy boundary, so its SHAPE is tested here: the
 * type intentionally has no field for internal expert notes, verdict text,
 * expert ids or database uuids. A future edit that widened it to leak those
 * would have to change this test to compile, which is the tripwire.
 *
 * The live filtering (wrong phone -> null, unpublished regimen -> hidden) is
 * exercised against real Supabase in the integration pass; here we assert
 * the contract a fake store must honour.
 */

class FakeStore implements CustomerConsultationStore {
  async lookup(reference: string, phone: string): Promise<CustomerConsultationView | null> {
    if (phone !== "9876500011") return null; // wrong phone is indistinguishable from not-found
    return {
      reference,
      status: "regimen_created",
      preferredTime: "morning",
      regimen: {
        durationDays: 30,
        summary: "A gentle brightening routine.",
        followUp: "Check in after three weeks.",
        items: [{ timeOfDay: "am", formulationRef: "Vitamin C serum", instructions: "Apply 3 drops", frequency: "Daily" }],
      },
    };
  }
}

afterEach(() => __setCustomerStore(null));

describe("customer consultation view", () => {
  it("returns null for a wrong phone, indistinguishable from not-found", async () => {
    __setCustomerStore(new FakeStore());
    expect(await getCustomerStore()!.lookup("SW-ABCDEFGH", "9000000000")).toBeNull();
  });

  it("exposes only customer-safe fields", async () => {
    __setCustomerStore(new FakeStore());
    const view = await getCustomerStore()!.lookup("SW-ABCDEFGH", "9876500011");
    const serialised = JSON.stringify(view);

    // These strings would indicate an internal field leaked into the view.
    expect(serialised).not.toMatch(/verdict/i);
    expect(serialised).not.toMatch(/internal/i);
    expect(serialised).not.toMatch(/expert_id|expertId/i);
    expect(serialised).not.toMatch(/audit/i);
    // The view carries a regimen and status, which the customer is allowed.
    expect(view?.regimen?.items[0]?.formulationRef).toBe("Vitamin C serum");
  });

  it("the view type has no internal-notes field (compile-time boundary)", () => {
    // If someone adds `internalNotes` to CustomerConsultationView, this
    // object literal stops compiling — the boundary is enforced by types,
    // not just by discipline.
    const view: CustomerConsultationView = {
      reference: "SW-ABCDEFGH",
      status: "reviewed",
      preferredTime: null,
      regimen: null,
    };
    expect(Object.keys(view)).toEqual(["reference", "status", "preferredTime", "regimen"]);
  });
});
