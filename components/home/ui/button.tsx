import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "dark" | "glass" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full font-body font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2 focus-visible:ring-offset-warm disabled:pointer-events-none disabled:opacity-50";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-5 py-2.5 text-sm",
  md: "px-7 py-3.5 text-[15px]",
  lg: "px-9 py-4 text-base",
};

/*
 * Contrast verified with the WCAG relative-luminance formula (see
 * .superpowers/sdd/aihome-1-report.md for the full pairing table):
 *  - white on rose (#E0819A)      ~2.70:1 — FAILS AA even at large-text size.
 *  - white on rose-deep (#C05E78) ~4.11:1 — fails normal-text AA (needs 4.5).
 *  - white on rose-ink (#A8506A)  ~5.22:1 — PASSES AA normal text.
 * So the "solid rose primary" button fills with `rose-ink`, not the raw
 * `rose` token, whenever it carries white text — same technique the
 * marketing site's existing Button already uses for its `accent`/`accent-ink`
 * pair.
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-rose-ink text-white shadow-soft hover:bg-rose-deep hover:shadow-lift",
  dark: "bg-plum text-white shadow-soft hover:bg-ink hover:shadow-lift",
  glass: "border border-white/50 bg-white/60 text-ink backdrop-blur-xl shadow-soft hover:bg-white/80",
  outline: "border border-ink/20 text-ink hover:border-rose-ink/40 hover:bg-blush",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Render the single child element instead of a <button>, merging
   * className/props/ref onto it (a tiny local "Slot" — avoids pulling in
   * @radix-ui/react-slot as a dependency). Use to render an <a>/<Link> that
   * is styled like a Button.
   */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, children, ...props }, ref) => {
    const classes = cn(baseClasses, sizeClasses[size], variantClasses[variant], className);

    if (asChild) {
      if (!React.isValidElement(children)) {
        throw new Error("Button: asChild requires a single valid React element child");
      }
      const child = children as React.ReactElement<{
        className?: string;
        ref?: React.Ref<unknown>;
      }>;
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
        ref,
        ...props,
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
