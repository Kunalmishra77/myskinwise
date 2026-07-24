# Stage 2 — completion report

**Date:** 2026-07-22
**Branch:** `feat/skinwise-stage-1-homepage-content`
**Readiness:** **Persistence verified. Production-ready pending deployment + credential rotation.**

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

## Resolved — the "stale validation message" was a test defect, not an app defect

An earlier revision of this document reported that the validation message could persist after the
user answered. **That was wrong, and the correction matters more than the original claim.**

Root cause, found by probing the live DOM rather than reasoning about the component: Next.js renders
a permanently-present, empty `role="alert"` element (the route announcer). The test asserted
`getByRole("alert").toHaveCount(0)`, which can therefore never pass — it was matching Next's
announcer, not the error message. The application was clearing the error correctly the whole time.

Measured: 2 alerts after a failed continue, 1 after answering — the survivor having empty text and
no class, i.e. the announcer.

The test now asserts on the message text itself and verifies it disappears the moment a valid answer
is selected. 10/10 passing.

Lesson recorded for future work: `getByRole("alert")` is unreliable as a count assertion in a
Next.js App Router app. Assert on content.

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

## Verified against the live database (2026-07-22)

| Check | Result |
|---|---|
| Schema migration applied | HTTP 201 — 4 tables, RLS enabled on all, 0 policies |
| Real submission | **HTTP 201, `status: stored`**, id `467f004b-…` |
| Lead persisted | name, phone, email |
| Assessment persisted | concern, skin type, consent, policy version |
| Answers persisted | 8 rows; multi-select correctly split into one row per value |
| Recommendation persisted | `engine_version: rules-1`, 4 ingredients, 2 fired rules |
| Anon SELECT × 4 tables | 200 but **empty** — RLS filters every row |
| Anon INSERT | **401 denied** |
| Anon DELETE | 204, but **0 rows affected** — row verified still present afterwards |
| Forced DB failure | **HTTP 200 `fallback`, `reason: "failed"`**, no assessment id, outline still returned |
| Orphan rows after failure | **none** — counts unchanged |

The failure path distinguishes `"failed"` (a real database error) from `"not-configured"` (no
credentials), so the two are not conflated in logs or metrics.

Rate limiting: 5 submissions per IP per 10 minutes, 64KB body cap. Service role key confirmed absent
from `.next/static`.

## Production blockers

0. **Credential rotation.** The service role key and a Supabase personal access token were both
   pasted into a chat transcript during development. Both must be rotated before launch, and
   production environment variables updated.
1. **The WordPress quiz is still broken.** All three URLs return HTTP 200 with zero forms and zero
   inputs, and the live homepage still links to all three. Every ad click is currently wasted.
   Requires wp-admin access — repair steps in `docs/migrations/wordpress-to-native-skin-check.md`.
2. ~~No Supabase credentials.~~ **Resolved.** Persistence is live and verified above. There is still
   no admin view for reading leads — the team currently sees them via WhatsApp only.
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
| Staging | ✅ Ready — persistence, RLS and failure degradation all verified |
| Production | ⚠️ **Code ready, not launchable** — needs credential rotation, deployment, and an admin view for the team to read leads |

Do not switch production CTAs to `/skin-check` until migration Phase F conditions are met.
