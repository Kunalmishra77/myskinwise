# Skinwise Platform Architecture

**Date:** 2026-07-21
**Status:** Design approved, pending written-spec review
**Supersedes:** nothing. Extends `PROJECT_BLUEPRINT.md` (Sub-project A scope) and `docs/superpowers/specs/2026-07-20-ai-homepage-spec.md`.

This is the umbrella architecture for turning the Skinwise marketing site into a mobile-first,
AI-assisted skincare platform. It is deliberately **not** an implementation plan — each sub-project
gets its own spec and plan. Sub-project 0's spec is
`docs/superpowers/specs/2026-07-21-subproject-0-foundation-design.md`.

---

## 1. Audit of the existing project

### 1.1 What exists today

A Next.js 16 / React 19 / TypeScript-strict / Tailwind v4 **static marketing site**. Nine routes, no
database, no auth, no runtime API calls, no AI, no commerce. Plus uncommitted work-in-progress: a new
AI-themed homepage (`app/page.tsx`, `components/home/`) whose sections are currently placeholder stubs,
which deleted `app/(marketing)/page.tsx`.

### 1.2 Keep

- **The stack.** Next.js 16 App Router + RSC, TS `strict` + `noUncheckedIndexedAccess`. No rewrite warranted.
- **The `config/` + `content/` content layer.** All copy and data typed and centralised; components take
  props and never hardcode. This is the seam a future CMS plugs into.
- **`content/assets.ts`.** Every image declared once with real intrinsic dimensions and written alt text.
- **`config/seo.ts`.** `buildMetadata()`, `organizationSchema`, `JsonLd`, generated sitemap and robots.
- **`ConcernPageTemplate` + `ConcernContent`.** Adding a concern is a data-only change.
- **The no-invented-content discipline.** `TODO(client-confirm)` markers, honest empty states, section
  omission over invention. This must survive into the AI phases.
- **`Assets/WEBSITE_CONTENT.md`.** The complete page-by-page WordPress export; the real content source.
- **`components/features/navbar.tsx` accessibility work.** Focus trap, `inert`, correct ARIA, scroll
  lock, focus restoration. Carried into the new app shell.

### 1.3 Improve

1. **The design system has forked in two.** `app/globals.css` carries two palettes (`--color-*` vs
   `--color-hp-*`), two rose scales, two blush values, two font pairings, two shadow systems. The
   homepage and the rest of the site are visually different products.
2. **Two component libraries.** `components/ui/` and `components/home/ui/` both define Button, Card,
   Accordion, Reveal, Eyebrow. `components/features/{navbar,footer}` and
   `components/home/sections/{nav,footer}` are duplicate chrome.
3. **Navigation is desktop-shaped** — a hover dropdown plus a mobile sticky call/WhatsApp bar. No
   app-like mobile shell.
4. **Content is trapped.** The richest SEO material (ingredient science, skin-zone map, AM/PM routines)
   sits inside concern pages with no hub of its own.

### 1.4 Remove

- **Desktop-only decoration on a mobile-first product:** `cursor-glow`, `film-grain` (fixed
  full-viewport SVG turbulence), `magnetic-button`, animated `gradient-mesh` drift. Pointer-only or
  full-viewport paint layers, on majority-mobile Indian traffic. The static gradient-mesh *look* is
  kept as a CSS background; only the animation goes.
- Duplicate nav, footer and UI primitives.
- Next.js scaffold leftovers: `public/{next,vercel,file,globe,window}.svg`.
- `Assets/Copy-of-INVOICE-AA24-2523-*.jpg` (five scanned invoices) and the
  `Find-Trusted-Maids-*` banners — unrelated business material that should not be in this repo.
- `Assets.zip` (10.9 MB, untracked) — gitignore before it enters history.
- ~90 redundant `public/images/brand/` variants (same image at `-1536x864`, `-2048x1024`, `-scaled`);
  `next/image` makes them unnecessary.

### 1.5 Rebuild

Homepage (currently stubs) · navigation → mobile app shell · `/quiz/[concern]` (currently a stub
route) · the unified design system.

### 1.6 New

Backend, database, storage, assessment engine, booking, payments, orders, AI assistant, photo
observation pipeline, admin, and eventually voice.

### 1.7 Verified defects

| Defect | Evidence |
|---|---|
| **~half the test suite cannot run** | 25 `.test.ts(x)` files exist; `npm run test` reports `Test Files 13 passed (13)` with `12 errors` — `[vitest-pool]: Failed to start forks worker` / `Timeout waiting for worker to respond`. Cause: `vitest.config.ts` sets no `pool`, defaulting to `forks`; forked workers + jsdom + Windows exceed the default startup timeout. Duration 252s. |
| Typecheck | Clean — `npx tsc --noEmit` passes. |

