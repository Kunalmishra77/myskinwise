import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "whatsapp";

const baseClasses =
  "rounded-full px-6 py-3 font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 inline-flex items-center justify-center gap-2";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-ink",
  secondary: "bg-ink text-white",
  outline: "border border-ink/20 text-ink hover:bg-ink/5",
  whatsapp: "bg-[#25D366] text-white",
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
