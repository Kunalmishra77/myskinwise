import { CONCERNS } from "@/content/concerns";
import { INGREDIENT_LIST } from "@/content/ingredients";
import { SKIN_TYPE_LIST } from "@/content/skin-types";
import { FAQS } from "@/content/faqs";
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
    `Skinwise is an Indian personalised-skincare brand. Customers complete a free Skin Check; a qualified human expert reviews it and designs a custom-compounded routine. Formulations are made per customer — there is NO fixed product catalogue, no SKUs, and no public prices. Contact: WhatsApp ${SITE.whatsapp.display}, email ${SITE.email}.`,
  );

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