Any CI signal from the current test suite is false comfort until this is fixed.

---

## 2. Findings that reshaped the brief

### 2.1 There is no product catalogue, and there cannot be one

Skinwise does not sell SKUs. Per `Assets/WEBSITE_CONTENT.md` §5, §8, §11, the products shown on the
old site carry an explicit on-page disclaimer:

> "This is just a demo product; the actual product will be customised with ingredients according to
> your skin type and concern."

"Pigmentation Cleanser", "Acne Gel", "SPF-30" are illustrative placeholders. The real product is a
**compounded, per-customer formulation decided on a phone call**. There is no SKU list, no per-product
price, no per-product ingredient list, no stock.

**Consequence:** the object model is `Concern → Assessment → Regimen Plan → Consultation → Custom
Formulation → Order → Refill`, not `Product → Cart`. Catalogue, search, filters, comparison, wishlist
and priced PDPs are struck from scope.

### 2.2 The funnel is deposit-first, not cart-first

Confirmed from the WooCommerce export: quiz → regimen tiers (15/30/45-day) → "Yes, I am Interested" →
Book Appointment (date, time, name, phone) → **₹500 refundable advance** → expert call → formulation →
plan purchase → shipping. The ₹500 is refunded if the customer declines.

### 2.3 The brand currently advertises "No AI Based"

`public/images/brand/safety-badges-{row,grid}.jpg` show four badges: *Clinically Proven,
Dermatologist-Tested, **No AI Based**, Cruelty-Free* (visually confirmed). Current positioning is
explicitly "a human expert, not an algorithm."

### 2.4 Face photos are already collected

All three source quizzes include *"Upload your face image — right + left side images"*. Photo capture
is **not** a new feature; experts already review these manually. The AI work automates an existing
step rather than introducing a new data ask — but the existing collection has no consent architecture,
no retention policy and no deletion path, and the privacy policy also collects *"Previous Medical
History"* and *"Present Ailments."*

### 2.5 The source quizzes have a pattern worth preserving

Every question carries a **"why is it important?"** explainer. This is a strong trust device and is
made a first-class part of the new assessment.

---

## 3. Competitive analysis — CureSkin

Benchmarked 2026-07-21. Their branding, headlines, taglines, SKU names and claim wording are their
IP and are not reused.

### 3.1 Their model

Free AI photo analysis → free **asynchronous** dermatologist chart review → pay in full for a
physical treatment kit (~₹1,499–1,700, stated inconsistently across their own pages) → free ongoing
follow-ups bundled in. Reorders are manual, not auto-billed. Refunds are 7-day, defect-only,
outcome-blind.

### 3.2 The exploitable gap

**Their entire product is gated behind an app install.** Every primary CTA on cureskin.com
307-redirects to the Play Store. There is no web quiz, no web photo upload, no lead capture on their
website at all. A web-first assessment that works immediately in a browser is a structural advantage,
and it validates building app-grade UX *on the web* rather than shipping a native app first.

### 3.3 Where their money sits versus ours

| | CureSkin | Skinwise (before this design) |
|---|---|---|
| AI analysis | Free | — |
| Expert review | Free (async chart review) | ₹500 first |
| First payment | Full kit price | ₹500 deposit, then plan |
| Live human call | Never | Yes |
| Refunds | 7 days, defects only | Fully refundable, no questions |

They ask for zero money before showing a personalised recommendation. **This design moves the ₹500
after the free result** (§5.3) to remove friction at the highest-drop-off point, while keeping the
no-show protection the deposit exists for.

### 3.4 The trap to avoid

Their marketing says *"Dermatologist Given Prescription Treatment"* and *"FDA-approved medicated
products"*, while their Terms state *"Nothing transmitted to or from this App constitutes the
establishment of a doctor-patient relationship"* and *"not intended to be a substitute for
face-to-face professional advice, diagnosis, or treatment."* That gap between the sell and the fine
print is a liability. "FDA-approved" is dubious for an India-market product.

**Skinwise's marketing and legal copy must say the same thing.** That alignment is a differentiator,
not just hygiene.

### 3.5 Other beatable weaknesses

Their own numbers contradict across their own pages — doctor count (40+/50+/100+), starting price
(₹1,499/₹1,600/₹1,700), AI attributes (68/2,000). Their homepage chatbot is menu-driven with five
canned topic buttons. Their headline efficacy claim ("98% saw visible results") rests on an unnamed
"internal study."

