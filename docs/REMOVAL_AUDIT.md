# Phase 0 — Current Skin-Scan Audit

**Purpose:** map everything the *current* skin scan touches, so the new
deterministic engine (`skin-cv-service`) can replace it without breaking
anything. **Nothing is removed by this document.**

> **Sequencing decision (important).** The blueprint's Phase 0 removes the old
> scan immediately and shows "coming soon". We are **not** doing that. The
> current scan is live and being demoed to clients, and the new engine is not
> ready to replace it until Phase 6/7. Per the blueprint's own Section 10
> ("Do not compress Phase 2/3… ship the classical product first"), the current
> scan **stays live** and is swapped out only when `skin-cv-service` passes its
> Phase 6/7 acceptance. This file is the map for that later swap.

---

## 1. What the current scan is

A **single OpenAI vision call** (`gpt-4.1-mini`) that returns a validated
`Observation` (visible features + coarse region + prominence + certainty). It is
a *recognition/description* tool, not a *measurement* tool — which is exactly the
limitation the new engine exists to fix. Marker placement is anchored to a real
face via **client-side MediaPipe** (`face-detect.ts`), but the *what* and
*where* come from the LLM and are approximate.

---

## 2. Files, routes, tables

### Frontend (Next.js, stays on Vercel)
| Path | Role | Fate at swap |
|---|---|---|
| `app/skin-check/analyzer/page.tsx` | Route entry | **Keep** (route stays) |
| `app/skin-check/analyzer/analyzer.tsx` | Stage machine (lead → intro → preview → analyzing → result) | Rewire `analyze()` to call the new service |
| `app/skin-check/analyzer/scan-result.tsx` | Renders `Observation` | Rewrite to render `ScanResult` (scores + masks) |
| `components/analyzer/face-markers.tsx` | Marker overlay from `Observation` | Replace with server mask overlays |
| `components/analyzer/lead-gate.tsx` | Lead capture (NEW, keep as-is) | **Keep** |
| `components/analyzer/camera-capture.tsx` | Capture UI | Keep; add live quality HUD (Phase 2) |
| `lib/analysis/quality-gate.ts` | Client image-quality pre-check | Superseded by the service gate; keep as a cheap client hint |
| `lib/analysis/face-detect.ts` | Client MediaPipe geometry | Keep for capture UX only; measurement moves server-side |

### API + storage (Next.js)
| Path | Role | Fate at swap |
|---|---|---|
| `app/api/v1/analysis/route.ts` | POST scan; rate-limit; consent; `leadId` | Becomes a thin proxy to `skin-cv-service` |
| `lib/analysis/storage.ts` | Supabase writes + OpenAI call orchestration | Replaced by service call; keep the Supabase persistence half |
| `lib/ai/vision-provider.ts` | OpenAI vision provider | **Remove** at swap |
| `lib/ai/vision-schema.ts` | `Observation` zod schema | **Remove** at swap (after all consumers move to `ScanResult`) |
| `lib/analysis/retention.ts` | 90-day photo deletion (DPDP) | **Keep** — still required |

### External API calls
- **OpenAI** `chat.completions` (vision), via `lib/ai/vision-provider.ts`. This is
  the call the new engine removes from the measurement path.

### Database (Supabase) — migration `0004_skin_analysis.sql`
| Table | Keep? |
|---|---|
| `skin_analyses` (has `lead_id`, `reference`, `status`, consent) | **Keep** — add new score columns / or store `ScanResult` JSON |
| `skin_analysis_images` (private `skin-photos` bucket paths) | **Keep** |
| `skin_analysis_observations` (LLM output JSON) | **Keep as legacy**; new engine writes a separate `scan_results` shape |
| `skin-photos` storage bucket (private) | **Keep** |

**Stored user data in the old format:** rows in `skin_analysis_observations`
(LLM `Observation` JSON). These are archived, not migrated — the new engine's
scores are not comparable to the old descriptive output.

---

## 3. Where the `Observation` output shape is consumed

Every consumer that must be updated (or adapted) at swap time:

| Consumer | Uses | Migration note |
|---|---|---|
| `app/skin-check/analyzer/scan-result.tsx` | Full `Observation` | Rewrite for `ScanResult` |
| `components/analyzer/face-markers.tsx` | `features[].region/area` | Replace with server masks |
| `lib/ai/context.ts` → `resolveCustomerContext` | `analysis.features[]` summary for Riya | Adapt to summarise `ScanResult.concerns[]` |
| `app/api/v1/voice/route.ts` (explain) & `assistant/route.ts` | Analysis summary in prompt | Adapt via `context.ts` (single point) |
| `components/voice/voice-conversation.tsx` | `recommendConcern` from scan | Unchanged (concern slug still derived) |
| `lib/consultation/session.ts` | `analysisReference` handoff | **Unchanged** — reference id is transport-agnostic |
| `app/admin/consultations/[id]/workspace.tsx`, `lib/expert/*` | Reads `skin_analyses` rows | Keep; extend with scores |

**Key insight:** the *reference id* (`SW-XXXXXXXX`) and the `analysisReference`
session handoff are the integration seam. If the new service keeps producing a
reference and a customer-safe summary, the Voice/Chat/session wiring barely
changes — only the *result rendering* and the *stored shape* do.

---

## 4. Migration seam — `lib/skin/types.ts` (to add, no behaviour change)

Introduce the new `ScanResult` TypeScript type (mirrors the service's JSON) now,
so consumers can be migrated one at a time behind an adapter, with the old
`Observation` path untouched until the swap. TODO markers go at each consumption
site in section 3 when we start the swap (Phase 7), not before.

---

## 5. Nothing breaks checklist (for the eventual swap, not now)
- [ ] `skin-cv-service` passes Phase 6/7 acceptance
- [ ] `/api/v1/analysis` proxies to the service; keeps `leadId`, consent, rate limit
- [ ] `scan_results` persisted alongside (not replacing) `skin_analyses`
- [ ] `context.ts` summarises `ScanResult` for Riya
- [ ] `scan-result.tsx` renders scores + masks
- [ ] `retention.ts` still deletes photos on schedule
- [ ] Old `Observation` rows archived, `vision-provider.ts`/`vision-schema.ts` removed last
