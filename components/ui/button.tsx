import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "whatsapp";

const baseClasses =
  "rounded-full px-6 py-3 font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 inline-flex items-center justify-center gap-2";

const variantClasses: Record<ButtonVariant, string> = {
  // `accent` (#ec6a93, the brand's rose-pink CTA color) with white text is
  // only ~3:1 — fails WCAG AA (4.5:1) for normal text. `accent-ink`, the
  // darker rose token (see globals.css), clears ~6.5:1 against white and
  // keeps the same rose family, so it's used as the resting background
  // instead; hover deepens further to `ink` for a clear, on-brand pressed
  // state. Rounded-full + soft shadow gives the friendly, pill-shaped CTA
  // look from the reference brand.
  primary: "bg-accent-ink text-white shadow-soft hover:bg-ink hover:shadow-lift",
  secondary: "bg-ink text-white",
  outline: "border border-ink/20 text-ink hover:bg-ink/5",
  // WhatsApp's brand green (#25D366) against white text is only ~2:1.
  // Keeping the brand green background but switching to dark `ink` text
  // (~9:1) preserves the recognizable brand color while passing AA.
  whatsapp: "bg-[#25D366] text-ink",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /**
   * When true, renders the single child element instead of a <button>,
   * merging className/props/ref onto it (a tiny local "Slot" — avoids
   * pulling in @radix-ui/react-slot as a dependency).
   */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", asChild = false, children, ...props }, ref) => {
    const classes = cn(baseClasses, variantClasses[variant], className);

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
