# Sub-project 0 — Foundation & De-fork

**Date:** 2026-07-21
**Status:** Design approved, pending written-spec review
**Parent:** `docs/superpowers/specs/2026-07-21-skinwise-platform-architecture.md`

---

## 1. Why this exists

The codebase currently contains **two design systems and two component libraries** that were forked
during the in-progress AI-homepage build. Every subsequent sub-project would inherit that fork and pay
for it twice. Additionally, **roughly half the test suite cannot execute**, so there is no reliable
regression net beneath any of the work that follows.

This sub-project ships no new features. It makes everything after it cheaper.

## 2. Goals

1. One design token set. One component library. One set of chrome.
2. A mobile-first app shell with bottom navigation.
3. A test suite where every test file actually runs.
4. No visual or behavioural regression on the nine existing marketing routes.
5. Measurably less JavaScript shipped to mobile.

## 3. Non-goals

- No new **content** pages. `/ingredients`, `/skin-types`, `/routines` are SP1.
  The one exception: `/skin-check` and `/me` are created as **empty placeholder routes**, because the
  bottom nav needs real navigation targets — a nav item pointing at a 404 is not shippable. They render
  a heading and nothing else. SP1/SP2 fill them.
- No backend, database, auth or AI. (SP2+.)
- No CMS.
- No rewriting of concern/legal content, **except** the claim-language fix in §4.6, which is a
  compliance requirement rather than a feature.

## 4. Scope

### 4.1 Unify design tokens

`app/globals.css` currently defines two palettes. Merge to one set with no `hp-` prefix.

| Token group | Winner | Values |
|---|---|---|
| Rose ramp | Homepage | `rose #E0819A`, `rose-deep #C05E78`, `rose-ink #A8506A` |
| Neutrals | Homepage | `warm #FBFAF7`, `surface #FFFFFF`, `ink #241C19`, `ink-soft #6E645F`, `ink-mute #8A807B` |
| Accents | Homepage | `blush #FCEEF2`, `champagne #F1E5D2`, `sage #8FA187`, `plum #231619` |
| Type families | Homepage | Cormorant Garamond (display), Manrope (body) |
| Type scale | Marketing | `clamp()`-based `--text-display`, `--text-h2` — ported onto the new families |
| Shadows | Homepage | `--shadow-soft`, `--shadow-lift` (warm, rose-tinted, two-layer) |

**Accessibility constraint that must survive the merge.** Both forks independently derived the same
finding, and it is load-bearing:

- `rose #E0819A` with white text is **~2.70:1 — fails AA even at large sizes.** Large display accents
  and fills only, or dark text on top.
- `rose-deep #C05E78` with white text is **~4.11:1 — fails normal-text AA.** Large/bold text only.
- `rose-ink #A8506A` with white text is **~5.22:1 — passes AA.** This is the text/button rose.
- `rose-ink` does **not** clear AA on champagne (~4.2:1) or as a foreground on plum (~3.4:1); use `ink`
  or the lighter `rose` there.

The existing explanatory comments in `globals.css` documenting these ratios are kept — they are the
reason the constraint has survived two independent builds.

**Deletions:** `--color-canvas`, `--color-charcoal`, the duplicate `--color-blush #F8DDE3`,
`--color-accent`, `--color-accent-ink`, `--color-muted`, `--font-serif`/`--font-sans` aliases, and the
entire `--color-hp-*` / `--shadow-hp-*` / `--animate-hp-*` prefix family (renamed, not dropped).

### 4.2 Unify components

| Merged component | Replaces | Notes |
|---|---|---|
| `Button` | `components/ui/button.tsx`, `components/home/ui/button.tsx` | Variants `primary \| dark \| glass \| outline \| whatsapp`; sizes `sm \| md \| lg`. Both existing versions hand-roll the same `asChild` slot to avoid a Radix dependency — **keep that approach**. |
| `Card` | `components/ui/card.tsx`, `components/home/ui/card.tsx` | Absorbs `GlassCard` as a variant. |
| `Accordion` | `components/ui/accordion.tsx`, `components/home/ui/accordion.tsx` | Keep the version with the more complete keyboard handling; port any missing behaviour. |
| `Reveal` | `components/ui/reveal.tsx`, `components/home/ui/reveal-on-scroll.tsx` | Must stay SSR-safe — no `opacity-0` gating that leaves content invisible without JS. |
| `Eyebrow` | `components/ui/eyebrow.tsx`, `components/home/ui/section-eyebrow.tsx` | Keeps the `index` prop and the `tone` prop for dark sections. |

Retained as-is, moved into the single library: `Section`, `Tabs`, `Badge`, `Pill`, `Marquee`,
`CountUp`.

**Deleted outright** (§4.4): `MagneticButton`, `CursorGlow`, `FilmGrain`, animated `GradientMesh`.

Final structure:

```
components/
  ui/            merged primitives
  layout/        AppShell, BottomNav, TopBar, Drawer
  features/      business components (ConcernPageTemplate, FaqSection, ...)
```

`components/home/` is removed entirely; its surviving pieces move into the above.

### 4.3 App shell

New `components/layout/`:

- **`AppShell`** — wraps all routes. Renders `TopBar`, `<main id="main">`, `BottomNav`.
- **`TopBar`** — logo, menu trigger, WhatsApp action in the right slot. Sticky, 56px on mobile.
- **`BottomNav`** — mobile only (`lg:hidden`), 64px + `env(safe-area-inset-bottom)`. Four items:
  `Home · Concerns · Skin Check · Me`. **Skin Check is centre and visually raised.**
- **`Drawer`** — full nav. **Port the existing focus trap, `inert` handling, scroll lock and focus
  restoration from `components/features/navbar.tsx` verbatim** — that code is correct and tested.

