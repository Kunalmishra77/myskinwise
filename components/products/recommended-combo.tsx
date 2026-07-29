"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { comboForConcern } from "@/content/products/combos";
import { primaryProductImage } from "@/content/products";
import { useCart } from "@/lib/cart/use-cart";

const CONCERN_LABEL: Record<string, string> = {
  acne: "acne & breakouts",
  pigmentation: "pigmentation & dark spots",
  "other-issues": "texture, dullness & fine lines",
};

/**
 * A suggested combo for a concern, with add-to-cart for the whole set and for
 * each product, plus a link into each product's detail.
 *
 * Framed as a suggestion the expert confirms — never "prescribed". Prices are
 * shown only where the label carried one; the rest say confirmed on WhatsApp,
 * and the whole-combo line never sums an incomplete set into a fake total.
 */
export function RecommendedCombo({ concern }: { concern: string }) {
  const combo = comboForConcern(concern);
  const { has, add, remove, addMany } = useCart();
  if (!combo) return null;

  const slugs = combo.products.map((p) => p.slug);
  const allIn = slugs.every((s) => has(s));
  const label = CONCERN_LABEL[concern] ?? "your skin";

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-soft sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-ink">Recommended combo</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
        A starter routine for {label}
      </h2>
      <p className="mt-2 text-sm text-ink-soft">
        A simple {combo.products.length}-step set our experts often build from for {label}. Each one
        is customised for you — your expert confirms the final routine after your Skin Check.
      </p>

      <ul className="mt-5 flex flex-col gap-3">
        {combo.products.map((p, i) => {
          const img = primaryProductImage(p);
          const inCart = has(p.slug);
          return (
            <li key={p.slug} className="flex items-center gap-3 rounded-2xl bg-warm p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-ink text-xs font-semibold text-white">
                {i + 1}
              </span>
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-ink/10">
                <Image src={img.src} alt="" fill sizes="56px" className="object-contain p-1" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${p.slug}`} className="block truncate font-semibold text-ink hover:text-rose-ink">
                  {p.name}
                </Link>
                <p className="text-xs capitalize text-ink-soft">
                  {p.step} · {p.mrp !== null ? `₹${p.mrp.toLocaleString("en-IN")}` : "price on confirmation"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => (inCart ? remove(p.slug) : add(p.slug))}
                aria-pressed={inCart}
                aria-label={inCart ? `Remove ${p.name} from cart` : `Add ${p.name} to cart`}
                className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full transition ${
                  inCart ? "bg-sage/50 text-ink" : "bg-rose-ink text-white hover:bg-rose-deep"
                }`}
              >
                {inCart ? <Check aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => (allIn ? slugs.forEach(remove) : addMany(slugs))}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition ${
          allIn ? "bg-sage/40 text-ink hover:bg-sage/60" : "bg-rose-ink text-white hover:bg-rose-deep"
        }`}
      >
        {allIn ? (
          <>
            <Check aria-hidden="true" className="size-5" />
            Combo in cart
          </>
        ) : (
          <>
            <Plus aria-hidden="true" className="size-5" />
            Add the combo to cart
          </>
        )}
      </button>
    </section>
  );
}
