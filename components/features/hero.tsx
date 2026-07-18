import Image from "next/image";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/content/assets";

export interface HeroCta {
  label: string;
  href: string;
  variant?: ButtonVariant;
}

export interface HeroTrustChip {
  /** Short label only — no copy is invented here, callers must supply it. */
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface HeroProps {
  /** Optional — omitting it renders a centered, single-column hero. */
  image?: ImageAsset;
  heading: string;
  subheading?: string;
  ctas: HeroCta[];
  /** Small uppercase label above the heading, e.g. "PERSONALIZED SKINCARE". */
  eyebrow?: string;
  /** Small muted line under the CTAs, e.g. "No commitment. Cancel anytime." */
  trustNote?: string;
  /** Floating pill card overlapping the image's corner. Only rendered when
   *  passed — never invented — and only meaningful when `image` is set. */
  trustChip?: HeroTrustChip;
}

/**
 * Above-the-fold editorial hero: eyebrow, display headline, optional
 * subheading, CTA buttons, and an optional trust note — paired with a
 * priority-loaded image in a soft-glow rounded frame on `md+` (image right,
 * content left). Degrades to a centered single-column layout when no image
 * is given. Server component — no client-side behaviour needed.
 */
export function Hero({ image, heading, subheading, ctas, eyebrow, trustNote, trustChip }: HeroProps) {
  return (
    <Section
      className="relative overflow-hidden py-14 md:py-20"
      containerClassName={cn(
        "grid grid-cols-1 items-center gap-12",
        image ? "lg:grid-cols-2 lg:gap-16" : "mx-auto max-w-3xl justify-items-center text-center",
      )}
    >
      <div className={cn("flex flex-col gap-6", image ? "order-2 lg:order-1" : "items-center")}>
        {eyebrow && <Eyebrow className={!image ? "justify-center" : undefined}>{eyebrow}</Eyebrow>}
        <h1 className="text-balance text-display font-semibold text-ink">{heading}</h1>
        {subheading && (
          <p className={cn("text-lg text-ink/70 md:text-xl", !image && "max-w-xl text-balance")}>
            {subheading}
          </p>
        )}
        <div className={cn("flex flex-wrap gap-3", !image && "justify-center")}>
          {ctas.map((cta) => (
            <Button key={cta.href} asChild variant={cta.variant ?? "primary"}>
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          ))}
        </div>
        {trustNote && <p className="text-sm text-ink/60">{trustNote}</p>}
      </div>

      {image && (
        <div className="relative order-1 lg:order-2">
          <div
            aria-hidden="true"
            className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_50%_35%,rgba(227,138,158,0.35),transparent_70%)] blur-2xl"
          />
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-lift">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          {trustChip && (
            <div className="absolute -bottom-5 left-5 flex items-center gap-2 rounded-2xl border border-ink/5 bg-surface px-4 py-3 shadow-soft sm:left-8">
              {trustChip.icon && (
                <trustChip.icon aria-hidden="true" className="size-5 shrink-0 text-accent-ink" />
              )}
              <span className="text-sm font-medium text-ink">{trustChip.label}</span>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
