"use client";

import { Check, Plus } from "lucide-react";
import { useCart } from "@/lib/cart/use-cart";
import { useT } from "@/lib/i18n/provider";

/**
 * Add a single product to the cart. Reflects whether it is already in, so the
 * button never lies about state, and toggles rather than adding duplicates.
 */
export function AddToCartButton({
  slug,
  className,
  size = "lg",
}: {
  slug: string;
  className?: string;
  size?: "lg" | "sm";
}) {
  const { has, add, remove } = useCart();
  const t = useT();
  const inCart = has(slug);

  const base =
    size === "lg"
      ? "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition"
      : "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition";

  return (
    <button
      type="button"
      onClick={() => (inCart ? remove(slug) : add(slug))}
      aria-pressed={inCart}
      className={`${base} ${
        inCart
          ? "bg-sage/40 text-ink hover:bg-sage/60"
          : "bg-rose-ink text-white hover:bg-rose-deep"
      } ${className ?? ""}`}
    >
      {inCart ? (
        <>
          <Check aria-hidden="true" className={size === "lg" ? "size-5" : "size-4"} />
          {t("cta.inCart")}
        </>
      ) : (
        <>
          <Plus aria-hidden="true" className={size === "lg" ? "size-5" : "size-4"} />
          {t("cta.addToCart")}
        </>
      )}
    </button>
  );
}
