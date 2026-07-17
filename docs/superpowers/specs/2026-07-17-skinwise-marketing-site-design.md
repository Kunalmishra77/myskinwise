# Skinwise Marketing Site — Design Spec (Sub-project A)

**Date:** 2026-07-17
**Status:** Draft for review
**Parent docs:** [`PROJECT_BLUEPRINT.md`](../../../PROJECT_BLUEPRINT.md), [`Assets/WEBSITE_CONTENT.md`](../../../Assets/WEBSITE_CONTENT.md)
**Owner:** Razorbill Private Limited (myskinwise.com)

---

## 1. Purpose & Scope

This spec covers **Sub-project A** only: the public, static marketing site — the first of four sub-projects the blueprint decomposes into.

| Sub-project | Covers | Status |
|---|---|---|
| **A. Foundation + Marketing Site** ← *this spec* | Scaffold, design system, reusable component library, all public marketing + legal pages, SEO, performance | Buildable now |
| B. Quiz Engine | `/quiz/[concern]` multi-step UI + submission | UI later; persistence needs Supabase |
| C. Backend + Admin + Payments | Supabase schema/RLS/auth, leads/admin CRM, product-regimen + Razorpay `₹500` deposit funnel | Blocked on Supabase + payment credentials |
| D. Launch | 301 redirect map, DNS cutover, monitoring | After A–C + domain decision |

**In scope (pages):** Home, About Us, Pigmentation, Acne, Other Issues, Contact Us, Privacy Policy, Terms & Conditions, Refund & Cancellation.

**Explicitly out of scope for A:** the quiz form itself, product/regimen pages, Book-Appointment/payment page, WooCommerce/Razorpay, Supabase, admin, auth, blog. Concern-page CTAs *link to* `/quiz/[concern]` (a placeholder route in A) rather than embedding the quiz.

### Success criteria
- Every marketing page renders real, approved content from a typed content layer.
- One canonical component per UI pattern — zero copy-paste duplication (the core WordPress lesson).
- Single source of truth for contact info (permanently fixes the 5+ inconsistent phone numbers).
- SSG throughout; deploys to Vercel with no backend.
- Lighthouse mobile ≥ 90 on marketing pages; WCAG 2.1 AA baseline; complete per-page metadata.
- Contact form has full client-side validation with a stubbed submit (wired to a backend in Sub-project B).

---

## 2. Content source of truth

