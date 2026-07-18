# Skinwise Marketing Site

The public marketing site for [myskinwise.com](https://myskinwise.com) — Home, About Us, the three skin-concern
landing pages (Hyperpigmentation, Acne, Other Issues), Contact, and legal pages. Built with Next.js (App Router)
and TypeScript.

This is **Sub-project A** of the larger Skinwise WordPress → Next.js rebuild described in
[`PROJECT_BLUEPRINT.md`](./PROJECT_BLUEPRINT.md). Sub-project A covers the static/SSG marketing surface only — no
backend, no database, no authentication. The multi-step quiz engine (Supabase-backed leads), the admin panel, and
any payment/checkout flow are out of scope here and land in **Sub-projects B and C**.

## Tech stack

- **Next.js 16** (App Router, React Server Components) + **React 19**
- **TypeScript**, `strict: true`, `noUncheckedIndexedAccess: true`
- **Tailwind CSS v4** for styling, with a small set of hand-built shadcn-style primitives in `components/ui`
  (no `shadcn/ui` CLI dependency — the primitives are written directly against Tailwind + `clsx`/`tailwind-merge`)
- **Framer Motion** for the interactive animations that need it (accordion collapse, sticky CTA slide-in, stat
  count-up), used sparingly and always respecting `prefers-reduced-motion`
- **React Hook Form + Zod** for client-side form validation (Contact form)
- **Vitest** + **Testing Library** for unit/component tests
- **Playwright** + **`@axe-core/playwright`** for end-to-end and automated accessibility tests
- **Lighthouse CI** wired into the project's CI pipeline for performance regressions

## Prerequisites

- **Node.js ≥ 20**
- **npm** (the repo is built and tested against npm; the lockfile is `package-lock.json`)

## Getting started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:3000`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build (`next build`) |
| `npm run start` | Serve the production build (`next start`) — run `build` first |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |
| `npm run test` | Run the Vitest unit/component suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run e2e` | Run the Playwright end-to-end + accessibility suite |

Type-checking isn't wrapped in an npm script; run it directly with `npx tsc --noEmit`.

## Environment variables

**None are required to run or build this phase of the site.** Sub-project A is fully static/SSG content — there is
no database, no auth, and no third-party API calls at build or runtime.

`.env.example` documents (commented out, as placeholders) the variables that **Sub-projects B and C** will need —
Supabase project keys for the quiz/lead engine and admin panel, and payment-provider keys if/when checkout is
added. Do not un-comment or invent values for any of these until the client provides real credentials; see
`PROJECT_BLUEPRINT.md` §11 and §23 rule 12.

## Project structure

See [`documentation/ARCHITECTURE.md`](./documentation/ARCHITECTURE.md) for the full breakdown. In short:

- `app/(marketing)/` — every public marketing route, sharing one layout (`Navbar` + `StickyCTA` + `Footer`)
- `components/ui/` — small, generic primitives (Button, Card, Badge, Section/Container, Accordion, Tabs)
- `components/features/` — composed, business-specific components (Navbar, Footer, Hero, ConcernPageTemplate, …)
  — see [`documentation/COMPONENTS.md`](./documentation/COMPONENTS.md) for the full catalog with props and usage
- `config/` — single-source-of-truth site config (`site.ts`: nav, contact info, phone/WhatsApp links) and SEO
  helpers (`seo.ts`: `buildMetadata`, `organizationSchema`)
- `content/` — typed page copy and data (`home.ts`, `about.ts`, `contact.ts`, `faqs.ts`, `assets.ts`,
  `concerns/*`, `legal/*`)
- `lib/` — utilities (`cn` helper) and Zod validation schemas

## Swapping in real brand assets

All images are declared once, centrally, in [`content/assets.ts`](./content/assets.ts) as an `IMAGES` map of
`{ src, alt, width, height }` objects — nothing in the app references a raw file path directly. To replace a
placeholder asset with the real one:

1. Drop the new file into `public/images/` (keep or update the filename — your choice).
2. Update that image's entry in `content/assets.ts`: point `src` at the new `/images/...` path, and set `width`/
   `height` to the file's real intrinsic dimensions (required by `next/image` to prevent layout shift). Update
   `alt` to accurately describe the new image.
3. Nothing else needs to change — every component that renders that image (`Hero`, `ConcernCard`,
   `BeforeAfterCarousel`, `Navbar`/`Footer` logo, etc.) reads from the same `IMAGES` entry.

To add a **new** image asset (e.g. a founder portrait, real before/after photos), add a new key to the `IMAGES`
object in `content/assets.ts` with the same shape, then reference `IMAGES.yourNewKey` from the component/content
file that needs it.

---

## Client open items (blocking launch, not the build)

Everything below is a **content, legal, or asset gap** — not a code defect. The build follows a strict
no-invented-content rule: anywhere the source WordPress site was missing, inconsistent, or ambiguous, the app
renders an honest placeholder or a `TODO(client-confirm)` / `TODO(client-legal)` marker in the source rather than
fabricating copy. These items must be resolved with the client before launch:

1. **Confirm canonical phone numbers** — currently the Contact-page 3-department set (General +91 93191 35065 /
   Product +91 99587 15003 / Shipment +91 96501 21669) in `config/site.ts` (marked `TODO(client-confirm)`); the
   source site had 5+ inconsistent numbers.
2. **Provide the real Refund & Cancellation policy text** — source page was empty; the page currently shows a
   "pending client approval" notice (no policy invented).
3. **Terms & Conditions**: supply currency, refund window, and governing jurisdiction (rendered as
   `[… — pending client input]` markers); confirm removal of the source's Lorem-Ipsum paragraph; and verify each
   clause's wording against the client's real approved Terms (clauses were transcribed from a bullet-summary
   source — see `TODO(client-legal)` markers).
4. **Approve the rewritten Contact FAQ answer** that replaced live Lorem-Ipsum, and confirm the 3 inferred
   Contact-page FAQ questions (source captured answers only).
5. **Resolve founder naming**: Home spotlights "Ashu Sharma, Skin Specialist"; About Us names founder "Anant
   Sanadhya" — both rendered as sourced.
6. **Confirm which Other Issues version is canonical** (live vs. the more-developed June-19 draft) and provide
   Other-Issues-specific "causes" copy (source reused Acne's causes — currently omitted with a TODO).
7. **Provide the WhatsApp business number** for the `wa.me` deep link (currently reuses the general phone).
8. **Provide real before/after testimonial images** (none exist in current assets — the results carousel shows a
   placeholder) and higher-res brand assets; also a real **founder portrait** of Anant Sanadhya (About page
   currently omits a photo).
9. **Confirm/replace the hero headlines** for Home, Acne, and Other Issues (no verbatim source existed —
   paraphrased/inferred, marked `TODO(client-confirm)`).
10. **Provide the real clinical-study percentages** for the Home "results" claims (the live site shows a buggy
    0%; we render the claim sentences + 28-day disclaimer as text, no fabricated numbers).
11. **Provide social links** (Instagram etc.) — `config/site.ts` `social` is a `TODO(client-confirm)` placeholder.
12. **Legal/compliance: DPDP Act review** of the Privacy Policy (it collects "Previous Medical History"/"Present
    Ailments" — sensitive health data).
