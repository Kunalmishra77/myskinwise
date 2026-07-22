# Sub-project 1 — Homepage & Content Hubs

**Date:** 2026-07-21
**Status:** Approved, in implementation
**Parent:** `docs/superpowers/specs/2026-07-21-skinwise-platform-architecture.md`
**Depends on:** Sub-project 0 (foundation, app shell) — complete

---

## 1. Context that shapes this stage

**The production quiz funnel is confirmed broken.** All three WordPress quiz pages
(`/pigmentation-form-quiz/`, `/acne-form-quiz/`, `/other-issues-form-quiz/`) return HTTP 200 with
zero forms, zero inputs, and a main content area containing 0 characters of text — verified both in
raw HTML and in a real browser after JavaScript. The homepage CTA "analyse your skin now" points
directly at one of them.

Two consequences for this stage:

1. **The homepage must not promise a working assessment it cannot deliver.** `/skin-check` remains an
   honest interim screen until Sub-project 2 builds the real one. Every homepage CTA points there,
   and that screen is truthful about what exists today.
2. **Content hubs matter more than usual right now.** With the funnel dead, education pages are the
   only thing on the site currently capable of earning and holding attention.

---

## 2. Goals

1. A homepage that makes the consultative journey immediately legible.
2. Content hubs that are genuinely useful, built only where real content exists.
3. Full SEO plumbing on every new route.
4. Mobile-first, measured at 320px upward.
5. No fabricated content anywhere.

## 3. Non-goals

- The real assessment engine (Sub-project 2).
- AI chat, photo analysis, voice (Sub-projects 4–6). **No CTA may point at any of these.**
- Accounts, payments, booking (Sub-project 3).
- A blog/CMS. `/learn` is an index over existing typed content, not an article system.

---

## 4. Content inventory — what actually exists

This stage adds no invented facts. Everything below is already in the repository.

### 4.1 Ingredients — 6, each with a professional photograph and a written benefit statement

Source: `content/assets.ts` (`IMAGES.ingredient*`, alt text) plus the ingredient-to-concern mappings
inside `content/concerns/*.ts`.

| Ingredient | Sourced benefit statement |
|---|---|
| Vitamin C | Brightens skin and reduces dark spots |
| Kojic Acid | Lightens pigmentation and evens skin tone |
| Retinol | Speeds up cell turnover and fades dark spots |
| Alpha Arbutin | Fades hyperpigmentation gently |
| Niacinamide | Controls oil production and soothes inflammation |
| Salicylic Acid | Unclogs pores and reduces blackheads and whiteheads |

### 4.2 Skin types — 4, each with a real differentiated regimen

Source: `Assets/WEBSITE_CONTENT.md` §5 "Ingredients by skin type".

| Skin type | Sourced ingredients | Sourced aim |
|---|---|---|
| Dry | Hyaluronic Acid, Niacinamide, Licorice Root Extract, Alpha-Arbutin | Hydrate, repair barrier, reduce melanin |
| Oily | Niacinamide, Salicylic Acid (BHA), Kojic Acid, Vitamin C | Exfoliate, reduce oil, inhibit melanin |
| Combination | Niacinamide, Mandelic Acid, Tranexamic Acid, Green Tea Extract | Balance oil, brighten |
| Sensitive | Centella Asiatica (Cica), Aloe Vera, Licorice Root Extract, Chamomile | Calm, soothe, gently brighten |

### 4.3 Concerns — 3 existing typed pages

Pigmentation, Acne, Ageing & Texture (renamed from "Other Issues"). Already built on
`ConcernPageTemplate`.

### 4.4 What does NOT exist, and is therefore not built

- Testimonials with confirmed consent → the results section stays a `TODO(client-confirm)` and
  renders nothing rather than placeholder faces.
- Clinical percentages → claims stay qualitative.
- Doctor/expert names and credentials → the expert is referred to by role, never by invented name.
- Before/after imagery with consent → not surfaced.

---

## 5. Information architecture

```
/                          Homepage
/concerns                  Hub — 3 concerns
/concerns/[slug]           Existing concern pages (301 from /pigmentation etc.)
/ingredients               Hub — 6 ingredients
/ingredients/[slug]        Ingredient page
/skin-types                Hub — 4 skin types
/skin-types/[slug]         Skin type page
/learn                     Index over all of the above + FAQs
/skin-check                Interim honest screen (SP2 replaces)
```

