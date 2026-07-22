import type { SkinType, SkinTypeSlug } from "@/content/skin-types/types";

/**
 * The four skin types Skinwise's own regimen tables define, with the
 * ingredient sets and aims transcribed from those tables
 * (Assets/WEBSITE_CONTENT.md §5). The ingredient lists are the brand's real
 * recommendations — they differ meaningfully per type rather than repeating
 * a generic list, which is why they are worth their own pages.
 */
export const SKIN_TYPES: Record<SkinTypeSlug, SkinType> = {
  dry: {
    slug: "dry",
    name: "Dry skin",
    summary: "Skin that feels tight, looks dull, and loses moisture faster than it replaces it.",
    characteristics: [
      "Feels tight, especially after washing",
      "Can look dull or papery in certain light",
      "Flaking or rough patches, often around the nose and cheeks",
      "Makeup tends to cling to dry areas",
    ],
    challenges: [
      "Moisturiser seems to disappear within a couple of hours",
      "Actives that suit other people cause stinging or flaking",
      "Winter and air conditioning make everything worse",
    ],
    aim: "Hydrate, repair the skin barrier, and reduce excess melanin.",
    ingredients: [
      "Hyaluronic Acid",
      "Niacinamide",
      "Licorice Root Extract",
      "Alpha-Arbutin",
    ],
    linkedIngredients: ["niacinamide", "alpha-arbutin"],
    mistakes: [
      "Using hot water to cleanse, which strips the skin further",
      "Reaching for a stronger exfoliant when skin looks flaky — usually the opposite of what it needs",
      "Applying hydrating serums to fully dry skin instead of slightly damp skin",
      "Skipping moisturiser in humid weather because skin feels temporarily fine",
    ],
  },

  oily: {
    slug: "oily",
    name: "Oily skin",
    summary: "Skin that produces excess oil through the day, with visible pores and congestion.",
    characteristics: [
      "Shine returns within hours of cleansing, particularly across the T-zone",
      "Pores are more visible around the nose and cheeks",
      "Blackheads and congestion are recurring rather than occasional",
      "Makeup slides or separates as the day goes on",
    ],
    challenges: [
      "Stripping the skin to control oil, which often triggers more of it",
      "Heavy moisturisers feeling greasy, leading to skipping moisturiser entirely",
      "Congestion returning as soon as a routine slips",
    ],
    aim: "Exfoliate, reduce excess oil, and inhibit melanin production.",
    ingredients: [
      "Niacinamide",
      "Salicylic Acid (BHA)",
      "Kojic Acid",
      "Vitamin C (Ethyl Ascorbic Acid)",
    ],
    linkedIngredients: ["niacinamide", "salicylic-acid", "kojic-acid", "vitamin-c"],
    mistakes: [
      "Skipping moisturiser — dehydrated skin often produces more oil, not less",
      "Cleansing several times a day with a stripping face wash",
      "Using an abrasive scrub on active breakouts",
      "Layering multiple strong actives at once and irritating the barrier",
    ],
  },

  combination: {
    slug: "combination",
    name: "Combination skin",
    summary: "An oily T-zone with normal or dry cheeks — two problems on one face.",
    characteristics: [
      "Forehead, nose and chin turn shiny while cheeks stay matte or tight",
      "Congestion concentrated in the T-zone",
      "Cheeks can flake in the same week the T-zone is oily",
    ],
    challenges: [
      "A product that suits the T-zone is too harsh for the cheeks, and vice versa",
      "Skin behaves differently by season",
      "Hard to judge which routine is actually working",
    ],
    aim: "Balance oil production and brighten.",
    ingredients: [
      "Niacinamide",
      "Mandelic Acid",
      "Tranexamic Acid",
      "Green Tea Extract",
    ],
    linkedIngredients: ["niacinamide"],
    mistakes: [
      "Treating the whole face as though it were oily",
      "Giving up on a routine after a week because one zone reacted",
      "Using strong clay masks across the entire face rather than only where needed",
    ],
  },

  sensitive: {
    slug: "sensitive",
    name: "Sensitive skin",
    summary: "Skin that reacts easily — stinging, redness, or flushing with little provocation.",
    characteristics: [
      "Stings or tingles with products other people tolerate",
      "Flushes easily with heat, weather or stress",
      "Visible redness across the cheeks and nose",
      "Reacts to fragrance and to changes in routine",
    ],
    challenges: [
      "Hard to tell which ingredient caused a reaction",
      "Recommended actives often cause more harm than good",
      "Skin can be sensitive and congested at the same time",
    ],
    aim: "Calm, soothe, and gently brighten.",
    ingredients: [
      "Centella Asiatica (Cica)",
      "Aloe Vera",
      "Licorice Root Extract",
      "Chamomile",
    ],
    linkedIngredients: [],
    mistakes: [
      "Introducing several new products at once, making the trigger impossible to identify",
      "Assuming 'natural' means non-irritating — plenty of botanical extracts sting",
      "Pushing through stinging in the belief that it means the product is working",
      "Over-exfoliating in response to rough texture caused by a damaged barrier",
    ],
  },
};

export const SKIN_TYPE_LIST: SkinType[] = Object.values(SKIN_TYPES);

export const SKIN_TYPE_SLUGS = Object.keys(SKIN_TYPES) as SkinTypeSlug[];