---

## 4. Decisions

| # | Decision | Outcome |
|---|---|---|
| 1 | Commerce model | Consultative funnel. No catalogue, no cart. |
| 2 | AI positioning | AI guides, human expert decides. |
| 3 | ₹500 deposit | Moved after the free result; books a named expert's slot. |
| 4 | Design system | Unified. Homepage palette + Cormorant/Manrope win the merge. |
| 5 | Navigation | 4-tab mobile shell, raised centre "Skin Check". |
| 6 | IA | 3 concerns + 6 ingredient + 4 skin-type pages. |
| 7 | Data model | AI observation and expert verdict in separate tables. |
| 8 | Accounts | None at launch; signed claim link delivered over WhatsApp. |
| 9 | Photo retention | Auto-delete 90 days post-call; opt-in to keep. |
| 10 | Photo analysis | Expert-gated — nothing unreviewed reaches the user. |
| 11 | Vision provider | Anthropic (terms of service match the architecture). |
| 12 | Chatbot | Prompt-stuffing + caching. No RAG. |
| 13 | Voice | Deferred to SP6. Cascaded Deepgram → LLM → ElevenLabs. |
| 14 | Payments | Razorpay. |
| 15 | Messaging | WhatsApp via Gupshup BSP, SMS fallback, email for receipts. |
| 16 | Compliance target | DPDP-ready by November 2026. |

---

## 5. Product architecture

### 5.1 Design system

One token set, no `hp-` prefix (that prefix existed only to prevent collisions during the fork).

| Concern | Source | Rationale |
|---|---|---|
| Rose scale | Homepage — `rose #E0819A` / `rose-deep #C05E78` / `rose-ink #A8506A` | 3-step ramp beats 2-step. Both forks independently derived the same constraint: the mid rose fails WCAG AA with white text and needs a darker companion for fills. That constraint survives the merge. |
| Neutrals | Homepage — `warm #FBFAF7`, `ink #241C19`, `ink-soft`, `ink-mute` | Warm off-white + 3-step ink ramp. The marketing `canvas #FDECEF` reads as a tint error. |
| Type families | Homepage — Cormorant Garamond + Manrope | Cormorant's italic is the brand's expressive asset. |
| Type scale | Marketing — `clamp()` display/h2 tokens | Fluid scale is the better technique; port it onto the homepage families. |
| Accents | Homepage — `champagne`, `sage`, `plum` | The marketing side has no accent range. |

Components merge to one library: `Button` (variants `primary | dark | glass | outline | whatsapp`,
sizes `sm | md | lg`), `Card`, `Accordion`, `Reveal`, `Eyebrow`, `Section`, `Tabs`, `Badge`, `Pill`,
`Marquee`, `CountUp`. Both existing Buttons already hand-roll the same `asChild` slot to avoid a Radix
dependency — that approach is kept.

### 5.2 App shell

```
MOBILE (primary)                    DESKTOP (>=1024px)

+-------------------------+         +----------------------------------+
| =   [logo]        chat  | 56px    | [logo]  Concerns Science About    |
+-------------------------+         |              [Talk to us][Start]  |
|                         |         +----------------------------------+
|      page content       |         |                                  |
|                         |         |        page content              |
+-------------------------+         |        (max-width, spacious)     |
|  Home Concerns  Skin  Me| 64px    +----------------------------------+
|              Check      |
+-------------------------+           Bottom nav is mobile-only.
   ^ safe-area inset                  Desktop keeps a top bar.
```

Four tabs. **Skin Check is centre and visually raised** — it is the primary conversion action, so it
gets the most reachable position and the most weight. `Me` is a session-scoped stub until SP3.

Two structural rules:
- **The bottom nav replaces the mobile sticky call/WhatsApp bar.** Two fixed bottom bars would consume
  120px of a 667px viewport. WhatsApp moves to the header's right slot.
- **No bottom nav inside the assessment.** The Skin Check runs full-screen with its own progress header
  and back control. Competing chrome depresses funnel completion.

### 5.3 Information architecture

```
FUNNEL                      CONTENT                       TRUST
/                           /concerns                     /about
/skin-check                 /concerns/pigmentation        /results   (consent-gated)
/skin-check/result          /concerns/acne                /contact
/book                       /concerns/ageing-and-texture  /help
/me            (stub)       /ingredients                  /legal/*
                            /ingredients/[slug]   x6
                            /skin-types/[slug]    x4
                            /routines
```

