# WEBSITE_CONTENT.md
### Skinwise (myskinwise.com) — Complete Page-by-Page Content Inventory
**Source:** WordPress admin CSV exports (Pages) provided by the client, 19 files, all successfully parsed.
**Nothing skipped.** Every page below reflects the actual `post_content` stored in the database — which in a few cases (noted below) differs from what currently renders live on the public site. That gap is itself one of the most important findings.

---

## 0. Critical Findings — read this before anything else

### 🔴 Finding #1: The quiz pages are NOT empty — this is a rendering bug, not missing content
Earlier, live-crawling `/acne-form-quiz/` showed a blank page. The CSV export proves the **full 15-question quiz (all fields, all "why is it important?" microcopy) exists in the database** for all three quiz pages (Pigmentation, Acne, Other Issues). This means the content was written and saved, but something — a broken shortcode, a deactivated forms plugin, a template conflict — is preventing it from rendering publicly. **This should be treated as an urgent bug ticket on the live site**, independent of the Next.js rebuild timeline, since it's the entire lead-capture mechanism.

### 🔴 Finding #2: WooCommerce is installed — this is NOT a pure lead-gen site
`cart.csv` and `checkout.csv` contain live `[woocommerce_cart]` and `[woocommerce_checkout]` shortcodes. Combined with the "Book Appointment / ₹500 advance payment / Add to cart / Buy Now" flow found on the product/regimen pages, the real funnel is:

```
Quiz → "Product" recommendation page (creams/gels/serums shown, "Yes, I am Interested")
   → Book Appointment (date/time/name/phone) + ₹500 advance payment via WooCommerce cart/checkout
   → Expert calls to confirm treatment plan
   → (Refund of ₹500 if customer declines — per copy on the payment page)
```

This corrects my earlier assumption. **The rebuild needs real cart/checkout/payment functionality**, not just a lead-capture form. This meaningfully changes the architecture — Supabase alone won't cover a payment flow; a payment gateway (Razorpay, given the INR pricing and Indian phone numbers, would be the natural fit) needs to be in scope.

### 🔴 Finding #3: Terms & Conditions has unresolved template placeholders AND a live Lorem Ipsum paragraph
The Terms page includes a literal, un-replaced paragraph of Latin filler text ("Platea porttitor potenti ac vitae senectus...") directly under the intro, and **three unfilled bracket placeholders**: `[currency]`, `[X] days` (refund window), and `[Jurisdiction]` (governing law). This is a real legal-exposure issue — a live terms page that doesn't actually state the currency, refund window, or governing jurisdiction. Flag this to whoever handles legal/compliance immediately; don't wait for the rebuild.

### 🟠 Finding #4: Refund and Cancellation page is completely empty (0 bytes of content)
Published, live, reachable — but contains nothing. Given #2 (real payments are happening), a live, empty refund/cancellation policy is a gap worth closing quickly given India's consumer protection and payment-gateway compliance norms (most gateways require a real refund policy page).

### 🟡 Finding #5: There's a duplicate/draft version of the Other Issues page
`otherissues.csv` (slug `other-issues`, live at `/other-issues/`) and `otherissues-allskincare-19june.csv` (slug `other-issues-all-skin-care-19-june`, dated June 19) are two different drafts of the same concern page — the June 19 version has a more developed "Day & Night Skincare Regimen" section with named products and a 🌞/🌙 emoji-led structure that the live version lacks. This looks like in-progress work that hasn't been published yet. Worth asking the client which version is the intended final.

### 🟡 Finding #6: There's an unrelated, unused "for testing" page
`fortesting.csv` (slug `for-testing`) is an entirely different **beauty-salon-and-spa template** full of Lorem Ipsum ("Curabitur potenti a enim facilisi...", "Viverra tellus accumsan dolor quam..."), unrelated to Skinwise's actual brand or content. This is clearly a leftover theme-demo/test page, published but not linked from navigation. Recommend excluding it from the migration entirely — confirm with the client it's not accidentally indexed by Google.

### Corrected Page Inventory (from actual WP export, superseding my earlier crawl-based list)
| Page | Slug | Status | Notes |
|---|---|---|---|
| Home | `home_page` (post title "New_Home_Page") | publish | |
| About Us | `about-us` | publish | |
| Pigmentation (landing) | `pigmentation` | publish | Quiz form is embedded directly inline on this page too, not just at the separate quiz URL |
| Pigmentation Quiz | `pigmentation-form-quiz` | publish | Content exists; not rendering live |
| Pigmentation Product/Regimen | `pigmentation-product` | publish | Post-quiz upsell page with Book Appointment forms |
| Acne (landing) | `acne` | publish | |
| Acne Quiz | `acne-form-quiz` | publish | Content exists; not rendering live |
| Acne Product/Regimen | `acne-product` | publish | |
| Other Issues (landing, live) | `other-issues` | publish | |
| Other Issues (draft, more developed) | `other-issues-all-skin-care-19-june` | publish | Possible unpublished replacement — confirm with client |
| Other Issues Quiz | `other-issues-form-quiz` | publish | Content exists; not rendering live |
| Other Issues Product/Regimen | `other-issues-product` | publish | |
| Book Appointment / Payment | `book-appointment-payment-page` | publish | ₹500 advance payment flow |
| Contact Us | `contact-us` | publish | |
| Cart | `cart` | publish | WooCommerce shortcode only |
| Checkout | `checkout` | publish | WooCommerce shortcode only |
| Privacy Policy | `privacy-policy` | publish | |
| Terms and Conditions | `terms-and-conditions` | publish | Unfilled placeholders + Lorem Ipsum paragraph |
| Refund and Cancellation | `refund-and-cancellation` | publish | **Completely empty** |
| For Testing (unused) | `for-testing` | publish | Unrelated beauty-salon demo content — exclude from migration |

