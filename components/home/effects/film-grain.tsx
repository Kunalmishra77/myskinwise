const NOISE_SVG_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/**
 * Fixed full-screen SVG feTurbulence noise overlay, ~0.5 opacity,
 * mix-blend-soft-light, pointer-events-none. Static texture (no motion), so
 * this needs no client-side JS and no reduced-motion gating of its own —
 * nothing here animates.
 */
export function FilmGrain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 opacity-50 mix-blend-soft-light"
      style={{ backgroundImage: `url("${NOISE_SVG_DATA_URI}")` }}
    />
  );
}
