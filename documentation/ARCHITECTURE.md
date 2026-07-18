# Architecture

This document describes how the Skinwise marketing site (Sub-project A) is structured, and the conventions that
keep it maintainable and extensible. See `README.md` for setup/scripts and `documentation/COMPONENTS.md` for the
component catalog.

## Scope

This app is the **static/SSG marketing surface only**: Home, About Us, three concern landing pages, Contact, and
three legal pages. There is no database, no authentication, and no server-side mutation of persisted data — the
Contact form and newsletter signup are stubbed (see `lib/validation/contact.ts` and `SubscribeForm`) pending
Sub-project B's Supabase-backed backend. `app/quiz/[concern]/page.tsx` is likewise a placeholder page that the
concern-page CTAs link to, not a real multi-step quiz.

## The content-layer pattern: `config/` vs `content/`

Two directories hold every piece of copy and site-wide data in the app, split by *how often it changes* and
*what depends on it*:

- **`config/`** — small, structural, cross-cutting configuration consumed by many components:
  - `config/site.ts` exports `SITE` (nav items, concern list, phone numbers, WhatsApp number, social links,
    copyright string) plus two link-builder helpers, `telHref(e164)` and `waHref(e164)`. This is the **single
    source of truth for contact info** — see the dedicated section below.
  - `config/seo.ts` exports `buildMetadata()` (a `Metadata`-building helper every page's `generateMetadata`/
    `export const metadata` calls) and `organizationSchema` (the sitewide `Organization` JSON-LD, rendered once
    in the root layout).
