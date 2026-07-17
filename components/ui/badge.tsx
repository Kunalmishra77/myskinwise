import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("rounded-full bg-accent/10 text-accent-ink px-3 py-1 text-sm", className)}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
