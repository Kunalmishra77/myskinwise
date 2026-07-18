# Component catalog

Every component below lives in `components/ui/` (generic primitives) or `components/features/` (composed,
business-specific components). "Server" vs "Client" reflects whether the file has a `"use client"` directive.

Import paths use the `@/*` alias (`tsconfig.json` maps `@/*` → project root), e.g. `@/components/ui/button`.

---

## `components/ui/` — primitives

### `Button`

`components/ui/button.tsx` — Server component (no `"use client"`; behavior is plain DOM/CSS, no hooks).

The one button primitive for the whole site — pill-shaped, four variants, and an `asChild` escape hatch to render
as a `<Link>` (or any other single element) instead of a `<button>` while keeping the same visual styling.

```ts
export type ButtonVariant = "primary" | "secondary" | "outline" | "whatsapp";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;      // default "primary"
  asChild?: boolean;            // render the single child element instead of <button>
}
```

Usage:

```tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

<Button variant="primary">Send message</Button>

// As a styled link:
<Button asChild variant="outline">
  <Link href="/pigmentation">Learn more</Link>
</Button>
```

### `Card` / `CardBody`

`components/ui/card.tsx` — Server component.

Generic rounded card shell (`Card`) with an optional unstyled body wrapper (`CardBody`) for cases that need a
plain content container inside the card padding. Both simply extend `React.HTMLAttributes<HTMLDivElement>` — no
custom props beyond the standard `className`/children.

```tsx
import { Card, CardBody } from "@/components/ui/card";

<Card>
  <CardBody>
    <h3>Melasma</h3>
    <p>Patchy brown or greyish patches, usually on the face.</p>
  </CardBody>
</Card>
```

### `Badge`

`components/ui/badge.tsx` — Server component.

Small rounded pill of text (`<span>`), e.g. for tags/labels. `React.HTMLAttributes<HTMLSpanElement>` — no custom
props.

```tsx
import { Badge } from "@/components/ui/badge";

<Badge>Dermatologist-formulated</Badge>
```

### `Section` / `Container`

`components/ui/section.tsx` — Server component.

`Container` centers content with a max width and horizontal padding. `Section` wraps a `<section>` with vertical
padding around an inner `Container` — the standard page-section wrapper used by nearly every page and feature
component in this codebase.

```ts
export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  containerClassName?: string; // extra classes for the inner <Container>
}
```

```tsx
import { Section } from "@/components/ui/section";

<Section className="bg-surface">
  <h2>What is hyperpigmentation?</h2>
  <p>…</p>
</Section>
```

### `Accordion`

`components/ui/accordion.tsx` — **Client component** (`"use client"`; uses `useState`, `useId`, Framer Motion).

Single accessible accordion primitive — powers both the "causes" sections and every FAQ block, so there's exactly
one accordion implementation in the app. Single-open by default; `allowMultiple` allows several panels open at
once. Panels stay permanently mounted (hidden via `aria-hidden`/`inert` + animated height) so `aria-controls`
always resolves. Every derived DOM id is salted with `React.useId()` so multiple `<Accordion>` instances on one
page never collide.

```ts
export interface AccordionItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items: AccordionItem[];
  allowMultiple?: boolean; // default false (single-open)
}
```

```tsx
import { Accordion } from "@/components/ui/accordion";

<Accordion
  items={[
    { id: "genetic", question: "Genetic factors", answer: "Some pigmentation is hereditary…" },
    { id: "sun", question: "Sun damage", answer: "UV exposure triggers melanin production…" },
  ]}
/>
```

### `Tabs`

`components/ui/tabs.tsx` — **Client component** (`"use client"`; uses `useState`, `useId`, keyboard handling).

Accessible tab list (`role="tablist"`/`"tab"`/`"tabpanel"`) with full arrow-key/Home/End roving-tabindex keyboard
navigation. Used inside `IngredientScience` to switch between per-sub-type ingredient lists.

```ts
export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[];
}
```

