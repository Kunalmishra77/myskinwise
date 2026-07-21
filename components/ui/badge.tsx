import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      // `text-rose-ink` on this light rose tint background falls under
      // WCAG AA's 4.5:1 for normal text (the tint itself, being close to
      // white, leaves little room). `text-ink` keeps the rose background
      // for on-brand color while giving the text a safe ~16:1 margin.
      className={cn("rounded-full bg-rose/10 text-ink px-3 py-1 text-sm", className)}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
