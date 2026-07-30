import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/config/seo";
import { IMAGES } from "@/content/assets";
import { INGREDIENTS, INGREDIENT_LIST, INGREDIENT_SLUGS } from "@/content/ingredients";
import type { IngredientSlug } from "@/content/ingredients/types";
import { CONCERNS } from "@/content/concerns";
import { SKIN_TYPES } from "@/content/skin-types";
import { Breadcrumb } from "@/components/features/breadcrumb";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { T } from "@/components/i18n/t";
import { INGREDIENT_PAGE, PAGE_COMMON } from "@/content/i18n/pages";

export function generateStaticParams() {
  return INGREDIENT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ingredient = INGREDIENTS[slug as IngredientSlug];
  if (!ingredient) return buildMetadata({ title: "Ingredient", description: "", path: "/ingredients" });
  return buildMetadata({
    title: `${ingredient.name} in Skincare`,
    description: `${ingredient.summary} What ${ingredient.name} is, who it suits, and how it fits into a routine.`,
    path: `/ingredients/${ingredient.slug}`,
  });
}

export default async function IngredientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ingredient = INGREDIENTS[slug as IngredientSlug];
  if (!ingredient) notFound();

  const img = IMAGES[ingredient.image];
  const related = INGREDIENT_LIST.filter((i) => i.slug !== ingredient.slug).slice(0, 3);

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 lg:py-16">
      <Breadcrumb
        items={[
          { label: "Ingredients", href: "/ingredients" },
          { label: ingredient.name, href: `/ingredients/${ingredient.slug}` },
        ]}
      />

      <header className="mt-6">
        <Eyebrow><T>{ingredient.role}</T></Eyebrow>
        <h1 className="mt-4 font-display text-display font-semibold text-ink">{ingredient.name}</h1>
        <p className="mt-4 text-lg text-ink-soft"><T>{ingredient.summary}</T></p>
      </header>

      <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-3xl bg-blush">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          priority
          sizes="(min-width: 768px) 720px, 100vw"
          className="object-cover"
        />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-h2 font-semibold text-ink"><T>{INGREDIENT_PAGE.whatItIs}</T></h2>
        <p className="mt-3 text-ink-soft"><T>{ingredient.whatItIs}</T></p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-h2 font-semibold text-ink"><T>{INGREDIENT_PAGE.usedFor}</T></h2>
        <ul className="mt-4 flex flex-col gap-3">
          {ingredient.commonlyUsedFor.map((item) => (
            <li key={item} className="flex gap-3 text-ink-soft">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-rose-ink" />
              <T>{item}</T>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-3xl bg-blush p-6">
        <h2 className="font-display text-h2 font-semibold text-ink"><T>{INGREDIENT_PAGE.whoSuits}</T></h2>
        <p className="mt-3 text-ink-soft"><T>{ingredient.suitedTo}</T></p>

        {ingredient.skinTypes.length > 0 && (
          <>
            <h3 className="mt-6 font-body text-sm font-semibold text-ink">
              <T>{INGREDIENT_PAGE.appearsIn}</T>
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {ingredient.skinTypes.map((t) => (
                <li key={t}>
                  <Link
                    href={`/skin-types/${t}`}
                    className="inline-flex rounded-full border border-rose-ink/20 bg-surface px-4 py-2 text-sm font-medium text-rose-ink transition hover:border-rose-ink/40"
                  >
                    <T>{SKIN_TYPES[t].name}</T>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-h2 font-semibold text-ink"><T>{INGREDIENT_PAGE.worthKnowing}</T></h2>
        <ul className="mt-4 flex flex-col gap-3">
          {ingredient.considerations.map((item) => (
            <li key={item} className="flex gap-3 text-ink-soft">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-champagne" />
              <T>{item}</T>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-ink-soft"><T>{INGREDIENT_PAGE.guidanceDisclaimer}</T></p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-h2 font-semibold text-ink"><T>{INGREDIENT_PAGE.whereItFits}</T></h2>
        <p className="mt-3 text-ink-soft"><T>{ingredient.routineNote}</T></p>
      </section>

      {ingredient.concerns.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-h2 font-semibold text-ink"><T>{INGREDIENT_PAGE.relatesTo}</T></h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {ingredient.concerns.map((c) => (
              <li key={c}>
                <Link
                  href={`/${c}`}
                  className="inline-flex rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink shadow-soft transition hover:text-rose-ink"
                >
                  <T>{CONCERNS[c].label}</T>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-14 rounded-3xl bg-plum p-8 text-center">
        <h2 className="font-display text-h2 font-semibold text-white">
          <T>{INGREDIENT_PAGE.ctaTitle}</T>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-white/80"><T>{INGREDIENT_PAGE.ctaBody}</T></p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/skin-check"><T>{PAGE_COMMON.startSkinCheck}</T></Link>
        </Button>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-h2 font-semibold text-ink"><T>{INGREDIENT_PAGE.otherIngredients}</T></h2>
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {related.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/ingredients/${r.slug}`}
                className="flex h-full flex-col rounded-2xl bg-surface p-5 shadow-soft transition-shadow hover:shadow-lift"
              >
                <span className="font-display text-lg font-semibold text-ink">{r.name}</span>
                <span className="mt-1 text-sm text-ink-soft"><T>{r.role}</T></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
