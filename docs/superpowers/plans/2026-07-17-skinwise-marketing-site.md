# Skinwise Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete public, static marketing site for Skinwise (Home, About, 3 concern pages, Contact, 3 legal pages) as a component-driven Next.js App Router app with real client content, SSG throughout, no backend.

**Architecture:** Next.js App Router with a `(marketing)` route group sharing one layout (Navbar + Footer + StickyCTA). All copy lives in a typed content layer (`config/`, `content/`); one canonical component per UI pattern in `components/ui` (primitives) and `components/features` (composed). Concern pages are three thin route files that render one shared `ConcernPageTemplate` fed by per-concern data objects. Everything renders at build time; the only client components are interactive ones (nav drawer, accordion, tabs, carousels, StatCounter, sticky CTA, contact form).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui-style primitives, Framer Motion, React Hook Form + Zod, lucide-react, next/font, next/image. Tests: Vitest + Testing Library, Playwright, @axe-core/playwright.

## Global Constraints

- **Node** ≥ 20. Package manager: **npm**.
- **TypeScript** `strict: true`; no `any` without a documented reason.
- **No backend in this phase** — no Supabase, auth, payments, quiz logic, admin, blog, dark mode, i18n, TanStack Query, analytics. Contact form submit is **stubbed**.
- **Single source of truth for contact info** — every phone/email/WhatsApp value comes from `config/site.ts`. No contact value hardcoded in any component or page.
- **Canonical contact values** (verbatim, marked `TODO(client-confirm)` in config): General `+91 93191 35065`, Product `+91 99587 15003`, Shipment `+91 96501 21669`, email `support@myskinwise.com`, WhatsApp `+91 93191 35065`.
- **`tel:` hrefs** contain no spaces (e.g. `tel:+919319135065`). **WhatsApp** uses `https://wa.me/919319135065`.
- **No invented legal text.** Privacy = real content. Terms = real content minus the Lorem-Ipsum paragraph, with `[currency]`/`[refund window]`/`[jurisdiction]` shown as visible "pending client input" markers. Refund & Cancellation = source empty → page shell with a visible "Content pending client approval" notice.
- **Every `next/image` has explicit `alt` and `sizes`.** `priority` only on above-the-fold hero images.
- **Accessibility:** all interactive elements keyboard-navigable with correct ARIA; honor `prefers-reduced-motion`.
- **SEO:** every page ships `generateMetadata()` (unique title/description, canonical, OG/Twitter). No medical-claim schema.
- **Visual tokens** ("Editorial Apothecary"): canvas cream `#FBF7F4`, card white `#FFFFFF`, accent rose `#E38A9E`, accent-ink (text-on-pink / darkened pink) `#B05A70`, ink `#1A1618`, plus a neutral gray scale. All color tokens are CSS variables. Card radius `rounded-2xl`, CTA/badge `rounded-full`.
- **Commit after every task.** Conventional Commit messages. Co-author trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Content source of truth:** `Assets/WEBSITE_CONTENT.md`. Transcribe real copy; fix the documented content bugs (dedupe blocks, correct "pigmetnation" typo, unify phones).

---

## Task 1: Scaffold Next.js app + tooling

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (temporary), `.env.example`, `README.md`, `vitest.config.ts`, `vitest.setup.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Scaffold**

Run from repo root (the repo already contains `PROJECT_BLUEPRINT.md`, `Assets/`, `docs/`, `.git`):

```bash
npx create-next-app@latest . --ts --app --tailwind --eslint --src-dir=false --import-alias "@/*" --no-turbopack --use-npm --yes
```

If the CLI refuses because the directory is non-empty, scaffold in a temp dir and copy `app/`, config files, and `package.json` over — do **not** overwrite `PROJECT_BLUEPRINT.md`, `Assets/`, `docs/`, `.git`, `.gitignore`.

- [ ] **Step 2: Add dependencies**

```bash
npm i framer-motion react-hook-form zod @hookform/resolvers lucide-react clsx tailwind-merge
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test @axe-core/playwright
npx playwright install chromium
```

- [ ] **Step 3: Configure Vitest**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true, setupFiles: ["./vitest.setup.ts"], include: ["**/*.test.{ts,tsx}"], exclude: ["tests/e2e/**", "node_modules/**"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"e2e": "playwright test"`.

- [ ] **Step 4: Set strict TS**

Ensure `tsconfig.json` `compilerOptions` includes `"strict": true`, `"noUncheckedIndexedAccess": true`.

- [ ] **Step 5: Verify dev server + typecheck**