**Why not six concern pages.** `/other-issues` contains six distinct concerns (wrinkles, fine lines,
dull skin, dark spots, open pores, dark circles) and currently has `causes: []` because the source
page copy-pasted Acne's causes onto it. Splitting yields roughly three ingredients and one definition
per page — thin content. Instead:

| Hub | Pages | Existing content backing it |
|---|---|---|
| `/ingredients/[slug]` | 6 | Vitamin C, Niacinamide, Salicylic Acid, Kojic Acid, Retinol, Alpha Arbutin — each already has a professional photograph and a written benefit statement in `content/assets.ts`, plus concern and skin-type mappings across all three concern files. |
| `/skin-types/[slug]` | 4 | Dry, Oily, Combination, Sensitive — each has a real, differentiated 4-ingredient regimen in the source content. |
| `/concerns/[slug]` | 3 | `other-issues` renamed to `ageing-and-texture`, its four types as on-page sections. 301 from the old path. |

13 content-backed pages instead of 6 thin ones. Ingredient and skin-type queries are also what people
search *before* they know what their concern is called.

`/routines` is backed by the unpublished `other-issues-all-skin-care-19-june` draft, which contains a
full AM/PM regimen structure markedly better than the live page.

### 5.4 The funnel

```
Entry: home / concern page / ingredient page / ad
   |
   v
/skin-check  (full-screen, no chrome, progress header)
   1  Concern              one tap, no typing
   2  Skin type            each step carries "why we ask"
   3  Duration + history
   4  Lifestyle / health flags
   5  Photos (optional)    already in the current funnel
   6  Contact (name + WhatsApp)
   |
   v
/skin-check/result   FREE. INSTANT. NO PAYWALL.
   - what we observed (expert-gated, see 6.2)
   - recommended regimen: 15 / 30 / 45-day
   - AM/PM routine shape
   - why this, traceable to fired rules
   |
   v
/book   choose a slot with a named expert
   |
   v
Rs500 refundable, framed as holding the appointment
   |
   v
Expert call -> custom formulation -> order -> refill
```

Two deliberate changes from the current funnel:
- **Contact capture moves to step 6.** The source quizzes ask name/email/age/WhatsApp/gender *first*,
  the most common cause of quiz abandonment.
- **The result is rules-driven**, from concern + skin type + the existing ingredient mappings. No LLM
  invents product claims. Every recommendation is replayable.

---

## 6. Technical architecture

### 6.1 Diagram

```
        User (mobile web, majority Indian networks)
                          |
        Next.js 16 App Router  (Vercel edge/CDN)
          - RSC static marketing + content hubs
          - client islands: assessment, chat, camera
                          |
        /api/v1/*  Route Handlers, Zod-validated contracts
                          |
   +------------+---------+---------+--------------+
   |            |                   |              |
 Supabase   Recommendation      AI services    Razorpay
 Postgres     engine            (server-only)   payments
 + Storage   (rules over        - Anthropic         |
 + RLS        content data)       vision        Gupshup
                                - Anthropic     WhatsApp
                                  chat + cache
                                - (SP6) voice
```

Everything server-side. **No provider API key ever reaches the browser.** The client only ever calls
Skinwise endpoints.

### 6.2 The principle that makes the positioning structurally true

```
assessment_photos --> photo_observations        what the AI saw
                            |                    model_version, confidence
                            v                    immutable
                     expert_assessments         what the human concluded
                            |                    authoritative
                            v
                  regimen_recommendations       what the customer is told
                                                 rationale: which rules fired
```

AI output and expert conclusion are **separate tables and never merged**. The AI row is immutable and
versioned. The expert row references it and may contradict it. Nothing reaches the customer except
through the expert row.

This is what makes "AI guides, human decides" true in the data rather than only in the copy — and it
is precisely the gap CureSkin has. It also accrues, at no extra cost, a labelled corpus of *AI
observation vs. expert verdict* on real Indian users, real lighting and real skin tones. That corpus
is the only realistic path to a future in-house model (§6.7).

### 6.3 Database schema (Supabase / Postgres)

```
-- Funnel
assessments             id, session_id, concern_slug, skin_type,
                        answers jsonb, contact_name, phone_e164,
                        status, created_at
assessment_photos       id, assessment_id, storage_path, angle,
                        retention_expires_at, deleted_at
photo_observations      id, photo_id, model_version, observations jsonb,
                        confidence, created_at            -- AI, immutable
expert_assessments      id, assessment_id, expert_id, notes,
                        agreed_with_ai bool, reviewed_at  -- human, authoritative
regimen_recommendations id, assessment_id, tier_days, rationale jsonb

-- Conversion
experts                 id, name, credentials, photo, active
booking_slots           id, expert_id, starts_at, is_booked
bookings                id, assessment_id, slot_id, status
payments                id, booking_id, provider, provider_ref,
                        amount_paise, status, refunded_at

-- Compliance (DPDP)
consents                id, subject_ref, purpose, policy_version,
                        granted_at, withdrawn_at
deletion_requests       id, subject_ref, requested_at, completed_at
```