All copy comes from `Assets/WEBSITE_CONTENT.md` (client's WordPress CSV export — real, not placeholder). Content is transcribed into a **typed content layer**, not hardcoded in JSX:

- `config/site.ts` — nav, contact info (phones/email/WhatsApp), social links, legal entity, copyright.
- `content/home.ts`, `content/about.ts`, `content/concerns/*.ts`, `content/contact.ts`, `content/legal/*.ts` — page copy as typed objects.
- `content/faqs.ts` — the shared 5 general FAQs + per-page objection-handling FAQs.
- `content/concerns/*` — one data object per concern (pigmentation/acne/other-issues) driving a shared concern-page template.

### Content-integrity fixes applied during transcription (fix, don't carry over)
1. **Phone numbers unified** to the Contact page's 3-department set (canonical unless client corrects):
   - General `+91 93191 35065`, Product `+91 99587 15003`, Shipment `+91 96501 21669`, email `support@myskinwise.com`.
   - `TODO(client-confirm)` marker in `config/site.ts`.
2. **Duplicated blocks removed** — causes accordions and FAQ blocks are single, data-driven arrays.
3. **`tel:` links** rendered correctly (no spaces) from the config.
4. **Footer "Home" link** → `/` (never `?page_id=`).
5. **Contact FAQ Lorem-Ipsum answer** → replaced with a written, on-brand answer marked `TODO(client-review)`; not silently shipped.
6. Typos in source (e.g. "pigmetnation") corrected in display copy.

### Legal pages — no invented legal text
- **Privacy Policy** — real content transcribed as-is.
- **Terms & Conditions** — real content transcribed; the live Lorem-Ipsum paragraph is removed; `[currency]`, `[refund window]`, `[jurisdiction]` rendered as visible **"pending client input"** markers, not fabricated values.
- **Refund & Cancellation** — source is empty (0 bytes). Page shell is built with a visible "Content pending client approval" notice. No policy text is invented. Flagged as a launch blocker for the client.

### Founder representation
Rendered exactly as the content states, and flagged: About Us → founder **Anant Sanadhya**; Home "Research-Driven Results" → **Ashu Sharma, Skin Specialist**. No correction invented.

---

## 3. Visual design — "Editorial Apothecary"

Derived from the logo (rose-pink editorial serif wordmark) and the warm, natural skin photography in `Assets/`.

- **Color tokens** (CSS variables, enabling later dark mode without rework):
  - Canvas: warm cream / off-white (`~#FBF7F4`), pure white for cards.
  - Accent (primary/CTA): rose-pink `~#E38A9E` (sampled from logo; exact value locked during token setup, verified for WCAG AA on its intended backgrounds — pink CTAs use dark text or a darkened pink for text-on-pink).
  - Ink: near-black `~#1A1618` for headings/body.
  - Neutral gray scale for secondary text, borders, muted surfaces.
  - Support/WhatsApp green for the WhatsApp CTA variant only.
- **Typography:** editorial serif for headings (matches the wordmark's character), clean humanist sans for body/UI (legible at small sizes for mobile-heavy traffic). Loaded via `next/font` (zero layout shift). Exact families finalized at token setup; must pass AA contrast.
- **Shape/space:** generous whitespace, `rounded-xl`/`rounded-2xl` cards, `rounded-full` CTAs/badges, subtle layered shadows only (no heavy drop-shadows).
- **Motion:** Framer Motion for restrained section reveals + the sticky CTA; respects `prefers-reduced-motion`. GSAP not used in A.
- **Dark mode:** not built in A, but token structure must not block it later.
- **Design method:** the `ui-ux-pro-max` skill informs palette/typography/component execution at build time.

---

## 4. Information architecture & routing

App Router, route group `(marketing)` for shared nav/footer layout.

```
/                     Home
/about-us             About Us
/pigmentation         Concern landing
/acne                 Concern landing
/other-issues         Concern landing
/contact-us           Contact
/privacy-policy        Legal
/terms-and-conditions  Legal
/refund-and-cancellation Legal
/quiz/[concern]       Placeholder route in A (real build in B) — CTA target
```

- All marketing routes are **SSG** (`generateStaticParams` for concern pages driven by the concerns data).
- Header nav mirrors current IA: Home / About (Our Expertise) / Skin Problem dropdown [Hyperpigmentation, Acne, Other Issues] / Contact. Sticky, responsive.
- Persistent **StickyCTA**: "Analyse your skin" (→ concern/quiz), working `tel:` link, and WhatsApp deep link (`https://wa.me/91XXXXXXXXXX`).
- Footer: single source of truth for contact info + nav + legal links.

---

## 5. Component architecture

One canonical version each; primitives in `components/ui/`, composed business components in `components/features/`.

**Primitives (`components/ui/`)**
`Button` (primary | secondary | whatsapp | outline) · `Card` · `Accordion` (accessible; powers FAQ + causes) · `Tabs` (ingredient-science sub-types) · `Badge` · `Container`/`Section` layout wrappers · `Modal`/`Drawer` (shadcn-based, for mobile nav).

**Composed (`components/features/`)**
`Navbar` · `Footer` · `StickyCTA` · `Hero` (image/carousel + heading + CTA row) · `TrustBadgeStrip` (marquee, data-driven) · `ConcernCard` · `ProcessSteps` (numbered) · `FAQSection` (wraps Accordion + emits FAQPage schema) · `StatCounter` (count-up, **SSR-safe** — final number renders without JS, animation progressive; fixes the "0%" bug) · `BeforeAfterCarousel` (swipeable, lazy, alt required) · `TestimonialCarousel` · `IngredientScience` (tabbed per concern) · `ContactForm` (RHF + Zod, stubbed submit) · `Breadcrumb`.

**Reuse rule:** concern pages (pigmentation/acne/other-issues) are one `ConcernPageTemplate` fed by per-concern data objects — adding a 4th concern later = one new data file, no new page.

---

## 6. Data flow

Static content objects → Server Components → rendered HTML at build. No client data fetching in A.

- `ContactForm` is a client component: RHF + Zod validates; on submit it calls a **stubbed action** that resolves success and shows the confirmation state. A `TODO(subproject-B)` marks the real submission wiring. A `mailto:` fallback link is also present so the page is functional pre-backend.
- `StatCounter`, carousels, accordions, mobile nav, sticky CTA are client components; everything else is server-rendered.

---

## 7. Error handling & edge cases

- `not-found.tsx` and `error.tsx` boundaries in the marketing group, brand-styled.
- Invalid `/quiz/[concern]` → 404 for unknown concerns via `generateStaticParams` + `notFound()`.
- Images: every `next/image` has explicit `alt` (content-model requirement) and `sizes`; missing-asset slots use a branded placeholder component, never a broken image.
- Contact form: inline field errors, disabled submit while pending, success + error states.
- Reduced motion honored globally.

---

## 8. SEO & performance

- Per-page `generateMetadata()` — unique title/description, canonical, OG + Twitter cards.
- Schema.org: `Organization` sitewide (unified contact points), `FAQPage` on Home + concern pages + Contact, `BreadcrumbList` on inner pages. **No medical-claim schema** (deferred pending legal review, per blueprint).
- `app/sitemap.ts` + `app/robots.ts` generated from the concerns/pages data.
- `next/image` (AVIF/WebP, responsive `sizes`, `priority` only on above-the-fold hero); `next/font`; per-route code splitting; below-fold carousels lazy-loaded.
- Asset hygiene: stray unrelated files in `Assets/` (maids banner, invoice scans, denim-sale banners) are excluded; used images get descriptive filenames + alt text.
- Target: Lighthouse mobile ≥ 90 on every marketing page.

---

## 9. Folder structure (A subset of blueprint Section 8)

```
skinwise/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                      # Home
│   │   ├── about-us/page.tsx
│   │   ├── [concern pages]/page.tsx      # via template
│   │   ├── contact-us/page.tsx
│   │   ├── privacy-policy/page.tsx
│   │   ├── terms-and-conditions/page.tsx
│   │   ├── refund-and-cancellation/page.tsx
│   │   ├── layout.tsx                     # Navbar + Footer + StickyCTA
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   ├── quiz/[concern]/page.tsx            # placeholder in A
│   ├── layout.tsx                         # root: fonts, providers
│   ├── sitemap.ts · robots.ts · globals.css
├── components/ui/ · components/features/
├── config/           # site.ts, seo.ts
├── content/          # typed page/FAQ/concern content
├── lib/              # utils, cn()
├── types/
├── public/images/    # optimized assets
└── docs/ · tests/
```

---

## 10. Testing (A scope)

- **Unit (Vitest):** Zod schemas, content-integrity invariants (e.g. all phone numbers resolve from config; every image has alt).
- **Component:** Accordion keyboard/ARIA, StatCounter SSR fallback, ContactForm validation.
- **E2E (Playwright):** each page renders, nav + dropdown + mobile drawer work, sticky CTA links (`tel:`/`wa.me`) are well-formed, contact form validation flow.
- **A11y:** axe-core on every page in CI.
- **Perf:** Lighthouse CI on marketing pages (fail below threshold).

---

## 11. Explicit non-goals (YAGNI for A)

No Supabase, auth, admin, quiz logic, payments, blog, dark mode, i18n, TanStack Query, analytics wiring. These belong to later sub-projects and are not scaffolded prematurely.

---

## 12. Open items carried to the client (non-blocking for build, blocking for launch)

1. Confirm canonical phone numbers (using Contact-page 3-department set).
2. Provide real Refund & Cancellation policy text.
3. Fill Terms placeholders: currency, refund window, jurisdiction; approve removal of Lorem-Ipsum paragraph.
4. Approve the written replacement for the Contact FAQ Lorem-Ipsum answer.
5. Resolve founder naming (Anant Sanadhya vs. Ashu Sharma spotlight) — currently both shown as sourced.
6. Confirm which Other-Issues version is canonical (live vs. the more-developed June-19 draft).
7. WhatsApp number for `wa.me` deep link.
8. Additional/higher-res assets (2k+ available) to replace starter images over time.
```
