"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items: AccordionItem[];
  /** Allow more than one panel to be open at once. Defaults to single-open. */
  allowMultiple?: boolean;
}

export function Accordion({ items, allowMultiple = false, className, ...props }: AccordionProps) {
  const [openIds, setOpenIds] = React.useState<Set<string>>(() => new Set());
  const prefersReducedMotion = useReducedMotion();

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(id)) {
        // Closing an already-open item: start from the untouched previous
        // set (not the cleared one above) so single-open mode can collapse
        // without side effects.
        const collapsed = new Set(prev);
        collapsed.delete(id);
        return collapsed;
      }
      next.add(id);
      return next;
    });
  };

  return (
    <div className={cn("divide-y divide-ink/10", className)} {...props}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const headerId = `acc-${item.id}-header`;
        const panelId = `acc-${item.id}-panel`;

        return (
          <div key={item.id} className="py-2">
            <h3 className="m-0">
              <button
                id={headerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 py-3 text-left font-medium text-ink"
              >
                <span>{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-5 shrink-0 text-muted transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  initial={prefersReducedMotion ? false : { height: 0 }}
                  animate={prefersReducedMotion ? {} : { height: "auto" }}
                  exit={prefersReducedMotion ? {} : { height: 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pb-4 pt-1 text-muted">{item.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