RLS on every table. `rationale jsonb` records which rules fired, making every recommendation
explainable and replayable.

Content (concerns, ingredients, skin types, FAQs, copy) stays in `content/` as typed code until a CMS
is genuinely needed. The database holds **user data only**. This is deliberate: it keeps SP0–SP2 fast
and avoids building a CMS nobody has asked to use yet.

### 6.4 Authentication

**No accounts at launch.** The audience is WhatsApp-native, and phone-OTP in India means DLT
registration and per-SMS cost for a login nobody requested.

- Assessment runs anonymously on a session cookie.
- The result is reachable via a **signed claim link** delivered over WhatsApp.
- `/me` reads that session.
- Real accounts (phone OTP) arrive in SP3, when orders and refills need identity.

### 6.5 API contracts

Versioned Route Handlers — `/api/v1/assessments`, `/api/v1/recommendations`, `/api/v1/bookings`,
`/api/v1/assistant` — with Zod-validated request and response schemas and **zero business logic in
components**. Server Actions are used only for same-origin form posts, where their built-in CSRF
protection is the point.

A future React Native or Flutter app consumes the identical API. Nothing about the recommendation
engine, the funnel or the AI services lives in the web UI.

### 6.6 Recommendation engine

Rules + product metadata, not LLM judgement:

```
input:  concern_slug, skin_type, duration, lifestyle flags,
        (optional) expert-confirmed observations
rules:  concern x skin_type -> ingredient set        (from content/concerns/*)
        contraindication filters                      (pregnancy, sensitivity)
        severity/duration -> tier suggestion          (15 / 30 / 45-day)
output: tier, ingredient rationale, AM/PM routine shape,
        rationale jsonb listing every rule that fired
```

The LLM never chooses a recommendation. It may *explain* one, grounded in the fired rules.

### 6.7 Training data — why "build our own model" is not a Phase 1 option

| Dataset | Licence | Commercial | Fit |
|---|---|---|---|
| Fitzpatrick17k | CC BY-NC-SA 3.0 | No | Ruled out |
| HAM10000 | CC BY-NC 4.0 | No | Also wrong domain — dermatoscopy of pigmented lesions |
| Google SCIN | Custom SCIN licence, no NC clause | Appears yes | Partial — US-skewed, inflammatory/allergic conditions |
| ACNE04 | See note | **No** | Wrong domain — clinical photography at 70 degrees, not selfies |

> **Source conflict on ACNE04, resolved.** One research pass reported CC BY 4.0 and commercially
> usable. A second pass fetched the repository README directly and quoted it verbatim: *"This work is
> free for academic usage. For other purposes, please contact Xiaoping Wu."* **The verbatim
> primary-source quote wins — treat ACNE04 as academic-only.** Nothing in this architecture depends
> on it.

Datasets that *are* selfie-domain and labelled for acne/pigmentation/wrinkles exist only as
descriptions inside papers and patents; one states *"The data presented in this study are not
publicly available due to privacy issues."* Commercial vendors (Nexdata, UniDataPro, TrainingDataPro)
sell such data but their public listings carry NC-ND licence tags, so commercial rights need
confirming in writing before purchase.

**Conclusion: start on a hosted API.** The corpus generated by §6.2 is the asset that eventually
makes an in-house model viable.

---

## 7. AI architecture

### 7.1 Accuracy reality, and what it means for scope

Published 2026 evaluation of multimodal LLMs on real dermatology images: GPT-4.1 scored **42.25%
top-3 accuracy on curated benchmarks and 24.65% on real hospital images** (5,811 cases). Authors'
conclusion: *"not ready for clinical deployment."* Accuracy degrades further on darker skin tones.
Generic vision models manage only 64–75% accuracy at counting simple objects — precisely the operation
"grade lesion count / pore visibility" requires. Medical-disclaimer rates in vision-model responses
fell from 19.6% (2023) to 1.05% (2025) across 18 commercial models: they now answer confidently
without caveats by default.

**A general vision model cannot reliably tell a user what is on their face.** Scope follows:

