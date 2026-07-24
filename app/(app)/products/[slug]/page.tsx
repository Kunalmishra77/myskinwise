import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/config/seo";
import {
  BRAND_LABEL,
  PRODUCTS,
  productBySlug,
  primaryProductImage,
  productsForConcern,
} from "@/content/products";
import { Breadcrumb } from "@/components/features/breadcrumb";
import { ProductCard } from "@/components/features/product-card";
import { ProductGallery } from "@/components/features/product-gallery";
import { Eyebrow } from "@/components/ui/eyebrow";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) {
    return buildMetadata({
      title: "Formulation not found",
      description: "This formulation is not part of the Skinwise range.",
      path: `/products/${slug}`,
    });
  }

  return buildMetadata({
    title: product.name,
    description: `${product.tagline} — ${product.description.slice(0, 130)}`,
    path: `/products/${product.slug}`,
    // The catalogue images are built as 1200x1200 squares by
    // scripts/build-product-images.mjs.
    image: { src: primaryProductImage(product).src, alt: product.name, width: 1200, height: 1200 },
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const related = productsForConcern(product.concerns[0] ?? "").filter(
    (p) => p.slug !== product.slug,
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 lg:py-16">
      <Breadcrumb
        items={[
          { label: "Formulations", href: "/products" },
          { label: product.name, href: `/products/${product.slug}` },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery product={product} />

        <div>
          <Eyebrow>{product.tagline}</Eyebrow>
          <h1 className="mt-3 font-display text-display font-semibold text-ink">{product.name}</h1>

          <p className="mt-5 text-ink-soft">{product.description}</p>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-ink/10 py-4 text-sm">
            <div>
              <dt className="text-ink-soft">Price</dt>
              {/*
                Seven of the nine labels wrap their statutory panel around a
                curve, so the printed MRP is genuinely unreadable. Rather than
                invent a figure for a regulated cosmetic, the price is stated
                as confirmed at consultation — which is also how it actually
                works, since the formulation is compounded per customer.
              */}
              <dd className="font-semibold text-ink">
                {product.mrp !== null ? `₹${product.mrp.toLocaleString("en-IN")}` : "Confirmed at consultation"}
              </dd>
            </div>
            {product.netQuantity ? (
              <div>
                <dt className="text-ink-soft">Net quantity</dt>
                <dd className="font-semibold text-ink">{product.netQuantity}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-ink-soft">Routine step</dt>
              <dd className="font-semibold capitalize text-ink">{product.step}</dd>
            </div>
          </dl>

          {product.directions ? (
            <section className="mt-6">
              <h2 className="font-display text-lg font-semibold text-ink">How to use it</h2>
              <p className="mt-2 text-ink-soft">{product.directions}</p>
            </section>
          ) : null}

          <section className="mt-6">
            <h2 className="font-display text-lg font-semibold text-ink">Ingredients</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Clinically proven plant-based actives, as printed on the label.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {product.ingredients.map((ingredient) => (
                <li
                  key={ingredient}
                  className="rounded-full bg-blush px-3 py-1 text-sm text-ink"
                >
                  {ingredient}
                </li>
              ))}
            </ul>
            {product.ingredientsPartial ? (
              /*
                An incomplete ingredient list read as complete is an allergy
                risk, so a clipped label says so rather than staying silent.
              */
              <p className="mt-3 text-sm text-ink-soft">
                This list is abridged — part of the printed panel is not readable in our packaging
                photography. Ask our team for the full ingredient list before use if you have a
                known allergy.
              </p>
            ) : null}
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/skin-check"
              className="rounded-full bg-rose-ink px-6 py-3 font-semibold text-white transition hover:bg-rose-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
            >
              Start your Skin Check
            </Link>
            <Link
              href="/consultation"
              className="rounded-full border border-ink/15 px-6 py-3 font-semibold text-ink transition hover:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
            >
              Talk to an expert
            </Link>
          </div>

          <section className="mt-8 rounded-2xl bg-blush px-5 py-4 text-sm text-ink-soft">
            <h2 className="font-semibold text-ink">On the label</h2>
            <p className="mt-2">{BRAND_LABEL.storage}</p>
            <p className="mt-1">{BRAND_LABEL.caution}</p>
            <p className="mt-1">{BRAND_LABEL.externalUseOnly}</p>
            <p className="mt-3">
              <span className="font-medium text-ink">Marketed by</span> {BRAND_LABEL.marketedBy}
            </p>
            <p className="mt-1">
              <span className="font-medium text-ink">Manufactured by</span>{" "}
              {BRAND_LABEL.manufacturedBy}
            </p>
            <p className="mt-3">
              Questions? {BRAND_LABEL.careNumber} · {BRAND_LABEL.careEmail}
            </p>
          </section>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-ink">Often used alongside</h2>
          <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-12 text-sm text-ink-soft">
        This is a cosmetic skincare product, not a medicine, and this page is not medical advice. If
        your skin is painful, bleeding, or changing quickly, please see a doctor.
      </p>
    </div>
  );
}
