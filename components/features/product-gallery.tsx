"use client";

import { useState } from "react";
import Image from "next/image";
import { productImages } from "@/content/products";
import type { Product } from "@/content/products/types";

export interface ProductGalleryProps {
  product: Product;
}

/**
 * Primary image plus the remaining packaging shots.
 *
 * Every product has three or four photographs — the presentation shot and the
 * label panels carrying description, ingredients and the statutory details.
 * Those panels are the reason this is a gallery and not a single hero image:
 * being able to read the actual printed ingredient list and manufacturer
 * details is what makes a compounded skincare product credible.
 *
 * Implemented as buttons over a single <Image> rather than a scroll-snap
 * carousel so it is operable by keyboard with no custom key handling, and so
 * the selected shot is announced rather than merely scrolled to.
 */
export function ProductGallery({ product }: ProductGalleryProps) {
  const images = productImages(product);
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0]!;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-soft">
        <Image
          src={current.src}
          alt={current.alt}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-contain p-4"
          priority
        />
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-3">
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show ${image.alt}`}
                aria-current={i === active}
                className={`relative block aspect-square w-full overflow-hidden rounded-2xl bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2 ${
                  i === active ? "ring-2 ring-rose-ink" : "ring-1 ring-ink/10 hover:ring-ink/25"
                }`}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-contain p-1.5"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
