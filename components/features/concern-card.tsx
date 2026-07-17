import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ImageAsset } from "@/content/assets";

export interface ConcernCardProps {
  slug: string;
  label: string;
  teaser: string;
  image: ImageAsset;
}

/**
 * Single skin-concern teaser card used in concern-picker grids. Links to
 * `/${slug}` — the concern's own landing page.
 */
export function ConcernCard({ slug, label, teaser, image }: ConcernCardProps) {
  return (
    <Card className="flex flex-col gap-4 overflow-hidden rounded-2xl p-0">
      <div className="relative aspect-[2/1] w-full overflow-hidden">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-2 px-6 pb-6">
        <h3 className="text-lg font-semibold text-ink">{label}</h3>
        <p className="text-sm text-muted">{teaser}</p>
        <Button asChild variant="outline" className="mt-2 w-fit">
          <Link href={`/${slug}`}>Learn more</Link>
        </Button>
      </div>
    </Card>
  );
}
