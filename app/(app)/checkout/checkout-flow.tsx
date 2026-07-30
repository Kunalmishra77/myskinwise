"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MessageCircle, CheckCircle2, ShoppingBag } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { primaryProductImage } from "@/content/products";
import { useCart, buildOrderMessage, formatPrice } from "@/lib/cart/use-cart";
import { CHECKOUT } from "@/content/i18n/checkout";
import { useTContent } from "@/lib/i18n/use-content";
import { T } from "@/components/i18n/t";

/**
 * Checkout: review → contact details → place the order on WhatsApp.
 *
 * There is no online payment by design. "Place order" opens WhatsApp with the
 * full order + the customer's contact ready to send, records a PII-FREE
 * analytics event server-side (name/phone never leave the browser except inside
 * the WhatsApp message), then shows a confirmation and clears the cart.
 */
export function CheckoutFlow() {
  const tc = useTContent();
  const { items, subtotal, clear } = useCart();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [placed, setPlaced] = React.useState(false);
  const [orderHref, setOrderHref] = React.useState<string>(waHref(SITE.whatsapp.e164));

  // Confirmation wins even though placing the order empties the cart.
  if (placed) {
    return (
      <div className="mx-auto w-full max-w-xl px-5 py-16 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-sage/40 text-ink">
          <CheckCircle2 aria-hidden="true" className="size-9 text-rose-ink" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink">
          <T>{CHECKOUT.confirmedTitle}</T>
        </h1>
        <p className="mt-3 text-ink-soft"><T>{CHECKOUT.confirmedBody}</T></p>
        <div className="mt-7 flex flex-col gap-3">
          <a
            href={orderHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-ink px-6 py-3.5 font-semibold text-white"
          >
            <MessageCircle aria-hidden="true" className="size-5" />
            <T>{CHECKOUT.openAgain}</T>
          </a>
          <Link href="/products" className="text-sm font-semibold text-rose-ink">
            <T>{CHECKOUT.continueShopping}</T>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl px-5 py-16 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-blush text-rose-ink">
          <ShoppingBag aria-hidden="true" className="size-8" />
        </span>
        <p className="mt-5 text-lg text-ink-soft"><T>{CHECKOUT.emptyRedirect}</T></p>
        <Link
          href="/products"
          className="mt-5 inline-flex rounded-full bg-rose-ink px-6 py-3 font-semibold text-white"
        >
          <T>{CHECKOUT.continueShopping}</T>
        </Link>
      </div>
    );
  }

  function place() {
    if (!name.trim()) {
      setError(CHECKOUT.nameRequired);
      return;
    }
    if (phone.replace(/\D/g, "").length < 8) {
      setError(CHECKOUT.phoneRequired);
      return;
    }
    setError(null);
    const message = buildOrderMessage(items, { name, phone, note });
    const href = `${waHref(SITE.whatsapp.e164)}?text=${encodeURIComponent(message)}`;
    setOrderHref(href);

    // PII-free server record — never send name/phone/note here.
    void fetch("/api/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: items.map((l) => ({ slug: l.product.slug, qty: l.qty })) }),
    }).catch(() => {});

    window.open(href, "_blank", "noopener,noreferrer");
    clear();
    setPlaced(true);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 lg:py-12">
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-ink">
        <ArrowLeft aria-hidden="true" className="size-4" />
        <T>{CHECKOUT.back}</T>
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-ink"><T>{CHECKOUT.title}</T></h1>

      {/* Review */}
      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-ink"><T>{CHECKOUT.reviewHeading}</T></h2>
        <ul className="mt-3 flex flex-col gap-2.5">
          {items.map(({ product: p, qty }) => {
            const img = primaryProductImage(p);
            return (
              <li key={p.slug} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-soft">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-ink/10">
                  <Image src={img.src} alt="" fill sizes="48px" className="object-contain p-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-ink-soft">
                    × {qty} · {p.mrp !== null ? formatPrice(p.mrp) : tc(CHECKOUT.subtotalPaidLater)}
                  </p>
                </div>
                {p.mrp !== null && <p className="shrink-0 font-semibold text-ink">{formatPrice(p.mrp * qty)}</p>}
              </li>
            );
          })}
        </ul>
        {subtotal > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-blush/60 px-4 py-3">
            <span className="font-semibold text-ink"><T>{CHECKOUT.subtotalPaidLater}</T></span>
            <span className="font-display text-lg font-semibold text-ink">{formatPrice(subtotal)}</span>
          </div>
        )}
      </section>

      {/* Details */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink"><T>{CHECKOUT.detailsHeading}</T></h2>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink"><T>{CHECKOUT.nameLabel}</T></span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tc(CHECKOUT.namePlaceholder)}
              className="rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink"><T>{CHECKOUT.phoneLabel}</T></span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder={tc(CHECKOUT.phonePlaceholder)}
              className="rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink"><T>{CHECKOUT.noteLabel}</T></span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={tc(CHECKOUT.notePlaceholder)}
              className="resize-none rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
            />
          </label>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-6 rounded-2xl bg-blush/60 p-4">
        <h3 className="text-sm font-semibold text-ink"><T>{CHECKOUT.howItWorks}</T></h3>
        <p className="mt-1 text-sm text-ink-soft"><T>{CHECKOUT.howItWorksBody}</T></p>
      </section>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-champagne/60 p-3 text-sm text-ink">
          <T>{error}</T>
        </p>
      )}

      <button
        type="button"
        onClick={place}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-rose-ink px-6 py-4 font-semibold text-white transition hover:bg-rose-deep"
      >
        <MessageCircle aria-hidden="true" className="size-5" />
        <T>{CHECKOUT.place}</T>
      </button>
      <p className="mt-2 text-center text-xs text-ink-soft"><T>{CHECKOUT.subtotalPaidLater}</T></p>
    </div>
  );
}
