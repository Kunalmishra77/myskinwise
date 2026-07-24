import Link from "next/link";
import { buildMetadata } from "@/config/seo";
import { CONCERNS } from "@/content/concerns";
import { Breadcrumb } from "@/components/features/breadcrumb";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";

export const metadata = buildMetadata({
  title: "Skin Concerns",
  description:
    "Pigmentation, acne and everyday skin concerns — what causes them, what actually helps, and how Skinwise approaches each one.",
  path: "/concerns",
});

export default function ConcernsHubPage() {
  const concerns = Object.values(CONCERNS);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 lg:py-16">
      <Breadcrumb items={[{ label: "Concerns", href: "/concerns" }]} />

      <header className="mt-6 max-w-2xl">
        <Eyebrow>Concerns</Eyebrow>
        <h1 className="mt-4 font-display text-display font-semibold text-ink">
          Start with what is bothering you.
        </h1>
        <p className="mt-4 text-ink-soft">
          Every concern has more than one cause. These guides explain what is likely happening
          before anyone recommends anything.
        </p>
      </header>

      <ul className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {concerns.map((concern, i) => (
          <Reveal as="li" key={concern.slug} delay={i * 0.05}>
            <Link
              href={`/${concern.slug}`}
              className="flex h-full flex-col rounded-3xl bg-surface p-6 shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
            >
              <h2 className="font-display text-2xl font-semibold text-ink">{concern.label}</h2>
              <p className="mt-3 flex-1 text-sm text-ink-soft">
                {concern.whatIs.body.slice(0, 160)}&hellip;
              </p>
              <span aria-hidden="true" className="mt-5 text-sm font-semibold text-rose-ink">
                Read the guide &rarr;
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
