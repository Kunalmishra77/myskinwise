import Link from "next/link";
import { ArrowRight, Camera, ClipboardList } from "lucide-react";
import { CHECK_VS_SCAN } from "@/content/i18n/scanner";
import { T } from "@/components/i18n/t";

export interface CheckVsScanProps {
  /** Which of the two the visitor is already on, so we offer the other. */
  current: "skin-check" | "analyzer";
}

/**
 * Explains the difference between the two assessments, and offers the one the
 * visitor is not currently looking at.
 *
 * The two were previously unrelated pages with no link between them and no
 * explanation of how they differ, so a visitor on the Skin Check had no way
 * to learn the photo analyzer existed — and someone who found the analyzer
 * had no idea it was not the main path to an expert.
 *
 * The distinction stated here is the real one, not marketing framing:
 *
 *   Skin Check   a questionnaire. Reaches a human expert. Works without a
 *                photo, which matters — plenty of people will not photograph
 *                their face, and that must not be a dead end.
 *   Analyzer     AI visual observations from a photo. Faster, and it sees
 *                things a questionnaire cannot, but it observes rather than
 *                assesses and an expert still reviews it.
 *
 * Deliberately never says "diagnosis", "detects", "results" or "score" about
 * the analyzer. It produces observations.
 */
export function CheckVsScan({ current }: CheckVsScanProps) {
  const other =
    current === "skin-check"
      ? {
          href: "/skin-check/analyzer",
          Icon: Camera,
          eyebrow: CHECK_VS_SCAN.analyzerEyebrow,
          title: CHECK_VS_SCAN.analyzerTitle,
          body: CHECK_VS_SCAN.analyzerBody,
          action: CHECK_VS_SCAN.analyzerAction,
        }
      : {
          href: "/skin-check",
          Icon: ClipboardList,
          eyebrow: CHECK_VS_SCAN.checkEyebrow,
          title: CHECK_VS_SCAN.checkTitle,
          body: CHECK_VS_SCAN.checkBody,
          action: CHECK_VS_SCAN.checkAction,
        };

  return (
    <aside className="rounded-3xl bg-surface p-6 shadow-soft">
      <p className="text-sm text-ink-soft">
        <T>{current === "skin-check" ? CHECK_VS_SCAN.fromCheck : CHECK_VS_SCAN.fromAnalyzer}</T>
      </p>

      <Link
        href={other.href}
        className="group mt-5 flex items-start gap-4 rounded-2xl border border-ink/10 p-4 transition hover:border-rose-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blush text-rose-ink">
          <other.Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-rose-ink">
            <T>{other.eyebrow}</T>
          </span>
          <span className="mt-0.5 block font-display text-lg font-semibold text-ink">
            <T>{other.title}</T>
          </span>
          <span className="mt-1 block text-sm text-ink-soft"><T>{other.body}</T></span>
          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-ink">
            <T>{other.action}</T>
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
            />
          </span>
        </span>
      </Link>
    </aside>
  );
}
