import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/config/seo";
import { SKIN_TYPES, SKIN_TYPE_LIST, SKIN_TYPE_SLUGS } from "@/content/skin-types";
import type { SkinTypeSlug } from "@/content/skin-types/types";
import { INGREDIENTS } from "@/content/ingredients";
import { Breadcrumb } from "@/components/features/breadcrumb";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { T } from "@/components/i18n/t";
import { SKIN_TYPE_PAGE, PAGE_COMMON } from "@/content/i18n/pages";

export function generateStaticParams() {
  return SKIN_TYPE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const type = SKIN_TYPES[slug as SkinTypeSlug];
  if (!type) return buildMetadata({ title: "Skin type", description: "", path: "/skin-types" });
  return buildMetadata({
    title: type.name,
    description: `${type.summary} How ${type.name.toLowerCase()} behaves, what it struggles with, and the ingredients we build its routine around.`,
    path: `/skin-types/${type.slug}`,
  });
}

function List({ title, items, dot }: { title: string; items: string[]; dot: string }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-h2 font-semibold text-ink"><T>{title}</T></h2>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-ink-soft">
            <span aria-hidden="true" className={`mt-2.5 size-1.5 shrink-0 rounded-full ${dot}`} />
            <T>{item}</T>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function SkinTypePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const type = SKIN_TYPES[slug as SkinTypeSlug];
  if (!type) notFound();

  const others = SKIN_TYPE_LIST.filter((t) => t.slug !== type.slug);

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 lg:py-16">
      <Breadcrumb
        items={[
          { label: "Skin types", href: "/skin-types" },
          { label: type.name, href: `/skin-types/${type.slug}` },
        ]}
      />

      <header className="mt-6">
        <Eyebrow><T>{SKIN_TYPE_PAGE.eyebrow}</T></Eyebrow>
        <h1 className="mt-4 font-display text-display font-semibold text-ink"><T>{type.name}</T></h1>
        <p className="mt-4 text-lg text-ink-soft"><T>{type.summary}</T></p>
      </header>

      <List title={SKIN_TYPE_PAGE.howItShows} items={type.characteristics} dot="bg-rose-ink" />
      <List title={SKIN_TYPE_PAGE.whatsDifficult} items={type.challenges} dot="bg-champagne" />

      <section className="mt-10 rounded-3xl bg-blush p-6">
        <h2 className="font-display text-h2 font-semibold text-ink">
          <T>{SKIN_TYPE_PAGE.routineAim}</T>
        </h2>
        <p className="mt-3 text-ink-soft"><T>{type.aim}</T></p>

        <h3 className="mt-6 font-body text-sm font-semibold text-ink">
          <T>{SKIN_TYPE_PAGE.ingredientsAround}</T>
        </h3>
        <ul className="mt-3 flex flex-col gap-2">
          {type.ingredients.map((name) => {
            const linked = type.linkedIngredients.find((s) => INGREDIENTS[s].name === name.split(" (")[0]);
            return (
              <li key={name}>
                {linked ? (
                  <Link
                    href={`/ingredients/${linked}`}
                    className="font-medium text-rose-ink underline underline-offset-4 transition hover:text-ink"
                  >
                    {name}
                  </Link>
                ) : (
                  <span className="text-ink">{name}</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-ink-soft"><T>{SKIN_TYPE_PAGE.routineDisclaimer}</T></p>
      </section>

      <List title={SKIN_TYPE_PAGE.commonMistakes} items={type.mistakes} dot="bg-sage" />

      <section className="mt-14 rounded-3xl bg-plum p-8 text-center">
        <h2 className="font-display text-h2 font-semibold text-white">
          <T>{SKIN_TYPE_PAGE.ctaTitle}</T>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-white/80"><T>{SKIN_TYPE_PAGE.ctaBody}</T></p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/skin-check"><T>{PAGE_COMMON.startSkinCheck}</T></Link>
        </Button>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-h2 font-semibold text-ink"><T>{SKIN_TYPE_PAGE.otherTypes}</T></h2>
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {others.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/skin-types/${t.slug}`}
                className="flex h-full flex-col rounded-2xl bg-surface p-5 shadow-soft transition-shadow hover:shadow-lift"
              >
                <span className="font-display text-lg font-semibold text-ink"><T>{t.name}</T></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