**Route migration.** Existing concern URLs (`/pigmentation`, `/acne`, `/other-issues`) move under
`/concerns/*` with permanent redirects in `next.config.ts`, preserving `/other-issues` →
`/concerns/ageing-and-texture`. Redirects are required: these URLs have live ad traffic.

---

## 6. Homepage

### 6.1 Section order

| # | Section | Job | Mobile treatment |
|---|---|---|---|
| 1 | Hero | What Skinwise is, and one action | Headline + subcopy + primary CTA above the fold at 320px |
| 2 | Concern selector | "This is my problem" | Horizontal scroll cards, thumb-height |
| 3 | How it works | The 6-step journey | Vertical stepped list, not a cramped grid |
| 4 | AI + expert | The differentiator | Two-panel contrast |
| 5 | Skin Check CTA | Conversion | Full-width panel, what you get + what it costs |
| 6 | Learn | Education entry | Three hub cards |
| 7 | Trust | Why believe us | Process transparency + founder story, no invented proof |
| 8 | Final CTA | No dead end | Single action |

### 6.2 CTA hierarchy

- **Primary, everywhere:** "Start your Skin Check" → `/skin-check`.
- **Secondary:** "Message a skin expert" → WhatsApp (real, works today).
- **No "Talk to Skinwise AI" CTA.** The assistant does not exist yet; a CTA pointing at it would be
  exactly the fake functionality this project forbids. It arrives with Sub-project 4.

### 6.3 Above the fold at 320px

The hero must fit headline, one line of subcopy, and the primary CTA within the first viewport on the
narrowest supported device. No full-bleed image pushing the CTA below the fold.

### 6.4 Motion

Reuses the Stage 0 `Reveal` (position-only, never opacity — see its component doc). Concern cards get
a press state. Nothing else animates.

---

## 7. Content hub page shapes

### 7.1 `/ingredients/[slug]`

What it is · what it is commonly used for · which concerns it relates to · which skin types it suits ·
considerations · how it fits a routine · related ingredients · CTA.

Efficacy is described in the sourced benefit language only. No clinical claims, no percentages.

### 7.2 `/skin-types/[slug]`

Characteristics · common challenges · the sourced ingredient set and its aim · common mistakes ·
related concerns · CTA.

### 7.3 `/concerns/[slug]`

Unchanged `ConcernPageTemplate`, re-parented under `/concerns` with breadcrumbs and cross-links into
ingredients and skin types.

### 7.4 `/learn`

An index, not an article system. Groups the three hubs plus the existing FAQ content.

---

## 8. SEO

- `buildMetadata()` on every route; unique title and description per page.
- One `<h1>` per page; correct heading order beneath it.
- `BreadcrumbList` JSON-LD on every hub and detail page.
- `FAQPage` JSON-LD only where real FAQ content exists.
- `sitemap.ts` extended to generate ingredient, skin-type and concern routes from the data files, so
  adding an entry updates the sitemap automatically.
- Internal linking: every concern links to its ingredients; every ingredient links back to concerns
  and skin types.
- **No `MedicalWebPage` schema** — a claim about what Skinwise is, ruled out in the parent spec §8.1.

## 9. Performance

- Ingredient photographs are 1414×2000 originals; served via `next/image` with explicit `sizes`.
- `priority` on the hero image only.
- No AI, chat or voice SDK loaded anywhere on the homepage.
- Budget: LCP < 2.5s on mid-range Android over 4G.

## 10. Accessibility

- Zero new serious/critical axe violations across all new routes, both viewports.
- Horizontal scrollers reachable by keyboard and not the only route to the content.
- Touch targets ≥ 44px.
- Contrast per the token rules — no `text-ink/60`, no reintroduced `ink-mute`.

## 11. Testing

- Unit tests for the new content data (shape, uniqueness, referential integrity between ingredients,
  concerns and skin types).
- E2E: every new route 200s, has one `h1`, and a unique title.
- Axe sweep extended to all new routes.
- Redirect tests for the three moved concern URLs.

## 12. Definition of done

- [ ] Homepage implemented, mobile-first, real content only
- [ ] Ingredient hub + 6 pages
- [ ] Skin-type hub + 4 pages
- [ ] Concern hub, concerns re-parented, redirects in place
- [ ] `/learn` index
- [ ] No CTA points at unbuilt functionality
- [ ] SEO: metadata, breadcrumbs, sitemap, internal links
- [ ] tsc, eslint, build, unit tests, e2e, axe all pass
- [ ] Responsive QA 320 → 1920
- [ ] Working tree clean
