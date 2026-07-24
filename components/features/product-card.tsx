import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { primaryProductImage } from "@/content/products";
import type { Product } from "@/content/products/types";

const STEP_LABEL: Record<Product["step"], string> = {
  cleanse: "Cleanse",
  treat: "Treat",
  eye: "Eye care",
  moisturise: "Moisturise",
  protect: "Protect",
  mask: "Weekly",
};

export interface ProductCardProps {
  product: Product;
  /** Why this product was surfaced, when it appears in a recommendation. */
  because?: string;
}

/**
 * Catalogue teaser for one product.
 *
 * The image sits on a white plate rather than the usual blush tint because
 * the photographs were shot on a white sweep and normalised onto a white
 * canvas — a tinted backdrop would show a visible square behind each bottle.
 */
export function ProductCard({ product, because }: ProductCardProps) {
  const image = primaryProductImage(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <Image
          src={image.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-rose-ink">
          {STEP_LABEL[product.step]}
        </span>
        <h3 className="font-display text-lg font-semibold text-ink">{product.name}</h3>
        <p className="text-sm text-ink-soft">{product.tagline}</p>
        {because ? <p className="text-sm text-ink-soft">{because}</p> : null}
        <span className="mt-auto inline-flex w-fit items-center gap-1.5 pt-3 text-sm font-medium text-rose-ink">
          View product
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}
