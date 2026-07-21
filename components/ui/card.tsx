import * as React from "react";
import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

/** Solid surface card: 24px radius, warm layered shadow, hover lift. */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl bg-surface p-6 shadow-soft transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export type GlassCardProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Translucent, blurred card for use over imagery or gradients, where a
 * solid surface would read as a hole punched in the composition.
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl border border-white/40 bg-white/60 p-6 shadow-soft backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";

export type CardBodyProps = React.HTMLAttributes<HTMLDivElement>;

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(className)} {...props} />,
);
CardBody.displayName = "CardBody";
