# Stage 2 — completion report

**Date:** 2026-07-22
**Branch:** `feat/skinwise-stage-1-homepage-content`
**Readiness:** **Staging ready. NOT production ready.**

---

## Completed

| Area | State |
|---|---|
| Assessment data model | `content/assessment/types.ts` |
| Question migration from all 3 WordPress quizzes | 17 questions, nothing meaningful dropped |
| "Why is it important?" explainer | Preserved as a **required** field on every question |
| Client validation | Zod, shared schema |
| Server validation | Authoritative; rejects unknown question ids |
| Storage adapter | No-silent-loss contract |
| Submit API | `POST /api/v1/assessments/submit` |
| Recommendation engine | Rules over brand content, never an LLM |
| Safety rules | Hard exclusions (pregnancy, sensitive skin) + doctor escalation |
| Native stepper UI | Mobile-first, one question per screen |
| Result page | Explicitly non-diagnostic |
| WhatsApp fallback | Structured lead hand-off + copy-to-clipboard alternative |
| Privacy of hand-off | No photo URLs, no storage hosts, no key material |
| E2E tests | 10/10 passing, both viewports |

### Verification

```
unit + integration   24 files / 97 tests   PASS
storage + engine     18 tests              PASS
skin-check E2E       10 / 10               PASS  (chromium + mobile-chrome)
typecheck                                  PASS
lint                                       PASS
production build                           PASS
build-freshness      linked CSS hash == disk hash, 200
```

The build-freshness check is not ceremony. An orphaned `next start` holding port 3000 caused a
**false pass earlier in this project** — tests ran against a stale build serving no CSS at all. Every
result above was taken against a server confirmed to serve the current build.

---

## Known issue — not fixed, not hidden

**Validation message can persist after the user answers.** On the first question, if the user tries
to continue without answering and then answers, the "Please choose an answer" message can remain
visible even though the answer is accepted and progress is unblocked.

- **Impact:** cosmetic and confusing, not blocking. The user can complete the assessment.
- **Investigated:** `setAnswer` clears error state unconditionally, and the fix is present in the
  running build, yet the alert still renders. Something else re-renders it; the cause was not
  identified before Stage 2 closed.
- **Test status:** `tests/e2e/skin-check.spec.ts` asserts the functional requirement (the user can
  proceed) and documents this gap in a comment rather than weakening the assertion silently.
- **Recommended:** fix before the native funnel takes production traffic (migration Phase F).

---

## Deferred, with reasons

**Photo upload UI — deferred to Stage 5.** This is a decision, not an oversight.

The question model, validation rules (`PHOTO_RULES`: 8MB, JPEG/PNG/WebP, max 3) and the 90-day
retention policy all exist. The UI does not, because:

1. Photos are **optional** in this flow, so the assessment is complete and usable without it.
2. Photos have no consumer yet. AI analysis is Stage 5 and expert review tooling is Stage 3 —
   uploading images that nothing reads adds DPDP exposure with no offsetting benefit.
3. Storing face photos requires the Supabase bucket that does not yet exist.

Experts currently receive photos over WhatsApp, as they do today. Building upload before there is
somewhere secure to put them and someone to read them would be premature.

**Analytics — deferred.** The project has no analytics system, and the instruction was not to add a
paid service for Stage 2. Event names are specified in the Stage 3 spec for when one exists.

**Concern URL migration to `/concerns/*`** — specced in Stage 1, still not built. Those URLs carry
live ad traffic and a botched redirect costs more than the tidier URL earns.

---

## Production blockers

1. **The WordPress quiz is still broken.** All three URLs return HTTP 200 with zero forms and zero
   inputs, and the live homepage still links to all three. Every ad click is currently wasted.
   Requires wp-admin access — repair steps in `docs/migrations/wordpress-to-native-skin-check.md`.
2. **No Supabase credentials.** Every submission takes the fallback path. The user still reaches the
   team via WhatsApp, but there is no database record and no admin view.
3. **Not deployed.** This repository does not serve `myskinwise.com`. Nothing built here is reachable
   by a customer yet.

---

## Persistence readiness

The adapter is production-ready pending credentials:

- Reads `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  from the environment.
- The service role key is server-only — the submit route is `runtime: "nodejs"` and the key is never
  referenced from a client component.
- `.env` is untracked; `.env.example` carries placeholder names only.
- A secret scan across the tree found no key material.
- Tests assert both paths and that a persistence failure **degrades to fallback, never to a false
  success**.

**Exact next action:** supply `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`, then implement `SupabaseAssessmentStorage` at the marked TODO in
`lib/assessment/storage.ts`. No UI change is required.

---

## Readiness verdict

| Environment | Verdict |
|---|---|
| Development | ✅ Ready |
| Staging | ✅ Ready |
| Production | ❌ **Not ready** — no persistence, not deployed, not verified in production |

Do not switch production CTAs to `/skin-check` until migration Phase F conditions are met.
