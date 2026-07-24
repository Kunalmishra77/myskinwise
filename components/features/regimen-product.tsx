import Image from "next/image";
import Link from "next/link";
import { matchFormulation, primaryProductImage } from "@/content/products";

export interface RegimenProductProps {
  /** The expert's free-text formulation reference, as stored on the regimen. */
  formulationRef: string;
  /** Optional trailing metadata, e.g. "Morning · Daily". */
  meta?: string;
}

/**
 * One line of a regimen, showing the real product where we can identify it.
 *
 * Regimen items store free text (`regimen_items.formulation_ref`) because they
 * predate the catalogue, and experts compound to order — so a reference will
 * not always name a catalogue product. When it does, the customer sees the
 * actual bottle they will receive and can open the full product page. When it
 * does not, the reference renders as plain text exactly as it did before.
 *
 * The fallback is the important half: showing a wrong bottle next to a
 * bespoke formulation would be worse than showing no bottle at all, so
 * `matchFormulation` returns null rather than guessing.
 */
export function RegimenProduct({ formulationRef, meta }: RegimenProductProps) {
  const product = matchFormulation(formulationRef);

  if (!product) {
    return (
      <div>
        <p className="font-semibold text-ink">{formulationRef}</p>
        {meta ? <p className="text-sm text-ink-soft">{meta}</p> : null}
      </div>
    );
  }

  const image = primaryProductImage(product);

  return (
    <div className="flex items-center gap-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-ink/10">
        <Image src={image.src} alt="" fill sizes="56px" className="object-contain p-1" />
      </div>
      <div className="min-w-0">
        <Link
          href={`/products/${product.slug}`}
          className="font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
        >
          {product.name}
        </Link>
        <p className="truncate text-sm text-ink-soft">{meta ?? product.tagline}</p>
      </div>
    </div>
  );
}
