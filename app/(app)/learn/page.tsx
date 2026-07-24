import Link from "next/link";
import { buildMetadata } from "@/config/seo";
import { CONCERNS } from "@/content/concerns";
import { INGREDIENT_LIST } from "@/content/ingredients";
import { SKIN_TYPE_LIST } from "@/content/skin-types";
import { FAQS } from "@/content/faqs";
import { Breadcrumb } from "@/components/features/breadcrumb";
import { Accordion } from "@/components/ui/accordion";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata = buildMetadata({
  title: "Learn About Your Skin",
  description:
    "Guides to skin concerns, skin types and the ingredients Skinwise builds routines around — plus answers to the questions people ask most.",
  path: "/learn",
});

/*
 * An index over the typed content that already exists, not an article
 * system. When a genuine blog is warranted it gets its own content model;
 * until then this page stays a router into the three hubs rather than a
 * shell waiting for posts that do not exist.
 */
export default function LearnPage() {
  const concerns = Object.values(CONCERNS);

  const sections = [
    {
      title: "Skin concerns",
      href: "/concerns",
      blurb: "What is actually happening, and what tends to help.",
      items: concerns.map((c) => ({ label: c.label, href: `/${c.slug}` })),
    },
    {
      title: "Skin types",
      href: "/skin-types",
      blurb: "Recognise your own skin before you buy anything for it.",
      items: SKIN_TYPE_LIST.map((t) => ({ label: t.name, href: `/skin-types/${t.slug}` })),
    },
    {
      title: "Ingredients",
      href: "/ingredients",
      blurb: "What each ingredient does, in plain language.",
      items: INGREDIENT_LIST.map((i) => ({ label: i.name, href: `/ingredients/${i.slug}` })),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 lg:py-16">
      <Breadcrumb items={[{ label: "Learn", href: "/learn" }]} />

      <header className="mt-6 max-w-2xl">
        <Eyebrow>Learn</Eyebrow>
        <h1 className="mt-4 font-display text-display font-semibold text-ink">
          Everything we know, before we ask you for anything.
        </h1>
        <p className="mt-4 text-ink-soft">
          Good skincare decisions come from understanding your own skin. Start anywhere.
        </p>
      </header>

      <div className="mt-12 flex flex-col gap-10">
        {sections.map((section) => (
          <section key={section.href}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-h2 font-semibold text-ink">{section.title}</h2>
              <Link
                href={section.href}
                className="shrink-0 text-sm font-semibold text-rose-ink hover:text-ink"
              >
                View all &rarr;
              </Link>
            </div>
            <p className="mt-2 text-ink-soft">{section.blurb}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex rounded-full bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-soft transition hover:text-rose-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h2 className="font-display text-h2 font-semibold text-ink">Common questions</h2>
          <div className="mt-5">
            <Accordion items={FAQS.generalFaqs} toggleIcon="plusminus" />
          </div>
        </section>
      </div>
    </div>
  );
}
