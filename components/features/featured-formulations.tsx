import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRODUCTS_BY_SLUG } from "@/content/products";
import { ProductCard } from "@/components/features/product-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { T } from "@/components/i18n/t";
import { FEATURED } from "@/content/i18n/home";

/**
 * A curated glimpse of the catalogue on the homepage — one recognisable
 * formulation from across the range, linking through to the full catalogue.
 * Uses the same ProductCard the catalogue does, so the imagery and pricing
 * behaviour stay consistent everywhere.
 */
const FEATURED_SLUGS = ["anti-acne-cleanser", "depigmentation-cream", "glowing-gel", "spf-30"];

export function FeaturedFormulations() {
  const products = FEATURED_SLUGS.map((s) => PRODUCTS_BY_SLUG.get(s as never)).filter(Boolean);

  return (
    <section className="mt-20 lg:mt-28" aria-labelledby="featured-heading">
      <div className="mx-auto w-full max-w-6xl px-5">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow><T>{FEATURED.eyebrow}</T></Eyebrow>
            <h2 id="featured-heading" className="mt-3 max-w-xl font-display text-h2 font-semibold text-ink">
              <T>{FEATURED.title}</T>
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-rose-ink"
          >
            <T>{FEATURED.viewAll}</T>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Reveal>

        <ul className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal as="li" key={p!.slug} delay={i * 0.05}>
              <ProductCard product={p!} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
