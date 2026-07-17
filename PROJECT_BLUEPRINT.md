# PROJECT_BLUEPRINT.md
### Skinwise — WordPress → Next.js Modernization
**Owner:** Razorbill Private Limited (myskinwise.com)
**Document status:** Draft v1.0 — pending stakeholder approval before implementation begins
**Audience:** Engineering, design, product, and any future contributor onboarding to this project

> ⚠️ **Read this first — data completeness notice**
> This blueprint is built on a real crawl of the live site (Home, About Us, Pigmentation, Contact Us, and the Acne quiz funnel were fetched and inspected directly) plus industry-standard assumptions for the sections that were **not yet accessible**: the WP-admin plugin list, a Lighthouse/PageSpeed report, and the Acne/Other-Issues/remaining quiz pages. Every section below is written as final-form documentation, but anywhere an assumption stands in for confirmed data, it is marked **[ASSUMED — VERIFY]**. Before Phase 2 (Project Setup) begins, the "Open Items" list in Section 0 must be closed out.

---

## 0. Open Items Blocking Full Confidence (read before build)

| # | Item | Why it matters | Status |
|---|---|---|---|
| 1 | WP-Admin plugin list (active + inactive) | Determines what functionality must be rebuilt vs. discarded | ❌ Not yet provided |
| 2 | PageSpeed Insights / Lighthouse report (mobile + desktop) | Real Core Web Vitals baseline to prove improvement post-launch | ❌ Not yet provided |
| 3 | `/acne/`, `/other-issues/`, `/privacy-policy`, `/terms-and-conditions` full content | Confirms these mirror `/pigmentation/`'s structure (assumed) | ⚠️ Partially assumed |
| 4 | `/pigmentation-form-quiz/`, `/other-issues-form-quiz/` content | The one quiz page crawled (`/acne-form-quiz/`) rendered **empty** — this may mean the entire lead funnel is broken in production | 🔴 Critical — verify immediately, independent of this migration |
| 5 | Supabase project credentials | Project URL, anon key, service role key, storage bucket names, desired Auth providers | ❌ Not yet provided — **do not invent, see Section 10/11** |
| 6 | Domain/DNS + hosting decision for cutover | Whether myskinwise.com stays on current registrar, how DNS will point to Vercel | ❌ Not yet discussed |
| 7 | Real inventory of before/after images, testimonial photos, and consent for their reuse | Legal/consent issue for medical-adjacent "before/after" claims | ❌ Not yet discussed |
| 8 | Actual order/fulfillment process (there's no WooCommerce or checkout — leads convert "offline") | Confirms this is a lead-gen site, not e-commerce, which shapes the whole backend design | ✅ Confirmed via crawl |

**Recommendation:** Treat Item #4 as a P0 bug ticket for the *current* WordPress site today, regardless of the rebuild timeline — if the quiz funnel is broken, the business may be losing leads right now.

---

## 1. Project Overview

### 1.1 Business Overview
Skinwise (legal entity: Razorbill Private Limited) is a **personalized, direct-to-consumer skincare brand** operating in India. The business model is not traditional e-commerce — there is no cart or checkout. Instead:

1. A visitor lands on the site and self-identifies a skin concern (Hyperpigmentation, Acne, or "Other Issues" — fine lines, dullness, dark spots, wrinkles).
2. They complete a **skin-assessment quiz** for their concern.
3. A human "skin expert" reviews submissions and contacts the lead within ~24 hours (per the site's own FAQ copy).
4. A **customised product/regimen** is proposed and, presumably, fulfilled and shipped after manual confirmation (likely over WhatsApp/phone, given the prominence of WhatsApp and call CTAs everywhere).

This is fundamentally a **lead-generation + high-touch consultative sales funnel**, not a self-serve storefront. That distinction drives almost every architecture decision in this document — we are not building a product catalog or cart; we are building a conversion-optimized content site with a robust, trackable quiz/lead pipeline.

### 1.2 Website Purpose
- Educate visitors on their specific skin condition (credibility + SEO content play)
- Convert visitors into quiz submissions (primary KPI)
- Build enough trust (science-backed messaging, before/after proof, founder story, safety claims) to justify a "trust us with your skin" ask before any product/price is shown
- Support the human sales team with qualified, structured lead data

### 1.3 Target Users / Personas
| Persona | Description | Primary need |
|---|---|---|
| **The Frustrated Self-Treater** | Has tried multiple OTC products for acne/pigmentation with no results | Wants to feel "finally understood" — personalization messaging is the hook |
| **The Cautious Researcher** | Reads ingredient lists, wants "dermatologically tested," "paraben-free," etc. before trusting a brand | Needs trust signals, science-backed copy, clear FAQs |
| **The Referral/Social Visitor** | Arrives via Instagram/WhatsApp share from a friend or influencer | Needs a fast, low-friction path straight to the quiz — long-form content is secondary |
| **The Mobile-First, WhatsApp-Native User (India-specific)** [ASSUMED — VERIFY with analytics] | Prefers messaging over forms/calls | WhatsApp CTA needs to be a first-class, prominent action, not an afterthought |

### 1.4 Business Goals
- Increase quiz-completion rate (top-of-funnel conversion)
- Reduce drop-off between "lead submitted" and "expert contact" (currently manual/offline — a future CRM integration could close this gap, see Section 20)
- Establish topical authority for "pigmentation," "acne," and "skin problems" search terms in India
- Present as a credible, premium, science-backed brand — not a "generic WordPress template" brand

### 1.5 Technical Goals
- Eliminate the plugin-stacked WordPress/Elementor architecture in favor of a fast, maintainable, type-safe Next.js codebase
- Fix confirmed content/data-integrity bugs (inconsistent phone numbers, placeholder Lorem-ipsum text, broken/empty quiz page, malformed `tel:` links) as part of the rebuild, not just a re-skin
- Build a **structured, database-backed quiz engine** (Supabase) instead of whatever black-box form plugin currently powers it — this makes leads queryable, exportable, and reportable for the first time
- Achieve consistently green Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 200ms) on mobile, since this audience is very likely majority-mobile

### 1.6 Success Metrics / KPIs
| Metric | Baseline | Target post-launch |
|---|---|---|
| Lighthouse Performance (mobile) | Unknown — [ASSUMED poor, given Elementor + uncompressed image filenames like `1-scaled.jpg`] | ≥ 90 |
| Quiz completion rate | Unknown — needs GA4/Pixel data | +20–30% (hypothesis: current broken/empty quiz page is suppressing this metric entirely) |
| Organic sessions to `/pigmentation/`, `/acne/`, `/other-issues/` | Unknown | +40% over 6 months via improved SEO architecture |
| Bounce rate on landing pages | Unknown | -15% |
| Data integrity issues (broken numbers, placeholder text, dead links) | 6 confirmed issues | 0 |

---

## 2. Existing Website Audit Summary

### Strengths
- Genuinely strong **long-form educational content** on the Pigmentation page (causes → types → ingredient science → 4-step process → FAQs) — this is a template worth preserving and replicating for Acne/Other Issues
- Clear, consistent brand narrative (founder story, mission/vision/values) that gives the rebuild real substance to work with — this isn't a content-empty rebuild
- A believable, differentiated model (personalization + human expert review) that is worth foregrounding in the new design rather than burying under generic SaaS-template patterns

### Weaknesses / Technical Debt
- **WordPress + Elementor + ElementsKit** stack: heavy DOM output, inline styles, render-blocking CSS, duplicate markup patterns (confirmed: duplicate FAQ accordion blocks on the homepage)
- No component reuse discipline — the same trust-badge list and FAQ block are copy-pasted per page rather than templated
- Unoptimized image delivery: filenames like `pigmentation-before-after-reel-size.jpg-5-1.jpg` suggest raw, uncompressed export-and-upload workflow, no responsive `srcset`, no modern formats (WebP/AVIF)
- No visible CMS discipline for data like phone numbers — hardcoded per-page, resulting in **4 different phone numbers across Home, About, Contact, and the sticky Call button**
- **Broken/empty core conversion page** (`/acne-form-quiz/`) — the single most business-critical page on the entire site currently renders no content
- Placeholder Lorem-ipsum-style text live on the Contact page FAQ — a content QA failure
- Malformed `tel:` href (`tel:70111 63196` — contains a space, which most mobile OSes will fail to dial correctly)
- Footer "Home" link points to `/?page_id=6943` instead of `/` — leaks internal WP post IDs into the public site, dilutes SEO signal for the homepage URL
- No blog / content hub — a missed SEO opportunity for a business this content-capable

### UI/UX Issues
- No dark mode, no accessibility affordances confirmed (need axe-core / manual audit once full pages are available)
- Repetitive image carousels with no visible alt text differentiation (accessibility + image-SEO issue)
- FAQ accordions duplicated with different collapse IDs on the same page (Home) — likely a rendering bug from Elementor's popup/loop widget re-render

### SEO Issues
- Query-string URLs leaking into internal links (`/?page_id=6943`)
- No confirmed sitemap.xml reachable via standard discovery [ASSUMED — VERIFY: could be at `/wp-sitemap.xml` or blocked]
- Meta generator tags exposing exact Elementor version (minor fingerprinting/security concern, not primarily SEO)
- Duplicate on-page content blocks likely cause duplicate/thin-content signals to search engines

### Performance Issues
- [ASSUMED — VERIFY with real Lighthouse report] Given large uncompressed JPGs, Elementor's CSS/JS payload, and multiple third-party scripts (Meta Pixel via PixelYourSite, ElementsKit widgets), expect poor LCP and high total blocking time on mobile
- Multiple `-scaled` and numbered duplicate image variants suggest no CDN-level image optimization pipeline

### Accessibility Issues
- Cannot fully audit without rendered JS/CSS, but structural signs (icon-only trust badges, decorative images without confirmed alt strategy, accordion-heavy FAQ UI) all need a WCAG 2.1 AA pass in the rebuild

### Scalability Issues
- Every "product line" (Pigmentation/Acne/Other Issues) is a hand-built Elementor page with duplicated components — adding a 4th concern category today would mean rebuilding an entire page from scratch rather than adding a data-driven entry

### Security Issues
- WordPress + third-party plugin stack (ElementsKit, PixelYourSite, and unknown forms plugin) is a standard high-value target for automated WP exploits — moving to Next.js + Supabase materially reduces this attack surface
- Credentials for the current site were shared in this chat conversation — **already flagged to the client, rotation recommended independent of migration timeline**

---

## 3. Future Vision

| Dimension | WordPress (today) | Next.js Platform (target) |
|---|---|---|
| Speed | Elementor-rendered, likely 40–60 Lighthouse mobile [ASSUMED] | Server Components + optimized images/fonts → 90+ Lighthouse |
| Scalability | New "skin concern" = new hand-built page | New concern = new data row + reused template |
| Maintainability | Logic scattered across plugins, no version control | Git-tracked, typed, component-driven, single source of truth |
| UX | Static content, no personalization beyond quiz-then-manual-contact | Same human-expert model, but a proper multi-step quiz UI, saved progress, and (future) automated recommendation logic |
| Accessibility | Unaudited, likely gaps | WCAG 2.1 AA target, tested with axe + manual screen reader pass |
| SEO | Duplicate content, leaking query params | Clean canonical routing, full structured data, sitemap, OG/Twitter cards |
| Dev experience | No local dev environment, edits happen live in wp-admin | Full local dev, preview deployments per PR, type safety, tests |
| Security | Plugin-stack attack surface, credentials shared ad hoc | Supabase RLS, environment-variable secrets, Vercel-managed infra |

---

## 4. Information Architecture

### 4.1 Sitemap (initial launch scope)

```
/                                  Home
/about-us                          Our Expertise / Mission / Founder story
/pigmentation                      Concern landing page: Hyperpigmentation
/acne                              Concern landing page: Acne
/other-issues                      Concern landing page: Other Issues (fine lines, dullness, etc.)
/quiz/pigmentation                 Multi-step quiz (replaces /pigmentation-form-quiz/)
/quiz/acne                         Multi-step quiz (replaces /acne-form-quiz/)
/quiz/other-issues                 Multi-step quiz (replaces /other-issues-form-quiz/)
/contact-us                        Contact form + FAQ + phone/WhatsApp/email
/privacy-policy                    Legal
/terms-and-conditions              Legal
/blog                              [NEW — Phase 2 feature, see Section 20]
/blog/[slug]                       [NEW]
/admin                             Internal dashboard (Supabase-authenticated) — leads, quiz responses
/admin/leads
/admin/leads/[id]
/admin/content                     [Future] lightweight CMS for FAQs/testimonials if not hardcoded
```

### 4.2 Routing Structure (Next.js App Router)
- **Public routes:** all of the above except `/admin/*`
- **Protected routes:** `/admin/*` — requires authenticated session with `admin` or `editor` role (see Section 11)
- **Dynamic routes:** `/quiz/[concern]`, `/blog/[slug]`, `/admin/leads/[id]`
- **Static/near-static routes (SSG/ISR):** `/`, `/about-us`, `/pigmentation`, `/acne`, `/other-issues`, `/privacy-policy`, `/terms-and-conditions`, `/blog/[slug]`
- **Dynamic/interactive routes (client + server mix):** `/quiz/[concern]` (multi-step form state), `/contact-us` (form submission), `/admin/*` (data tables, auth-gated)

### 4.3 Navigation
- Primary header nav mirrors current IA (Our Expertise / Skin Problem dropdown [Hyperpigmentation, Acne, Other Issues] / Contact us) — this pattern tested fine structurally, keep it
- Add a persistent, non-intrusive **sticky CTA** (quiz + WhatsApp) — replacing the malformed `tel:` sticky button with a working `tel:` link *and* a WhatsApp deep link (`https://wa.me/91XXXXXXXXXX`)
- Footer nav: fix the `/?page_id=6943` bug — link directly to `/`

### 4.4 Internal Linking / Page Relationships
- Each concern landing page (`/pigmentation`, `/acne`, `/other-issues`) links directly into its corresponding `/quiz/[concern]` — never a generic quiz
- Blog posts (future) tag by concern and cross-link into the matching landing page, compounding topical SEO authority
- Footer replicates primary nav + legal links + contact info (single source of truth via a shared config, not hardcoded per page — fixes the phone-number inconsistency permanently)

### 4.5 Future Expansion Strategy
- New skin concerns become new rows in a `concerns` table + a route using the same `[concern]` dynamic template — no new hand-built page required
- Blog category taxonomy can expand independently of the core 3-concern IA
- `/admin` can grow into a full internal CRM view over time without touching the public site's architecture

---

## 5. User Journey

### 5.1 Primary Conversion Flow
```
Landing (Home or paid/social ad → concern landing page)
   → Reads trust signals + concern-specific content
   → Clicks "Analyse your skin now" / "Know Your [Concern]"
   → Enters /quiz/[concern]
   → Completes multi-step quiz (skin type, concern duration, current products, contact info)
   → Submission stored in Supabase + confirmation shown ("Our expert will contact you within 24 hours")
   → [Offline] Human expert calls/WhatsApps lead
   → [Offline] Manual order + fulfillment
```

### 5.2 Secondary Flows
- **Direct contact flow:** `/contact-us` form → stored as a `contact_submissions` row → surfaced in `/admin/leads` alongside quiz leads, tagged by source
- **Research/trust flow:** Home → About Us (founder story, mission) → back to a concern page → quiz
- **Exit paths:** WhatsApp click-out, phone call click-out, or abandonment mid-quiz (should be tracked as a funnel-drop-off event, not silently lost — see Section 15/20 for analytics)

### 5.3 Admin / Content Management Flow
```
Admin logs in (Supabase Auth) → /admin
   → Views leads table (filter by concern, date, status)
   → Opens a lead → sees full quiz answers + contact info
   → Updates lead status (New / Contacted / Converted / Lost) — internal CRM-lite
```

### 5.4 Authentication Flow (admin-only; public site has no user accounts at launch)
```
/admin (unauthenticated) → redirect to /admin/login
Login via Supabase Auth (email/password to start; Google OAuth optional — see Section 11)
On success → redirect to /admin/leads
Session managed via Supabase SSR cookies + Next.js middleware route protection
```

---

## 6. Page Inventory

> Each entry below reflects confirmed content where the page was crawled, and a **[TEMPLATE]** tag where content is inferred from the sibling page pattern (Pigmentation) pending full confirmation.

### `/` — Home
- **Purpose:** Brand introduction, funnel visitors to the correct concern page/quiz
- **Confirmed components:** Hero banner carousel, trust-badge strip, 4-value-prop grid ("Your Problems Our Priority" etc.), founder/research callout, 3 concern cards (Pigmentation/Acne/Other Issues), "4 Steps to Healthy Skin" process, image gallery strip, real-customer before/after carousel, stats block (0% placeholders — needs JS-render check), FAQ accordion (currently duplicated — bug), support/contact block, footer
- **SEO requirements:** Title + meta description targeting "personalized skincare India," Organization schema, FAQ schema for the FAQ block
- **Performance requirements:** Hero images must be priority-loaded, below-fold carousels lazy-loaded
- **Assets required:** All hero/testimonial images (currently large, unoptimized JPGs — must be reprocessed)
- **Fix list:** de-duplicate FAQ block, fix footer Home link, unify phone numbers via shared config, confirm stats counters render without JS dependency issues

### `/about-us` — Our Expertise
- **Purpose:** Trust-building — mission, vision, core values, founder story (Anant Sanadhya), approach pillars
- **Confirmed components:** Mission/Vision/Core Values blocks, founder bio + photo, 3-pillar "Our Approach" section
- **SEO requirements:** Title targeting brand + "about," Organization/Person schema for founder
- **Fix list:** same footer/phone-number bug as Home

### `/pigmentation` — Hyperpigmentation landing page
- **Purpose:** Educate + convert for the pigmentation concern
- **Confirmed components:** Hero + quiz CTA, "What is hyperpigmentation" explainer, causes accordion (genetic/harsh skincare/sun damage/hormonal — **also duplicated in source, bug to fix**), "Which one looks like yours" type gallery (Melasma/Sunspots/Freckles/PIH), ingredient science section per sub-type, handpicked-ingredients gallery, 4-step process, before/after carousel, "what's inside the kit" teaser, two-tier FAQ (general + objection-handling)
- **SEO requirements:** Target "hyperpigmentation treatment," "melasma treatment India," etc.; MedicalWebPage or Article schema (verify claims are compliant — see Section 15 legal note on health claims); FAQ schema
- **Fix list:** de-duplicate the causes accordion IDs

### `/acne` — Acne landing page **[TEMPLATE — mirrors /pigmentation/ structure, pending direct confirmation]**
- **Purpose:** Same pattern as Pigmentation, for Acne (Blackheads/Whiteheads/Papules/Pustules/Nodules/Cystic per homepage teaser copy)
- **Action item:** confirm actual content matches this assumption before final copy is finalized

### `/other-issues` — Other Issues landing page **[TEMPLATE — same assumption]**
- **Purpose:** Fine lines, dull skin, dark spots, wrinkles, per homepage teaser copy

### `/contact-us` — Contact
- **Purpose:** Direct contact path for users who don't want the quiz flow
- **Confirmed components:** Phone support (3 numbers by department — General/Product/Shipment), email support, contact form (Name/Email/Message), FAQ block
- **Fix list:** **remove the live Lorem-ipsum placeholder text** in the "What if I don't see results?" FAQ answer — replace with real copy; unify phone numbers with the site-wide config

### `/quiz/[concern]` — Quiz funnel (replaces `/pigmentation-form-quiz/`, `/acne-form-quiz/`, `/other-issues-form-quiz/`)
- **Purpose:** THE core conversion mechanism of the entire site
- **Current state:** confirmed empty/broken on at least the Acne variant — full rebuild, not a port
- **Required components:** multi-step form (skin type → concern specifics → duration/severity → current routine → contact details), progress indicator, validation (Zod), submit → Supabase insert → confirmation screen
- **Performance requirements:** must work flawlessly on low-end Android/mobile Chrome — this audience is mobile-first
- **Fix list:** this is a full rebuild; there is no legacy behavior worth preserving beyond the *step order* implied by existing FAQ copy ("fill out our form... expert will contact you within 24 hours")

### `/privacy-policy`, `/terms-and-conditions` **[TEMPLATE — content not yet crawled]**
- **Action item:** pull actual legal text from WP before rebuild — do not regenerate legal copy without the client's actual approved text

---

## 7. Component Architecture

All components are designed reusable-first — one canonical version each, parameterized by props/content, never copy-pasted per page (directly fixing the current site's core technical debt pattern).

```
<Button />                variant: primary | secondary | whatsapp | outline
<Card />                   generic card shell — used by ConcernCard, ValuePropCard, StepCard
<Navbar />                 sticky, responsive, dropdown-capable
<Footer />                 single source of truth for contact info (fixes phone-number bug)
<Hero />                   configurable image/carousel + heading + CTA row
<TrustBadgeStrip />        icon + label list, data-driven from a single config array
<ConcernCard />            concern name, teaser copy, CTA → /quiz/[concern]
<ProcessSteps />           numbered step list (used for "4 Steps to Healthy Skin" and per-concern process)
<Accordion />              single accessible accordion primitive — powers FAQ AND "causes" sections (no more duplicated markup)
<FAQSection />             wraps <Accordion />, accepts a data array, supports schema.org FAQPage output
<StatCounter />            animated count-up, SSR-safe fallback (renders final number without JS, animates progressively — fixes the "0%" rendering risk)
<BeforeAfterCarousel />    swipeable, lazy-loaded, alt-text required per slide
<TestimonialCarousel />
<QuizStepper />            multi-step form shell: progress bar + step transition + persisted state (React Hook Form + Zod)
<ContactForm />            Name/Email/Message, RHF + Zod validated, submits via Server Action
<StickyCTA />              sticky quiz/WhatsApp/call bar — fixed tel: and wa.me links
<Modal /> / <Drawer />     shared primitives (shadcn/ui-based)
<Breadcrumb />             for SEO + UX on inner pages
<Pagination />             reserved for future /blog
<Tabs />                   used within ingredient-science sections (Melasma/Sunspots/Freckles/PIH tabs)
```

Design rule: every component above lives in `components/ui` (primitives) or `components/features/*` (composed, business-specific) — see folder structure in Section 8.

---

## 8. Folder Structure

```
skinwise/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                    # Home
│   │   ├── about-us/page.tsx
│   │   ├── pigmentation/page.tsx
│   │   ├── acne/page.tsx
│   │   ├── other-issues/page.tsx
│   │   ├── contact-us/page.tsx
│   │   ├── privacy-policy/page.tsx
│   │   └── terms-and-conditions/page.tsx
│   ├── quiz/
│   │   └── [concern]/
│   │       ├── page.tsx
│   │       └── steps/                  # step components if not colocated in features/
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── leads/page.tsx
│   │   ├── leads/[id]/page.tsx
│   │   └── layout.tsx                  # auth-gated layout
│   ├── api/
│   │   └── (route handlers, if any beyond Server Actions)
│   ├── layout.tsx                       # root layout: fonts, providers, Navbar/Footer
│   ├── sitemap.ts
│   ├── robots.ts
│   └── globals.css
├── components/
│   ├── ui/                              # primitives: Button, Card, Accordion, Modal, Tabs...
│   └── features/
│       ├── home/
│       ├── concern-page/                # shared building blocks for pigmentation/acne/other-issues
│       ├── quiz/                        # QuizStepper + step subcomponents
│       ├── contact/
│       └── admin/
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # browser client
│   │   ├── server.ts                    # server/RSC client
│   │   └── middleware.ts                # session refresh helper
│   ├── validation/                      # Zod schemas (quiz steps, contact form)
│   ├── constants/                       # site-wide contact info, nav config — single source of truth
│   └── utils.ts
├── hooks/
│   ├── use-quiz-state.ts
│   └── use-media-query.ts
├── types/
│   ├── database.types.ts                # generated from Supabase
│   └── index.ts
├── services/                            # data-access layer wrapping Supabase queries
│   ├── leads.service.ts
│   └── content.service.ts
├── config/
│   ├── site.ts                          # nav items, contact info, social links
│   └── seo.ts                           # default metadata, OG defaults
├── middleware.ts                        # route protection for /admin
├── public/
│   ├── images/
│   └── favicons/
├── scripts/
│   └── migrate-content.ts               # one-off WP → Supabase content migration scripts
├── documentation/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── COMPONENTS.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   └── CHANGELOG.md
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── PROJECT_BLUEPRINT.md
```

---

## 9. Backend Architecture

- **API strategy:** Prefer **Server Actions** for all mutations originating from the site's own forms (quiz submission, contact form) — no need for a public REST API at launch. Reserve **Route Handlers** (`app/api/*`) only for things that genuinely need an HTTP endpoint (e.g., a future webhook from a CRM/WhatsApp provider).
- **Validation:** Every Server Action validates input server-side with **Zod**, even though React Hook Form + Zod already validates client-side — never trust the client.
- **Authentication/Authorization:** Supabase Auth session read via `lib/supabase/server.ts` in Server Components/Actions; `middleware.ts` protects all `/admin/*` routes, redirecting unauthenticated requests to `/admin/login`.
- **Logging:** Structured server-side logging on every Server Action (lead created, contact submitted, admin login) — start simple (console + Vercel logs), upgrade to a dedicated logging service only if volume demands it.
- **Error handling:** Consistent `try/catch` in every Server Action, returning a typed `{ success, error }` shape to the client — never let raw Supabase errors reach the UI.
- **Caching:** Static/ISR for marketing pages (revalidate on content change via a webhook or a sane time-based revalidation, e.g., 1 hour); no caching for admin/lead data (always fresh).
- **Rate limiting:** Apply basic rate limiting to the contact form and quiz submission Server Actions (e.g., per-IP, via a simple Supabase-backed counter or an edge-based solution) to prevent spam submissions — this is a real risk for any public lead form.
- **Monitoring:** Vercel Analytics/Speed Insights at minimum; consider Sentry for error tracking once the app is live.
- **Security:** All secrets in environment variables only, never committed; Supabase Row Level Security enforced on every table (see Section 10.7) so that even if the anon key leaks, public clients cannot read/write leads directly — all writes go through Server Actions using the service role key server-side only.

---

## 10. Database Design (Supabase / PostgreSQL)

### 10.1 ER Diagram (text form)

```
concerns (1) ───< leads (many)
concerns (1) ───< quiz_questions (many)
leads (1) ───< lead_status_history (many)
admin_users (1) ───< lead_status_history (many)   [who changed the status]
contact_submissions (standalone)
blog_posts (standalone, future)
testimonials (standalone)
faqs (standalone, tagged by page/concern)
```

### 10.2 Tables

**`concerns`**
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| slug | text, unique | `pigmentation`, `acne`, `other-issues` |
| name | text | Display name |
| teaser_copy | text | |
| hero_image_url | text | Supabase Storage reference |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`quiz_questions`**
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| concern_id | uuid, fk → concerns.id | |
| step_order | int | Ordering within the quiz |
| question_key | text | Machine-readable key, e.g. `skin_type` |
| question_label | text | Display text |
| input_type | text | `single_select`, `multi_select`, `text`, `phone`, `email` |
| options | jsonb | Nullable — only for select types |
| required | boolean | default true |

**`leads`**
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| concern_id | uuid, fk → concerns.id | |
| name | text | |
| phone | text | |
| email | text, nullable | |
| answers | jsonb | Full quiz-answer payload keyed by `question_key` |
| source | text | `quiz`, `contact_form`, future: `whatsapp`, `referral` |
| status | text | `new`, `contacted`, `converted`, `lost` — default `new` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`lead_status_history`** *(audit log)*
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| lead_id | uuid, fk → leads.id | |
| changed_by | uuid, fk → admin_users.id | |
| old_status | text | |
| new_status | text | |
| note | text, nullable | |
| created_at | timestamptz | |

**`contact_submissions`**
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| name | text | |
| email | text | |
| message | text | |
| status | text | `new`, `resolved` |
| created_at | timestamptz | |

**`testimonials`**
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| concern_id | uuid, fk → concerns.id, nullable | |
| before_image_url | text | |
| after_image_url | text | |
| caption | text, nullable | |
| consent_confirmed | boolean | **Required true before publish** — legal/consent gate |
| display_order | int | |

**`faqs`**
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| page_key | text | `home`, `pigmentation`, `contact-us`, etc. |
| question | text | |
| answer | text | |
| display_order | int | |

**`blog_posts`** *(future — Section 20)*
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| slug | text, unique | |
| title | text | |
| body_markdown | text | |
| cover_image_url | text | |
| concern_id | uuid, fk → concerns.id, nullable | |
| published_at | timestamptz, nullable | |

**`admin_users`** *(mirrors `auth.users`, extends with role)*
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk, fk → auth.users.id | |
| role | text | `admin`, `editor`, `viewer` |
| display_name | text | |

### 10.3 Indexes
- `leads(concern_id)`, `leads(status)`, `leads(created_at desc)` — for admin dashboard filtering/sorting
- `quiz_questions(concern_id, step_order)` — composite, for ordered quiz retrieval
- `blog_posts(slug)` unique index (already implied by unique constraint)
- `faqs(page_key, display_order)` composite

### 10.4 Views
- `v_leads_with_concern` — joins `leads` + `concerns` for a denormalized admin table view (avoids repeated joins in every query)
- `v_lead_funnel_stats` — aggregate view: count of leads by concern/status/day, powering a future admin dashboard chart

### 10.5 Triggers
- `set_updated_at` trigger on `leads` and `concerns` (auto-update `updated_at` on row change)
- `log_lead_status_change` trigger on `leads` — on `status` column change, auto-insert into `lead_status_history`

### 10.6 Functions
- `get_lead_funnel_summary(date_from, date_to)` — Postgres function returning aggregate counts for the admin dashboard, callable via Supabase RPC

### 10.7 Row Level Security (RLS)
- **All tables have RLS enabled by default.**
- `concerns`, `faqs`, `testimonials` (where `consent_confirmed = true`), `blog_posts` (where `published_at is not null`): public `SELECT` allowed (anon role) — this is public marketing content.
- `leads`, `contact_submissions`, `lead_status_history`, `admin_users`: **no anon access at all.** All inserts happen via Server Actions using the **service role key** (server-only, never exposed to the browser). All reads/updates from `/admin` require an authenticated session matched against `admin_users.role in ('admin','editor')`.
- `quiz_questions`: public `SELECT` (needed to render the quiz), no public write.

### 10.8 Storage Buckets
- `public-images` — hero images, concern images, testimonial before/afters (public read)
- `private-uploads` *(future)* — if users are ever allowed to upload their own skin photos for the quiz, this must be a **private** bucket with signed URLs only, given the sensitive/biometric nature of facial images — flagged for careful legal review if this feature is ever added.

### 10.9 Soft Delete & Versioning
- Use a `deleted_at timestamptz, nullable` column on `leads`, `testimonials`, `blog_posts`, `faqs` rather than hard deletes — preserves audit trail and undo capability.
- `lead_status_history` already provides lead-level versioning; no separate versioning table needed at this scale.

### 10.10 Future Scaling Notes
- Current design comfortably scales to tens of thousands of leads without partitioning.
- If lead volume grows significantly, add a `created_at` range index and consider monthly table partitioning — not needed at launch.

---

## 11. Authentication

- **Public site:** no user accounts at launch — leads are anonymous submissions, not registered users.
- **Admin panel:** Supabase Auth, **email/password** at launch. Google OAuth can be added later as a convenience (low priority, since this is an internal team, not public users).
- **OTP:** not needed at launch (no consumer accounts); revisit if a future customer-facing "track my order" portal is built.
- **Password reset:** standard Supabase Auth flow (magic link/reset email).
- **Roles:** `admin` (full access, can manage other admin_users), `editor` (can view/update leads, manage FAQs/testimonials/blog), `viewer` (read-only dashboard access — useful for a founder/stakeholder who wants visibility without edit rights).
- **Future enterprise roles:** if a sales team grows, consider a `sales_rep` role scoped to only the leads assigned to them (`leads.assigned_to` column would need to be added at that point — not built prematurely now).

> **Supabase credentials needed before this section can be implemented:** Project URL, anon key, service role key, and confirmation of which Auth providers to enable (email/password only, or also Google). **Do not proceed with Supabase-dependent implementation until these are provided by the client — no credentials will be invented or assumed.**

---

## 12. CMS Strategy

**Decision: Hybrid.**

- **Structural/marketing copy** (hero headlines, mission/vision text, founder bio) is **hardcoded in the codebase** as typed content objects (`config/site.ts` and per-page content files). This content changes rarely, benefits from type safety, and doesn't justify CMS overhead.
- **Frequently-changing, structured data** (FAQs, testimonials, blog posts, quiz questions) lives in **Supabase tables** (Section 10), editable via the `/admin` panel — this is effectively a lightweight custom CMS, purpose-built for exactly what this site needs, rather than a generic headless CMS that would be overkill for a 7-page marketing site plus a quiz engine.
- **Why not a full headless CMS (Sanity/Contentful/etc.):** the content model here is narrow and well-understood (FAQs, testimonials, quiz questions, leads) — Supabase already being the database for leads/auth means adding a second CMS platform would mean two systems of record for no real benefit at this scale. Revisit only if content volume/complexity grows substantially (e.g., a large multi-author blog with rich media workflows).

---

## 13. Assets Inventory

| Asset type | Source / Action needed |
|---|---|
| Logo (header + footer) | Export current logo at multiple resolutions + transparent PNG/SVG; current asset (`cropped-WhatsApp_Image...-removebg-preview-1.png`) should be replaced with a proper vector/high-res source, not a WhatsApp export |
| Favicons | Generate full favicon set (16/32/180/512, `site.webmanifest`) from the logo mark |
| Hero images (Home, per-concern) | Re-shoot or re-process existing images; must be compressed + served via `next/image` with responsive `srcset` |
| Before/after testimonial images | Re-collect with **explicit written consent** confirmed per Section 10.6's `consent_confirmed` flag — do not carry over existing images without confirming consent was originally obtained |
| Ingredient/science diagram icons | Recreate as clean SVG icon set rather than photographic/PNG icons currently used |
| Trust badge icons (Toxin-free, Vegan-friendly, etc.) | Recreate as a consistent SVG icon set — currently inconsistent styles across badges |
| Fonts | [ASSUMED — VERIFY current font choice via Elementor settings]; recommend a modern, readable pairing (e.g., a humanist sans for body + a slightly editorial serif or display sans for headings) — finalize in Section 14 |
| Social share / OG images | New — 1200×630 per major page, branded template |
| Downloadables | None currently identified on the crawled pages; confirm none exist on Acne/Other Issues before finalizing |
| Lottie/micro-animations | New — optional, for quiz step transitions and stat counters (Framer Motion can cover most needs without full Lottie dependency) |

---

## 14. Design System

- **Typography:** Two-font system — one for headings (slightly more expressive, matches the "premium skincare" positioning), one for body/UI (highly legible at small sizes for mobile-heavy traffic). Exact families to be chosen in the design phase, not hardcoded here as a technical assumption.
- **Spacing/Grid:** Tailwind's default spacing scale (4px base unit), 12-column responsive grid via Tailwind's container + grid utilities.
- **Radius:** Consistent, moderate rounding (e.g., `rounded-xl` for cards, `rounded-full` for CTAs/badges) to reinforce the "soft, skincare" brand feel without looking like a generic template.
- **Shadow:** Subtle, layered shadows for cards/modals only — avoid heavy drop-shadows that read as dated.
- **Colors:** Derive a proper palette from brand assets (logo colors) — primary brand color, a complementary accent, and a full neutral gray scale for text/backgrounds. Must pass WCAG AA contrast at all text sizes used.
- **Breakpoints:** Tailwind defaults (`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`), designed **mobile-first** given the likely traffic profile.
- **Animation guidelines:** Framer Motion for page/section transitions and the quiz stepper; GSAP reserved only for anything genuinely complex (e.g., a scroll-driven ingredient-science animation) — avoid using GSAP where Framer Motion alone suffices, to keep bundle size down.
- **Component standards:** Every component built once in `components/ui`, documented in `COMPONENTS.md` (Section 22), no one-off inline-styled elements.
- **Accessibility rules:** All interactive elements keyboard-navigable, all images require alt text (enforced via a lint rule or content-model requirement), color contrast checked in CI where feasible, accordions/modals use proper ARIA roles.
- **Dark mode strategy:** Not a priority for this brand/audience — **not required at launch**, but component structure (CSS variables for color tokens) should not actively block adding it later.

---

## 15. SEO Strategy

- **Metadata:** Per-page `generateMetadata()` in Next.js App Router — unique title/description per route, no shared boilerplate.
- **Open Graph / Twitter Cards:** Full OG tags (title, description, image, type) and Twitter summary-large-image cards on every public page.
- **Schema.org:**
  - `Organization` schema sitewide (logo, name, contact points — using the **corrected, unified** phone numbers)
  - `FAQPage` schema on Home, each concern page, and Contact Us
  - `BreadcrumbList` schema on all inner pages
  - Consider `MedicalWebPage`/`MedicalCondition`-adjacent schema **only after legal review** — health/medical schema and claims (e.g., specific ingredient efficacy claims) carry regulatory sensitivity in the skincare space; do not add structured "medical claim" markup without confirming the copy is compliant with applicable advertising/health-claim regulations in India.
- **Robots & Sitemap:** `app/robots.ts` and `app/sitemap.ts` generated dynamically from the `concerns` and `blog_posts` tables so new content is automatically included — no manual sitemap maintenance.
- **Canonical:** Every page sets an explicit canonical URL; eliminates the current query-param URL leakage entirely (Next.js routing makes this a non-issue by construction).
- **Redirects:** A full 301 redirect map must be built from the *old* WordPress URLs to the *new* Next.js routes before cutover (see Section 4 migration plan work in the discovery phase) — since the URL structure is being kept nearly identical (`/pigmentation/` → `/pigmentation`), redirect risk is low, but the query-param home link and any WP-generated URLs (e.g., `?page_id=`) must be redirected too.
- **Structured data testing:** validate every schema block with Google's Rich Results Test before launch.
- **Image SEO:** descriptive filenames and alt text for every image (replacing current generic/auto-generated filenames), `next/image` for automatic responsive delivery.
- **Performance SEO:** directly tied to Section 16 — Core Web Vitals are a ranking factor, and mobile performance is currently a likely weak point worth fixing regardless of SEO, purely for conversion rate.

---

## 16. Performance Strategy

- **Rendering strategy:**
  - Marketing pages (`/`, `/about-us`, concern pages, legal pages): **SSG with ISR** (revalidate periodically or on-demand via a webhook when FAQ/testimonial content changes in Supabase)
  - `/blog/[slug]`: SSG + ISR, revalidate on publish
  - `/quiz/[concern]`: mostly client-rendered (interactive form state) with a server-rendered shell for the initial questions fetch
  - `/admin/*`: fully dynamic/server-rendered per request (always-fresh lead data), no caching
- **Image optimization:** `next/image` everywhere, AVIF/WebP with JPEG fallback, explicit `sizes` for responsive `srcset`, `priority` only on true above-the-fold hero images
- **Font optimization:** `next/font` for self-hosted, zero-layout-shift font loading (replacing Elementor's Google Fonts external requests)
- **Bundle splitting:** rely on Next.js's automatic per-route code splitting; keep heavy libraries (Framer Motion, GSAP if used) scoped to the components that need them via dynamic `import()` where they're not needed above the fold
- **Lazy loading:** all below-the-fold carousels, testimonial galleries, and non-critical sections
- **Caching/CDN:** Vercel's edge network handles static asset + ISR caching automatically; no additional CDN layer needed at this scale
- **Streaming:** use React Server Component streaming (`loading.tsx` boundaries) for the admin dashboard's data-heavy lead tables, so the shell renders instantly while data loads
- **Target:** 90+ Lighthouse Performance on mobile for every marketing page, verified in CI (Section 21) before each production deploy

---

## 17. Security Strategy

- **Authentication/Authorization:** Supabase Auth + `middleware.ts` route protection for `/admin/*`, role checks (Section 11) enforced both in middleware and again at the data layer (defense in depth)
- **CSRF:** Next.js Server Actions have built-in CSRF protection via same-origin checks — no additional CSRF token handling needed for form submissions
- **XSS:** No `dangerouslySetInnerHTML` except for tightly-controlled, sanitized blog content (if blog posts ever accept rich HTML rather than Markdown, sanitize with a library like `sanitize-html` before render)
- **SQL Injection:** N/A directly — all database access goes through Supabase's parameterized client, no raw string-concatenated SQL anywhere in the codebase
- **Rate limiting:** on `contact_submissions` and `leads` insert Server Actions, to prevent spam/bot abuse of the public forms
- **Headers:** standard security headers (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy) configured in `next.config.ts`
- **Secrets:** all API keys (Supabase service role key, any future third-party integration keys) live only in Vercel environment variables, never in client-side code or committed files; `.env.example` documents required variables without real values
- **Environment variables:** clear separation of `NEXT_PUBLIC_*` (safe for browser: Supabase URL + anon key) vs. server-only (`SUPABASE_SERVICE_ROLE_KEY` — never prefixed with `NEXT_PUBLIC_`)
- **API security:** any future Route Handlers validate input with Zod and check auth/role before touching the database, identically to Server Actions
- **Supabase RLS:** enforced on every table per Section 10.7 — this is the primary data-security boundary, not just an app-layer check
- **Monitoring/Audit logs:** `lead_status_history` table provides a built-in audit trail for lead changes; Vercel/Supabase logs cover infra-level monitoring at launch scale

---

## 18. Deployment Strategy

- **Version control:** GitHub, `main` branch is production, `develop` (or feature branches directly off `main` with PR review) for in-progress work — team size will determine whether a `develop` branch adds value or just overhead; default to trunk-based development with short-lived feature branches unless the team grows past ~3 engineers.
- **CI/CD:** GitHub Actions (or Vercel's native git integration) runs lint, type-check, and test suite on every PR; Vercel auto-deploys a **preview URL** per PR for stakeholder review before merge.
- **Hosting:** Vercel for the Next.js app; Supabase-hosted Postgres/Auth/Storage.
- **Environment variables:** managed per-environment in Vercel (Production/Preview/Development) and mirrored in Supabase project settings where relevant.
- **Preview deployments:** every PR gets a live preview URL — this replaces the current "edit live in wp-admin" workflow entirely with a safe review-before-merge process.
- **Production deployments:** merge to `main` → automatic production deploy via Vercel.
- **Rollback strategy:** Vercel's instant rollback to any previous deployment (no rebuild needed) covers the app layer; database migrations (Supabase) should be additive/backward-compatible wherever possible so a code rollback never requires a matching destructive database rollback.
- **Domain/DNS cutover:** [OPEN ITEM — Section 0 #6] plan a low-risk cutover window, keep the old WordPress site accessible at a staging subdomain during transition in case of rollback need.

---

## 19. Development Roadmap

| Phase | Focus | Key deliverables | Dependencies | Est. effort | Completion criteria |
|---|---|---|---|---|---|
| **1. Planning** | Finalize this blueprint | Approved PROJECT_BLUEPRINT.md, Section 0 items closed | Client provides plugin list, PageSpeed report, Supabase credentials, remaining page content | 3–5 days | Client sign-off on this document |
| **2. Project Setup** | Repo, tooling, CI | Next.js app scaffolded, Tailwind/shadcn configured, Supabase project connected, CI pipeline running | Phase 1 complete | 2–3 days | `npm run dev` works, CI passes on an empty commit |
| **3. Design System** | Section 14 implementation | Tokens, base components (`Button`, `Card`, `Accordion`, etc.) in Storybook or a component-preview route | Phase 2 | 4–6 days | All primitives documented in `COMPONENTS.md` with visual review |
| **4. Core Components** | Navbar, Footer, Hero, FAQ, Stepper | Fully reusable, tested in isolation | Phase 3 | 5–7 days | Components pass unit tests + visual QA |
| **5. Public Pages** | Home, About, 3 concern pages, Contact, Legal | Pixel-approved, content-accurate rebuild of every marketing page | Phase 4 + confirmed content for Acne/Other Issues/Legal pages | 10–14 days | All pages match approved designs, Lighthouse ≥ 85 in dev |
| **6. Quiz Engine** | Supabase-backed multi-step quiz | `/quiz/[concern]` fully functional, submissions land in `leads` table | Phase 5 + Supabase credentials | 7–10 days | End-to-end submission tested for all 3 concerns |
| **7. Authentication** | Admin login + role gating | Supabase Auth wired, `middleware.ts` protecting `/admin` | Phase 6 | 3–4 days | Only authenticated `admin`/`editor` roles can reach `/admin/*` |
| **8. Backend/Admin Panel** | Leads dashboard, status updates, FAQ/testimonial management | Functional internal CRM-lite | Phase 7 | 8–10 days | Team can view/update real leads end-to-end |
| **9. SEO** | Metadata, schema, sitemap, redirects | Full SEO implementation per Section 15, 301 redirect map from old URLs | Phase 5 | 4–5 days | Rich Results Test passes, redirect map verified |
| **10. Optimization** | Performance pass | Image/font optimization finalized, bundle audited | Phase 9 | 3–5 days | Lighthouse ≥ 90 mobile on all marketing pages |
| **11. Testing** | Full test pass | Unit, integration, E2E, accessibility, cross-browser (Section 21) | Phase 10 | 5–7 days | All critical flows covered, no P0/P1 bugs open |
| **12. Production Deployment** | Cutover | DNS switched, old site archived/redirected, monitoring live | Phase 11 | 1–2 days + monitoring window | Site live at myskinwise.com, no redirect/SEO regressions in first 2 weeks |

*(Estimates assume a small team of 1–2 full-stack engineers plus a designer; adjust with real team composition once staffed.)*

---

## 20. Feature Backlog

**Must Have (launch blockers)**
- Working, database-backed quiz for all 3 concerns (fixes the confirmed broken funnel)
- Contact form
- Unified, correct contact info sitewide
- Admin leads dashboard (view + status update)
- Full SEO/redirect parity with old site

**Should Have**
- Blog/content hub (SEO compounding, positions brand as an authority)
- WhatsApp deep-link CTA as a first-class action, not secondary to phone
- Basic analytics event tracking on quiz step completion/drop-off (funnel visibility currently doesn't exist at all)
- Email notification to the internal team on new lead submission (simple transactional email, e.g., via Resend)

**Nice to Have**
- Dark mode
- Multi-language support (Hindi + English, given the India market) — real user-value feature, not just a technical nicety, worth scoping seriously once the core launches
- Saved/resumable quiz progress (magic-link style) for users who drop off mid-quiz

**Future**
- Customer accounts + order/treatment-progress tracking portal
- AI-assisted preliminary skin-concern triage before human expert review (must be framed carefully — not a diagnostic claim, purely a routing/preparation aid for the human expert)
- Referral program

**Enterprise**
- Role-based sales team assignment (`leads.assigned_to`)
- Multi-brand/multi-site support if Razorbill expands beyond Skinwise

**AI Features**
- AI chat assistant for pre-quiz FAQ triage (reduces load on human support for repetitive questions like "is there a consultation fee")
- Auto-generated, on-brand blog draft assistance for the content team (human-reviewed before publish, always)

**Automation Features**
- Auto-tag leads by source/UTM for marketing attribution
- Auto-send a WhatsApp confirmation message on quiz submission (via a WhatsApp Business API integration) — directly addresses the current "expert will contact you in 24 hours" gap with an instant acknowledgment

**Analytics**
- GA4 + server-side conversion tracking for quiz completion and contact-form submission
- Funnel drop-off dashboard (which quiz step loses the most users) inside `/admin`

**CRM**
- Long-term: consider syncing `leads` to a proper CRM (e.g., a lightweight integration) once lead volume outgrows the in-house `/admin` panel

**Marketing**
- UTM-aware landing experiences (e.g., a paid-ad visitor sees a slightly different hero matched to the ad's promise) — future personalization layer, not launch-critical

**Integrations**
- WhatsApp Business API (see Automation above)
- Email (Resend/Postmark) for internal notifications and any future customer-facing confirmation emails

---

## 21. Testing Strategy

- **Unit:** Vitest/Jest for utility functions, Zod schemas, and isolated component logic
- **Integration:** Testing Library for component + Server Action integration (e.g., quiz step validation → submission flow)
- **E2E:** Playwright covering the critical paths — full quiz completion for each concern, contact form submission, admin login + lead status update
- **Accessibility:** automated `axe-core` checks in CI on every major page, plus a manual screen-reader pass (VoiceOver/NVDA) before launch
- **Performance:** Lighthouse CI on every PR against the marketing pages, failing the build if Performance score regresses below the agreed threshold
- **SEO:** automated check that every page has a unique title/description and valid structured data (Rich Results Test, run manually pre-launch and after any schema change)
- **Regression:** Playwright E2E suite re-run on every deploy to production
- **Cross-browser:** Playwright configured for Chromium, WebKit, and Firefox at minimum
- **Mobile:** explicit mobile-viewport Playwright runs, plus real-device manual QA (this audience is mobile-heavy) before launch

---

## 22. Documentation Standards

| File | Purpose |
|---|---|
| `README.md` | Project setup, local dev instructions, environment variable list |
| `ARCHITECTURE.md` | Expanded version of Sections 4/7/8/9 — kept in sync as the system evolves |
| `API.md` | Documents every Server Action and Route Handler: inputs, outputs, auth requirements |
| `DATABASE.md` | Expanded version of Section 10 — schema, RLS policies, migration history |
| `COMPONENTS.md` | Living catalog of every component in `components/ui` and `components/features`, with usage examples |
| `DEPLOYMENT.md` | Expanded Section 18 — exact deploy steps, environment variable checklist, rollback procedure |
| `SECURITY.md` | Expanded Section 17 — incident response contact, secret-rotation procedure (relevant given the credential-sharing incident during discovery) |
| `CHANGELOG.md` | Human-readable log of notable changes per release, following Keep a Changelog format |
| `CONTRIBUTING.md` | PR process, branch naming, code review expectations |

---

## 23. Execution Rules

These rules apply to every future task on this project, without exception:

1. Never break the established architecture in this document without an explicit, documented decision recorded in `ARCHITECTURE.md`.
2. Never duplicate code — if a pattern repeats twice, extract a shared component/utility.
3. Build reusable components only; no one-off, page-specific markup for things that exist elsewhere on the site (this is the single biggest lesson from the WordPress audit).
4. Use TypeScript strictly — `strict: true`, no `any` without a documented reason.
5. Follow SOLID principles and Clean Architecture boundaries (UI ↛ direct DB calls; always through `services/`).
6. Accessibility-first: no component ships without keyboard support and proper ARIA semantics.
7. SEO-first: no public page ships without complete metadata.
8. Performance-first: no marketing page ships if it drops the Lighthouse mobile score below the agreed threshold.
9. Production-ready code only — no "TODO, fix later" merged to `main` without a tracked issue.
10. Document every major decision in the relevant file from Section 22 at the time it's made, not retroactively.
11. **Never move to the next roadmap phase (Section 19) until the current phase's deliverables are complete and explicitly approved by the client.**
12. Never invent Supabase, third-party API, or any other credentials — always stop and request them explicitly, listing exactly what is needed (see Section 0/11).

---

## Technology Stack (Fixed)

**Frontend:** Next.js (latest App Router), React (latest), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, React Hook Form, Zod
**Backend:** Next.js Route Handlers / Server Actions, Supabase
**Database:** PostgreSQL (Supabase)
**Authentication:** Supabase Auth
**Storage:** Supabase Storage
**Deployment:** Vercel, Supabase
**Version Control:** GitHub

---

## Next Steps

1. Client reviews and approves (or amends) this blueprint.
2. Client closes out the **Open Items** in Section 0 — plugin list, PageSpeed report, remaining page content, and critically, **Supabase project credentials** (Project URL, anon key, service role key, desired Auth providers) — none of which will be invented.
3. On approval, Phase 1 (Planning) is marked complete and Phase 2 (Project Setup) begins.