| Job | Reliable | Where |
|---|---|---|
| Is this a usable photo (face centred, lit, sharp)? | Yes | On-device |
| Describe visible characteristics, appearance-only language | Roughly | Server, expert-gated |
| Pre-fill a structured brief for the expert | **Yes — highest real value** | Server |
| Diagnose a condition | No | Nowhere |

### 7.2 Photo pipeline

```
capture
  |
  v
on-device quality gate                   MediaPipe Face Landmarker (Apache-2.0,
  - face centred, both eyes visible      478 landmarks, WASM, client-side)
  - blur: variance-of-Laplacian          + ~150 lines of first-party canvas code
  - exposure: luminance histogram        (no OpenCV.js -- 6-8MB for one operation)
  |
  | bad photos never leave the device: never uploaded, never paid for, never stored
  v
upload -> Supabase Storage (encrypted, RLS, retention_expires_at set)
  |
  v
Anthropic vision -> photo_observations   immutable, versioned, appearance-only
  |
  v
expert reviews, edits, confirms -> expert_assessments
  |
  v
user sees ONLY the expert-confirmed version
```

Between upload and review the user sees an honest *"your photos are with Dr. [name] — reviewed within
24 hours"* state. **No fabricated instant result.** Nothing unreviewed is ever shown.

> **Spike required.** Google's docs give no mobile-Safari FPS figures for MediaPipe. Benchmark on a
> real mid-range Android and a real iPhone before committing. Treat as a plan task, not an assumption.

### 7.3 Provider choice is driven by terms of service

| Provider | Relevant clause | Fit |
|---|---|---|
| **Gemini** | *"You may not use the Services in clinical practice, to provide medical advice, or in any manner that is overseen by or requires clearance or approval from a medical device regulatory agency."* No human-review exception stated. | **Highest risk** |
| **OpenAI** | Bans *"inferring sensitive attributes"* from biometric data — "biometric data" undefined, so coverage of skin-condition inference is genuinely ambiguous. Has a human-in-the-loop carve-out for licensed advice. | Moderate |
| **Anthropic** | *"When using our products or services to provide advice, recommendations, or in subjective decision-making directly affecting individuals or consumers, a qualified professional in that field must review the content or decision prior to dissemination or finalization"* + disclose AI use. | **Matches this architecture exactly** |

Anthropic's required safeguard *is* §6.2's design. Gemini is cheapest per image (~$0.0004 vs ~$0.005)
and it does not matter — at this volume the difference is tens of dollars a month against a
categorical prohibition.

Anthropic also prohibits promoting *"unhealthy or unattainable body image or beauty standards"* — a
copy constraint: outputs are neutral observations, never beauty judgements.

### 7.4 Chatbot — no RAG

Knowledge base is ~300 chunks / ~40k tokens, which fits in a single context window.

| Approach | 1,000 MAU | 10,000 MAU |
|---|---|---|
| Full RAG | ~$9/mo | ~$88/mo |
| **Prompt-stuffing + caching** | **~$22/mo** | **~$219/mo** |

RAG saves $13–130/month — noise — and costs an embedding pipeline, re-indexing on every content edit,
retrieval tuning, and a new failure mode where the answer is in the KB but retrieval misses it.
**Skip RAG.** Revisit past ~2,000–3,000 chunks or if per-segment content filtering is needed.

If Gemini is ever reconsidered: its *explicit* caching bills $1.00/1M tokens **per hour of storage** —
keeping a 40k-token cache warm costs ~$29/mo, exceeding the no-cache cost at 1,000 MAU. OpenAI and
Anthropic have no storage fee.

Grounding: context-only system instructions, citation-forcing, server-side validation of any product
or routine name against real data, and an `in_kb: false` flag that routes to a human instead of
guessing. That last control matters most — ingredient interactions and pregnancy safety are where a
confident wrong answer does real harm.

### 7.5 Voice (SP6)

Deferred, and the research supports deferring. **Whisper is not safe here**: on the AI4Bharat
Indian-accent benchmark `whisper-large-v3` scores **19.0% WER, worse than `whisper-small` at 17.6%**,
and hallucination rate climbs from 3.22% to 9.62% as the model grows.

Recommended when built: **Deepgram (Hindi model) → LLM → ElevenLabs**, ~$0.13–0.23 per 5-minute call.
ElevenLabs is already owned and offers 160 Indian-accent voices; each leg is independently swappable
(e.g. adding Sarvam AI later without re-architecting).

Rejected: OpenAI Realtime — best latency, but **no native Indian-accented voices**. Gemini Live —
cheapest with best language coverage, but **WebSocket-only with no first-party WebRTC**, and
head-of-line blocking on lossy Indian mobile networks is a real risk.

