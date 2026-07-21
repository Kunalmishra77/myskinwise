import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionEyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Italic serif index number prefix, e.g. "01". Omit for sections with no index (e.g. Results). */
  index?: string;
  /**
   * "default" (rose-ink, ~4.6–5.2:1 AA on warm/surface/blush light
   * backgrounds) or "dark" (rose, ~6.5:1 AA on the #231619 dark section).
   * rose-ink does NOT clear AA on the dark plum background — always use
   * tone="dark" there. See .hp-eyebrow in globals.css for the exact ratios.
   */
  tone?: "default" | "dark";
}

/**
 * `<SectionEyebrow index="01">The AI Skin Analyzer</SectionEyebrow>` — an
 * italic serif index number followed by an uppercase, wide-tracked Manrope
 * label, per the spec's section-eyebrow convention.
 */
export function SectionEyebrow({ index, tone = "default", className, children, ...props }: SectionEyebrowProps) {
  return (
    <p className={cn("hp-eyebrow flex items-center gap-2.5", tone === "dark" && "hp-eyebrow--dark", className)} {...props}>
      {index && (
        <span aria-hidden="true" className="font-display text-base italic normal-case tracking-normal">
          {index}
        </span>
      )}
      <span>{children}</span>
    </p>
  );
}
