# Skinwise AI Homepage — Build Spec (verbatim from client)

Build the homepage for "Skinwise" — an AI-powered personalised skincare platform —
in Next.js (App Router) + React + TypeScript + Tailwind CSS. Framer Motion for
animation. Mobile-first and fully responsive. Award-winning, modern, premium
skincare-tech aesthetic (think Apple × Aesop × Linear). Single homepage, no pricing.

## BRAND & DESIGN SYSTEM
Warm, luxe, pink/rose. Lots of whitespace, soft depth, subtle motion.

Colors (add to tailwind theme as tokens):
- bg warm white:  #FBFAF7
- surface/cards:  #FFFFFF
- ink (text):     #241C19   ink-soft: #6E645F   ink-mute: #8A807B
- rose (primary): #E0819A   rose-deep: #C05E78   rose-ink: #A8506A
- blush bg:       #FCEEF2
- champagne:      #F1E5D2
- sage accent:    #8FA187
- dark section:   #231619  (deep plum-brown)
Never use loud saturated colors.

Typography (next/font):
- Display/headings: "Cormorant Garamond" (serif, weight 600, use italic for accent words)
- Body/UI:          "Manrope" (400–800)
- Big headlines clamp up to ~90px, line-height ~1.0, letter-spacing -0.015em.
- Section eyebrows: Manrope 12.5px, uppercase, letter-spacing .16em, rose-ink,
  prefixed with an italic serif index number (01, 02 …).

Radius: cards 20–28px, pills/buttons 999px. Shadows: soft, layered, low-opacity
warm (e.g. 0 24px 54px rgba(120,70,80,.12)). Buttons: solid rose primary + glass/
outline secondary.

## GLOBAL MOTION (make it feel alive, tasteful — desktop only where noted)
- Fixed top scroll-progress bar (rose gradient).
- Cursor-follow radial glow (rose, low opacity), desktop only.
- Magnetic buttons: primary CTAs drift slightly toward the cursor when near.
- Staggered scroll reveals: fade + translateY(34px) + blur(6px) → clear, via
  IntersectionObserver / Framer whileInView.
- Count-up numbers for stats when scrolled into view.
- Subtle parallax on hero background orbs.
- Film-grain overlay (fixed SVG feTurbulence noise, ~0.5 opacity, soft-light).
- Animated gradient-mesh blobs (blurred rose/champagne/lilac radial circles drifting).
- All motion must respect prefers-reduced-motion.

## SECTIONS (in order)

1. STICKY NAV — blurred translucent bar. Logo left. Center links: Analyzer, AI Chat,
   How it works, Concerns, Results. Right: "Try AI Chat" (outline) + "Analyze My
   Skin" (dark solid, magnetic).

2. HERO (full width, gradient-mesh bg) — two columns.
   Left: pill "AI-POWERED SKIN ANALYSIS" (dot). Serif headline:
   "Understand your skin." / "Then transform it." — the word "transform" italic with
   a rose gradient text-fill. Subcopy: "Skinwise pairs AI-powered analysis with real
   human experts to build a customised routine for your exact concern —
   hyperpigmentation, acne, and beyond. No guesswork. Just skin science, made
   personal." CTAs: "Analyze My Skin →" (rose, magnetic) + "Try AI Chat" (glass).
   Trust row: ★★★★★ "4.9/5 from 2,000+ skin journeys" | lock icon "Your photos stay
   private. Always."
   Right: portrait photo in a rounded card with a scan-line sweep animation + pulsing
   detection ring. Three floating GLASS UI cards (float animation): "Acne detection ·
   Mild · T-zone", "Hydration · 72% · Rising", and a circular skin-score gauge "84 ·
   Great start".

3. TRUST MARQUEE — infinite scrolling pills: 100% Natural Ingredients, Toxin-Free,
   Vegan-Friendly, Dermatologically Tested, Paraben-Free, Non-Greasy Formula,
   Sulfate-Free, Cruelty-Free, Safe for all skin types.

4. KINETIC STATEMENT — huge serif marquee, mixing solid + outlined (text-stroke) +
   italic rose words: "Personalised skincare · Powered by AI · Backed by experts ·" (repeat).