---

## 8. Compliance

### 8.1 Medical-device line (CDSCO)

CDSCO's draft Medical Device Software guidance (21 Oct 2025, still in consultation) carries the
needed carve-out: **"Lifestyle, wellness and fitness applications remain outside the scope."**

But **no CDSCO ruling endorses "AI observes, human confirms" as a safe harbour.** Unlike the US FDA,
which widened exactly that discretion in January 2026, India's draft pushes AI diagnostic tools toward
*more* scrutiny, including a mandatory Algorithm Change Protocol for retraining. Human review is good
practice, not a legal shield. **Copy discipline is the operative control.**

### 8.2 Claim language

```
SAY                                     NEVER SAY
"Your photos show visible               "You have acne / melasma"
 breakouts across the T-zone"           "Diagnosis:"
"helps improve the appearance of"       "cures", "treats", "heals"
"may help reduce the look of"           "permanently", "guaranteed"
"signs of uneven tone"                  "pigmentation disorder"
```

Two specifics:
- **"Melasma" must leave user-facing copy.** It is adjacent to *Leucoderma*, a named condition in the
  Drugs & Magic Remedies (Objectionable Advertisements) Act schedule.
- **The existing "clear it permanently" / "clear them permanently for flawless skin" copy must be
  rewritten.** It appears in the `process` block of all three concern files. ASCI flagged 500+ beauty
  brands for this claim class between 2025 and January 2026, and 98% of scrutinised beauty ads in its
  2023–24 report required modification.

> Primary statutory text for the DMR Act could not be retrieved (indiacode.nic.in returned 403). The
> schedule detail above is from cross-checked secondary sources. **Indian counsel must verify the
> verbatim text before legal copy is finalised.**

### 8.3 DPDP Act 2023

- **No "sensitive data" tier exists.** A face photo carries the same baseline obligations as an email
  address. What is required is **itemised** notice — "face photographs" and "AI-generated skin
  observations" must be named as distinct line items, not covered by "information you provide."
- **The 3-year retention floor does not apply** — it binds entities with 5 million+ users.
- **Retention policy: auto-delete 90 days after the consultation**, unless the customer explicitly
  opts in to keep photos for progress comparison (off by default, revocable from `/me`). Enforced by a
  scheduled job; deletions logged.
- **Under-18 is a "child"** requiring verifiable parental consent, with targeted advertising to them
  banned outright. **Exclude under-18 users** rather than build guardian-consent flows.
- **Cross-border transfer is currently permitted** — DPDP uses a negative list and no country is
  restricted today. DPAs still required with every processor.
- **Deadline: build to November 2026.** Full obligations formally bite 13 May 2027, but MeitY proposed
  compressing to November 2026 (consultation closed Feb 2026, outcome unconfirmed as of this writing).
