"use client";

import * as React from "react";
import { useTContent } from "@/lib/i18n/use-content";
import { motion } from "framer-motion";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-media-query";

export interface AccordionItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items: AccordionItem[];
  /** Allow more than one panel open at once. Defaults to single-open. */
  allowMultiple?: boolean;
  /**
   * Toggle affordance. "chevron" (default) suits dense content lists;
   * "plusminus" reads as more deliberate and suits editorial FAQ blocks.
   */
  toggleIcon?: "chevron" | "plusminus";
}

/**
 * Accordion with an animated height collapse (instant under
 * prefers-reduced-motion).
 *
 * Every panel stays permanently mounted rather than being unmounted while
 * collapsed, so `aria-controls`/`aria-labelledby` always resolve to a real
 * element. Collapsed panels are removed from the accessibility tree and the
 * tab order with `aria-hidden` + `inert`, while the height animation
 * handles the visual collapse — animating a panel that screen readers can
 * still reach, or unmounting one that ARIA still points at, are the two
 * usual ways this component goes wrong.
 */
export function Accordion({
  items,
  allowMultiple = false,
  toggleIcon = "chevron",
  className,
  ...props
}: AccordionProps) {
  const tc = useTContent();
  // Salts every derived DOM id so multiple <Accordion> instances on one
  // page never collide, even when their items share caller-supplied ids.
  const uid = React.useId();
  const [openIds, setOpenIds] = React.useState<Set<string>>(() => new Set());
  const prefersReducedMotion = usePrefersReducedMotion();

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      if (prev.has(id)) {
        // Start from the untouched previous set, not a cleared one, so
        // single-open mode can collapse without side effects.
        const collapsed = new Set(prev);
        collapsed.delete(id);
        return collapsed;
      }
      const next = new Set(allowMultiple ? prev : []);
      next.add(id);
      return next;
    });
  };

  return (
    <div className={cn("divide-y divide-ink/10", className)} {...props}>
      {items.map((item) => {
        // translate() falls back to English when no Hindi exists / no provider
        const isOpen = openIds.has(item.id);
        const headerId = `acc-${uid}-${item.id}-header`;
        const panelId = `acc-${uid}-${item.id}-panel`;

        return (
          <div key={item.id} className="py-2">
            <h3 className="m-0">
              <button
                id={headerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left font-display text-lg font-medium text-ink transition-colors hover:text-rose-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
              >
                <span>{tc(item.question)}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full bg-blush text-rose-ink transition-colors",
                    isOpen && "bg-rose-ink text-white",
                  )}
                >
                  {toggleIcon === "plusminus" ? (
                    isOpen ? (
                      <Minus className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )
                  ) : (
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    />
                  )}
                </span>
              </button>
            </h3>
            <motion.div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              aria-hidden={!isOpen}
              inert={!isOpen}
              initial={false}
              animate={{ height: isOpen ? "auto" : 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pb-5 pt-1 font-body text-ink-soft">{typeof item.answer === "string" ? tc(item.answer) : item.answer}</div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