```tsx
import { Tabs } from "@/components/ui/tabs";

<Tabs
  tabs={[
    { id: "melasma", label: "Melasma", content: <ul>…</ul> },
    { id: "sunspots", label: "Sunspots", content: <ul>…</ul> },
  ]}
/>
```

---

## `components/features/` — composed, business-specific components

### `Navbar`

`components/features/navbar.tsx` — **Client component** (`"use client"`; dropdown/drawer state, focus trapping).

Sticky site header: logo, desktop nav (with a hover/focus/click-accessible dropdown for "Skin Problem" → the 3
concerns), a primary "Analyse your skin" CTA, and a focus-trapped mobile drawer (`role="dialog"`,
`aria-modal="true"`) on small screens. Reads all nav items and the logo from `SITE.nav` (`config/site.ts`) and
`IMAGES.logo` (`content/assets.ts`) — no props.

```tsx
import { Navbar } from "@/components/features/navbar";

<Navbar />
```

### `Footer`

`components/features/footer.tsx` — Server component.

Site-wide footer: logo, phone/WhatsApp/email contact links, visit links, a `SubscribeForm`, and legal links.
Every contact detail is read from `SITE`/`telHref`/`waHref` (`config/site.ts`) — nothing is hardcoded, which is
what keeps contact info single-sourced across the whole app. No props.

```tsx
import { Footer } from "@/components/features/footer";

<Footer />
```

### `StickyCTA`

`components/features/sticky-cta.tsx` — **Client component** (`"use client"`; scroll listener, Framer Motion).

Mobile-only (`md:hidden`) sticky bottom bar with call, WhatsApp, and "Analyse your skin" actions. Slides in via a
`transform` once the user scrolls past 300px (rAF-throttled scroll listener); links stay in the DOM at all times
(`tabIndex={-1}`/`aria-hidden` while off-screen) so they remain easy to test and keyboard-safe. No props.

```tsx
import { StickyCTA } from "@/components/features/sticky-cta";

<StickyCTA />
```

### `Hero`

`components/features/hero.tsx` — Server component.

Above-the-fold hero: heading, optional subheading, one or more CTA buttons, and a priority-loaded `next/image`.
Used on Home and (via `ConcernPageTemplate`) every concern page.

```ts
export interface HeroCta {
  label: string;
  href: string;
  variant?: ButtonVariant;
}

export interface HeroProps {
  image: ImageAsset;      // from content/assets.ts
  heading: string;
  subheading?: string;
  ctas: HeroCta[];
}
```

```tsx
import { Hero } from "@/components/features/hero";
import { IMAGES } from "@/content/assets";

<Hero
  image={IMAGES.heroModel}
  heading="Personalized skincare, backed by science"
  subheading="Take our free skin assessment to get started"
  ctas={[{ label: "Analyse your skin", href: "/pigmentation" }]}
/>
```

### `TrustBadgeStrip`

`components/features/trust-badge-strip.tsx` — Server component (pure CSS marquee, no JS).

Horizontally-looping strip of trust badges (e.g. "Cruelty-Free", "Dermatologist-Tested"). Renders the list twice
for a seamless CSS `translateX` loop; only the first copy is exposed to assistive tech, the duplicate is
`aria-hidden`. Respects `prefers-reduced-motion` via CSS (see `app/globals.css`).

```ts
export interface TrustBadgeStripProps {
  badges: string[];
}
```

```tsx
import { TrustBadgeStrip } from "@/components/features/trust-badge-strip";

<TrustBadgeStrip badges={["Cruelty-Free", "Vegan-Friendly", "Paraben-Free", "Dermatologist-Tested"]} />
```

### `ProcessSteps`

`components/features/process-steps.tsx` — Server component.

Numbered "how it works" step list (1..N), rendered in a responsive grid. Used for "4 Steps to Healthy Skin" on
Home and "From Assessment to Results" on every concern page.

```ts
export interface ProcessStep {
  title: string;
  body: string;
}

export interface ProcessStepsProps {
  steps: ProcessStep[];
  heading?: string;
}
```

