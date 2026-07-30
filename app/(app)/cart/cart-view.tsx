"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { primaryProductImage } from "@/content/products";
import { useCart, formatPrice } from "@/lib/cart/use-cart";
import { CART_PAGE } from "@/content/i18n/checkout";
import { useTContent } from "@/lib/i18n/use-content";
import { T } from "@/components/i18n/t";

/**
 * The full cart page: quantities, per-line prices, a priced subtotal that never
 * fabricates a figure for compounded items, and the step into checkout. Shares
 * the one localStorage cart store with the header badge and drawer.
 */
export function CartView() {
  const tc = useTContent();
  const { items, count, subtotal, hasUnpriced, increment, decrement, setQty, remove, clear } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-blush text-rose-ink">
          <ShoppingBag aria-hidden="true" className="size-8" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink">
          <T>{CART_PAGE.empty}</T>
        </h1>
        <p className="mt-2 text-ink-soft">
          <T>{CART_PAGE.emptyBody}</T>
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-ink px-6 py-3 font-semibold text-white"
        >
          <T>{CART_PAGE.browse}</T>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 lg:py-12">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">
          <T>{CART_PAGE.title}</T>
        </h1>
        <p className="text-sm text-ink-soft">
          {count} <T>{count === 1 ? CART_PAGE.itemLabel : CART_PAGE.itemsLabel}</T>
        </p>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {items.map(({ product: p, qty }) => {
          const img = primaryProductImage(p);
          return (
            <li key={p.slug} className="flex items-center gap-3 rounded-3xl bg-surface p-3 shadow-soft sm:gap-4 sm:p-4">
              <Link
                href={`/products/${p.slug}`}
                className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10 sm:size-20"
              >
                <Image src={img.src} alt="" fill sizes="80px" className="object-contain p-1.5" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${p.slug}`} className="block truncate font-display font-semibold text-ink hover:text-rose-ink">
                  {p.name}
                </Link>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {p.mrp !== null ? formatPrice(p.mrp) : <T>{CART_PAGE.priceOnConfirmation}</T>}
                </p>

                {/* Quantity stepper */}
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-ink/15">
                    <button
                      type="button"
                      onClick={() => decrement(p.slug)}
                      aria-label={tc(CART_PAGE.decrease)}
                      className="inline-flex size-9 items-center justify-center rounded-full text-ink transition hover:bg-blush"
                    >
                      <Minus aria-hidden="true" className="size-4" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={qty}
                      onChange={(e) => {
                        const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                        if (!Number.isNaN(n)) setQty(p.slug, n);
                      }}
                      aria-label={tc(CART_PAGE.quantity)}
                      className="w-9 bg-transparent text-center text-sm font-semibold text-ink focus-visible:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => increment(p.slug)}
                      aria-label={tc(CART_PAGE.increase)}
                      className="inline-flex size-9 items-center justify-center rounded-full text-ink transition hover:bg-blush"
                    >
                      <Plus aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(p.slug)}
                    className="inline-flex items-center gap-1 text-sm text-ink-soft transition hover:text-rose-ink"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    <span className="hidden sm:inline"><T>{CART_PAGE.remove}</T></span>
                  </button>
                </div>
              </div>

              {/* Line price (priced items only) */}
              {p.mrp !== null && (
                <p className="shrink-0 self-start font-semibold text-ink">
                  {formatPrice(p.mrp * qty)}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {/* Summary */}
      <div className="mt-6 rounded-3xl bg-blush/60 p-5">
        {subtotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink"><T>{CART_PAGE.subtotal}</T></span>
            <span className="font-display text-xl font-semibold text-ink">{formatPrice(subtotal)}</span>
          </div>
        )}
        <p className="mt-2 text-xs text-ink-soft">
          <T>{hasUnpriced ? CART_PAGE.someOnWhatsapp : CART_PAGE.subtotalNote}</T>
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/checkout"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-ink px-6 py-3.5 font-semibold text-white transition hover:bg-rose-deep"
        >
          <T>{CART_PAGE.proceed}</T>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <div className="flex items-center justify-between">
          <Link href="/products" className="text-sm font-semibold text-rose-ink">
            <T>{CART_PAGE.keepShopping}</T>
          </Link>
          <button type="button" onClick={clear} className="text-sm font-medium text-ink-soft hover:text-rose-ink">
            <T>{CART_PAGE.clear}</T>
          </button>
        </div>
      </div>
    </div>
  );
}