Rules:
- `BottomNav` **replaces** `StickyCTA`. Two fixed bottom bars would consume 120px of a 667px viewport.
- `BottomNav` is **suppressed on assessment routes** (`/skin-check/*`) via a layout boundary, not a
  conditional inside the component.
- Desktop (≥1024px) renders a top bar only — not a stretched phone layout.
- `Skin Check` and `Me` point at placeholder routes in this sub-project; SP1/SP2 fill them.

`app/(marketing)/layout.tsx` collapses into the shell. `app/page.tsx` and
`app/(marketing)/page.tsx` resolve to exactly one homepage.

### 4.4 Deletions

| Deleted | Reason |
|---|---|
| `components/home/effects/cursor-glow.tsx` | Pointer-only; no effect on touch devices |
| `components/home/effects/film-grain.tsx` | Fixed full-viewport SVG turbulence paint layer |
| `components/home/ui/magnetic-button.tsx` | Pointer-only |
| `GradientMesh` animation | Keep the static gradient as a CSS background; drop the drift |
| `public/{next,vercel,file,globe,window}.svg` | Next.js scaffold leftovers |
| `Assets/Copy-of-INVOICE-AA24-2523-*.jpg` (5 files) | Unrelated business documents; should not be in the repo |
| `Assets/Find-Trusted-Maids-*.jpg` (3 files) | Unrelated business artwork |
| Redundant `public/images/brand/` scale variants | `-1536x864`, `-2048x1024`, `-scaled` duplicates; `next/image` handles resizing |

`Assets.zip` (10.9 MB, untracked) is added to `.gitignore`.

**Asset deletion is gated:** only remove a `brand/` variant after confirming no `content/assets.ts`
entry references it. `IMAGES` is the single source of truth; anything unreferenced is safe.

### 4.5 Fix the test suite

`vitest.config.ts` sets no `pool`, so Vitest defaults to `forks`. On Windows with jsdom, forked
workers exceed the default startup timeout: 12 of 25 test files die with `Timeout waiting for worker
to respond` before running an assertion.

Fix: set `pool: 'threads'` and raise `testTimeout`/`hookTimeout` as needed.

**Acceptance: all 25 test files execute and pass. Zero worker errors.** This is a hard gate — the
remainder of SP0 is a large refactor and is not safe without it, so **this task is done first.**

### 4.6 Claim-language fix

Required by the parent architecture §8.2 and by ASCI/DMR Act exposure. In
`content/concerns/{acne,pigmentation,other-issues}.ts`, the `process` block currently reads:

> "The product works on the root cause of acne to clear it **permanently**."
> "…working to clear them **permanently** for flawless skin."

Rewrite to appearance-based language with no permanence or cure claim. Any user-facing occurrence of
**"melasma"** is likewise replaced with appearance-based phrasing.

This is a **content change requiring client sign-off**, so it ships as a proposed rewrite in the PR
rather than being silently applied.

## 5. Sequence

```
1  Fix the test suite                 <- gate: everything after needs it
2  Merge design tokens                 (visual diff only, no structural change)
3  Merge component primitives          (mechanical, test-covered)
4  Build the app shell
5  Migrate routes onto the shell
6  Delete dead effects and assets
7  Claim-language rewrite (proposed, for sign-off)
8  Performance verification
```

## 6. Testing

- **Unit/component:** every merged primitive keeps its existing tests; merged variants get new cases.
  Contrast-critical pairings (`rose` / `rose-deep` / `rose-ink` on each surface) get an explicit test
  so the §4.1 constraint cannot silently regress.
- **E2E (Playwright):** the existing smoke suite must pass unchanged against all nine routes. New
  specs for bottom-nav navigation, drawer focus trap, and bottom-nav suppression on `/skin-check/*`.
- **Accessibility (`@axe-core/playwright`):** zero new violations. The bottom nav needs explicit
  coverage — touch target ≥44px, correct `aria-current`, reachable by keyboard.
- **Performance (Lighthouse CI):** record a **before** baseline prior to any change. After: mobile
  performance must not regress, and total JS transferred must **decrease** (the effect deletions and
  library merge should make this comfortably true).

## 7. Risks

| Risk | Mitigation |
|---|---|
| Token merge silently breaks contrast somewhere | Explicit contrast tests (§6); axe run over every route |
| Deleting a brand asset that is still referenced | Gate every deletion on a `content/assets.ts` reference check |
| Bottom nav overlaps content on iOS Safari | `env(safe-area-inset-bottom)` + real-device check; `scroll-padding-bottom` on `main` |
| Removing `StickyCTA` reduces WhatsApp taps | WhatsApp moves to the persistent top bar, still one tap. Worth instrumenting in SP1 |
| Large refactor, no regression net | §4.5 runs first and is a hard gate |

## 8. Definition of done

- [ ] All 25 test files execute; suite green; zero worker errors
- [ ] One token set in `globals.css`; no `hp-` prefix remains anywhere
- [ ] One component library; `components/home/` deleted
- [ ] App shell live on all routes; exactly one homepage resolves at `/`
- [ ] Bottom nav on mobile, suppressed on `/skin-check/*`, safe-area correct
- [ ] Focus trap, `inert`, scroll lock and focus restoration preserved in the drawer
- [ ] Four effect components deleted; scaffold SVGs and unrelated `Assets/` files removed
- [ ] `Assets.zip` gitignored
- [ ] Nine existing routes render with no visual or behavioural regression
- [ ] Zero new axe violations
- [ ] Total mobile JS transferred is lower than the recorded baseline
- [ ] Claim-language rewrite proposed in the PR for client sign-off
