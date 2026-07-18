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
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, containerClassName, children, ...props }, ref) => (
    <section ref={ref} className={cn("py-16 md:py-24", className)} {...props}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  ),
);
Section.displayName = "Section";
