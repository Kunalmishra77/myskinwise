"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ImageAsset } from "@/content/assets";

export interface BeforeAfterSlide {
  before: ImageAsset;
  after: ImageAsset;
  caption?: string;
}

export interface BeforeAfterCarouselProps {
  slides: BeforeAfterSlide[];
}

const IMAGE_SIZES = "(min-width: 768px) 25vw, 50vw";

/**
 * Swipeable/tabbable before-and-after results carousel. Each slide shows a
 * "Before" image beside an "After" image, with prev/next controls and an "X
 * of N" indicator announced via `aria-live` for screen-reader users tracking
 * the current slide.
 *
 * TODO(client): real before/after images pending (see open items) — no
 * before/after photo pairs exist in content/assets.ts yet, so `slides` is
 * expected to be empty for now. Rendering an empty carousel would be
 * confusing (no controls, nothing to show), so we render a branded
 * placeholder instead of crashing or showing a blank shell.
 */
export function BeforeAfterCarousel({ slides }: BeforeAfterCarouselProps) {
  const [index, setIndex] = React.useState(0);

  const goTo = React.useCallback(
    (next: number) => {
      const count = slides.length;
      setIndex(((next % count) + count) % count);
    },
    [slides.length],
  );

  const goPrev = React.useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = React.useCallback(() => goTo(index + 1), [goTo, index]);

  const touchStartX = React.useRef<number | null>(null);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    const SWIPE_THRESHOLD = 40;
    if (delta > SWIPE_THRESHOLD) goPrev();
    else if (delta < -SWIPE_THRESHOLD) goNext();
    touchStartX.current = null;
  };

  if (slides.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-lg font-semibold text-ink">Before &amp; after results coming soon</h3>
        <p className="text-sm text-muted">
          We&apos;re gathering real customer transformations to share here.
        </p>
      </Card>
    );
  }

  const slide = slides[index];
  // Guard only for TypeScript's noUncheckedIndexedAccess: `index` is always
  // kept in [0, slides.length) by `goTo`'s modulo wrap, and we've already
  // returned above when `slides` is empty, so this branch is unreachable in
  // practice.
  if (!slide) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
          {(
            [
              { asset: slide.before, label: "Before" },
              { asset: slide.after, label: "After" },
            ] as const
          ).map(({ asset, label }) => (
            <div key={label} className="relative flex flex-col gap-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface">
                <Image
                  src={asset.src}
                  alt={asset.alt}
                  fill
                  loading="lazy"
                  sizes={IMAGE_SIZES}
                  className="object-cover"
                />
                <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-white">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next slide"
          className="absolute right-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>

      {slide.caption && <p className="text-center text-sm text-muted">{slide.caption}</p>}

      <div className="flex items-center justify-center gap-3">
        <div aria-live="polite" className="text-xs font-medium text-muted">
          {index + 1} of {slides.length}
        </div>
        <div className="flex gap-1.5" role="tablist" aria-label="Slides">
          {slides.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              role="tab"
              aria-selected={dotIndex === index}
              aria-label={`Go to slide ${dotIndex + 1}`}
              onClick={() => goTo(dotIndex)}
              className={cn(
                "size-2 rounded-full transition",
                dotIndex === index ? "bg-accent" : "bg-ink/20",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
