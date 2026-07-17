export interface TrustBadgeStripProps {
  badges: string[];
}

/**
 * Horizontally-scrolling marquee of trust badges (e.g. "Cruelty-Free",
 * "Vegan-Friendly"). The badge list is rendered twice back-to-back and
 * animated with a CSS `translateX` loop (see `.marquee`/`@keyframes marquee`
 * in `app/globals.css`) so the strip appears to scroll seamlessly forever.
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
    <div className="overflow-hidden bg-surface py-4">
      <div
        role="list"
        aria-label="Trust badges"
        className="marquee flex w-max items-center gap-x-10"
      >
        {badges.map((badge) => (
          <span
            key={badge}
            role="listitem"
            className="whitespace-nowrap text-sm font-medium text-muted"
          >
            {badge}
          </span>
        ))}
        {badges.map((badge) => (
          <span
            key={`dup-${badge}`}
            aria-hidden="true"
            className="whitespace-nowrap text-sm font-medium text-muted"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
