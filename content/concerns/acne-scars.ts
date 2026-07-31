import type { ConcernContent } from "@/content/concerns/types";
import { FAQS } from "@/content/faqs";

/**
 * Acne Scars / post-acne marks landing page content (slug `acne-scars`).
 *
 * This page is deliberately distinct from the Acne page (`acne.ts`): it is
 * about the *marks and texture left behind* once a breakout has settled, not
 * about active, inflamed acne. Copy focuses on the *appearance* of scars and
 * marks and follows the same regulated-cosmetic claim rules as the other
 * concern files:
 * - No "cure / treat / heal / permanent / guaranteed / clinically proven /
 *   flawless" language. Effects are framed as "may help", "can support",
 *   "helps fade the look of", "commonly used for".
 * - Appearance-based only — never a diagnosis or a promised result.
 * - Honest that deep, pitted (textural) scars often need a professional
 *   in-clinic option, framed gently and without naming any condition beyond
 *   "acne scars / marks".
 *
 * // TODO(client-confirm): verbatim hero headline for the acne-scars landing page.
 */
export const acneScars: ConcernContent = {
  slug: "acne-scars",
  label: "Acne Scars",
  hero: {
    heading: "Customized acne-scar care — Start your skin analysis",
    subheading:
      "Tell us about the marks your breakouts left behind, and we'll help you fade their look.",
  },
  whatIs: {
    title: "What Are Acne Scars",
    body: "Acne scars are the marks and changes in texture that can be left behind after a breakout settles. Some show up as flat spots — brown, dark, red or pink patches where the skin looks discoloured — while others are changes you can feel, like small indentations or raised areas. Flat marks tend to fade with the right ingredients and time, whereas deeper textural scars are more stubborn and often respond best to in-clinic care.",
  },
  causes: [
    {
      title: "Inflammation from breakouts",
      body: "When a pimple becomes swollen and inflamed, it can disrupt the surrounding skin. As the spot settles, it may leave a discoloured mark or a change in texture behind.",
    },
    {
      title: "Picking or squeezing spots",
      body: "Popping, picking or squeezing a breakout adds extra trauma to the skin and pushes bacteria deeper, which makes a lasting mark or an indent far more likely.",
    },
    {
      title: "Delayed care for acne",
      body: "The longer active, inflamed acne goes unaddressed, the more the skin around it can be affected — so persistent or severe breakouts are more prone to leaving marks.",
    },
    {
      title: "Sun exposure",
      body: "UV exposure stimulates extra melanin and can darken existing marks, making post-acne discolouration look deeper and linger for longer.",
    },
    {
      title: "Slow skin cell turnover",
      body: "When the skin renews its surface cells slowly, discoloured marks sit around longer instead of naturally fading, so post-acne spots can appear to linger.",
    },
  ],
  types: [
    {
      name: "Dark / brown marks (post-inflammatory hyperpigmentation)",
      body: "Flat brown, tan or grey-brown spots left where a breakout used to be. These are discolouration rather than a change in texture, and they commonly respond to brightening ingredients and diligent sun protection over time.",
    },
    {
      name: "Red / pink marks (post-inflammatory erythema)",
      body: "Flat red, pink or purplish marks that linger after a spot has calmed, most often seen on lighter skin tones. They sit at skin level and usually fade gradually with soothing, barrier-supporting care.",
    },
    {
      name: "Pitted / indented scars (atrophic)",
      body: "Textural scars you can feel — rolling (soft, wave-like dips), boxcar (broader, sharp-edged indents) and ice-pick (small, deep pinpoints). Because these are changes in the skin's surface rather than colour, they are more stubborn and often need a professional, in-clinic option to improve their look.",
    },
    {
      name: "Raised scars (hypertrophic)",
      body: "Firm, raised areas that can form where the skin over-responds as a breakout settles, more common on the chest, back and jawline. These are textural too and are best assessed by a professional.",
    },
  ],
  scienceSteps: [
    {
      title: "Support surface renewal",
      body: "Gentle exfoliating actives help lift away dull, discoloured surface cells so fresher, more even-looking skin can come through, which can make flat marks look lighter over time.",
    },
    {
      title: "Even the look of tone",
      body: "Brightening ingredients work on the appearance of excess pigment, helping to soften how visible dark and red post-acne marks are and encouraging a more even-looking complexion.",
    },
    {
      title: "Protect and maintain",
      body: "Daily broad-spectrum SPF is the most important step for marks — it shields the skin from UV that would otherwise darken discolouration and undo your progress.",
    },
  ],
  ingredientsByType: [
    {
      tabLabel: "Dark / Brown Marks (PIH)",
      items: [
        "Vitamin C",
        "Niacinamide",
        "Alpha-Arbutin",
        "Kojic Acid",
        "Azelaic Acid",
      ],
    },
    {
      tabLabel: "Red / Pink Marks (PIE)",
      items: [
        "Niacinamide",
        "Azelaic Acid",
        "Centella Asiatica",
        "Broad-Spectrum SPF 50+",
      ],
    },
    {
      tabLabel: "Textural / Uneven Skin",
      items: [
        "Retinol",
        "AHAs (Glycolic, Lactic Acid)",
        "BHA (Salicylic Acid)",
        "Mandelic Acid",
      ],
    },
    {
      tabLabel: "Everyday Protection",
      items: [
        "Broad-Spectrum SPF 50+",
        "Niacinamide",
        "Antioxidant Serums",
      ],
    },
  ],
  process: [
    {
      title: "Skin Quiz & Expert Assessment",
      body: "Take a quick quiz, and our expert will look at your post-acne marks and skin type to understand what you're seeing.",
    },
    {
      title: "Personalized Formulation",
      body: "We put together a routine of research-driven ingredients commonly used for the look of dark, red and uneven post-acne marks.",
    },
    {
      title: "Fade the Look, From the Source",
      body: "Your routine works on what is keeping your marks visible — lingering surface pigment and uneven tone — while daily SPF helps protect your progress, so your skin has the best chance to look clearer with continued care.",
    },
    {
      title: "Progress Tracking & Honest Guidance",
      body: "We track how your marks are responding and adjust as needed. If deeper, pitted scars would be better served by an in-clinic option, we'll tell you honestly rather than overpromise.",
    },
  ],
  objectionFaqs: FAQS.acneScarsObjections,
};