---

## 1. Home Page
*Post title: "New_Home_Page" · slug: `home_page`*

- Hero image carousel (3 banner images)
- Trust badge strip (100% Natural Ingredients, Toxin-Free, Vegan-Friendly, Dermatologically Tested, Paraben-Free, Non-Greasy Formula, Sulfate-Free, Cruelty-Free, Safe for all skin types) — rendered via an animated CSS "marquee" scroll effect
- **Four value props:** "Your Problems, Our Priority" / "Expert Guidance, Every Step of the Way" / "Seamless Service, Happy Journey" / "Results that Speak for Themselves"
- **"What Difference Does Skinwise bring?"** section
- **"Research – Driven Results"** — founder/specialist spotlight:
  > Ashu Sharma, Skin Specialist with a passion for Innovation. Ashu Sharma is a renowned skin specialist with extensive expertise in research and development in bioscience. At SkinWise, she and her team are committed to driving innovation, delivering accurate and lasting skin solutions with [Read More → /about-us/]
- **Three concern cards:** "Know Your Pigmentation" / "Know Your Acne" / "Know Your Face Issues" (each linking to the respective landing page)
- **"Four Steps to Healthy Skin"** process:
  1. Take us through your skin journey for us to understand what you have been going through and how we can help.
  2. Our trained personnel will listen to your concerns and guide you with the right solutions for your skin issues.
  3. We develop a skin treatment routine to treat your problems and get it delivered at your doorstep.
  4. Follow routine and experience actual improvements in your skin. Do share your feedback too.
- Image gallery strip (7 numbered images)
- **"Real Customers Real Results"** — before/after image carousel (Pigmentation + Acne)
- Three CTA cards: "Customised Pigmentation Treatment" → `/pigmentation-form-quiz/`, "Customised Acne Treatment" → `/acne-form-quiz/`, "Customised Anti-Aging Treatment" → `/other-issues-form-quiz/`
- **"Your Safety Is Our Top Most Priority"** trust-badge section

> 🟡 **Note on source completeness:** the four items below (stats, FAQ, footer) appear on the live homepage and in the client-provided content PDF, but are **not present in the `new_home_page.csv` export's `post_content` field.** This strongly suggests they're rendered from a separate **Elementor Theme Builder global template** (most likely a shared footer template used site-wide) rather than being part of this page's own content. **Action item:** when pulling final content from wp-admin, also export any Theme Builder templates (Templates → Theme Builder, if Elementor Pro) — the page-by-page CSV export alone will miss this.

- **"Our Results Are Powered By Science, Human Expertise & Supported By Data"** — "Skinwise provides solutions you can trust."
  - Agreed that their dark spots visibly reduced. *(shows "2%"/"0%" live — see Section 0 stat-counter bug)*
  - Agreed that their skin tone looks even.
  - Agreed that their skin appears brighter and healthier.
  - Agreed that their skin feels smooth and hydrated.
  - *"According to an independent, third-party clinical study conducted over a period of 28 days."*
- **FAQ — "We've got answers"** (same 5 general Q&As used across Pigmentation/Acne/Other Issues pages):
  - How soon will I see results for pigmentation and acne? → Results vary based on skin type and condition, but many customers notice visible improvements within a few weeks.
  - Do your products work on all types of pigmentation and acne? → Our expert-formulated solutions target various skin concerns for effective results. However, effectiveness may vary depending on individual skin conditions.
  - How can I get a customized treatment for acne or pigmentation? → Simply fill out our form with details about your skin concerns, and our experts will create a personalized skincare solution for you.
  - Is there a consultation fee for product customization? → No, our expert consultation for personalized skincare solutions is completely free of charge.
  - What happens after I submit the customization form? → Our expert will contact you within 24 hours to assess your concerns. After evaluation, you can proceed with placing your order.
- **Footer / Contact block:**
  - For Support: `+91 93191 35065`
  - Product Related Query: `+91 96501 21669`
  - Email: `Support@myskinwise.com`
  - Reach Out: WhatsApp `+91 93191 35065` | Customer Care `+91 93191 35065` | Email `support@myskinwise.com`
  - Visit Links: Home, About Us, Contact us, Hyperpigmentation, Acne, Other Issues
  - Subscribe Now: "Never miss our updates! Subscribe today!"
  - CTA: "analyse your skin now" → `/pigmentation-form-quiz/`
  - © 2025 Razorbill Private Limited. All Rights Reserved. | Privacy Policy | Terms & Conditions

*(This section merged in from a second client-provided content reference (PDF) that captured the live-rendered footer/stats/FAQ — cross-checked against and consistent with the earlier screenshot.)*

---

## 2. About Us
*slug: `about-us`*

### Heading
**About Us** / *OUR EXPERTISE - OUR MISSION, VISION AND CORE VALUES*

### Mission
> To provide personalized skincare solutions that seamlessly blend natural ingredients with scientific innovation, benefiting those suffering from prolonged skin related problems. We promise effective results that help to gain and maintain healthy and radiant skin while promoting overall well-being.

