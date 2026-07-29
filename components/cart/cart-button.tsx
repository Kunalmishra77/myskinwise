"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, X, Trash2, MessageCircle } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { primaryProductImage } from "@/content/products";
import { useCart, buildOrderMessage } from "@/lib/cart/use-cart";
import { useT } from "@/lib/i18n/provider";

/**
 * The header cart: a button with a live count, and its own drawer.
 *
 * The drawer's open state is local to this component, so nothing else needs to
 * coordinate it. Contents come from useCart, which is a localStorage-backed
 * external store — the badge updates the instant any "add to cart" anywhere on
 * the site fires, with no provider around the tree.
 *
 * Ordering is a WhatsApp handoff, not a checkout: the button opens WhatsApp
 * pre-filled with the cart. No payment, no invented prices — unpriced items
 * say "price to confirm".
 */
export function CartButton() {
  const { products, count, remove, clear } = useCart();
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const orderHref = products.length
    ? `${waHref(SITE.whatsapp.e164)}?text=${encodeURIComponent(buildOrderMessage(products))}`
    : waHref(SITE.whatsapp.e164);

  const drawer =
    mounted && open
      ? createPortal(
          <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Your cart">
            <div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-warm shadow-lift">
              <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                <h2 className="font-display text-lg font-semibold text-ink">{t("cart.title")}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close cart"
                  className="inline-flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-blush"
                >
                  <X aria-hidden="true" className="size-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {products.length === 0 ? (
                  <div className="pt-10 text-center">
                    <p className="text-ink-soft">{t("cart.empty")}</p>
                    <Link
                      href="/products"
                      onClick={() => setOpen(false)}
                      className="mt-4 inline-flex text-sm font-semibold text-rose-ink"
                    >
                      {t("cart.browse")}
                    </Link>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {products.map((p) => {
                      const img = primaryProductImage(p);
                      return (
                        <li key={p.slug} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-soft">
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-ink/10">
                            <Image src={img.src} alt="" fill sizes="56px" className="object-contain p-1" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/products/${p.slug}`}
                              onClick={() => setOpen(false)}
                              className="block truncate font-semibold text-ink hover:text-rose-ink"
                            >
                              {p.name}
                            </Link>
                            <p className="text-sm text-ink-soft">
                              {p.mrp !== null ? `₹${p.mrp.toLocaleString("en-IN")}` : t("cart.priceOnWhatsapp")}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(p.slug)}
                            aria-label={`Remove ${p.name}`}
                            className="inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-blush hover:text-rose-ink"
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {products.length > 0 && (
                <div className="border-t border-ink/10 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                  <p className="mb-3 text-xs text-ink-soft">{t("cart.note")}</p>
                  <a
                    href={orderHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-ink px-6 py-3.5 font-semibold text-white"
                  >
                    <MessageCircle aria-hidden="true" className="size-5" />
                    {t("cta.orderWhatsapp")}
                  </a>
                  <button
                    type="button"
                    onClick={clear}
                    className="mt-2 w-full text-center text-sm font-medium text-ink-soft"
                  >
                    {t("cart.clear")}
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Cart${count ? `, ${count} item${count > 1 ? "s" : ""}` : ""}`}
        className="relative inline-flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-blush"
      >
        <ShoppingBag aria-hidden="true" className="size-5" />
        {mounted && count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-rose-ink px-1 text-[11px] font-semibold text-white">
            {count}
          </span>
        )}
      </button>
      {drawer}
    </>
  );
}
