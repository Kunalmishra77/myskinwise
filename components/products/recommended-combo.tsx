"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Plus, MessageCircle } from "lucide-react";
import { comboForConcern } from "@/content/products/combos";
import { primaryProductImage } from "@/content/products";
import { useCart, formatPrice, buildOrderMessage } from "@/lib/cart/use-cart";
import { SITE, waHref } from "@/config/site";
import { COMBO } from "@/content/i18n/checkout";
import { T } from "@/components/i18n/t";

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
  // A one-tap order: opens WhatsApp pre-filled with this combo. No account, no
  // checkout page needed — the team confirms price/quantity/address there.
  const orderHref = `${waHref(SITE.whatsapp.e164)}?text=${encodeURIComponent(
    buildOrderMessage(combo.products.map((p) => ({ product: p, qty: 1 }))),
  )}`;

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-soft sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-ink"><T>{COMBO.eyebrow}</T></p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
        <T>{COMBO.title}</T>
      </h2>
      <p className="mt-2 text-sm text-ink-soft">
        <T>{COMBO.body}</T>
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
                  {p.step} · {formatPrice(p.mrp)}
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

      {/* Primary: order this combo now — redirects straight to WhatsApp. */}
      <a
        href={orderHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-rose-ink px-6 py-3.5 font-semibold text-white transition hover:bg-rose-deep"
      >
        <MessageCircle aria-hidden="true" className="size-5" />
        <T>{COMBO.orderWhatsapp}</T>
      </a>
      <p className="mt-2 text-center text-xs text-ink-soft"><T>{COMBO.orderHint}</T></p>

      {/* Secondary: add to cart to keep shopping / combine with other products. */}
      <button
        type="button"
        onClick={() => (allIn ? slugs.forEach(remove) : addMany(slugs))}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full border px-6 py-3 font-semibold transition ${
          allIn
            ? "border-sage/60 bg-sage/30 text-ink hover:bg-sage/50"
            : "border-rose-ink/25 bg-surface text-ink hover:bg-blush"
        }`}
      >
        {allIn ? (
          <>
            <Check aria-hidden="true" className="size-5 text-rose-ink" />
            <T>{COMBO.inCart}</T>
          </>
        ) : (
          <>
            <Plus aria-hidden="true" className="size-5 text-rose-ink" />
            <T>{COMBO.addCombo}</T>
          </>
        )}
      </button>
    </section>
  );
}