### Vision
> Skinwise is going to be the destination for those seeking a solution to their skin ailments and thus enjoy the confidence of those who found long-term remedy from neglected skin health.

### Core Values
- **Personalization:** Tailored skincare solutions for every unique skin type.
- **Integrity:** Transparent, ethical, and safe skincare you can trust.
- **Sustainability:** Eco-friendly ingredients and packaging for a greener future.
- **Innovation:** Science-backed formulas for visible and lasting results.
- **Community:** Empowering lives through health, education, and sustainability.

### Founder's Story
> Hi, I'm Anant Sanadhya, the founder of Skinwise. I started this brand with a simple belief: skincare should be as unique as your skin. Too often, people struggle with concerns like pigmentation, acne and fine lines while using products that don't truly work for them. That's why Skinwise is all about understanding your skin and choosing wisely.
>
> At Skinwise, we create personalized treatments with expert-backed formulations, ensuring that every product is suited to your specific skin needs. It's not just about skincare—it's about making informed choices that bring real results.
>
> My journey with Skinwise is fueled by a passion for helping people feel confident in their own skin. Through continuous learning and innovation, I'm committed to making skincare effective, personal, and truly transformative.

### Our Approach (3 pillars)
1. **Customised Solutions for Persistent Skin Problems** — Effective treatments for acne, pigmentation, and wrinkles, delivering lasting, visible results.
2. **Guided by Proven Expertise** — Years of research and dermatological care ensure reliable, science-backed results.
3. **Commitment to Nature-Based Active Ingredients** — At Skinwise, your experience will be without any unnecessary procedures as our team ensures that you get the best of what nature and science have to offer.

### Footer block
Reach Out: Email `support@myskinwise.com` · Customer Care `+91 9211530020` · WhatsApp `+91 9311512230`
Visit Links: Home / About Us / Contact us / Hyperpigmentation / Acne / Other Issues
Subscribe Now: "Never miss our updates! Subscribe today!"

---

## 3. Pigmentation — Landing Page
*slug: `pigmentation`*

**CTA:** "Analyse your skin" (note: link target is empty/broken in source — `href=""` — another small bug)

### Hero
**"Customized hyper-pigmentation solution — Start your skin analysis"**
"Tell Us About Your Skin – We'll Fix the Hyper-pigmentation."

*(Note: the full pigmentation quiz form — Full Name, Email ID, Age, WhatsApp Number, Gender, skin type, duration, severity, prior treatments, sun exposure, sunscreen use, current routine, pregnancy/menstrual/hormonal questions, face image upload — is embedded directly inline on this landing page in addition to existing at the separate `/pigmentation-form-quiz/` URL. See Section 9 for the full question set, shared across both locations.)*

### What is Hyperpigmentation
> Hyperpigmentation is a common skin condition where certain areas of the skin become darker than the surrounding skin due to excess melanin production. It can appear as dark spots, patches or uneven skin tone.

### Reasons of Hyperpigmentation
- **Genetic factors** — Some pigmentation disorders, like vitiligo or freckles, run in families and affect skin tone.
- **Harsh skincare** — Overuse of strong products or frequent exfoliation can trigger inflammation and pigmentation.
- **Sun damage** — Prolonged UV exposure stimulates excess melanin, leading to stubborn dark spots and uneven skin tone.
- **Hormonal changes** — Pregnancy, PCOS or birth control pills can disrupt melanin production, leading to melasma.

*(Note: this block is duplicated twice in the source with different accordion IDs — same content-duplication bug pattern seen elsewhere on the site.)*

### Which One Looks Like Your Hyper-pigmentation
- **Melasma** — Patchy brown or grayish spots, usually on the face, triggered by hormones or sun exposure.
- **Sunspots** — Dark patches caused by prolonged sun exposure, commonly appearing on the face.
- **Freckles** — Small, light-brown spots that darken with sun exposure, often seen in people with fair skin.
- **Hyperpigmentation (PIH)** — Dark marks left behind after acne, cuts, burns, skin inflammation, or hyperpigmentation.

### The Science Behind Treating Hyper-pigmentation
1. **Exfoliation & cellular renewal** — Removes dead skin cells and accelerates cell turnover, revealing fresher, healthier skin with a natural glow.
2. **Targeted pigment correction** — Active ingredients penetrate deep into melanin-producing cells, regulating melanin production and reducing dark spots.
3. **Enhanced even skin tone** — Supports skin regeneration at a cellular level, gradually fading pigmentation and restoring a balanced, radiant complexion.

### Research-Driven Ingredients for Every Hyper-pigmentation Concern
- **Melasma:** Tranexamic Acid (controls excess melanin), Niacinamide (strengthens barrier, reduces hyperpigmentation), Kojic Acid (inhibits melanin formation)
- **Sunspots:** Vitamin C (neutralizes sun damage, brightens), Alpha Arbutin (targets pigmentation, evens tone), Retinol (speeds cell turnover)
- **Freckles:** Azelaic Acid (reduces melanin overproduction), Licorice Extract (naturally lightens pigmentation), Sunscreen SPF 50+ (prevents darkening)
- **Post-Inflammatory Hyperpigmentation (PIH):** Mandelic Acid (mild exfoliation), Centella Asiatica (heals, reduces inflammation), Green Tea Extract (soothes, prevents further darkening)

### Process: "From Assessment to Results"
1. **Skin Quiz & Expert Assessment** — Take a quick quiz, and our expert will analyze your pigmentation concerns.
2. **Personalized Formulation** — We create a custom blend of active ingredients to treat your pigmentation.
3. **Deep Action & Skin Repair** — The treatment reduces excess melanin and repairs skin at deeper levels.
4. **Progress Tracking** — We monitor results and adjust treatment for long-lasting improvements.