- **`content/`** — page-specific copy and structured data, one file (or small module) per page/domain:
  - `content/home.ts`, `content/about.ts`, `content/contact.ts` — copy for those specific pages.
  - `content/faqs.ts` — shared FAQ data (`FaqItem = { id, question, answer }`), including the general FAQs reused
    across all three concern pages.
  - `content/assets.ts` — the `IMAGES` map (`ImageAsset = { src, alt, width, height }`), the single source of
    truth for every image reference in the app (see README's "Swapping in real brand assets").
  - `content/concerns/` — one typed data file per concern (`pigmentation.ts`, `acne.ts`, `other-issues.ts`)
    conforming to the shared `ConcernContent` shape (`content/concerns/types.ts`), aggregated in
    `content/concerns/index.ts` as `CONCERNS: Record<slug, ConcernContent>`.
  - `content/legal/` — one typed data file per legal page (`privacy.ts`, `terms.ts`, `refund.ts`) conforming to
    `LegalContent` (`content/legal/types.ts`), re-exported from `content/legal/index.ts`.

Components never hardcode copy, phone numbers, or image paths inline — they receive them as props sourced from
`config/`/`content/`. This is what makes the "add a 4th concern" and "swap a brand asset" workflows a data change
rather than a template change (see below).

## Route-group layout: `app/(marketing)/`

Every public marketing route lives inside the `(marketing)` route group:

```
app/
├── layout.tsx                        # root layout: fonts (next/font), sitewide Organization JSON-LD
├── (marketing)/
│   ├── layout.tsx                    # Navbar + <main> + StickyCTA + Footer — shared chrome
│   ├── page.tsx                      # Home  →  /
│   ├── about-us/page.tsx             # →  /about-us
│   ├── pigmentation/page.tsx         # →  /pigmentation  (ConcernPageTemplate)
│   ├── acne/page.tsx                 # →  /acne          (ConcernPageTemplate)
│   ├── other-issues/page.tsx         # →  /other-issues  (ConcernPageTemplate)
│   ├── contact-us/page.tsx           # →  /contact-us
│   ├── privacy-policy/page.tsx       # →  /privacy-policy           (LegalPage)
│   ├── terms-and-conditions/page.tsx # →  /terms-and-conditions     (LegalPage)
│   ├── refund-and-cancellation/page.tsx # → /refund-and-cancellation (LegalPage)
│   ├── error.tsx                     # marketing-scoped error boundary
│   └── not-found.tsx                 # marketing-scoped 404
├── quiz/[concern]/page.tsx           # placeholder route (Sub-project B builds the real quiz)
├── sitemap.ts                        # generated from SITE.concerns + the fixed route list
└── robots.ts                         # allow-all, points at /sitemap.xml
```

A [route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups) (parenthesized
folder name) applies a layout to a set of routes **without adding a URL segment** — `(marketing)/page.tsx` still
serves `/`, not `/marketing`. `app/(marketing)/layout.tsx` renders `Navbar`, the routed page content inside
`<main id="main">`, the mobile `StickyCTA` bar, and `Footer` around every route in the group, so that shared
chrome is defined exactly once. `/quiz/[concern]` deliberately sits **outside** the group — it doesn't want the
marketing Navbar/Footer/StickyCTA chrome around a (future) full-screen quiz flow.

## SSG rendering strategy

Every route under `(marketing)` is a plain Server Component with no `dynamic`/`revalidate` export and no
per-request data fetching — Next.js statically renders all of them at build time (SSG) by default. The three
concern routes (`pigmentation`, `acne`, `other-issues`) render the same `ConcernPageTemplate` against different
`CONCERNS[slug]` data; `/quiz/[concern]` uses `generateStaticParams()` to pre-render its 3 known concern slugs
and calls `notFound()` for anything else. There is no ISR/ on-demand revalidation in this phase — content only
changes via a code change (a `content/`/`config/` edit) and a redeploy, which is appropriate since there's no CMS
or database yet feeding these pages.

## Single source of truth for contact info: `config/site.ts`

The original WordPress site had 5+ inconsistent phone numbers scattered across Home, About, Contact, and the
sticky call button. This rebuild fixes that structurally, not just cosmetically: `SITE.phones` (general/product/
shipment), `SITE.whatsapp`, and `SITE.email` in `config/site.ts` are the **only** place these values are written
down. Every component that needs to render or link to a phone/WhatsApp number — `Footer`, `StickyCTA`,
`ContactForm`'s mailto fallback, the Contact page, `organizationSchema`'s `contactPoint` list — imports `SITE`
(and the `telHref`/`waHref` helpers) rather than hardcoding a string. Changing a number is a one-line edit in
`config/site.ts` that propagates everywhere automatically. The current numbers are marked
`TODO(client-confirm)` pending client sign-off (see README's open items list).

## SEO infrastructure

- **`buildMetadata()`** (`config/seo.ts`) — called from every page's `export const metadata` (or
  `generateMetadata` for the dynamic quiz route) with `{ title, description, path, image? }`. It builds a
  consistent `Metadata` object: canonical URL (`SITE.url + path`, normalized for `/`), Open Graph tags, and a
  Twitter summary-large-image card, all sharing one default OG image (`IMAGES.logo`) unless overridden. Every
  page therefore emits complete, non-duplicated metadata by construction, not by convention.
- **`organizationSchema`** (`config/seo.ts`) — sitewide `Organization` JSON-LD (name, legal name, url, logo, and
  a `contactPoint` array built directly from `SITE.phones`, so the structured data can never drift from the
  numbers rendered on the page). Emitted once via `<JsonLd data={organizationSchema} />` in the **root**
  `app/layout.tsx` (not the marketing layout), so it's present on every route including future non-marketing
  ones.
- **`JsonLd`** (`components/features/json-ld.tsx`) — the one shared component for emitting any
  `<script type="application/ld+json">` block. Reused for `Organization` (root layout), `FAQPage` (`FAQSection`,
  when `emitSchema` is set — currently the concern pages' general-FAQ block), and `BreadcrumbList` (`Breadcrumb`,
  on every inner page).
- **`app/sitemap.ts`** — generates `sitemap.xml` from a route list built from `SITE.concerns` plus the fixed
  marketing routes, so a new concern slug added to `SITE.concerns` is automatically included with no manual
  sitemap edit.
- **`app/robots.ts`** — allow-all `robots.txt` pointing at `${SITE.url}/sitemap.xml`.

## Extensibility: adding a 4th skin concern

Because every concern page is one template (`ConcernPageTemplate`) driven by one typed data shape
(`ConcernContent`, `content/concerns/types.ts`), adding a new concern category is a **data-only** change:

1. Create `content/concerns/<new-slug>.ts` exporting a `ConcernContent` object (hero copy, "what is" explainer,
   causes, types gallery, ingredient tabs, science steps, process steps, objection FAQs).
2. Register it in `content/concerns/index.ts`'s `CONCERNS` map and widen the `ConcernContent["slug"]` union
   (`content/concerns/types.ts`) to include the new slug.
3. Add the concern to `SITE.concerns` (`config/site.ts`) — this alone updates the Navbar dropdown, the Footer
   visit links, and `app/sitemap.ts`'s generated route list, since all three read from that array.
4. Add `app/(marketing)/<new-slug>/page.tsx` — a ~10-line file that calls `buildMetadata()` and renders
   `<ConcernPageTemplate content={CONCERNS["<new-slug>"]} />`, mirroring `app/(marketing)/acne/page.tsx`.

No new component is built, no existing component is touched, and no page-specific markup is written — this is
the direct fix for the source site's "every concern is a hand-built Elementor page" scalability problem
(`PROJECT_BLUEPRINT.md` §2 "Scalability Issues").

The same pattern applies to the three legal pages via `LegalPage` + `LegalContent` (`content/legal/types.ts`) if
a 4th legal page were ever needed.

## No-invented-content / TODO-marker discipline

Per `PROJECT_BLUEPRINT.md`'s execution rules, this build never fabricates business-sensitive content (legal
text, prices, clinical claims, contact details, credentials) to fill a gap in the source material. Where the
source WordPress site was missing, inconsistent, or ambiguous, the codebase does one of the following instead of
guessing:

- **`TODO(client-confirm)` / `TODO(client-legal)` code comments** at the exact data site — e.g. `SITE.phones` and
  `SITE.social` in `config/site.ts`, individual clauses in `content/legal/terms.ts` — marking exactly what needs
  client sign-off and why.
- **Visible in-page notices** — e.g. `LegalPage`'s optional `notice` banner prop, used to tell a real site visitor
  (not just a future developer) that the Refund & Cancellation page is pending client approval, or that specific
  Terms clauses contain `[… — pending client input]` placeholders rather than invented numbers.
- **Honest empty states instead of fabricated data** — e.g. `BeforeAfterCarousel` rendering a "coming soon" card
  when `slides` is empty rather than inventing testimonial images; `StatCounter`/Home rendering claim sentences
  and a disclaimer instead of a fabricated percentage where the source site showed a buggy "0%".
- **Section omission over invention** — e.g. `ConcernPageTemplate` skips the entire causes-accordion section for
  Other Issues rather than reusing Acne's causes copy (which the *source* site did, incorrectly) or writing new
  causes copy that was never provided.

Every one of these gaps is compiled into the **"Client open items"** list in `README.md`, so nothing marked this
way is silently forgotten before launch.