Run: `npm run build`
Expected: build succeeds (default scaffold page).
Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, Vitest, Playwright"
```

---

## Task 2: Prepare and optimize brand assets

**Files:**
- Create: `public/images/` (curated, renamed images), `content/assets.ts`
- Reference: `Assets/` (source)

**Interfaces:**
- Produces: `content/assets.ts` exporting `IMAGES` — a typed map of semantic keys → `{ src: string; alt: string; width: number; height: number }`. Every consumer imports images from here; no raw `/images/...` string literals in components.

- [ ] **Step 1: Curate**

Copy only brand-relevant files from `Assets/` into `public/images/` with descriptive names. **Exclude** the stray/unrelated files: `Find-Trusted-Maids-*`, `Copy-of-INVOICE-*`, `Brown-Blue-Denim-Jeans-*`. Keep: `skinwise_logo.png` → `public/images/logo.png`; the `ff-*` before/after photos → `before-after-1.jpg` … ; the skincare model photo → `hero-model.jpg`; the `Untitled-design-*`/`1.jpg`/`2.jpg`/`3.jpg` sets → `gallery-1.jpg` … as fits. Record actual pixel dimensions (use any image tool or `sharp`) for `width`/`height`.

- [ ] **Step 2: Author the typed image map**

`content/assets.ts`:
```ts
export type ImageAsset = { src: string; alt: string; width: number; height: number };
export const IMAGES = {
  logo: { src: "/images/logo.png", alt: "Skinwise", width: 320, height: 160 },
  heroModel: { src: "/images/hero-model.jpg", alt: "Woman with clear, healthy, glowing skin", width: 1708, height: 2560 },
  // ...one entry per curated image, each with meaningful alt text (never a filename)
} as const satisfies Record<string, ImageAsset>;
export type ImageKey = keyof typeof IMAGES;
```

- [ ] **Step 3: Test — every image has non-empty, non-filename alt**

`content/assets.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { IMAGES } from "./assets";
describe("IMAGES", () => {
  it("every asset has meaningful alt text", () => {
    for (const [key, a] of Object.entries(IMAGES)) {
      expect(a.alt.trim().length, key).toBeGreaterThan(2);
      expect(a.alt, key).not.toMatch(/\.(png|jpe?g|svg|webp|gif)$/i);
      expect(a.width, key).toBeGreaterThan(0);
      expect(a.height, key).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 4: Run test**

Run: `npm run test -- content/assets.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: curate and type brand image assets"
```

---

## Task 3: Design tokens + globals + fonts

**Files:**
- Modify: `app/globals.css`, `app/layout.tsx`
- Create: `lib/utils.ts`

**Interfaces:**
- Produces: `cn(...inputs)` from `lib/utils.ts`; CSS variables `--color-canvas`, `--color-surface`, `--color-accent`, `--color-accent-ink`, `--color-ink`, `--color-muted`, gray scale `--gray-50..900`; Tailwind theme aliases `bg-canvas`, `text-ink`, `bg-accent`, `text-accent-ink`, `rounded-2xl`, etc.; two font CSS variables `--font-serif` (headings) and `--font-sans` (body).

- [ ] **Step 1: Fonts via next/font**

In `app/layout.tsx`, load an editorial serif for headings and a humanist sans for body. Use `next/font/google` (e.g. `Fraunces` for serif, `Inter` for sans — final choice may change but wire the variables now):
```tsx
import { Fraunces, Inter } from "next/font/google";
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// <html lang="en" className={`${serif.variable} ${sans.variable}`}>
```

- [ ] **Step 2: Tokens in globals.css**

Tailwind v4 `@theme` block mapping CSS variables to utilities:
```css
@import "tailwindcss";
@theme {
  --color-canvas: #FBF7F4;
  --color-surface: #FFFFFF;
  --color-accent: #E38A9E;
  --color-accent-ink: #B05A70;
  --color-ink: #1A1618;
  --color-muted: #6B6469;
  --font-serif: var(--font-serif);
  --font-sans: var(--font-sans);
}
body { background: var(--color-canvas); color: var(--color-ink); font-family: var(--font-sans); }
h1,h2,h3,h4 { font-family: var(--font-serif); }
@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration:.001ms!important; transition-duration:.001ms!important; } }
```

- [ ] **Step 3: `cn` helper**

`lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

- [ ] **Step 4: Verify build renders tokens**

Run: `npm run build && npx tsc --noEmit`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: design tokens, fonts, cn helper"
```

---

## Task 4: Site config — single source of truth

**Files:**
- Create: `config/site.ts`, `config/site.test.ts`

**Interfaces:**
- Produces: `SITE` object with `name`, `legalEntity`, `url`, `email`, `phones: { general, product, shipment }`, `whatsapp` (`{ display, e164 }`), `nav: NavItem[]`, `concerns: { slug, label }[]`, `social`, `copyright`. Helper `telHref(e164)` and `waHref(e164)`.

- [ ] **Step 1: Test the invariants first**

`config/site.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { SITE, telHref, waHref } from "./site";
describe("SITE contact config", () => {
  it("tel hrefs have no spaces and are e164", () => {
    for (const p of Object.values(SITE.phones)) expect(telHref(p.e164)).toMatch(/^tel:\+\d{8,15}$/);
  });
  it("whatsapp link is a valid wa.me url", () => {
    expect(waHref(SITE.whatsapp.e164)).toMatch(/^https:\/\/wa\.me\/\d{8,15}$/);
  });
  it("email is the canonical support address", () => {
    expect(SITE.email).toBe("support@myskinwise.com");
  });
});
```

- [ ] **Step 2: Run — fails (module missing)**

Run: `npm run test -- config/site.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `config/site.ts`**

```ts
export type NavItem = { label: string; href: string; children?: NavItem[] };
type Phone = { label: string; display: string; e164: string };
export const SITE = {
  name: "Skinwise",
  legalEntity: "Razorbill Private Limited",
  url: "https://myskinwise.com",
  email: "support@myskinwise.com",
  // TODO(client-confirm): canonical phone set (Contact-page 3-department split)
  phones: {
    general: { label: "General Inquiries", display: "+91 93191 35065", e164: "+919319135065" },
    product: { label: "Product Queries", display: "+91 99587 15003", e164: "+919958715003" },
    shipment: { label: "Shipment Queries", display: "+91 96501 21669", e164: "+919650121669" },
  } satisfies Record<string, Phone>,
  whatsapp: { display: "+91 93191 35065", e164: "919319135065" },
  concerns: [
    { slug: "pigmentation", label: "Hyperpigmentation" },
    { slug: "acne", label: "Acne" },
    { slug: "other-issues", label: "Other Issues" },
  ],
  nav: [] as NavItem[],
  social: { instagram: "" }, // TODO(client-confirm)
  copyright: "© 2025 Razorbill Private Limited. All Rights Reserved.",
};
SITE.nav = [
  { label: "Home", href: "/" },
  { label: "Our Expertise", href: "/about-us" },
  { label: "Skin Problem", href: "#", children: SITE.concerns.map(c => ({ label: c.label, href: `/${c.slug}` })) },
  { label: "Contact", href: "/contact-us" },
];
export const telHref = (e164: string) => `tel:${e164.replace(/\s/g, "")}`;
export const waHref = (e164: string) => `https://wa.me/${e164.replace(/\D/g, "")}`;
```

- [ ] **Step 4: Run — passes**

Run: `npm run test -- config/site.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: site config as single source of truth for contact info"
```

---

## Task 5: UI primitives — Button, Card, Badge, Section

**Files:**
- Create: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/section.tsx`, `components/ui/button.test.tsx`

**Interfaces:**
- Produces: `<Button variant="primary"|"secondary"|"whatsapp"|"outline" size? asChild?>`; `<Card>`, `<CardBody>`; `<Badge>`; `<Section>` (max-width container + vertical rhythm) and `<Container>`.

- [ ] **Step 1: Test Button variants render accessible element**

`components/ui/button.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
it("renders a button with accessible name", () => {
  render(<Button>Analyse your skin</Button>);
  expect(screen.getByRole("button", { name: "Analyse your skin" })).toBeInTheDocument();
});
it("renders as link when asChild wraps an anchor", () => {
  render(<Button asChild><a href="/x">Go</a></Button>);
  expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute("href", "/x");
});
```

- [ ] **Step 2: Run — fails**

Run: `npm run test -- components/ui/button.test.tsx` → FAIL.

- [ ] **Step 3: Implement primitives**

`button.tsx` — a class-variance-style variant map using `cn`, `asChild` via `Slot` pattern (implement a tiny local `Slot` or clone child with merged className/props; do not add a new dep). Variants:
- `primary`: `bg-accent text-white hover:bg-accent-ink`
- `secondary`: `bg-ink text-white`
- `outline`: `border border-ink/20 text-ink hover:bg-ink/5`
- `whatsapp`: `bg-[#25D366] text-white`
All `rounded-full px-6 py-3 font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2`.
`card.tsx`: `rounded-2xl bg-surface shadow-[0_1px_3px_rgba(0,0,0,.06),0_8px_24px_-12px_rgba(0,0,0,.12)] p-6`.
`section.tsx`: `<Section>` = `<section className="py-16 md:py-24">` + inner `<Container className="mx-auto w-full max-w-6xl px-5">`.
`badge.tsx`: `rounded-full bg-accent/10 text-accent-ink px-3 py-1 text-sm`.

- [ ] **Step 4: Run — passes**

Run: `npm run test -- components/ui/button.test.tsx` → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: base UI primitives (Button, Card, Badge, Section)"
```

---

## Task 6: Accordion primitive (accessible)

**Files:**
- Create: `components/ui/accordion.tsx`, `components/ui/accordion.test.tsx`

**Interfaces:**
- Produces: `<Accordion items={{ id, question, answer }[]} allowMultiple? />`. Each header is a `<button aria-expanded aria-controls>`; panel has `role="region" aria-labelledby`. Keyboard: Enter/Space toggles.

- [ ] **Step 1: Test toggling + ARIA**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "./accordion";
const items = [{ id: "a", question: "Q1", answer: "A1" }, { id: "b", question: "Q2", answer: "A2" }];
it("expands a panel on click and sets aria-expanded", async () => {
  render(<Accordion items={items} />);
  const btn = screen.getByRole("button", { name: "Q1" });
  expect(btn).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("A1")).toBeVisible();
});
```

- [ ] **Step 2: Run — fails.** `npm run test -- components/ui/accordion.test.tsx`
- [ ] **Step 3: Implement** as a `"use client"` component with local `useState` (a `Set` of open ids), unique `id`s for `aria-controls`/`aria-labelledby`, Framer Motion height animation guarded by reduced-motion.
- [ ] **Step 4: Run — passes.**
- [ ] **Step 5: Commit** `git commit -m "feat: accessible Accordion primitive"`

---

## Task 7: Tabs primitive (accessible)

**Files:**
- Create: `components/ui/tabs.tsx`, `components/ui/tabs.test.tsx`

**Interfaces:**
- Produces: `<Tabs tabs={{ id, label, content: ReactNode }[]} />` with `role="tablist"`, `role="tab" aria-selected`, `role="tabpanel"`, arrow-key navigation.

- [ ] **Step 1: Test** — clicking a tab shows its panel and sets `aria-selected="true"`.
- [ ] **Step 2: Run — fails.**
- [ ] **Step 3: Implement** `"use client"`, roving tabindex, arrow-key handler.
- [ ] **Step 4: Run — passes.**
- [ ] **Step 5: Commit** `git commit -m "feat: accessible Tabs primitive"`

---

## Task 8: Navbar (responsive, dropdown, mobile drawer)

**Files:**
- Create: `components/features/navbar.tsx`, `components/features/navbar.test.tsx`

**Interfaces:**
- Consumes: `SITE.nav`, `IMAGES.logo`, `<Button>`.
- Produces: `<Navbar />` — sticky top, logo → `/`, desktop nav with a "Skin Problem" dropdown, mobile hamburger opening a drawer. Includes a header "Analyse your skin" CTA.

- [ ] **Step 1: Test** — renders all top-level nav labels as links; hamburger button present with `aria-label`; clicking it opens a dialog (`role="dialog"`).
- [ ] **Step 2: Run — fails.**
- [ ] **Step 3: Implement** `"use client"`, dropdown on hover/focus (keyboard accessible via focus-within + Escape), mobile drawer as a focus-trapped dialog. Logo uses `next/image` with `priority`.
- [ ] **Step 4: Run — passes.**
- [ ] **Step 5: Commit** `git commit -m "feat: responsive Navbar with dropdown and mobile drawer"`

---

## Task 9: Footer (from config)

**Files:**
- Create: `components/features/footer.tsx`, `components/features/footer.test.tsx`

**Interfaces:**
- Consumes: `SITE` (phones, email, whatsapp, concerns, copyright), `telHref`, `waHref`.
- Produces: `<Footer />` — Support/Product phone lines, email, WhatsApp + Customer-care links, "Visit Links" (Home/About/Contact + 3 concerns), a non-functional "Subscribe" input (visual only, `TODO(subproject-B)` for wiring), legal links (Privacy/Terms/Refund), copyright.

- [ ] **Step 1: Test** — all phone links use `tel:+91...` (no spaces); Home link href is exactly `/`; every legal link present.
```tsx
it("home link points to / not a wp id", () => {
  render(<Footer />);
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
});
it("tel links have no spaces", () => {
  render(<Footer />);
  screen.getAllByRole("link").filter(a => a.getAttribute("href")?.startsWith("tel:"))
    .forEach(a => expect(a.getAttribute("href")).not.toMatch(/\s/));
});
```
- [ ] **Step 2: Run — fails.**
- [ ] **Step 3: Implement** pulling every value from `SITE`. Subscribe input is `<form onSubmit={e=>e.preventDefault()}>` with a disabled/no-op button.
- [ ] **Step 4: Run — passes.**
- [ ] **Step 5: Commit** `git commit -m "feat: Footer sourced from site config"`

---

## Task 10: StickyCTA (tel / wa.me / quiz)

**Files:**
- Create: `components/features/sticky-cta.tsx`, `components/features/sticky-cta.test.tsx`

**Interfaces:**
- Consumes: `SITE`, `telHref`, `waHref`, `<Button>`.
- Produces: `<StickyCTA />` — mobile-first fixed bottom bar (call, WhatsApp, "Analyse your skin"→`/pigmentation`), hidden on `md+` where the header CTA suffices; appears after scroll; respects reduced motion.

- [ ] **Step 1: Test** — WhatsApp link is `https://wa.me/919319135065`; call link is `tel:+919319135065`; "Analyse" link points to a concern route.
- [ ] **Step 2: Run — fails.**
- [ ] **Step 3: Implement** `"use client"` with a scroll listener (throttled) toggling visibility.
- [ ] **Step 4: Run — passes.**
- [ ] **Step 5: Commit** `git commit -m "feat: StickyCTA with working tel and WhatsApp links"`

---

## Task 11: Marketing layout + error/not-found

**Files:**
- Create: `app/(marketing)/layout.tsx`, `app/(marketing)/not-found.tsx`, `app/(marketing)/error.tsx`
- Delete: temporary `app/page.tsx` from scaffold (Home is added in Task 18 under the group)

**Interfaces:**
- Consumes: `<Navbar>`, `<Footer>`, `<StickyCTA>`.
- Produces: shared marketing chrome wrapping all marketing routes.

- [ ] **Step 1: Implement layout**
```tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (<><Navbar /><main id="main">{children}</main><StickyCTA /><Footer /></>);
}
```
- [ ] **Step 2: Implement branded `not-found.tsx` and `error.tsx`** (`"use client"` for error, with a reset button).
- [ ] **Step 3: Move Home** — create a placeholder `app/(marketing)/page.tsx` returning `<Section>Home</Section>` so routing resolves; delete root `app/page.tsx`.
- [ ] **Step 4: Verify** `npm run build` → all routes compile; `/` renders inside nav/footer.
- [ ] **Step 5: Commit** `git commit -m "feat: marketing route-group layout, not-found, error boundaries"`

---

## Task 12: SEO infrastructure (metadata helper, Organization schema, sitemap, robots)

**Files:**
- Create: `config/seo.ts`, `components/features/json-ld.tsx`, `app/sitemap.ts`, `app/robots.ts`
- Modify: `app/layout.tsx` (root metadata + Organization JSON-LD)

**Interfaces:**
- Produces: `buildMetadata({ title, description, path, image? }): Metadata` (sets title, description, canonical `alternates`, OG + Twitter); `<JsonLd data={...} />`; `organizationSchema` (uses `SITE` contact points); dynamic `sitemap()` listing all marketing routes + concern slugs; `robots()` allowing all, pointing to sitemap.

- [ ] **Step 1: Test** — `buildMetadata` returns a canonical matching `SITE.url + path`, and OG title equals the page title.
```ts
import { buildMetadata } from "@/config/seo";
it("sets canonical and og", () => {
  const m = buildMetadata({ title: "T", description: "D", path: "/about-us" });
  expect(m.alternates?.canonical).toBe("https://myskinwise.com/about-us");
  expect((m.openGraph as any)?.title).toBe("T");
});
```
- [ ] **Step 2: Run — fails.**
- [ ] **Step 3: Implement** all four files. `sitemap.ts` maps `["", "about-us", "contact-us", "privacy-policy", "terms-and-conditions", "refund-and-cancellation", ...SITE.concerns.map(c=>c.slug)]` to `{ url, lastModified }`.
- [ ] **Step 4: Run — passes**; `npm run build` emits `/sitemap.xml` and `/robots.txt`.
- [ ] **Step 5: Commit** `git commit -m "feat: SEO infra — metadata helper, Organization schema, sitemap, robots"`

---

## Task 13: FAQ content + FAQSection (with FAQPage schema)

**Files:**
- Create: `content/faqs.ts`, `components/features/faq-section.tsx`, `content/faqs.test.ts`

**Interfaces:**
- Consumes: `<Accordion>`, `<JsonLd>`, `<Section>`.
- Produces: `FAQS` (`generalFaqs`, `pigmentationObjections`, `acneObjections`, `contactFaqs`, each `{ id, question, answer }[]`); `<FAQSection title items emitSchema? />` rendering the accordion + optional `FAQPage` JSON-LD.

- [ ] **Step 1: Transcribe** the real FAQ copy from `WEBSITE_CONTENT.md` §1/§3/§6/§13 into `content/faqs.ts`. The 5 general Q&As are shared. The Contact-page Lorem-Ipsum answer (§13) is replaced with:
  `answer: "We track your progress closely and adjust your formula if needed, so your journey to healthier skin is supported at every step. // TODO(client-review): replace placeholder answer with client-approved copy."`
- [ ] **Step 2: Test** — no FAQ answer contains Latin-filler markers.
```ts
import { FAQS } from "./faqs";
it("contains no lorem ipsum", () => {
  const all = Object.values(FAQS).flat().map(f => f.answer.toLowerCase()).join(" ");
  ["lorem","ipsum","platea","porttitor","raptures declared"].forEach(w => expect(all).not.toContain(w));
});
```
- [ ] **Step 3: Run — fails then implement/verify PASS.**
- [ ] **Step 4: Implement `<FAQSection>`** wrapping `<Accordion>`; when `emitSchema`, render `<JsonLd>` with `@type: FAQPage`.
- [ ] **Step 5: Commit** `git commit -m "feat: FAQ content layer and FAQSection with FAQPage schema"`

---

## Task 14: Content display components — Hero, TrustBadgeStrip, ProcessSteps, ConcernCard

**Files:**
- Create: `components/features/hero.tsx`, `components/features/trust-badge-strip.tsx`, `components/features/process-steps.tsx`, `components/features/concern-card.tsx`, plus `.test.tsx` for `concern-card` and `process-steps`

**Interfaces:**
- Consumes: `<Button>`, `<Card>`, `<Section>`, `next/image`, `IMAGES`.
- Produces:
  - `<Hero image heading subheading ctas={{label, href, variant}[]} />`
  - `<TrustBadgeStrip badges={string[]} />` — CSS marquee, `aria-label`, pauses on `prefers-reduced-motion`
  - `<ProcessSteps steps={{ title, body }[]} heading? />` — numbered
  - `<ConcernCard slug label teaser image />` — CTA → `/${slug}`

- [ ] **Step 1: Test ConcernCard** links to `/pigmentation` and renders teaser + an `alt`'d image.
- [ ] **Step 2: Test ProcessSteps** renders N numbered steps in order.
- [ ] **Step 3: Run — fail, implement, PASS.**
- [ ] **Step 4: Implement** all four. `TrustBadgeStrip` badges from §1 list (100% Natural, Toxin-Free, Vegan-Friendly, Dermatologically Tested, Paraben-Free, Non-Greasy, Sulfate-Free, Cruelty-Free, Safe for all skin types).
- [ ] **Step 5: Commit** `git commit -m "feat: Hero, TrustBadgeStrip, ProcessSteps, ConcernCard"`

---

## Task 15: StatCounter (SSR-safe) + BeforeAfterCarousel

**Files:**
- Create: `components/features/stat-counter.tsx`, `components/features/before-after-carousel.tsx`, `components/features/stat-counter.test.tsx`

**Interfaces:**
- Produces:
  - `<StatCounter value={number} suffix? label />` — **renders the final value in server HTML** (no "0"), animates only as progressive enhancement on the client via IntersectionObserver.
  - `<BeforeAfterCarousel slides={{ before: ImageAsset, after: ImageAsset, caption? }[]} />` — swipeable, lazy images, alt required.

- [ ] **Step 1: Test StatCounter SSR fallback** — rendered output contains the final number text even without triggering animation.
```tsx
import { render, screen } from "@testing-library/react";
import { StatCounter } from "./stat-counter";
it("renders final value in markup (SSR-safe)", () => {
  render(<StatCounter value={92} suffix="%" label="even skin tone" />);
  expect(screen.getByText(/92%/)).toBeInTheDocument();
});
```
- [ ] **Step 2: Run — fails, implement, PASS.** Implementation: render `{value}{suffix}` directly; a `"use client"` effect counts up from 0→value only after mount + in-view, so no-JS users still see the real number (fixes the live "0%" bug).
- [ ] **Step 3: Implement BeforeAfterCarousel** using the `ff-*` before/after images from `IMAGES`; lazy `next/image`, keyboard-navigable prev/next.
- [ ] **Step 4: Commit** `git commit -m "feat: SSR-safe StatCounter and BeforeAfterCarousel"`

---

## Task 16: Home page

**Files:**
- Create: `content/home.ts`, `app/(marketing)/page.tsx`
- Modify: replace the Task 11 placeholder Home

**Interfaces:**
- Consumes: every component from Tasks 13–15, `FAQS.generalFaqs`, `IMAGES`.
- Produces: fully composed Home.

- [ ] **Step 1: Author `content/home.ts`** transcribing §1: hero heading/subheading, 4 value props ("Your Problems, Our Priority" / "Expert Guidance, Every Step of the Way" / "Seamless Service, Happy Journey" / "Results that Speak for Themselves"), "What Difference Does Skinwise bring?" text, Research-Driven Results spotlight (Ashu Sharma — verbatim, `// note: sourced as-is; see founder-naming open item`), 3 concern cards, 4-step process (verbatim 4 steps), stats (4 "Agreed that…" claims + the "28-day third-party clinical study" disclaimer), safety trust section. Type it against interfaces from Task 14.
- [ ] **Step 2: Compose `app/(marketing)/page.tsx`** as a Server Component: `Hero → TrustBadgeStrip → value props grid → What-Difference → Research spotlight → ConcernCard grid → ProcessSteps → gallery strip → BeforeAfterCarousel → StatCounter row → FAQSection(generalFaqs, emitSchema) → safety section`. Export `metadata = buildMetadata({...})`.
- [ ] **Step 3: Smoke test** (Vitest render of the page's exported content or a lightweight component test) that the 4 value-prop titles and all 4 process steps appear.
- [ ] **Step 4: Verify** `npm run build` renders `/`; visually check in `npm run dev`.
- [ ] **Step 5: Commit** `git commit -m "feat: Home page composed from content layer"`

---

## Task 17: About Us page

**Files:**
- Create: `content/about.ts`, `app/(marketing)/about-us/page.tsx`

- [ ] **Step 1: Author `content/about.ts`** from §2 verbatim: heading, Mission, Vision, 5 Core Values, Founder's Story (Anant Sanadhya, full 3 paragraphs), 3 approach pillars.
- [ ] **Step 2: Compose page** — Mission/Vision/Core-Values blocks, founder bio + photo (`IMAGES`), 3-pillar approach. `metadata` with `Person`/Organization context via `buildMetadata` + optional `<JsonLd>`.
- [ ] **Step 3: Test** — page content module exports all 5 core values and the founder name.
- [ ] **Step 4: Verify build; Step 5: Commit** `git commit -m "feat: About Us page"`

---

## Task 18: IngredientScience component + concern content data

**Files:**
- Create: `components/features/ingredient-science.tsx`, `content/concerns/types.ts`, `content/concerns/pigmentation.ts`, `content/concerns/acne.ts`, `content/concerns/other-issues.ts`, `content/concerns/index.ts`, `content/concerns/concerns.test.ts`

**Interfaces:**
- Consumes: `<Tabs>`, `<Accordion>`.
- Produces:
  - `ConcernContent` type: `{ slug, label, hero: {heading, subheading}, whatIs: {title, body}, causes: {title, body}[], types: {name, body}[], science: {title, body}[] | string[], ingredientsByType: { tabLabel, items: string[] }[], process: {title, body}[], objectionFaqs: FaqItem[] }`.
  - `CONCERNS: Record<Slug, ConcernContent>` from `index.ts`.
  - `<IngredientScience groups={{ tabLabel, items }[]} />`.

- [ ] **Step 1: Author the three data files** transcribing §3 (pigmentation), §6 (acne), §9 (other-issues) — verbatim causes, "which one looks like yours" types, science steps, research-driven ingredients (as tabbed groups), 4-step process, objection FAQs. **Dedupe** the causes blocks (source duplicates them). For other-issues, use the live version's copy and **omit the copy-pasted acne causes block** (flagged content-accuracy fix) — leave a `// TODO(client): other-issues-specific causes copy` note where source lacked original content.
- [ ] **Step 2: Test** — each concern has ≥1 cause, ≥1 type, non-empty process, and objection FAQs; no "pigmetnation" typo present.
```ts
import { CONCERNS } from "./index";
it("each concern is well-formed and typo-free", () => {
  for (const c of Object.values(CONCERNS)) {
    expect(c.causes.length).toBeGreaterThan(0);
    expect(c.process.length).toBe(4);
    expect(JSON.stringify(c)).not.toMatch(/pigmetnation/i);
  }
});
```
- [ ] **Step 3: Run — fail, fix, PASS.**
- [ ] **Step 4: Implement `<IngredientScience>`** as tabbed groups.
- [ ] **Step 5: Commit** `git commit -m "feat: concern content data + IngredientScience component"`

---

## Task 19: Concern page template + three routes

**Files:**
- Create: `components/features/concern-page-template.tsx`, `app/(marketing)/pigmentation/page.tsx`, `app/(marketing)/acne/page.tsx`, `app/(marketing)/other-issues/page.tsx`

**Interfaces:**
- Consumes: `CONCERNS`, all display components, `FAQS.generalFaqs` + per-concern objections.
- Produces: `<ConcernPageTemplate content={ConcernContent} />`; each route file is a thin wrapper exporting `metadata` + rendering the template with its data.

- [ ] **Step 1: Implement template** composing: `Hero(quiz CTA → /quiz/${slug}) → whatIs → causes Accordion → types gallery → IngredientScience → science steps → ProcessSteps → BeforeAfterCarousel → FAQSection(general, emitSchema) → FAQSection(objections)`. Include `<Breadcrumb>` + `BreadcrumbList` JSON-LD.
- [ ] **Step 2: Implement the 3 route files**, e.g.:
```tsx
import { ConcernPageTemplate } from "@/components/features/concern-page-template";
import { CONCERNS } from "@/content/concerns";
import { buildMetadata } from "@/config/seo";
export const metadata = buildMetadata({ title: "Hyperpigmentation Treatment | Skinwise", description: "...", path: "/pigmentation" });
export default function Page() { return <ConcernPageTemplate content={CONCERNS.pigmentation} />; }
```
- [ ] **Step 3: E2E-lite test** — render template with pigmentation data, assert hero CTA href is `/quiz/pigmentation` and a known cause title appears.
- [ ] **Step 4: Verify build** renders all three routes.
- [ ] **Step 5: Commit** `git commit -m "feat: shared concern page template + pigmentation/acne/other-issues routes"`

---

## Task 20: Breadcrumb component

**Files:**
- Create: `components/features/breadcrumb.tsx`, `components/features/breadcrumb.test.tsx`

**Interfaces:**
- Produces: `<Breadcrumb items={{ label, href }[]} />` — `<nav aria-label="Breadcrumb">` + emits `BreadcrumbList` JSON-LD. (Extract if Task 19 inlined it; otherwise build here first and consume in Task 19 — build order: do this before Task 19's Step 1.)

- [ ] **Step 1: Test** — renders an ordered list of links; last item is `aria-current="page"`.
- [ ] **Step 2: Run — fail, implement, PASS.**
- [ ] **Step 3: Commit** `git commit -m "feat: Breadcrumb with BreadcrumbList schema"`

> **Note:** sequence Task 20 before Task 19 during execution (Task 19 consumes it).

---

## Task 21: ContactForm (RHF + Zod, stubbed submit)

**Files:**
- Create: `lib/validation/contact.ts`, `components/features/contact-form.tsx`, `lib/validation/contact.test.ts`, `components/features/contact-form.test.tsx`

**Interfaces:**
- Produces: `contactSchema` (Zod: `name` min 2, `email` valid, `message` min 10); `<ContactForm />` — RHF + zodResolver; on valid submit calls `submitContactStub(data)` returning `{ success: true }` after a short delay, then shows a success panel. Includes a `mailto:` fallback link. `// TODO(subproject-B): replace stub with real Server Action`.

- [ ] **Step 1: Test schema** — rejects short message, bad email; accepts valid input.
- [ ] **Step 2: Test form** — submitting empty shows validation errors; submitting valid input shows the success message (await).
- [ ] **Step 3: Run — fail, implement, PASS.**
- [ ] **Step 4: Commit** `git commit -m "feat: ContactForm with RHF+Zod validation and stubbed submit"`

---

## Task 22: Contact page

**Files:**
- Create: `content/contact.ts`, `app/(marketing)/contact-us/page.tsx`

- [ ] **Step 1: Author `content/contact.ts`** from §13: "Need Help?" / "Get In Touch with Skinwise" heading + intro; the 3 phone-support lines **sourced from `SITE.phones`** (not re-hardcoded); email; contact FAQ = `FAQS.contactFaqs`.
- [ ] **Step 2: Compose page** — header, phone/email/WhatsApp contact methods (from `SITE`), `<ContactForm>`, `<FAQSection items={FAQS.contactFaqs} emitSchema>`. `metadata`.
- [ ] **Step 3: Test** — page surfaces all three department phone numbers from config.
- [ ] **Step 4: Verify; Step 5: Commit** `git commit -m "feat: Contact page"`

---

## Task 23: Legal pages (Privacy, Terms, Refund)

**Files:**
- Create: `content/legal/privacy.ts`, `content/legal/terms.ts`, `content/legal/refund.ts`, `components/features/legal-page.tsx`, `app/(marketing)/privacy-policy/page.tsx`, `app/(marketing)/terms-and-conditions/page.tsx`, `app/(marketing)/refund-and-cancellation/page.tsx`, `content/legal/legal.test.ts`

**Interfaces:**
- Produces: `<LegalPage title sections={{ heading?, body }[]} notice? />`; typed legal content.

- [ ] **Step 1: Author content**
  - `privacy.ts` — real content from §15 verbatim (Information We Collect / How We Use / Sharing / Data Security / Contact).
  - `terms.ts` — real content from §16 verbatim, **the Lorem-Ipsum paragraph omitted**, and the three placeholders rendered as literal visible markers: `currency: "[currency — pending client input]"`, `refundWindow: "[refund window — pending client input]"`, `jurisdiction: "[jurisdiction — pending client input]"`. Include a top-of-page `notice` = "Some clauses are pending final legal input and are marked accordingly."
  - `refund.ts` — source empty → `sections: []`, `notice: "This policy is pending client approval and will be published before launch."` No invented policy.
- [ ] **Step 2: Test** — `terms` contains no "lorem"/"platea"/"porttitor"; `refund` has the pending-approval notice and zero fabricated policy sections; `privacy` includes "Information We Collect".
```ts
import { PRIVACY, TERMS, REFUND } from "./index";
it("terms has no lorem ipsum and shows placeholder markers", () => {
  const t = JSON.stringify(TERMS).toLowerCase();
  ["lorem","ipsum","platea","porttitor"].forEach(w => expect(t).not.toContain(w));
  expect(t).toContain("pending client input");
});
it("refund invents no policy", () => { expect(REFUND.sections.length).toBe(0); expect(REFUND.notice).toMatch(/pending client approval/i); });
```
- [ ] **Step 3: Run — fail, implement, PASS.**
- [ ] **Step 4: Implement `<LegalPage>`** (renders `notice` banner when present) + the three thin routes with `metadata`.
- [ ] **Step 5: Commit** `git commit -m "feat: legal pages (real Privacy, cleaned Terms, pending Refund) with no invented text"`

---

## Task 24: E2E, accessibility, and Lighthouse CI

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/a11y.spec.ts`, `.lighthouserc.json`, `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the running app (`npm run build && npm run start`).

- [ ] **Step 1: Playwright config** — `webServer` runs `npm run build && npm run start` on port 3000; project = chromium + a mobile viewport project.
- [ ] **Step 2: `smoke.spec.ts`** — for each route in `["/", "/about-us", "/pigmentation", "/acne", "/other-issues", "/contact-us", "/privacy-policy", "/terms-and-conditions", "/refund-and-cancellation"]`: page responds 200, has a unique `<title>`, `h1` visible. Assert nav "Skin Problem" dropdown reveals 3 concern links; mobile drawer opens. Assert every `tel:` href matches `/^tel:\+\d+$/` and a `wa.me` link exists. Fill+submit the contact form → success panel.
- [ ] **Step 3: `a11y.spec.ts`** — run `@axe-core/playwright` against each route; assert no serious/critical violations.
- [ ] **Step 4: Lighthouse CI** — `.lighthouserc.json` asserts mobile Performance ≥ 0.9, Accessibility ≥ 0.95 on the marketing routes. Wire into `ci.yml` alongside `npm run test`, `npx tsc --noEmit`, `npm run e2e`.
- [ ] **Step 5: Run** `npm run build && npm run e2e` locally → PASS (fix any real a11y/perf issues surfaced).
- [ ] **Step 6: Commit** `git commit -m "test: E2E smoke, axe a11y, and Lighthouse CI"`

---

## Task 25: Documentation + README + final review

**Files:**
- Create/Modify: `README.md`, `documentation/COMPONENTS.md`, `documentation/ARCHITECTURE.md`, `.env.example`

- [ ] **Step 1: README** — setup, `npm run dev/build/test/e2e`, env vars (none required for A), asset-swap instructions, the Section-12 open-items list for the client.
- [ ] **Step 2: COMPONENTS.md** — catalog every `components/ui` + `components/features` component with props + one usage example.
- [ ] **Step 3: ARCHITECTURE.md** — content-layer pattern, route-group layout, SSG strategy, "add a 4th concern = one data file" note.
- [ ] **Step 4: Full verify** — `npm run test && npx tsc --noEmit && npm run build && npm run e2e` all green.
- [ ] **Step 5: Commit** `git commit -m "docs: README, COMPONENTS, ARCHITECTURE for marketing site"`

---

## Self-Review

**Spec coverage:** Scaffold+tooling (T1) ✓; assets (T2) ✓; tokens/fonts (T3) ✓; contact single-source (T4, verified in T9/T22) ✓; primitives Button/Card/Accordion/Tabs/Badge/Section (T5–T7) ✓; Navbar/Footer/StickyCTA (T8–T10) ✓; layout+error/not-found (T11) ✓; SEO metadata/schema/sitemap/robots (T12) ✓; FAQ + FAQPage schema + Lorem-Ipsum fix (T13) ✓; Hero/TrustBadge/ProcessSteps/ConcernCard (T14) ✓; SSR-safe StatCounter + BeforeAfterCarousel (T15) ✓; Home (T16); About + founder-as-sourced (T17); concern data + dedupe + typo fix + IngredientScience (T18); concern template + 3 routes + quiz-CTA link (T19); Breadcrumb + schema (T20); ContactForm RHF+Zod stub (T21); Contact page (T22); legal pages with no invented text (T23); E2E + axe + Lighthouse (T24); docs (T25). All spec §1–§11 requirements mapped. Open items (spec §12) surfaced in README (T25).

**Build-order note:** Execute **T20 before T19** (template consumes Breadcrumb). All other tasks are in dependency order.

**Placeholder scan:** `TODO(...)` markers in the plan are intentional, client-facing content gaps (phones, legal, contact FAQ, quiz wiring) — each is explicitly justified and required by the spec's no-invented-content rule, not a plan gap.

**Type consistency:** `ImageAsset`/`IMAGES` (T2) consumed consistently; `FaqItem` shape `{id,question,answer}` used in T6/T13/T18; `ConcernContent` defined T18, consumed T19; `buildMetadata` signature stable T12→pages; `telHref`/`waHref` stable T4→T9/T10/T22.
