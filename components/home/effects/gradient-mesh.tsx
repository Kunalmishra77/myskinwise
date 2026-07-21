import { cn } from "@/lib/utils";

export interface GradientMeshProps {
  className?: string;
}

/**
 * Blurred, drifting rose/champagne/lilac radial blobs for section
 * backgrounds. Purely decorative (`aria-hidden`) and purely CSS — the host
 * section must be `relative` (or otherwise a positioning container) since
 * this renders `absolute inset-0`. Drift is applied via
 * `motion-safe:animate-hp-drift-*` so under `prefers-reduced-motion:
 * reduce` the blobs render fully static with no JS involved at all.
 */
export function GradientMesh({ className }: GradientMeshProps) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -left-24 -top-24 size-[26rem] rounded-full bg-hp-rose/25 blur-[100px] motion-safe:animate-hp-drift-a" />
      <div className="absolute -right-20 top-1/4 size-[24rem] rounded-full bg-hp-champagne/60 blur-[110px] motion-safe:animate-hp-drift-b" />
      {/* Lilac isn't a named palette token (decorative-only, no text ever
          sits on it, so it carries no WCAG contrast requirement) — a literal
          matches the spec's "rose/champagne/lilac" description without
          inventing a new brand token for a one-off blur. */}
      <div className="absolute bottom-[-6rem] left-1/3 size-[22rem] rounded-full bg-[#E7D6F0]/45 blur-[100px] motion-safe:animate-hp-drift-a" />
    </div>
  );
}
