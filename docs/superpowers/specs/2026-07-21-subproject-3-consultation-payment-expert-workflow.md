# Sub-project 3 — Consultation, Expert Workflow & Regimen

**Date:** 2026-07-22
**Status:** Specification only. **Not implemented.**
**Depends on:** Stage 2 (assessment) — complete and **persistence verified**

---

## 1. Scope

Turns a completed Skin Check into a booked conversation: result → consultation request →
structured WhatsApp handoff → expert review → personalised regimen → order.

Supabase persistence is live and verified (201 stored, RLS confirmed, failure degradation
confirmed), so Stage 3 is unblocked.

## 2. Non-goals

AI photo analysis (Stage 5), voice (Stage 6), AI chat (Stage 4), a SKU catalogue (does not exist —
formulations are compounded per customer).

---

## 3. Flow

```
Assessment result
   → "Continue with Skinwise"
   → choose a consultation type
   → structured WhatsApp handoff (team arranges the call)
   → expert reviews the assessment
   → expert verdict + regimen
   → order + delivery
   → refill
```

No money changes hands anywhere in this flow. The customer receives their guidance free, then
talks to a person.

---

## 4. Data model — extends Stage 2, never duplicates it

Existing: `leads`, `assessments`, `assessment_answers`, `assessment_photos`, `photo_observations`,
`expert_assessments`, `regimen_recommendations`.

New:

```
experts            id, name, credentials, photo, active
consultations      id, assessment_id, expert_id, reference, status,
                   preferred_time, payment_status, payment_ref,
                   requested_at, closed_at
regimens           id, assessment_id, expert_review_id, created_by_expert,
                   am_steps jsonb, pm_steps jsonb, notes, duration_days
orders             id, regimen_id, status, shipped_at, tracking_ref
audit_log          id, actor_type, actor_id, action, subject_ref, at, meta
```

**`photo_observations` (AI) and `expert_assessments` (human) stay separate.** The regimen references
the *expert* row. That separation is what makes "AI guides, human decides" true in the data.

---

## 5. Consultation handoff — WhatsApp, not payment

**Razorpay and the ₹500 deposit are OUT of scope for this stage.** The business does not have a
working payment gateway today, and building a payment state machine, webhook verification, replay
protection and a refund workflow for a gateway nobody is using would be the largest and riskiest
part of Stage 3 built on a hypothetical.

Instead, choosing a consultation produces a **structured WhatsApp handoff** — the same mechanism
already proven by the Stage 2 assessment fallback, which works and which the team already monitors.

### Flow

```
Result  →  "Continue with Skinwise"  →  choose a consultation type
        →  consultation row written (status: requested)
        →  WhatsApp opens, pre-filled with a structured summary
        →  team replies and arranges the call manually
        →  expert review  →  verdict  →  regimen
```

### What the handoff message carries

Reuses `lib/assessment/whatsapp.ts`, which is already tested for exactly this:

- Consultation reference (quotable by both sides)
- Name and phone
- Main concern and skin type
- Safety-relevant answers pulled to the top (pregnancy, dermatologist history)
- The rules-engine outline
- **Never**: photo URLs, storage hosts, key material. Deep links land in browser history, OS share
  sheets and clipboard managers.

### The payment boundary, preserved for later

Consultation state deliberately keeps a payment seam so Razorpay can be added without redesign:

```
consultations.payment_status  'not_required' | 'pending' | 'paid' | 'refunded'
consultations.payment_ref     null for now
```

Today every consultation is written `not_required`. When a gateway exists, a `PaymentProvider`
interface slots in between "choose consultation" and "confirmed" — the consultation lifecycle,
expert workflow, regimen and order stages are unaffected because none of them read payment state to
function. **Nothing else in this spec assumes payment exists.**

The security requirements previously drafted here (signature verification, webhook idempotency,
replay protection, server-set amounts, never trusting frontend payment state) are retained verbatim
in `docs/superpowers/specs/future-payment-integration.md` so they are not lost when the gateway
lands.

## 6. Scheduling — deliberately not built

There is no calendar system and no published expert availability, so **no slot picker is shown**.
Inventing appointment times the business cannot honour would be exactly the kind of fake
functionality this project forbids.

The customer states a rough preference (`preferred_time`: morning / afternoon / evening / anytime)
which travels in the handoff message, and the team confirms the actual time on WhatsApp.

`booking_slots` is intentionally absent from the schema. When a real calendar provider exists, add
it behind a `SchedulingProvider` interface — consultations already carry their own status, so
nothing downstream changes.

---

## 7. Expert workflow

Expert-only surface, access-controlled:

1. Queue of assessments awaiting review, oldest first, safety flags surfaced first.
2. Case view: answers, safety-relevant answers pinned, rules-engine outline, photos if present.
3. Expert writes notes, records agreement or disagreement with the outline, and composes the regimen.
4. Nothing reaches the customer until the expert marks it reviewed.

**Access control:** expert routes require an authenticated expert role, enforced in middleware *and*
again at the data layer (RLS). Customers can never read another customer's assessment; experts see
only assigned cases.

---

## 8. Regimen

Built by the expert from the ingredient content, expressed as AM/PM steps with instructions and a
duration (15/30/45-day plans). **No SKU catalogue is invented** — a regimen references ingredients
and a plan length, and the physical formulation is compounded per customer.

---

## 9. Orders

Only what the business actually does: regimen approved → order created → fulfilled manually →
shipped with a tracking reference → refill prompt at plan end. No cart, no self-serve storefront.

---

## 10. WhatsApp (Gupshup)

| Trigger | Template type | Notes |
|---|---|---|
| Assessment received | Utility | Free inside the 24h service window |
| Consultation requested | Utility | Includes reference |
| Appointment reminder | Utility | 24h and 1h before |
| Expert follow-up | Utility | Post-call summary |
| Result ready | Utility | Signed claim link, short-lived |

Result links are signed and expiring. No raw photo URLs, ever.

---

## 11. Definition of done

- [x] Stage 2 persistence live and verified
- [ ] Consultation request persists, with a reference the customer can quote
- [ ] WhatsApp handoff carries the structured summary and no photo URL, proven by test
- [ ] Duplicate consultation requests for one assessment do not create duplicate rows
- [ ] Expert access control enforced in middleware and at the data layer
- [ ] Audit log covers every expert decision
- [ ] Regimen creation works and is visible to the customer only after expert sign-off
- [ ] No secret reachable from the browser, verified by build scan
- [ ] E2E: result → request consultation → WhatsApp handoff → expert review → regimen
