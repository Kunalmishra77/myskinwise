import { buildMetadata } from "@/config/seo";
import { PRODUCTS, sortByRoutineStep } from "@/content/products";
import { Breadcrumb } from "@/components/features/breadcrumb";
import { ProductCard } from "@/components/features/product-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";

export const metadata = buildMetadata({
  title: "Our Formulations",
  description:
    "The Skinwise formulations our experts build routines from — cleansers, treatments, moisturisers, sun protection and weekly care, each customised to your skin.",
  path: "/products",
});

export default function ProductsPage() {
  const products = sortByRoutineStep(PRODUCTS);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 lg:py-16">
      <Breadcrumb items={[{ label: "Formulations", href: "/products" }]} />

      <header className="mt-6 max-w-2xl">
        <Eyebrow>Formulations</Eyebrow>
        <h1 className="mt-4 font-display text-display font-semibold text-ink">
          The formulations we build routines from.
        </h1>
        <p className="mt-4 text-ink-soft">
          Every Skinwise formulation is compounded for the person it is made for, so what goes into
          your bottle depends on what your skin needs. These are the bases our experts work from —
          shown with their real packaging and printed ingredient lists.
        </p>
      </header>

      <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, i) => (
          <Reveal as="li" key={product.slug} delay={i * 0.05}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </ul>

      <p className="mt-12 rounded-2xl bg-blush px-5 py-4 text-sm text-ink-soft">
        Skinwise formulations are cosmetic skincare products, not medicines. They are prepared after
        an expert reviews your Skin Check, and are not a substitute for seeing a doctor about a skin
        condition.
      </p>
    </div>
  );
}
