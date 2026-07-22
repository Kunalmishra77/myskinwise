# Sub-project 3 — Consultation, Payment & Expert Workflow

**Date:** 2026-07-22
**Status:** Specification only. **Not implemented.**
**Depends on:** Stage 2 (assessment) — complete; Supabase credentials — **missing**

---

## 1. Scope

Turns a completed Skin Check into revenue: result → consultation → ₹500 refundable deposit →
expert review → personalised regimen → order.

**Blocked on credentials.** Every table below needs a database. Stage 3 cannot begin until Supabase
credentials exist, because a payment flow with nowhere to record payments is worse than none.

## 2. Non-goals

AI photo analysis (Stage 5), voice (Stage 6), AI chat (Stage 4), a SKU catalogue (does not exist —
formulations are compounded per customer).

---

## 3. Flow

```
Assessment result
   → "Book a consultation"
   → choose a slot with a named expert
   → ₹500 deposit (refundable)
   → expert reviews the assessment before the call
   → expert call
   → expert verdict + regimen
   → order + delivery
   → refill
```

The deposit sits **after** the free result — moving it earlier was rejected in the platform spec
because CureSkin asks for nothing until the customer buys.

---

## 4. Data model — extends Stage 2, never duplicates it

Existing: `leads`, `assessments`, `assessment_answers`, `assessment_photos`, `photo_observations`,
`expert_assessments`, `regimen_recommendations`.

New:

```
experts            id, name, credentials, photo, active
booking_slots      id, expert_id, starts_at, duration_min, is_booked
consultations      id, assessment_id, expert_id, slot_id, status,
                   rescheduled_from, cancelled_at
payments           id, consultation_id, provider, provider_order_id,
                   provider_payment_id, amount_paise, currency, status,
                   refunded_at, refund_ref, idempotency_key
regimens           id, assessment_id, expert_review_id, created_by_expert,
                   am_steps jsonb, pm_steps jsonb, notes, duration_days
orders             id, regimen_id, status, shipped_at, tracking_ref
audit_log          id, actor_type, actor_id, action, subject_ref, at, meta
```

**`photo_observations` (AI) and `expert_assessments` (human) stay separate.** The regimen references
the *expert* row. That separation is what makes "AI guides, human decides" true in the data.

---

## 5. Payment — Razorpay

### Flow

1. Client asks the server to create an order. **Amount is set server-side.** Never trust a
   client-supplied amount.
2. Server creates a Razorpay order, writes a `payments` row as `created`, returns `order_id` only.
3. Client opens Razorpay checkout.
4. Client posts the handshake back. Server verifies
   `HMAC_SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)` against the signature.
5. Server marks `paid` **only after signature verification**.
6. The webhook is the authority. Client callbacks are a hint.

### Security requirements

- **Signature verification on both** the checkout handshake and the webhook
  (`X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET`).
- **Never mark paid from frontend state.** A client saying "payment succeeded" proves nothing.
- **Idempotency.** Webhooks retry. Key on `provider_payment_id` with a unique constraint; a repeat
  delivery must be a no-op, not a second booking or a second refund.
- **Replay protection.** Reject events whose timestamp is outside a tolerance window; store
  processed event ids.
- **Secrets server-only.** `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` never carry the
  `NEXT_PUBLIC_` prefix. Only the public key id reaches the browser.
- **Raw body for verification.** Compute the HMAC over the raw request body, before JSON parsing.
- **Audit log** every payment state transition with actor and timestamp.

### Refunds

₹500 is refundable if the customer declines after the call. Refund is expert- or admin-initiated,
never automatic, and writes `refunded_at` + `refund_ref`. Partial refunds are out of scope.

### Failure handling

Payment failed → consultation stays `pending_payment`, slot released after a hold window. Webhook
before callback → webhook wins. Callback without webhook → remain `pending_verification`; never
`paid`.

---

## 6. Appointments

Slot selection from `booking_slots` (only unbooked, future). Booking is transactional — a slot
cannot be double-booked under concurrency; enforce with a unique constraint on `slot_id` in
`consultations`, not application logic alone.

Rescheduling moves to a new slot and records `rescheduled_from`. Cancellation frees the slot and
triggers the refund decision path.

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
| Deposit paid | Utility | Includes reference and slot time |
| Appointment reminder | Utility | 24h and 1h before |
| Expert follow-up | Utility | Post-call summary |
| Result ready | Utility | Signed claim link, short-lived |

Result links are signed and expiring. No raw photo URLs, ever.

---

## 11. Definition of done

- [ ] Supabase credentials configured; Stage 2 persistence live and verified
- [ ] Razorpay signature verification on handshake and webhook, with tests
- [ ] Idempotent webhook proven by replaying the same event
- [ ] No payment marked paid without server verification, proven by test
- [ ] Slot double-booking impossible under concurrent requests, proven by test
- [ ] Expert access control enforced in middleware and at the data layer
- [ ] Audit log covers every payment and expert decision
- [ ] Refund path works end to end
- [ ] No secret reachable from the browser, verified by build scan
- [ ] E2E: result → book → pay (test mode) → expert review → regimen