```tsx
import { ProcessSteps } from "@/components/features/process-steps";

<ProcessSteps
  heading="4 Steps to Healthy Skin"
  steps={[
    { title: "Assess", body: "Take our free skin quiz" },
    { title: "Consult", body: "Our expert reviews your answers" },
    { title: "Personalize", body: "Get a routine built for you" },
    { title: "Glow", body: "Follow your routine and track progress" },
  ]}
/>
```

### `ConcernCard`

`components/features/concern-card.tsx` — Server component.

Single skin-concern teaser card for concern-picker grids (e.g. on Home): image, label, teaser copy, and a
"Learn more" link to `/${slug}`.

```ts
export interface ConcernCardProps {
  slug: string;
  label: string;
  teaser: string;
  image: ImageAsset;
}
```

```tsx
import { ConcernCard } from "@/components/features/concern-card";
import { IMAGES } from "@/content/assets";

<ConcernCard
  slug="acne"
  label="Acne"
  teaser="Clear breakouts with a routine built for your skin."
  image={IMAGES.concernBlemishes}
/>
```

### `StatCounter`

`components/features/stat-counter.tsx` — **Client component** (`"use client"`; `IntersectionObserver`, rAF
animation, Framer Motion's `useReducedMotion`).

Animated count-up numeric stat (e.g. "92%"). SSR-safe by design: initial render always shows the *final* `value`
(never 0), and the count-up-from-zero animation is layered on top only once the element scrolls into view and
only when the user hasn't requested reduced motion — this directly fixes the source site's "stuck at 0%" bug.

```ts
export interface StatCounterProps {
  value: number;
  suffix?: string;
  label: string;
}
```

```tsx
import { StatCounter } from "@/components/features/stat-counter";

<StatCounter value={92} suffix="%" label="reported clearer skin*" />
```

### `BeforeAfterCarousel`

`components/features/before-after-carousel.tsx` — **Client component** (`"use client"`; touch/swipe handling,
carousel state).

Swipeable before/after results carousel with prev/next buttons, dot navigation, and an `aria-live` "X of N"
indicator. When `slides` is empty (real testimonial images are a pending client open item — see README), it
renders a branded "coming soon" placeholder instead of a blank/broken carousel.

```ts
export interface BeforeAfterSlide {
  before: ImageAsset;
  after: ImageAsset;
  caption?: string;
}

export interface BeforeAfterCarouselProps {
  slides: BeforeAfterSlide[];
}
```

```tsx
import { BeforeAfterCarousel } from "@/components/features/before-after-carousel";

<BeforeAfterCarousel slides={[]} /> {/* renders the "coming soon" placeholder */}
```

### `IngredientScience`

`components/features/ingredient-science.tsx` — Server component (thin wrapper around the client `Tabs`).

Renders "research-driven ingredients" content as a `Tabs` list — one tab per concern sub-type/skin-type, each
showing its ingredients as a bulleted list. Tab ids are auto-derived (slugified) from `group.tabLabel`.

```ts
export interface IngredientGroup {
  tabLabel: string;
  items: string[];
}

export interface IngredientScienceProps {
  groups: IngredientGroup[];
  heading?: string;
}
```

```tsx
import { IngredientScience } from "@/components/features/ingredient-science";

<IngredientScience
  heading="Research-Driven Ingredients"
  groups={[{ tabLabel: "Melasma", items: ["Niacinamide", "Tranexamic acid", "Vitamin C"] }]}
/>
```

### `FAQSection`

`components/features/faq-section.tsx` — Server component (wraps the client `Accordion`).

Titled FAQ block built on `Accordion`, with an optional `FAQPage` JSON-LD schema block (via `JsonLd`) for SEO.

```ts
export interface FAQSectionProps {
  title: string;
  items: FaqItem[];      // { id, question, answer } — from content/faqs.ts
  emitSchema?: boolean;  // default false
}
```

```tsx
import { FAQSection } from "@/components/features/faq-section";
import { FAQS } from "@/content/faqs";

<FAQSection title="Frequently Asked Questions" items={FAQS.generalFaqs} emitSchema />
```

### `Breadcrumb`

`components/features/breadcrumb.tsx` — Server component.

Accessible breadcrumb trail (`<nav aria-label="Breadcrumb">`); the last item renders as plain text with
`aria-current="page"` rather than a self-link. Also emits a `BreadcrumbList` JSON-LD block built from the same
items, with absolute URLs via `SITE.url`.

```tsx
import { Breadcrumb } from "@/components/features/breadcrumb";

<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Acne", href: "/acne" }]} />
```

### `ContactForm`

`components/features/contact-form.tsx` — **Client component** (`"use client"`; React Hook Form + Zod).

Name/Email/Message form validated with `contactSchema` (`lib/validation/contact.ts`) via
`@hookform/resolvers/zod`. Submission currently calls `submitContactStub` (no backend yet — Sub-project B wires a
real endpoint) and shows a thank-you state on success; a `mailto:` fallback link is always shown below the form.
No props.

```tsx
import { ContactForm } from "@/components/features/contact-form";

<ContactForm />
```

### `SubscribeForm`

`components/features/subscribe-form.tsx` — **Client component** (`"use client"`; controlled form element only,
no external state).

Visual-only newsletter signup used in the footer. `onSubmit` is intentionally a no-op (`TODO(subproject-B): wire
subscribe`) — there is no backend endpoint yet. No props.

```tsx
import { SubscribeForm } from "@/components/features/subscribe-form";

<SubscribeForm />
```

### `JsonLd`

`components/features/json-ld.tsx` — Server component.

Renders a `<script type="application/ld+json">` tag from a plain JS object. The one sanctioned use of
`dangerouslySetInnerHTML` in the codebase — safe because `data` is always app-constructed (never raw user input),
and every `<` is escaped to `<` as defense-in-depth against premature `</script>` termination.

```ts
{ data: object } // no exported props interface — inline prop type
```

```tsx
import { JsonLd } from "@/components/features/json-ld";

<JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "Skinwise" }} />
```

### `ConcernPageTemplate`

`components/features/concern-page-template.tsx` — Server component.

The shared template that renders all three concern landing pages (Pigmentation, Acne, Other Issues) from one
`ConcernContent` data object: Breadcrumb → Hero → "What is" explainer → causes accordion (skipped entirely when
`content.causes` is empty, e.g. Other Issues) → types gallery → `IngredientScience` tabs → science steps →
`ProcessSteps` → `BeforeAfterCarousel` → general FAQs (emits the page's `FAQPage` schema) → objection FAQs. This
is the concrete implementation of the "add a 4th concern = one data file" extensibility rule — see
`documentation/ARCHITECTURE.md`.

```ts
export interface ConcernPageTemplateProps {
  content: ConcernContent; // from content/concerns/types.ts
}
```

```tsx
// app/(marketing)/acne/page.tsx
import { ConcernPageTemplate } from "@/components/features/concern-page-template";
import { CONCERNS } from "@/content/concerns";

export default function AcnePage() {
  return <ConcernPageTemplate content={CONCERNS.acne} />;
}
```

### `LegalPage`

`components/features/legal-page.tsx` — Server component.

Shared template for the three legal pages (Privacy Policy, Terms and Conditions, Refund and Cancellation):
Breadcrumb → title → optional accent-tinted `notice` banner (e.g. flagging placeholder/pending-approval clauses)
→ sections, each with an optional heading and a body that's split into one `<p>` per blank-line-separated
paragraph.

```ts
export interface LegalPageProps {
  title: string;
  path: string;              // e.g. "/privacy-policy" — used in the breadcrumb + its JSON-LD
  sections: LegalSection[];  // { heading?, body } — from content/legal/*
  notice?: string;
}
```

```tsx
// app/(marketing)/privacy-policy/page.tsx
import { LegalPage } from "@/components/features/legal-page";
import { PRIVACY } from "@/content/legal";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title={PRIVACY.title}
      path="/privacy-policy"
      sections={PRIVACY.sections}
      notice={PRIVACY.notice}
    />
  );
}
```
