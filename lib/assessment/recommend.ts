import type { SubmitAssessmentInput } from "@/lib/assessment/schema";
import { SKIN_TYPES } from "@/content/skin-types";
import type { SkinTypeSlug } from "@/content/skin-types/types";
import { INGREDIENTS } from "@/content/ingredients";
import type { IngredientSlug } from "@/content/ingredients/types";
import { CONCERNS } from "@/content/concerns";

export type FiredRule = {
  /** Stable id so a recommendation can be replayed and audited later. */
  id: string;
  /** Plain-language reason shown to the user. */
  because: string;
};

export type RegimenOutline = {
  concernLabel: string;
  skinTypeLabel: string | null;
  /** Ingredients suggested, each traceable to the rules that produced it. */
  ingredients: { slug: IngredientSlug; name: string; because: string }[];
  /** Ingredients deliberately withheld, and why. Safety comes first. */
  excluded: { name: string; because: string }[];
  /** Guidance points, not instructions. */
  guidance: string[];
  /** True when the answers suggest a person should see a doctor. */
  recommendProfessional: boolean;
  professionalReason: string | null;
  rules: FiredRule[];
};

/**
 * Turns assessment answers into a regimen outline using explicit rules over
 * the brand's own content — never a language model.
 *
 * Three properties matter here and are the reason this is not an LLM call:
 *
 *  - Every suggestion traces to a rule id, so the output is replayable and
 *    auditable months later.
 *  - Safety exclusions are hard rules, not probabilities. A pregnant user
 *    is never shown retinol, and that cannot drift with a prompt change.
 *  - It cannot invent an ingredient or a claim, because it can only select
 *    from `content/ingredients`.
 *
 * The output is deliberately an *outline*, not a prescription. A Skinwise
 * expert still decides the actual formulation — this is what the user sees
 * while they wait, and what the expert opens the call already knowing.
 */
export function buildRegimenOutline(input: SubmitAssessmentInput): RegimenOutline {
  const { concern, answers } = input;
  const rules: FiredRule[] = [];
  const excluded: RegimenOutline["excluded"] = [];
  const guidance: string[] = [];

  const answer = (id: string): string | undefined => {
    const v = answers[id];
    return Array.isArray(v) ? v[0] : v;
  };
  const answerList = (id: string): string[] => {
    const v = answers[id];
    return Array.isArray(v) ? v : v ? [v] : [];
  };

  const rawSkinType = answer("skin_type");
  const skinType =
    rawSkinType && rawSkinType !== "unsure" ? (rawSkinType as SkinTypeSlug) : null;

  // --- Base set: the brand's own regimen for this skin type ------------
  const candidates = new Map<IngredientSlug, string>();

  if (skinType) {
    rules.push({
      id: "skin-type-base",
      because: `Your routine starts from what we recommend for ${SKIN_TYPES[skinType].name.toLowerCase()}.`,
    });
    for (const slug of SKIN_TYPES[skinType].linkedIngredients) {
      candidates.set(slug, `Part of our usual approach for ${SKIN_TYPES[skinType].name.toLowerCase()}.`);
    }
  } else {
    rules.push({
      id: "skin-type-unknown",
      because: "You were not sure of your skin type, so your expert will confirm it on the call.",
    });
  }

  // --- Concern layer ---------------------------------------------------
  for (const [slug, ingredient] of Object.entries(INGREDIENTS) as [
    IngredientSlug,
    (typeof INGREDIENTS)[IngredientSlug],
  ][]) {
    if (ingredient.concerns.includes(concern)) {
      candidates.set(slug, ingredient.summary);
    }
  }
  rules.push({
    id: "concern-layer",
    because: `Ingredients we most often use for ${CONCERNS[concern].label.toLowerCase()}.`,
  });

  // --- Safety exclusions. These win over everything above. -------------
  const pregnancy = answer("pregnancy");
  if (pregnancy === "pregnant" || pregnancy === "breastfeeding") {
    for (const slug of ["retinol", "salicylic-acid"] as IngredientSlug[]) {
      if (candidates.delete(slug)) {
        excluded.push({
          name: INGREDIENTS[slug].name,
          because: "Commonly avoided during pregnancy and breastfeeding.",
        });
      }
    }
    rules.push({
      id: "safety-pregnancy",
      because: "You told us you are pregnant or breastfeeding, so we have left out ingredients usually avoided then.",
    });
    guidance.push(
      "Because you are pregnant or breastfeeding, your expert will confirm every ingredient with you before anything is made up.",
    );
  }

  if (skinType === "sensitive") {
    for (const slug of ["retinol"] as IngredientSlug[]) {
      if (candidates.delete(slug)) {
        excluded.push({
          name: INGREDIENTS[slug].name,
          because: "Often too harsh to start with on sensitive skin.",
        });
      }
    }
    rules.push({
      id: "safety-sensitive",
      because: "Sensitive skin does better starting gently, so stronger actives are held back.",
    });
  }

  // --- Guidance --------------------------------------------------------
  if (answer("sunscreen") === "never" || answer("sunscreen") === "sometimes") {
    guidance.push(
      "Daily sunscreen will do more for uneven tone than any other single change. Without it, brightening work is undone.",
    );
    rules.push({ id: "guidance-sunscreen", because: "You told us sunscreen is not yet a daily habit." });
  }

  if (answer("routine") === "none" || answer("routine") === "basic") {
    guidance.push(
      "We will keep your routine short. A routine you actually follow beats a longer one you abandon.",
    );
    rules.push({ id: "guidance-simple-routine", because: "You told us your current routine is minimal." });
  }

  if (answer("routine") === "extensive") {
    guidance.push(
      "You already do a lot. Part of the value here may be removing steps rather than adding them.",
    );
    rules.push({ id: "guidance-reduce", because: "You told us you already follow a full routine." });
  }

  // --- When to see a doctor -------------------------------------------
  let recommendProfessional = false;
  let professionalReason: string | null = null;

  if (answerList("acne_type").includes("nodules")) {
    recommendProfessional = true;
    professionalReason =
      "You described deep, painful lumps. That is worth having a doctor look at directly, alongside anything we suggest.";
    rules.push({ id: "escalate-nodular", because: "You reported deep, painful breakouts." });
  } else if (answer("severity") === "significant" && answer("tried_before") === "prescription") {
    recommendProfessional = true;
    professionalReason =
      "You have already tried prescription treatment and it is still affecting you daily. A doctor should be part of this.";
    rules.push({
      id: "escalate-failed-prescription",
      because: "Significant impact despite previous prescription treatment.",
    });
  }

  const ingredients = [...candidates.entries()].map(([slug, because]) => ({
    slug,
    name: INGREDIENTS[slug].name,
    because,
  }));

  return {
    concernLabel: CONCERNS[concern].label,
    skinTypeLabel: skinType ? SKIN_TYPES[skinType].name : null,
    ingredients,
    excluded,
    guidance,
    recommendProfessional,
    professionalReason,
    rules,
  };
}