- Implement §14 nomination as a settings feature; breach notification within 72 hours to the DPBI
  (and note CERT-In's separate, stricter 6-hour clock).

### 8.4 Business-continuity flag

On 24 February 2026 India issued a Section 69A blocking order against Supabase; Jio, Airtel and ACT
blocked `*.supabase.co` for roughly a week before restoration. This is not a legal-compliance issue,
but it justifies a documented storage exit plan and argues for an India-region project.

---

## 9. Commerce and messaging

**Razorpay.** Stripe India is invite-only as of July 2026 and cannot be self-served. Razorpay's free
standard refunds matter specifically because the deposit is refundable; tokenisation (RBI CoFT) is
handled; UPI Autopay exists off-the-shelf for future refills. Cashfree undercuts on a promotional rate
through 31 July 2026 and is useful negotiating leverage, but its refund-fee schedule is not published.

The current model is **two independent one-off payments** (₹500 deposit, later plan payment), each
authenticated at time of payment. The RBI Digital Payments E-Mandate Framework 2026 does **not** apply
until a true recurring reorder subscription is built.

**WhatsApp via Gupshup.** Utility templates are free inside an open 24-hour service window, covering
deposit confirmations and appointment reminders at near-zero cost. SMS remains a thin fallback only
(DLT registration ~1 week, ~₹7,000 one-time). Email (Resend) for durable receipts.

Estimated messaging: ~₹2,100/mo at 1,000 MAU, ~₹22,400/mo at 10,000 MAU.

---

## 10. Performance and SEO

**Performance is mostly subtraction:** delete the four desktop-only effect layers, drop the ~90
redundant brand image variants, keep Framer Motion dynamically imported below the fold. The existing
`next/image` + `next/font` + SSG foundation is already correct. Budget: **LCP < 2.5s on a mid-range
Android over 4G**; the AI bundle must never block first paint — it loads on interaction.

**SEO is mostly addition:** the 6 ingredient + 4 skin-type pages, `Article` / `FAQPage` /
`BreadcrumbList` schema on top of the working `buildMetadata` infrastructure, and a 301 map for the
renamed concern route.

**No `MedicalWebPage` schema.** That is a claim about what Skinwise is, and §8.1 says not to make it.

---

## 11. Roadmap

### 11.1 Do before the rebuild

| # | Action | Why it cannot wait |
|---|---|---|
| 1 | Verify the live quiz renders in production | Reportedly empty. If true, every lead is being lost today. Outranks this entire plan. |
| 2 | Remove invoice scans from `Assets/`; gitignore `Assets.zip` | One `git add .` from permanent history |
| 3 | Strike "permanently" and "melasma" from live copy | §8.2 |
| 4 | Rotate credentials shared in chat | Flagged in `PROJECT_BLUEPRINT.md` §2, still open |

### 11.2 Sub-projects

| # | Sub-project | Ships |
|---|---|---|
| **0** | Foundation & de-fork | One design system, one component library, mobile app shell, working test suite |
| **1** | Homepage · IA · content hubs | The conversion surface and the SEO engine |
| **2** | Assessment engine · Supabase · admin | Fixes the broken funnel. Highest business value. |
| **3** | Regimen · booking · deposit · Razorpay · WhatsApp | Revenue |
| **4** | AI assistant (text) | The differentiator, safely |
| **5** | Photo analysis (expert-gated) | The headline feature |
| **6** | Voice · progress tracking · full personalisation | The moat |

Each boundary is shippable.

### 11.3 Priority matrix

```
        HIGH IMPACT
             |
   SP2 *     |     * SP0        <- first: cheap and unblocking
 assessment  |    foundation
             |  * SP1 content
   SP3 *     |
  commerce   |  * SP4 assistant
-------------+-----------------  LOW EFFORT ->
   SP5 *     |
   photo     |
   SP6 *     |
   voice     |
             |
        LOW IMPACT
```

SP5 and SP6 are the headline features in the original brief and are built **last** — SP5's accuracy is
weak until the expert-reviewed corpus exists (§6.2), and SP6 is expensive to do well in Hindi. Both
improve by waiting. SP2 only gets more expensive.

---

## 12. Open items requiring client input

Carried from `README.md` and extended by this design:

1. Confirm canonical phone numbers (source site had 5+ inconsistent).
2. Provide the real Refund & Cancellation policy (source page empty).
3. Terms & Conditions: currency, refund window, governing jurisdiction; remove source Lorem Ipsum.
4. Resolve founder naming — Home says "Ashu Sharma, Skin Specialist"; About says "Anant Sanadhya".
5. Provide Other-Issues-specific causes copy (`causes: []` today).
6. Provide the WhatsApp business number.
7. **Consent for before/after images.** None currently confirmed. `/results` stays consent-gated and
   ships empty rather than fabricated.
8. Real clinical-study percentages, or the claims stay qualitative.
9. Social links.
10. **DPDP review of the privacy policy** — it already collects "Previous Medical History" and
    "Present Ailments".
11. **Counsel verification of DMR Act schedule text** before legal copy is finalised (§8.2).
12. **Decision on the "No AI Based" badge** — retire or reword to "AI-assisted, human-decided".
13. Whether the `other-issues-all-skin-care-19-june` draft is canonical (backs `/routines`).

---

## 13. What could not be verified

Recorded so no reader mistakes an inference for a fact:

- CureSkin's in-app flow (no device walkthrough possible); their mobile-web sticky behaviour; whether
  their "24/7 chat support" is human, AI or hybrid.
- Whether CDSCO's Oct-2025 draft has been finalised, and whether the wellness carve-out survived.
- Verbatim DMR Act §3 text and the complete 54-item schedule.
- Verbatim ASCI safe-harbour phrase list (PDFs unreachable) — §8.2's table is a synthesis.
- Whether MeitY's DPDP timeline acceleration has been formally notified.
- Official SDF thresholds — none notified; all circulating figures are private estimates.
- MediaPipe mobile-Safari FPS — no vendor figure exists; spike required (§7.2).
- No dermatology benchmark exists for Gemini or Claude specifically; the accuracy evidence in §7.1
  tests GPT-4/4.1. This is a gap in the literature, not in the research.
- Cashfree's refund-fee schedule.
- Whether commercial dataset vendors' paid tiers actually grant commercial rights despite NC-ND tags
  on their public previews.
