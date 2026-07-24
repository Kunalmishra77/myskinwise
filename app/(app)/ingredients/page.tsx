import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/config/seo";
import { IMAGES } from "@/content/assets";
import { INGREDIENT_LIST } from "@/content/ingredients";
import { Breadcrumb } from "@/components/features/breadcrumb";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";

export const metadata = buildMetadata({
  title: "Skincare Ingredients Explained",
  description:
    "Plain-language guides to the six ingredients Skinwise builds routines around — what each one does, who it suits, and how to use it.",
  path: "/ingredients",
});

export default function IngredientsHubPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 lg:py-16">
      <Breadcrumb items={[{ label: "Ingredients", href: "/ingredients" }]} />

      <header className="mt-6 max-w-2xl">
        <Eyebrow>Ingredients</Eyebrow>
        <h1 className="mt-4 font-display text-display font-semibold text-ink">
          The ingredients we build routines around.
        </h1>
        <p className="mt-4 text-ink-soft">
          Six ingredients do most of the work in the routines our experts put together. Here is what
          each one actually does, who it suits, and what to watch out for — without the marketing.
        </p>
      </header>

      <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {INGREDIENT_LIST.map((ingredient, i) => {
          const img = IMAGES[ingredient.image];
          return (
            <Reveal as="li" key={ingredient.slug} delay={i * 0.05}>
              <Link
                href={`/ingredients/${ingredient.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-blush">
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="eyebrow">{ingredient.role}</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                    {ingredient.name}
                  </h2>
                  <p className="mt-2 text-sm text-ink-soft">{ingredient.summary}</p>
                  <span
                    aria-hidden="true"
                    className="mt-4 font-body text-sm font-semibold text-rose-ink"
                  >
                    Read more &rarr;
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </div>
  );
}
