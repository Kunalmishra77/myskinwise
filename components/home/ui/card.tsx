import * as React from "react";
import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

/** Solid white card: rounded-3xl (~24px), warm layered shadow, hover-lift. */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl bg-hp-surface p-6 shadow-hp-soft transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-hp-lift",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export type GlassCardProps = React.HTMLAttributes<HTMLDivElement>;

/** Translucent white + backdrop-blur card, for use over imagery/gradients (quiz card, chat panel, dashboard tiles). */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-white/40 bg-white/60 p-6 shadow-hp-soft backdrop-blur-xl",
      className,
    )}
    {...props}
  />
));
GlassCard.displayName = "GlassCard";
