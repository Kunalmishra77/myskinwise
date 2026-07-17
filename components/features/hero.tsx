import Image from "next/image";
import Link from "next/link";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import type { ImageAsset } from "@/content/assets";

export interface HeroCta {
  label: string;
  href: string;
  variant?: ButtonVariant;
}

export interface HeroProps {
  image: ImageAsset;
  heading: string;
  subheading?: string;
  ctas: HeroCta[];
}

/**
 * Above-the-fold hero: headline, optional subheading, CTA buttons, and a
 * priority-loaded image. Server component — no client-side behaviour needed.
 */
export function Hero({ image, heading, subheading, ctas }: HeroProps) {
  return (
    <Section className="py-10 md:py-16" containerClassName="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
      <div className="flex flex-col gap-6 order-2 lg:order-1">
        <h1 className="text-3xl font-semibold text-ink md:text-5xl">{heading}</h1>
        {subheading && <p className="text-lg text-muted md:text-xl">{subheading}</p>}
        <div className="flex flex-wrap gap-3">
          {ctas.map((cta) => (
            <Button key={cta.href} asChild variant={cta.variant ?? "primary"}>
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          ))}
        </div>
      </div>
      <div className="relative order-1 aspect-[4/5] w-full overflow-hidden rounded-2xl lg:order-2">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </Section>
  );
}
