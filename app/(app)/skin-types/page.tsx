import Link from "next/link";
import { buildMetadata } from "@/config/seo";
import { SKIN_TYPE_LIST } from "@/content/skin-types";
import { Breadcrumb } from "@/components/features/breadcrumb";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";

export const metadata = buildMetadata({
  title: "Skin Types",
  description:
    "Dry, oily, combination or sensitive — how each skin type behaves, what it struggles with, and the ingredients Skinwise builds its routines around.",
  path: "/skin-types",
});

export default function SkinTypesHubPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 lg:py-16">
      <Breadcrumb items={[{ label: "Skin types", href: "/skin-types" }]} />

      <header className="mt-6 max-w-2xl">
        <Eyebrow>Skin types</Eyebrow>
        <h1 className="mt-4 font-display text-display font-semibold text-ink">
          Which of these sounds like your skin?
        </h1>
        <p className="mt-4 text-ink-soft">
          Most routines fail because they were built for somebody else&rsquo;s skin. Start by
          recognising your own.
        </p>
      </header>

      <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SKIN_TYPE_LIST.map((type, i) => (
          <Reveal as="li" key={type.slug} delay={i * 0.05}>
            <Link
              href={`/skin-types/${type.slug}`}
              className="group flex h-full flex-col rounded-3xl bg-surface p-6 shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
            >
              <h2 className="font-display text-2xl font-semibold text-ink">{type.name}</h2>
              <p className="mt-2 text-sm text-ink-soft">{type.summary}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {type.ingredients.slice(0, 3).map((ing) => (
                  <li
                    key={ing}
                    className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-rose-ink"
                  >
                    {ing}
                  </li>
                ))}
              </ul>
              <span aria-hidden="true" className="mt-5 font-body text-sm font-semibold text-rose-ink">
                Read more &rarr;
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
