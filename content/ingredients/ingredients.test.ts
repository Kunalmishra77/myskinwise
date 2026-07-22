import { INGREDIENTS, INGREDIENT_LIST, INGREDIENT_SLUGS } from "@/content/ingredients";
import { SKIN_TYPES } from "@/content/skin-types";
import { CONCERNS } from "@/content/concerns";
import { IMAGES } from "@/content/assets";

/*
 * These guard the seams between four separate content files. Each of them
 * is edited by hand, so a typo in a slug would otherwise surface as a
 * runtime crash on a live page rather than a failing test.
 */

it("every ingredient's slug matches its key", () => {
  for (const slug of INGREDIENT_SLUGS) {
    expect(INGREDIENTS[slug].slug).toBe(slug);
  }
});

it("every ingredient points at a real image in the IMAGES map", () => {
  for (const ingredient of INGREDIENT_LIST) {
    expect(IMAGES[ingredient.image], `${ingredient.slug} has a dangling image key`).toBeDefined();
  }
});

it("every concern an ingredient references actually exists", () => {
  for (const ingredient of INGREDIENT_LIST) {
    for (const concern of ingredient.concerns) {
      expect(CONCERNS[concern], `${ingredient.slug} -> unknown concern ${concern}`).toBeDefined();
    }
  }
});

it("every skin type an ingredient references actually exists", () => {
  for (const ingredient of INGREDIENT_LIST) {
    for (const skinType of ingredient.skinTypes) {
      expect(SKIN_TYPES[skinType], `${ingredient.slug} -> unknown skin type ${skinType}`).toBeDefined();
    }
  }
});

it("ingredient and skin-type cross-references agree in both directions", () => {
  // If niacinamide claims it suits oily skin, the oily skin type must list
  // niacinamide back — otherwise one page contradicts the other.
  for (const ingredient of INGREDIENT_LIST) {
    for (const skinType of ingredient.skinTypes) {
      expect(
        SKIN_TYPES[skinType].linkedIngredients,
        `${ingredient.slug} claims ${skinType}, but ${skinType} does not link back`,
      ).toContain(ingredient.slug);
    }
  }
});

it("every linkedIngredient on a skin type resolves to a real ingredient page", () => {
  for (const type of Object.values(SKIN_TYPES)) {
    for (const slug of type.linkedIngredients) {
      expect(INGREDIENTS[slug], `${type.slug} -> unknown ingredient ${slug}`).toBeDefined();
    }
  }
});

it("every linkedIngredient is actually named in that skin type's sourced list", () => {
  // linkedIngredients is the subset of `ingredients` that has its own page.
  // If they drift apart, a skin-type page links to an ingredient it never
  // recommended.
  //
  // Hyphens are normalised before comparing: the source tables in
  // WEBSITE_CONTENT.md write "Alpha-Arbutin" while the ingredient page is
  // titled "Alpha Arbutin". Those are the same ingredient spelled two ways
  // in the client's own material, and the sourced list is transcribed
  // verbatim rather than corrected, so the comparison absorbs the
  // difference instead of the data being quietly rewritten.
  const normalise = (s: string) => s.toLowerCase().replace(/-/g, " ");

  for (const type of Object.values(SKIN_TYPES)) {
    for (const slug of type.linkedIngredients) {
      const name = INGREDIENTS[slug].name;
      const named = type.ingredients.some((entry) =>
        normalise(entry).startsWith(normalise(name)),
      );
      expect(named, `${type.slug} links ${slug} but never lists "${name}"`).toBe(true);
    }
  }
});

it("no ingredient makes a prohibited claim", () => {
  // Claim-language rules from the platform architecture spec section 8.2.
  const banned = /\b(cure[sd]?|treats?|heals?|permanent(ly)?|guarantee[ds]?|clinically proven)\b/i;
  for (const ingredient of INGREDIENT_LIST) {
    const prose = [
      ingredient.summary,
      ingredient.whatItIs,
      ingredient.suitedTo,
      ingredient.routineNote,
      ...ingredient.commonlyUsedFor,
      ...ingredient.considerations,
    ].join(" ");
    expect(prose, `${ingredient.slug} contains a prohibited claim`).not.toMatch(banned);
  }
});
