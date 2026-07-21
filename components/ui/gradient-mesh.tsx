import { cn } from "@/lib/utils";

export interface GradientMeshProps {
  className?: string;
}

/**
 * Blurred rose/champagne/lilac radial blobs for section backgrounds.
 * Purely decorative (`aria-hidden`) and pure CSS. The host section must be
 * a positioning container, since this renders `absolute inset-0`.
 *
 * These blobs used to drift continuously via `motion-safe:animate-drift-*`.
 * The drift is gone: three simultaneously animating 22–26rem elements each
 * carrying a ~100px blur means the compositor re-rasterises a very
 * expensive layer every frame, for the entire time the section is on
 * screen. On the mid-range Android hardware most of this audience uses,
 * that is a measurable cost paid continuously for an effect almost nobody
 * consciously notices. The static composition is kept because it does real
 * work — it stops large flat sections reading as empty.
 */
export function GradientMesh({ className }: GradientMeshProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute -left-24 -top-24 size-[26rem] rounded-full bg-rose/25 blur-[100px]" />
      <div className="absolute -right-20 top-1/4 size-[24rem] rounded-full bg-champagne/60 blur-[110px]" />
      {/* Lilac is not a named palette token — it is decorative-only, no text
          ever sits on it, so it carries no contrast requirement, and adding
          a brand token for one blurred blob would not earn its keep. */}
      <div className="absolute bottom-[-6rem] left-1/3 size-[22rem] rounded-full bg-[#E7D6F0]/45 blur-[100px]" />
    </div>
  );
}
