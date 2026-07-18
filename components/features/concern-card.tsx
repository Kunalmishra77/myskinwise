import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ImageAsset } from "@/content/assets";

export interface ConcernCardProps {
  slug: string;
  label: string;
  teaser: string;
  image: ImageAsset;
}

/**
 * Single skin-concern teaser card used in concern-picker grids. The whole
 * card is one link to `/${slug}` — the concern's own landing page — with a
 * masked, slightly-zooming image frame and an animated "Learn more" row.
 */
export function ConcernCard({ slug, label, teaser, image }: ConcernCardProps) {
  return (
    <Card className="group overflow-hidden p-0">
      <Link
        href={`/${slug}`}
        className="flex flex-col rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
      >
        <div className="relative m-3 aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col gap-2 px-6 pb-6 pt-1">
          <h3 className="text-lg font-semibold text-ink">{label}</h3>
          <p className="text-sm text-ink/70">{teaser}</p>
          <span className="mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent-ink">
            Learn more
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
            />
          </span>
        </div>
      </Link>
    </Card>
  );
}