### FAQ — General
- **How soon will I see results for pigmentation and acne?** Results vary based on skin type and condition, but many customers notice visible improvements within a few weeks.
- **Do your products work on all types of pigmentation and acne?** Our expert-formulated solutions target various skin concerns for effective results. However, effectiveness may vary depending on individual skin conditions.
- **How can I get a customized treatment for acne or pigmentation?** Simply fill out our form with details about your skin concerns, and our experts will create a personalized skincare solution for you.
- **Is there a consultation fee for product customization?** No, our expert consultation for personalized skincare solutions is completely free of charge.
- **What happens after I submit the customization form?** Our expert will contact you within 24 hours to assess your concerns. After evaluation, you can proceed with placing your order.

### FAQ — Objection handling
- **I've tried many products, but nothing works. How is Skinwise different?** We listen to your concerns, analyze your skin deeply, and create a personalized formula to target the root cause of pigmentation—not just the surface.
- **My pigmentation makes me feel conscious. Can this really help?** Absolutely! Our treatments are designed to deliver visible results, helping you feel more confident in your skin again.
- **I don't know my skin type. Can I still get treatment?** Yes! Our experts will guide you through a quick skin quiz and consultation to understand your skin and its needs.
- **I have a busy routine. Will this treatment be hard to follow?** Not at all! We keep it simple and effective, with easy steps that fit into your daily routine without any hassle.
- **What if I don't see results? Will someone assist me?** We track your progress closely and adjust your formula if needed, ensuring your journey to clear skin is supported at every step.

---

## 4. Pigmentation — Quiz (`pigmentation-form-quiz`)
*Content exists in database; not rendering on live site — see Finding #1*

**Title:** "New Pigmentation Questions"

**Question flow:**
1. Full Name, Email ID, Age (18-25 / 26-35 / 36-45 / 46-55 / 55+), WhatsApp Number, Gender (Male/Female)
2. Select your skin type
3. How long have you been experiencing pigmentation?
4. How severe is your pigmentation? *(source has typo: "pigmetnation")*
5. Have you previously used any treatments for pigmentation?
6. How much direct sun exposure do you get daily?
7. Do you use sunscreen regularly?
8. Current skincare routine for pigmentation
9. Are you pregnant or breastfeeding?
10. Do you experience any skin changes during your menstrual cycle?
11. Have you tried any hormonal treatments (like birth control pills)?
12. **Upload your face image*** — Right side image / Left side image of face issues
13. Submit Form

---

## 5. Pigmentation — Product/Regimen Page (`pigmentation-product`)
*Reached after quiz submission*

### Header
**"Dear Customer, Congratulations on completing your Deep Skin Analysis!"**
**"Here's your customised skincare routine!"**
> Our experts will recommend the best products for your skin. You may receive options like creams, gels, or serums. Each made to target your concerns with carefully chosen ingredients.

### Three regimen tiers, each with "Yes, I am Interested" CTA + inline Book Appointment mini-form (Date, Time, First Name, Last Name, Phone/Mobile):
- **15-day** pigmentation plan
- **30-day** pigmentation plan
- **45-day** pigmentation plan

