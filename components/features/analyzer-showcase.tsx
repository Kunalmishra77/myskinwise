import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
import { IMAGES } from "@/content/assets";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { T } from "@/components/i18n/t";
import { ANALYZER_SHOWCASE } from "@/content/i18n/home";

/**
 * Homepage showcase for the AI Skin Scanner — the product's most
 * differentiated feature, given a section of its own with real imagery.
 *
 * The copy is careful for the same reason the scanner itself is: it offers
 * "visual observations" and marks "areas", never a diagnosis or a detected
 * condition. It sells the experience honestly.
 */
export function AnalyzerShowcase() {
  return (
    <section className="mt-20 lg:mt-28" aria-labelledby="scan-showcase-heading">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-surface shadow-soft lg:grid-cols-2 lg:gap-0">
          <Reveal className="order-2 p-8 lg:order-1 lg:p-12">
            <Eyebrow><T>{ANALYZER_SHOWCASE.eyebrow}</T></Eyebrow>
            <h2
              id="scan-showcase-heading"
              className="mt-3 font-display text-h2 font-semibold text-ink"
            >
              <T>{ANALYZER_SHOWCASE.title}</T>
            </h2>
            <p className="mt-4 text-ink-soft">
              <T>{ANALYZER_SHOWCASE.body}</T>
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/skin-check/analyzer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-ink px-6 py-3 font-semibold text-white transition hover:bg-rose-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
              >
                <Camera aria-hidden="true" className="size-5" />
                <T>{ANALYZER_SHOWCASE.scanCta}</T>
              </Link>
              <Link
                href="/skin-check"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 px-6 py-3 font-semibold text-ink transition hover:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
              >
                <T>{ANALYZER_SHOWCASE.answerCta}</T>
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </Reveal>

          <div className="relative order-1 aspect-[4/3] w-full lg:order-2 lg:aspect-auto lg:h-full lg:min-h-[420px]">
            <Image
              src={IMAGES.scanShowcase.src}
              alt={IMAGES.scanShowcase.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
