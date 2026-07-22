import type { Ingredient, IngredientSlug } from "@/content/ingredients/types";

/**
 * The six ingredients Skinwise has published photography and written
 * descriptions for. Deliberately not a general skincare encyclopaedia —
 * a page exists here only where the brand already had real material for it.
 */
export const INGREDIENTS: Record<IngredientSlug, Ingredient> = {
  "vitamin-c": {
    slug: "vitamin-c",
    name: "Vitamin C",
    role: "Brightening antioxidant",
    summary: "Brightens skin and reduces the look of dark spots.",
    image: "ingredientVitaminC",
    whatItIs:
      "Vitamin C is an antioxidant used widely in skincare, usually as L-ascorbic acid or a gentler derivative such as ethyl ascorbic acid. In a routine it is valued for helping skin look brighter and more even.",
    commonlyUsedFor: [
      "Helping dull skin look brighter",
      "Reducing the appearance of dark spots and uneven tone",
      "Supporting skin against day-to-day environmental stress",
    ],
    suitedTo:
      "People whose main frustration is dullness or patches of darker tone rather than active breakouts.",
    considerations: [
      "Introduce it gradually rather than daily from the start.",
      "Wear sunscreen — brightening work is undone by unprotected sun exposure.",
      "Vitamin C formulas can oxidise; a formula that has turned deep orange is past its best.",
    ],
    routineNote:
      "Usually applied in the morning, after cleansing and before moisturiser and sunscreen.",
    concerns: ["pigmentation", "other-issues"],
    skinTypes: ["oily"],
  },

  niacinamide: {
    slug: "niacinamide",
    name: "Niacinamide",
    role: "Barrier-supporting multitasker",
    summary: "Helps control oil production and soothes the look of inflammation.",
    image: "ingredientNiacinamide",
    whatItIs:
      "Niacinamide is a form of vitamin B3. It is one of the most broadly tolerated active ingredients in skincare, which is why it appears in regimens for almost every skin type.",
    commonlyUsedFor: [
      "Helping skin look less shiny through the day",
      "Calming the look of redness and irritation",
      "Supporting the skin barrier",
      "Softening the appearance of uneven tone",
    ],
    suitedTo:
      "Almost everyone — it appears in the Skinwise regimens for dry, oily and combination skin alike.",
    considerations: [
      "Generally well tolerated, including by sensitive skin.",
      "If you are using several actives, introduce them one at a time so you can tell what is working.",
    ],
    routineNote: "Works morning or evening, and pairs comfortably with most other ingredients.",
    concerns: ["pigmentation", "acne", "other-issues"],
    skinTypes: ["dry", "oily", "combination"],
  },

  "salicylic-acid": {
    slug: "salicylic-acid",
    name: "Salicylic Acid",
    role: "Pore-clearing BHA",
    summary: "Helps unclog pores and reduce the appearance of blackheads and whiteheads.",
    image: "ingredientSalicylicAcid",
    whatItIs:
      "Salicylic acid is a beta hydroxy acid (BHA). Unlike water-soluble acids it is oil-soluble, which is why it is the usual choice for congested pores rather than surface texture alone.",
    commonlyUsedFor: [
      "Clearing the look of congested pores",
      "Reducing visible blackheads and whiteheads",
      "Helping skin feel less oily through the day",
    ],
    suitedTo: "Oily and congestion-prone skin, and anyone whose pores look visibly blocked.",
    considerations: [
      "Start with a few times a week rather than daily.",
      "Can be drying — pair it with a moisturiser rather than skipping one.",
      "Increases sun sensitivity, so daily sunscreen matters more while using it.",
      // TODO(client-legal): confirm the wording of pregnancy guidance for BHAs
      // with a qualified reviewer before this line ships publicly.
      "If you are pregnant or breastfeeding, check with a doctor before using acids.",
    ],
    routineNote: "Usually used in the evening, after cleansing.",
    concerns: ["acne", "other-issues"],
    skinTypes: ["oily"],
  },

  "kojic-acid": {
    slug: "kojic-acid",
    name: "Kojic Acid",
    role: "Tone-evening brightener",
    summary: "Helps lighten the look of pigmentation and even out skin tone.",
    image: "ingredientKojicAcid",
    whatItIs:
      "Kojic acid is derived from fungi and from the fermentation of certain foods. In skincare it is used to interrupt the process that makes patches of skin look darker than the skin around them.",
    commonlyUsedFor: [
      "Softening the appearance of dark patches",
      "Helping overall tone look more even",
      "Working alongside other brightening ingredients",
    ],
    suitedTo: "People whose main concern is uneven tone or long-standing dark patches.",
    considerations: [
      "Patch test first — kojic acid can be sensitising for some people.",
      "Daily sunscreen is essential; sun exposure works directly against it.",
      "Results with any brightening ingredient are gradual, not immediate.",
    ],
    routineNote: "Typically an evening step, followed by moisturiser.",
    concerns: ["pigmentation", "other-issues"],
    skinTypes: ["oily"],
  },

  retinol: {
    slug: "retinol",
    name: "Retinol",
    role: "Cell-turnover vitamin A",
    summary: "Speeds up cell turnover and helps fade the look of dark spots.",
    image: "ingredientRetinol",
    whatItIs:
      "Retinol is a vitamin A derivative. It encourages skin to renew itself more quickly, which is why it appears in routines aimed at both texture and tone.",
    commonlyUsedFor: [
      "Softening the appearance of fine lines",
      "Helping skin texture look smoother",
      "Fading the look of dark marks over time",
    ],
    suitedTo:
      "People focused on texture and early signs of ageing who are willing to introduce it slowly.",
    considerations: [
      "Start once or twice a week and build up — retinol commonly causes dryness or flaking at first.",
      "Always pair with sunscreen; it increases sun sensitivity.",
      // TODO(client-legal): retinoid pregnancy guidance must be reviewed and
      // worded by a qualified reviewer before launch.
      "Not recommended during pregnancy. Speak to a doctor first.",
      "Introduce it on its own, not alongside several other new actives.",
    ],
    routineNote: "Evening only, after cleansing and before moisturiser.",
    concerns: ["pigmentation", "other-issues"],
    skinTypes: [],
  },

  "alpha-arbutin": {
    slug: "alpha-arbutin",
    name: "Alpha Arbutin",
    role: "Gentle brightener",
    summary: "Fades the look of hyperpigmentation gently.",
    image: "ingredientAlphaArbutin",
    whatItIs:
      "Alpha arbutin is a plant-derived brightening ingredient. It is usually chosen when skin does not tolerate stronger brightening actives well.",
    commonlyUsedFor: [
      "Softening the look of dark patches gradually",
      "Evening out tone without the sting of stronger actives",
    ],
    suitedTo: "People who want to work on uneven tone but find stronger brighteners irritating.",
    considerations: [
      "Among the gentler brightening options, which also means it works slowly.",
      "Sunscreen is what protects the progress you make.",
    ],
    routineNote: "Suits either morning or evening, applied before moisturiser.",
    concerns: ["pigmentation", "other-issues"],
    skinTypes: ["dry"],
  },
};

export const INGREDIENT_LIST: Ingredient[] = Object.values(INGREDIENTS);

export const INGREDIENT_SLUGS = Object.keys(INGREDIENTS) as IngredientSlug[];