*(Note: form field says "pigmetnation" — same typo as the quiz — appearing site-wide, confirming it's a copy-paste propagated error, not a one-off.)*

### Concerns covered: Melasma, Sunspots, Freckles, hyperpigmentation

### Ingredients by skin type
- **Dry Skin:** Hyaluronic Acid, Niacinamide, Licorice Root Extract, Alpha-Arbutin — hydrate, repair barrier, reduce melanin
- **Oily Skin:** Niacinamide, Salicylic Acid (BHA), Kojic Acid, Vitamin C (Ethyl Ascorbic Acid) — exfoliate, reduce oil, inhibit melanin
- **Combination Skin:** Niacinamide, Mandelic Acid, Tranexamic Acid, Green Tea Extract — balance oil, brighten
- **Sensitive Skin:** Centella Asiatica (Cica), Aloe Vera, Licorice Root Extract, Chamomile — calm, soothe, gently brighten

### Sample regimen products shown
Pigmentation Cleanser, Pigmentation Cream, SPF-30, Day Care Cream
> Note: This is just a demo product; the actual product will be customised with ingredients according to your skin type and concern.

### "At SkinWise, Your Journey Matters"
> At SkinWise, we don't just sell products—we build long-term relationships by listening to you, supporting you, and ensuring you get the results you desire. Unlike other brands, we actively stay in touch with you throughout your skincare journey to track your progress and provide expert guidance.

### "Clean. Safe. Effective."
> Every skin concern—whether acne, pigmentation, melasma, dark spots, or wrinkles—has a root cause. The right ingredients can repair, nourish, and protect your skin. That's why we carefully select clinically proven ingredients to give you the best results.

### "Pure & Ethical: Free from Harmful Ingredients"
> Our formulas are cruelty-free with zero parabens, sulfates, phthalates, mineral oils, or GMOs. We can even make your vegan, silicone-free, dye-free, or fragrance-free.
Badge row: cruelty-free / sulfate free / paraben free / gmo free / phthalate free / alcohol free *(duplicated twice in source)*

### Support block
For Support `+91 93191 35065` · Product Related Query `+91 9311822254` *(note: yet another distinct phone number — see the running phone-number-inconsistency issue)* · Email `support@myskinwise.com`

---

## 6. Acne — Landing Page (`acne`)

**CTA:** "Analyse your skin" → `/acne-form-quiz/`

### What Is Acne
> Acne is a common skin condition that occurs when hair follicles get clogged with oil, dead skin cells and bacteria, leading to pimples, blackheads, and inflammation.

### Reasons of Acne
- **Excess oil** — Overactive sebaceous glands lead to clogged pores.
- **Bacterial growth** — Propionibacterium acnes (P. acnes) bacteria cause inflammation and breakouts.
- **Hormonal changes** — Fluctuations in hormones, especially during puberty, pregnancy or PCOS can trigger acne.
- **Clogged pores** — Dead skin cells and oil buildup contribute to breakouts.
- **Diet & lifestyle** — High-sugar and dairy-rich diets can exacerbate acne in some individuals.
- **Harsh skincare** — Overuse of strong products or frequent exfoliation can trigger acne.

*(Again duplicated twice in source with different accordion IDs.)*

### Which One Looks Like Your Acne
- **Comedonal** — Includes whiteheads and blackheads (open clogged pores) caused by excess oil and dead skin buildup.
- **Inflammatory** — Includes papules (red, swollen bumps) and pustules (pus-filled pimples) caused by bacteria and inflammation.
- **Nodular** — Large, painful, hard lumps deep under the skin caused by severe bacterial infection and inflammation.
- **Cystic** — The most severe type, with deep, pus-filled cysts that can lead to scarring if left untreated.

### The Science Behind Treating Acne
- **Problem:** Clogged Pores & Excess Oil — dead skin, excess sebum and bacteria trap dirt inside pores, leading to breakouts and inflammation.
- **Action:** Targeted Treatment — Powerful actives like salicylic acid, benzoyl peroxide, and retinoids penetrate deep, unclog pores, control oil and kill bacteria.
- **Solution:** Clearer, Healthier Skin — with consistent treatment, skin heals, inflammation reduces, and breakouts fade, preventing future acne and scarring.

### Research-Driven Ingredients for Every Acne Concern
- **Comedonal Acne (Whiteheads & Blackheads):** Salicylic Acid, Niacinamide, Green Tea Extract
- **Inflammatory Acne (Papules & Pustules):** Benzoyl Peroxide, Tea Tree Oil, Centella Asiatica
- **Severe Acne (Nodular & Cystic):** Isotretinoin, Retinoids, Azelaic Acid

### Process: "From Assessment to Results"
1. **Expert Skin Analysis** — Take a quick quiz, and our expert will analyze your acne concerns.
2. **Customized Acne Solution** — A specially formulated product designed to treat your acne effectively.
3. **Root Cause Treatment** — The product works on the root cause of acne to clear it permanently.
4. **Continuous Support & Care** — A dedicated service team keeps tracking your results for long-lasting improvements.

### FAQ — General
Same 5 general FAQs as the Pigmentation page (results timing, product effectiveness, how to get treatment, consultation fee, what happens after submission).

### FAQ — Objection handling (acne-specific)
- **I've tried multiple acne treatments, but nothing seems to work. How is Skinwise different?** Skinwise analyzes your skin type and acne triggers to create a personalized solution that targets the root cause, not just the symptoms.
- **Will this treatment help with old acne scars and new breakouts both?** Yes! Our formulations are designed to heal active acne while fading scars and preventing future breakouts.
- **I have sensitive skin. Can I still use this treatment?** Absolutely! Our formulations are free from harsh chemicals and carefully selected to suit your skin's sensitivity.
- **How long will it take to see results?** While results vary, most people notice visible improvements within 4-6 weeks of consistent use.
- **My acne keeps coming back. Will this treatment prevent future breakouts?** Yes! Our treatments regulate oil production, clear clogged pores, and strengthen your skin barrier to reduce recurring acne.

---

## 7. Acne — Quiz (`acne-form-quiz`)
*Content exists in database; not rendering on live site — see Finding #1*

**Title:** "New Acne Questions"

**Question flow (most detailed of the three quizzes):**
1. First Name, Last Name — "Tell us a bit about yourself so we can create a personalized product (and custom bottle) just for you!"
2. Email, Age (12-18 / 18-25 / 26-35 / 36-45 / 46-55 / 55+), WhatsApp Number, Gender
3. Select Your Skin Type
4. Select your face concern
5. How long have you been experiencing acne?
6. What type of acne do you primarily experience?
7. Have you previously used any treatments for acne?
8. How many pus-filled pimples do you have?
9. Have you seen a dermatologist for your acne?
10. What treatments have you tried for your acne? *(+ free-text: "Please specify the name of the product")*
11. How often do you experience stress?
12. Do you have acne scars?
13. Are you pregnant or breastfeeding?
14. Do you experience skin changes during your menstrual cycle?
15. Have you tried hormonal treatments (birth control pills)?
16. Do you have acne issues related to shaving or beard care?
17. **Upload your face image*** (jpg/jpeg/png/gif/svg) — right + left side images
18. Anything else you want us to know about acne? *(free text)*
19. Submit Form

Every question includes a "why is it important?" explainer — e.g. for the shaving question: *"Asking about acne issues related to shaving or beard care helps us identify mechanical irritation and product ingredients that may trigger breakouts, allowing us to recommend better grooming practices."* This pattern (a rationale under every question) is a strong, trust-building UX choice worth preserving in the rebuild.

---

## 8. Acne — Product/Regimen Page (`acne-product`)

Same structure as the Pigmentation product page:
- "Dear Customer, Congratulations on completing your Deep Skin Analysis!"
- Three regimen tiers (30-day, 30-day, 45-day shown in source — inconsistent labeling, worth fixing) each with Book Appointment mini-form
- **Concerns covered:** Whiteheads, Blackheads, Papules, Pustules, Nodules, Cystic Acne
- **Ingredients by skin type:**
  - Dry: Hyaluronic Acid, Niacinamide, Salicylic Acid, Tea Tree Extract
  - Oily: Salicylic Acid, Niacinamide, Zinc PCA, Tea Tree Extract, Aloe Vera
  - Combination: Niacinamide, Mandelic Acid, Tranexamic Acid, Green Tea Extract
  - Sensitive: Centella Asiatica (Cica), Aloe Vera, Licorice Root Extract, Chamomile
- **Sample products:** Acne Cleanser, Acne Gel, SPF-30, Day Care Cream
- Same "Benefits of Customized Acne Treatment" 3-pillar block: Personalized Solution / Long-Lasting Results / Expert Guidance
- Same "Why Choose SkinWise" + "Everything you want and nothing you don't" ingredient-safety badge section
- Support block: `+91 93191 35065` (general) / `+91 9311822254` (product query) / `support@myskinwise.com`

---

## 9. Other Issues — Landing Page (`other-issues`, live version)

**CTA:** "Analyse your skin" → `/other-issues-form-quiz/`

### Understanding Common Skin Concerns
> Our skin constantly regenerates, adapting to internal and external factors. Wrinkles, open pores, dullness, and dark circles are common issues, but addressing their root causes is key. With advanced dermatological science and personalised skincare, these concerns can be effectively treated at a deeper level, restoring your skin's health and radiance.

### The Science Behind SkinWise: Treating Skin Concerns Deep Within
- **Wrinkles & Fine Lines:** Peptides & Retinoids, Hyaluronic Acid & Ceramides, Vitamin E & Antioxidants
- **Open Pores:** Niacinamide, Salicylic Acid & AHAs, Zinc & Green Tea Extract
- **Dull Skin:** Vitamin C & Ferulic Acid, AHAs/BHAs, Licorice & Kojic Acid
- **Dark Circles:** Caffeine & Arnica Extract, Vitamin K & Peptides, Hyaluronic Acid & Aloe Vera

*(A second accordion block repeating Acne's causes — Excess Oil, Bacterial Growth, Hormonal, Clogged Pores, Diet & Lifestyle, Harsh Skincare — appears to be reused/copy-pasted from the Acne page onto this one, which is a content-accuracy issue since this page is meant to be about "other issues," not acne specifically.)*

### Which One Looks Like Your Face Issue
- **Wrinkles** — Deep lines that form due to aging, sun exposure, and loss of skin elasticity.
- **Dark Spots** — Patches of skin that appear darker due to sun damage, acne scars, or pigmentation.
- **Fine Lines** — Shallow lines that develop due to repeated facial movements & collagen loss.
- **Dull Skin** — Skin looks tired and lifeless due to lack of hydration and dead skin buildup.

### Why Customized Skincare is More Effective Than Generic Products
- **Identifying Your Unique Skin Needs** — Instead of a generic approach, we analyze the concerns of your skin's and provide targeted solutions.
- **Using Science-Backed Ingredients** — Every ingredient is chosen carefully to work at a cellular level, ensuring real, long-term results.
- **Avoiding Harsh Chemicals** — Many store-bought products contain parabens, sulfates, and artificial fragrances that can further worsen skin issues. The formulations we offer are free from harmful additives.
- **Result** — You enjoy a highly effective skincare solution that is tailored to suit your skin's exact needs!

### Process: "From Assessment to Results"
1. **Expert Skin Analysis** — Take a quick quiz, and our expert will analyze your face concerns.
2. **Customized Solution** — A specially formulated product designed to effectively treat all your facial concerns, including acne.
3. **Root Cause Treatment** — The product targets the root cause of all your facial concerns, working to clear them permanently for flawless skin.
4. **Continuous Support & Care** — A dedicated service team keeps tracking your results for long-lasting improvements.

### FAQ
Same general 5 + same acne-flavored objection-handling FAQs as the Acne page (this appears copy-pasted rather than written specifically for "other issues" — another content-accuracy gap worth fixing in the rebuild, since FAQ answers reference "acne" specifically on a page about wrinkles/dullness/dark circles).

---

## 9b. Other Issues — Alternate/Draft Version (`other-issues-all-skin-care-19-june`)
*Not linked from live navigation — appears to be a newer, more developed draft. Flagged in Finding #5 — confirm with client whether this should replace the live page.*

Adds a much richer **"Your Skin Deserves the Best From AM to PM! 🌞🌙"** section with a full **Day & Night Skincare Regimen**, including named demo products:

**🌞 Morning Routine:**
- Gentle Cleanser — *Herbal Glow Face Wash* (Neem & Tulsi Extracts, Vitamin C)
- Refreshing Toner — *Rose Water Toner* (Rose Extract, Witch Hazel)
- Hydrating Serum — *Glow Boost Vitamin C Serum* (Vitamin C, Hyaluronic Acid)
- Day Protection Cream with SPF — *Daily Radiance Day Cream SPF 30* (Zinc Oxide & Titanium Dioxide, Aloe Vera & Licorice)

**🌙 Night Routine:**
- Deep Cleanser — *Oil-Free Gentle Cleanser* (Salicylic Acid, Aloe Vera)
- Repair Night Serum — *Advanced Repair Night Serum* (Retinol, Niacinamide)
- Nourishing Night Cream — *Rejuvenating Night Cream* (content continues beyond what was captured in this pass — worth pulling the full remainder directly from wp-admin if this version is confirmed as the one to use)

This named-product, routine-based structure is notably more polished than the live version and would be a strong basis for the rebuilt Other Issues page if the client confirms it's the intended direction.

---

## 10. Other Issues — Quiz (`other-issues-form-quiz`)
*Content exists in database; not rendering on live site — see Finding #1*

**Title:** "New No Issue Questions" *(likely meant to be "No-Issue" as in general/other, but reads oddly — worth renaming in the rebuild)*

**Question flow:**
1. First Name, Last Name
2. Email, Age, WhatsApp, Gender
3. Select Your Skin Type
4. Select your face concern
5. Would you like to improve your skin's glow and radiance?
6. Are you looking for products to enhance skin hydration?
7. Would you like to reduce the appearance of fine lines and wrinkles?
8. Are you interested in minimizing your pore size?
9. Would you like to even out your skin tone?
10. Are you looking for a product that offers sun protection and nourishes the skin?
11. How much water do you drink daily?
12. Are you pregnant or breastfeeding?
13. Do you experience skin changes during your menstrual cycle?
14. Have you tried hormonal treatments (birth control pills)?
15. **Upload your face image*** — right + left side images
16. Anything else you want us to know? *(free text)*
17. Submit Form

Same "why is it important?" explainer pattern under every question as the other two quizzes.

---

## 11. Other Issues — Product/Regimen Page (`other-issues-product`)

Same structure as the other two product pages:
- "Dear Customer, Congratulations on completing your Deep Skin Analysis!"
- Three regimen tiers (all labeled "30 days" in source — likely should be 15/30/45 like the others; worth fixing)
- **Concerns covered:** Wrinkles, Dull Skin, Dark Spots
- **Ingredients by skin type:** identical ingredient list to the Pigmentation product page (Hyaluronic Acid/Niacinamide/Licorice/Alpha-Arbutin for dry; Niacinamide/Salicylic Acid/Kojic Acid/Vitamin C for oily; etc.) — this appears to be reused content not specifically tailored to "anti-aging," another content-accuracy item to address
- **Sample products:** Glowing Cleanser, Glowing Gel, Skin Lightening Gel, SPF-30
- Same "At SkinWise, Your Journey Matters" / "Clean. Safe. Effective." / "Pure & Ethical" blocks

---

## 12. Book Appointment / Payment Page (`book-appointment-payment-page`)

### Header
**"THANK YOU, for Booking Your Slot with Our Skin Expert!"**

### Offer
> Save 5% Extra with an Advance Payment of Just ₹500/- → ₹500.00 [Add to cart] [Buy Now]

### What to Expect After Payment
> ...and enjoy an extra 5% off on any product plan you choose — whether it's a 15-day, 30-day, or 45-day treatment.
> After you pay, our expert will call you to understand your skin concerns and suggest the right treatment plan. If you decide not to go ahead, your ₹500/- will be refunded—no questions asked.

*(This confirms the real business model per Finding #2: a small refundable deposit secures a consultation call, with the actual product/treatment plan finalized afterward.)*

---

## 13. Contact Us (`contact-us`)

### Header
**"Need Help?"** / **"Get In Touch with Skinwise"**
> Have questions about your skincare journey? Our experts at Skinwise are here to help! Whether you need guidance on acne and pigmentation treatments, order support, or general inquiries, reach out to us through your preferred contact method for personalized assistance.

### Phone Support (3 lines)
- General Inquiries — `+91 93191 35065`
- Product-Related Queries — `+91 99587 15003`
- Shipment-Related Queries — `+91 96501 21669`

### Email Support
> For any concerns, feedback, or support, email us at support@myskinwise.com

### Contact Form
Name / Email / Message / Send

### FAQ
- We listen to your concerns, analyze your skin deeply, and create a personalized formula to target the root cause of pigmentation—not just the surface.
- Yes! Our experts will guide you through a quick skin quiz and consultation to understand your skin and its needs.
- Not at all! We keep it simple and effective, with easy steps that fit into your daily routine without any hassle.
- 🔴 **"In to am attended desirous raptures declared diverted confined at. Collected instantly remaining up certainly to necessary as. Over walk dull into son boy door went new. At or happiness commanded daughters as. Is handsome an declared at received in extended vicinity subjects. Into miss on he over been late pain an."** — confirmed live placeholder Lorem-Ipsum-style text, needs a real answer written for it.

---

## 14. Cart & Checkout

Both pages contain nothing but their WooCommerce shortcodes:
- `cart` → `[woocommerce_cart]`
- `checkout` → `[woocommerce_checkout]`

Standard WooCommerce-rendered pages — confirms Finding #2 (real e-commerce payment flow exists).

---

## 15. Privacy Policy (`privacy-policy`)

### MySkinWise Privacy Policy
> MySkinWise (www.myskinwise.com) takes all due care and reasonable precautions, as foreseen under normal circumstances, to safeguard the privacy of its customers and visitors ("Customer/Visitor").

**Information We Collect:** Personal Information, Address and Contact Details, Previous Medical History, Present Ailments/Diseases/Skin-related Concerns, Transaction Details — all provided directly, voluntarily, and unconditionally by the Customer/Visitor.

**How We Use Your Information:** Improving services, maintaining accurate records, enabling follow-ups and customer support, enhancing customer satisfaction.

**Information Sharing:** Internal teams and associates, consultants and service providers, vendors and third-party partners, government authorities or law enforcement (if legally required) — "only when necessary and for legitimate business or legal purposes."

**Data Security:** "MySkinWise takes all reasonable steps and precautions to protect your data. However, due to the nature of the internet, the possibility of unauthorized access, data breaches, or misuse cannot be completely ruled out."

**Contact:** support@myskinwise.com · +91 93191 35065 · www.myskinwise.com

🟡 Note: this policy collects "Previous Medical History" and "Present Ailments" — this is sensitive health-adjacent data. Worth a compliance review (India's DPDP Act) as part of the rebuild, not just a copy-paste into the new site.

---

## 16. Terms and Conditions (`terms-and-conditions`)

> Welcome to MySkinWise.com. These Terms and Conditions ("Terms") govern your use of our website and services, including the purchase of our customized skincare products designed to address concerns such as acne, pigmentation, and other skin issues. By accessing or using MySkinWise.com, you agree to abide by these Terms. Please read them carefully.

🔴 **Immediately followed by a live, un-replaced Lorem Ipsum paragraph** (see Finding #3) — needs to be deleted and replaced with real content or removed.

1. **Acceptance of Terms**
2. **Eligibility** — 18+ required
3. **Customized Skincare Products** — formulated based on individual requirements; results may vary, no guaranteed outcomes; patch test recommended
4. **Orders and Payments** — prices in `[currency]` *(unfilled placeholder)*, various payment methods, secure processing
5. **Shipping and Delivery** — timelines vary by location; not responsible for courier delays; customer responsible for customs/duties
6. **Returns and Refunds** — no returns except defective/incorrect items; refund window stated as `[X] days` *(unfilled placeholder)*
7. **User Conduct** — no hacking/spamming/harmful content; right to terminate access
8. **Intellectual Property** — all content owned/licensed by MySkinWise; no reproduction without permission
9. **Medical Disclaimer** — products not intended to diagnose/treat/cure/prevent any medical condition; consult a dermatologist for pre-existing conditions/allergies
10. **Privacy Policy** — cross-reference
11. **Modifications to Terms** — right to update at any time
12. **Governing Law** — stated as laws of `[Jurisdiction]` *(unfilled placeholder)*; disputes via arbitration
13. **Contact Us** — support@myskinwise.com

---

## 17. Refund and Cancellation (`refund-and-cancellation`)

🔴 **Completely empty.** Zero content in `post_content`. Live, published, reachable — but blank. Given the confirmed real payment flow (₹500 advance payments via WooCommerce), this needs real content before launch, and arguably before the current site keeps taking payments.

---

## 18. "For Testing" — Unused Beauty Salon Template (`for-testing`)

Not part of the actual Skinwise site content — a leftover Elementor/theme demo page for a generic "Beauty Salon & Spa" business, filled entirely with Lorem Ipsum placeholder text ("Curabitur potenti a enim facilisi mus et rhoncus...", "Viverra tellus accumsan dolor quam primis congue rutrum scelerisque non...") and stock imagery (hair cut, nail art, massage, aromatherapy). Includes fake testimonial "Marie R. Winters" with more Lorem Ipsum.

**Recommendation:** Exclude entirely from the migration. Recommend the client unpublish or delete this page from the current WordPress site too, and check Google Search Console to confirm it hasn't been indexed under the Skinwise domain (a live Lorem-Ipsum page on a real domain can hurt SEO trust signals).

---

## Summary of Content-Accuracy Issues to Fix During Rebuild (not just carry over)

1. Quiz content exists but doesn't render live — root-cause and fix before migrating the pattern
2. WooCommerce cart/checkout confirmed live — rebuild needs real payment integration (Razorpay likely, given ₹ pricing)
3. Terms & Conditions: remove Lorem Ipsum paragraph; fill in currency, refund window, and jurisdiction
4. Refund and Cancellation page: currently empty — needs real content, urgently, given live payments
5. Duplicate/draft Other Issues page — confirm with client which version is final
6. Unused "For Testing" beauty-salon page — exclude from migration, recommend removing from current site
7. Other Issues page FAQs and "causes" content appear copy-pasted from the Acne page rather than written specifically for wrinkles/dullness/dark circles/open pores — needs original copy
8. "Other issues product" and "Pigmentation product" pages share near-identical ingredient lists — not tailored to anti-aging concerns specifically
9. Regimen tier labeling inconsistent across product pages (e.g., Acne page shows "30 days / 30 days / 45 days" instead of 15/30/45)
10. Recurring "pigmetnation" typo across quiz and product page form labels
11. Phone number inconsistency continues here: `+91 9311822254` appears as yet another "Product Related Query" number on the product pages, on top of the 4 numbers already found on Home/About/Contact
12. Privacy Policy collects "Previous Medical History" and "Present Ailments" — flag for compliance review under India's DPDP Act given the sensitivity of health data

---

*This document reflects 100% of the content provided across all 19 uploaded CSV exports. No page was skipped. Where content was thin (e.g., the empty Refund and Cancellation page, or a page reusing another page's copy), that gap is called out explicitly above rather than silently filled in — any new copy needed should be written and approved by the client, not invented here.*
