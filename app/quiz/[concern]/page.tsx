import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { CONCERNS, type ConcernContent } from "@/content/concerns";

// TODO(subproject-B): real multi-step quiz — this route is a placeholder so
// the Hero "Analyse your skin" CTA on each concern page has somewhere to
// resolve to until the actual quiz flow is built.

type PageProps = { params: Promise<{ concern: string }> };

function isKnownConcern(value: string): value is ConcernContent["slug"] {
  return Object.prototype.hasOwnProperty.call(CONCERNS, value);
}

export function generateStaticParams() {
  return Object.keys(CONCERNS).map((concern) => ({ concern }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { concern } = await params;
  const label = isKnownConcern(concern) ? CONCERNS[concern].label : "Skin";
  // Bare segment title — the root layout's "%s | Skinwise" template
  // appends the site suffix; adding it here too would double it.
  return { title: `${label} Quiz` };
}

export default async function QuizPage({ params }: PageProps) {
  const { concern } = await params;

  if (!isKnownConcern(concern)) {
    notFound();
  }

  const content = CONCERNS[concern];

  return (
    <Section className="text-center">
      <h1 className="font-display text-4xl font-semibold text-ink md:text-5xl">
        Your {content.label} skin quiz is coming soon
      </h1>
      <p className="mt-4 text-lg text-ink-soft">
        We&apos;re putting the finishing touches on this quiz. In the meantime, share your
        details on the {content.label.toLowerCase()} page and our expert will contact you
        within 24 hours to build your personalized routine.
      </p>
      <div className="mt-8 flex justify-center">
        <Button asChild>
          <Link href={`/${content.slug}`}>Back to {content.label}</Link>
        </Button>
      </div>
    </Section>
  );
}
