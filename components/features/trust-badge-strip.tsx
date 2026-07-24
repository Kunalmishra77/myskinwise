import { BadgeCheck } from "lucide-react";

export interface TrustBadgeStripProps {
  badges: string[];
}

function BadgeDot() {
  return <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-white/40" />;
}

/**
 * Horizontally-scrolling marquee of trust badges (e.g. "Cruelty-Free",
 * "Vegan-Friendly") on a solid rose-pink band, each badge paired with a
 * small white check icon and separated by a subtle dot — matching the
 * reference brand's magenta trust strip. The badge list is rendered twice
 * back-to-back and animated with a CSS `translateX` loop (see
 * `.marquee`/`@keyframes marquee` in `app/globals.css`) so the strip
 * appears to scroll seamlessly forever.
 *
 * Uses `--color-accent-ink` (not the lighter `--color-accent`) as the fill:
 * white text/icons directly on `--color-accent` only clear ~3:1, failing
 * WCAG AA's 4.5:1 for normal text; `--color-accent-ink` clears ~6.5:1.
 *
 * Only the first copy is exposed to assistive tech (`role="list"` /
 * `role="listitem"`); the second copy exists purely for the visual loop and
 * is `aria-hidden`, so screen readers don't announce every badge twice.
 *
 * The animation respects `prefers-reduced-motion` (paused via CSS, see
 * globals.css), and this is a server component — the marquee is pure CSS,
 * no JS is needed.
 */
export function TrustBadgeStrip({ badges }: TrustBadgeStripProps) {
  return (
    <div className="overflow-hidden bg-rose-ink py-3">
      <div role="list" aria-label="Trust badges" className="marquee flex w-max items-center gap-x-3">
        {badges.map((badge) => (
          <span key={badge} className="flex items-center gap-x-3">
            <span
              role="listitem"
              className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-white"
            >
              <BadgeCheck aria-hidden="true" className="size-4 text-white" />
              {badge}
            </span>
            <BadgeDot />
          </span>
        ))}
        {badges.map((badge) => (
          <span key={`dup-${badge}`} aria-hidden="true" className="flex items-center gap-x-3">
            <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-white">
              <BadgeCheck aria-hidden="true" className="size-4 text-white" />
              {badge}
            </span>
            <BadgeDot />
          </span>
        ))}
      </div>
    </div>
  );
}
