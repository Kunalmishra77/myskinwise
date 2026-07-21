import * as React from "react";
import { cn } from "@/lib/utils";

export type ContainerProps = React.HTMLAttributes<HTMLDivElement>;

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mx-auto w-full max-w-6xl px-5", className)} {...props} />
  ),
);
Container.displayName = "Container";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  containerClassName?: string;
  /**
   * Background band for alternating section rhythm down a page. Omit to
   * keep the current default (transparent — inherits the page's canvas
   * background from `body`).
   */
  tone?: "canvas" | "surface" | "blush";
}

const toneClasses: Record<NonNullable<SectionProps["tone"]>, string> = {
  canvas: "bg-warm",
  surface: "bg-surface",
  blush: "bg-blush",
};

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, containerClassName, tone, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn("py-20 md:py-28", tone && toneClasses[tone], className)}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  ),
);
Section.displayName = "Section";
