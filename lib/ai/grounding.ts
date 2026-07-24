import { CONCERNS } from "@/content/concerns";
import { INGREDIENT_LIST } from "@/content/ingredients";
import { SKIN_TYPE_LIST } from "@/content/skin-types";
import { FAQS } from "@/content/faqs";
import { PRODUCTS } from "@/content/products";
import { SITE } from "@/config/site";

/**
 * Builds the assistant's knowledge base from the SAME typed content that
 * powers the website — concerns, ingredients, skin types, FAQs. There is one
 * source of truth, so the assistant can never describe an ingredient or FAQ
 * differently from the page about it, and adding content to the site adds it
 * to the assistant automatically.
 *
 * Prompt-stuffed, not RAG. The whole base is well under 15k tokens, which
 * fits comfortably in one request with room to spare; a vector store would
 * add an embedding pipeline and a retrieval failure mode to save nothing at
 * this size (platform architecture spec §7.4).
 *
 * The base is built once at module load and cached — it only changes when
 * the content files change, i.e. at deploy time.
 */
function build(): string {
  const parts: string[] = [];

  parts.push("# Skinwise knowledge base");
  parts.push(
    `Skinwise is an Indian personalised-skincare brand. Customers complete a free Skin Check; a qualified human expert reviews it and designs a routine. Skinwise publishes a range of base formulations (listed below), and each one is then customised for the individual customer — so a customer can be told which formulation an expert is likely to build from, but never the exact contents of their own bottle before an expert has reviewed them. Contact: WhatsApp ${SITE.whatsapp.display}, email ${SITE.email}.`,
  );

  parts.push("\n## Formulations (the ONLY products that exist — never invent another)");
  parts.push(
    "Describe these only as written here. Ingredient lists are as printed on the label. Only two products have a published price; for every other one, say the price is confirmed at consultation rather than estimating a figure.",
  );
  for (const p of PRODUCTS) {
    const price =
      p.mrp !== null
        ? `₹${p.mrp}${p.netQuantity ? ` for ${p.netQuantity}` : ""}`
        : "price confirmed at consultation";
    const actives = p.ingredientsPartial
      ? `${p.ingredients.join(", ")} (list abridged — the full list must be confirmed with the team)`
      : p.ingredients.join(", ");
    parts.push(
      `### ${p.name} (${p.tagline})\nRoutine step: ${p.step}. ${p.description}\n${
        p.directions ? `Directions: ${p.directions}\n` : ""
      }Key actives: ${actives}.\nPrice: ${price}.\nPage: /products/${p.slug}`,
    );
  }

  parts.push("\n## Concerns Skinwise works with");
  for (const c of Object.values(CONCERNS)) {
    parts.push(`### ${c.label}`);
    parts.push(c.whatIs.body);
    if (c.causes.length) {
      parts.push("Common contributing factors: " + c.causes.map((x) => x.title).join(", ") + ".");
    }
  }

  parts.push("\n## Ingredients (describe only in these terms)");
  for (const i of INGREDIENT_LIST) {
    parts.push(
      `### ${i.name} (${i.role})\n${i.whatItIs}\nCommonly used for: ${i.commonlyUsedFor.join("; ")}.\nWorth knowing: ${i.considerations.join("; ")}.`,
    );
  }

  parts.push("\n## Skin types");
  for (const t of SKIN_TYPE_LIST) {
    parts.push(`### ${t.name}\n${t.summary}\nAim of a routine: ${t.aim}\nCommon mistakes: ${t.mistakes.join("; ")}.`);
  }

  parts.push("\n## Frequently asked questions");
  for (const f of [...FAQS.generalFaqs, ...FAQS.acneObjections, ...FAQS.pigmentationObjections]) {
    parts.push(`Q: ${f.question}\nA: ${f.answer}`);
  }

  return parts.join("\n");
}

let cached: string | null = null;

export function knowledgeBase(): string {
  cached ??= build();
  return cached;
}

/** Approximate token size, for context-budget assertions in tests. */
export function knowledgeBaseApproxTokens(): number {
  return Math.ceil(knowledgeBase().length / 4);
}
