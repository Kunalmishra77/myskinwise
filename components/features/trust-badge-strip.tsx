import { BadgeCheck } from "lucide-react";

export interface TrustBadgeStripProps {
  badges: string[];
}

function BadgeDot() {
  return <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-ink/25" />;
}

/**
 * Horizontally-scrolling marquee of trust badges (e.g. "Cruelty-Free",
 * "Vegan-Friendly") on a soft blush band, each badge paired with a small
 * check icon and separated by a subtle dot. The badge list is rendered
 * twice back-to-back and animated with a CSS `translateX` loop (see
 * `.marquee`/`@keyframes marquee` in `app/globals.css`) so the strip
 * appears to scroll seamlessly forever.
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
    <div className="overflow-hidden bg-blush py-5">
      <div role="list" aria-label="Trust badges" className="marquee flex w-max items-center gap-x-3">
        {badges.map((badge) => (
          <span key={badge} className="flex items-center gap-x-3">
            <span
              role="listitem"
              className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-ink/80"
            >
              <BadgeCheck aria-hidden="true" className="size-4 text-accent-ink" />
              {badge}
            </span>
            <BadgeDot />
          </span>
        ))}
        {badges.map((badge) => (
          <span key={`dup-${badge}`} aria-hidden="true" className="flex items-center gap-x-3">
            <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-ink/80">
              <BadgeCheck aria-hidden="true" className="size-4 text-accent-ink" />
              {badge}
            </span>
            <BadgeDot />
          </span>
        ))}
      </div>
    </div>
  );
}
