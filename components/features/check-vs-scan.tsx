import Link from "next/link";
import { ArrowRight, Camera, ClipboardList } from "lucide-react";

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
          eyebrow: "Or upload a photo",
          title: "AI Skin Analyzer",
          body: "Take or upload a clear photo and get AI-powered visual observations in seconds. A Skinwise expert reviews them before any routine is made.",
          action: "Scan your skin",
        }
      : {
          href: "/skin-check",
          Icon: ClipboardList,
          eyebrow: "Or answer questions",
          title: "Skin Check",
          body: "A few guided questions about your skin, routine and history — no photo needed. This is the route that reaches a Skinwise expert.",
          action: "Start your Skin Check",
        };

  return (
    <aside className="rounded-3xl bg-surface p-6 shadow-soft">
      <p className="text-sm text-ink-soft">
        {current === "skin-check"
          ? "The Skin Check asks about your skin in your own words. The Skin Analyzer looks at a photo. You can do either, or both — together they give an expert the fullest picture."
          : "The Skin Analyzer makes visual observations from your photo. The Skin Check asks about your skin, your routine and your history. You can do either, or both — together they give an expert the fullest picture."}
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
            {other.eyebrow}
          </span>
          <span className="mt-0.5 block font-display text-lg font-semibold text-ink">
            {other.title}
          </span>
          <span className="mt-1 block text-sm text-ink-soft">{other.body}</span>
          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-ink">
            {other.action}
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