5. AI SKIN ANALYZER  (eyebrow "01 — The AI Skin Analyzer")
   Heading: "A dermatology-grade read of your skin in seconds."
   Left: skin close-up photo styled as a live scan (scan-line, pulsing ring, "Scanning
   · 5 concerns detected" badge, chips: Enlarged pores / Uneven texture / Dehydration).
   Right: WORKING multi-step quiz card (glass) with progress bar + Back button:
     Step 1 "What's your main concern?" → Hyperpigmentation / Acne & breakouts /
       Fine lines & ageing / Dullness & dark spots
     Step 2 "What's your skin type?" → Dry / Oily / Combination / Sensitive
     Step 3 "How long has this been a concern?" → <3 months / 3–12 months / 1–3 years / 3+ years
     Step 4 "Where should we send your analysis?" → name + WhatsApp inputs + "Get my
       analysis" (privacy note)
     Success: check icon, "Your analysis is on its way — a Skinwise expert will review
       your {concern} concern and reach out within 24 hours." + Start over.
   Selecting an option auto-advances; selected option highlights (rose border + blush bg).
   Footer of card: 3 overlapping avatars + "Join 2,000+ people who found their routine".

6. AI CHATBOT  (eyebrow "02 — Skinwise AI Chat", blush gradient bg)
   Heading: "Ask anything. Get skin answers, instantly."
   Left: tappable suggested-question buttons: "How do I remove acne?", "Which
   moisturizer suits oily skin?", "Build my skincare routine". Clicking one appends a
   user bubble + a canned assistant reply (store canned answers in a map).
   Right: premium chat UI — header ("Skinwise Assistant · Online now"), message list
   (bot bubbles left/white, user bubbles right/rose), disabled input row with send btn.

7. HOW IT WORKS  (eyebrow "03") — "Four gentle steps to healthier skin." 4 cards
   connected by a dashed line, each with big serif number + icon + hover lift:
   01 Upload your photo · 02 AI analyses your skin · 03 Understand your results ·
   04 Get your custom routine.

8. WHY SKINWISE — BENTO  (eyebrow "04") — "Everything your skin needs, nothing it
   doesn't." 4-col responsive bento; two tiles span 2 cols, one is a DARK featured
   tile. Items: AI-powered analysis (dark feature), Dermatology-inspired, Private &
   Secure, Instant Reports, Progress Tracking, Customised Products (span 2), Skin
   Score, Routine Builder. Hover lift.

9. DASHBOARD PREVIEW — DARK SECTION (#231619, eyebrow "05") — "See your progress, week
   by week." Glass panels on dark: circular overall skin-score gauge (84, ▲12 this
   month), a "today's routine 3 of 4" card, four metric bars (Acne Mild, Hydration
   72%, Sensitivity Low, Pigmentation Moderate), and an 8-week progress line chart (SVG
   area+line, rose).

10. CONCERNS  (eyebrow "06") — "Built for your exact concern." 3 cards (image zoom on
    hover, gradient overlay, tag pill, "Analyze this concern →"): Hyperpigmentation,
    Acne & breakouts, Ageing & texture. Each links to the analyzer.

11. RESULTS — rose→champagne gradient panel, two columns. Copy: "Skin journeys that
    speak for themselves." Count-up stats: 2,000+ skin journeys started · 89% saw
    visible change* · 24h expert response time. Right: two portrait photos, offset.

12. TESTIMONIALS — "From skin concern to skin confidence." 3 glass cards: ★★★★★, quote,
    initials avatar + name + role. (Priya S. / Aarav M. / Neha K.)

13. FAQ — animated accordion (one open at a time, +/– toggle, smooth max-height):
    Is the skin analysis really free? · How soon will I see results? · What happens
    after I submit my analysis? · Are my photos and data kept private? · I've tried
    many products with no luck — how is Skinwise different?

14. FINAL CTA — rose gradient panel with morphing blob shapes: "Ready to understand
    your skin?" + subcopy + "Start Free Skin Analysis →" (white, magnetic) + "Try AI
    Chat" (glass).

15. FOOTER (dark #231619) — logo + tagline + Instagram/Facebook/WhatsApp icons; columns
    Explore / Concerns; newsletter email capture; support@myskinwise.com;
    "© 2025 Razorbill Private Limited."

## ARCHITECTURE
- app/page.tsx composes section components in components/sections/*.
- Reusable UI in components/ui/ (Button, Pill, SectionEyebrow, Card, Accordion,
  MagneticButton, RevealOnScroll, CountUp, Marquee).
- Quiz + chat + FAQ state via useState; motion effects via useEffect / Framer Motion.
- Use next/image for all images, next/font for fonts.
- Accessible: keyboard-navigable buttons/accordion, aria on interactive elements,
  alt text on images, WCAG AA contrast.
- Content: real Skinwise substance, elevated premium tone. Testimonial quotes/stats
  are placeholders — mark them for later replacement. No pricing anywhere.

Deliver clean, typed, componentised code following an 8px spacing grid.

## Build-integration notes (controller)
- Isolate everything under `components/home/` (ui + sections) to avoid clashing with the
  existing shared components used by the other marketing pages. New `app/page.tsx`
  (outside the `(marketing)` route group) composes them and includes its OWN nav +
  footer per the spec; DELETE `app/(marketing)/page.tsx` so `/` resolves once.
- Add Cormorant Garamond + Manrope via `next/font` in the root `app/layout.tsx` as
  additional CSS variables (keep the existing Fraunces/Inter for the other pages).
- Add the spec's colors as Tailwind v4 `@theme` tokens with clear names (warm, rose,
  rose-deep, rose-ink, blush, champagne, sage, plum/dark, ink, ink-soft, ink-mute).
  Do not remove tokens the other pages use.
- Reuse real photos already in `content/assets.ts` (`IMAGES` — includes harvested brand
  photos: heroModelPortrait/heroModelPink, beforeAfter*, model-1, concern images) for
  the hero portrait, analyzer skin close-up, concerns cards, and results portraits.
  Testimonials use initials avatars (no photo). Mark placeholder stats/quotes.
- Reuse `config/site.ts` `SITE` for the footer contact (email, WhatsApp) and any real
  contact values — no hardcoded contact info.
- Keep WCAG AA contrast, keyboard/aria a11y, prefers-reduced-motion throughout.
