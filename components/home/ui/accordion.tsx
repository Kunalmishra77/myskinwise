"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/components/home/lib/use-reduced-motion";

export interface AccordionItemData {
  id: string;
  q: string;
  a: React.ReactNode;
}

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items: AccordionItemData[];
}

/**
 * Single-open-at-a-time accordion with a +/- toggle and a smooth height
 * animation (instant under prefers-reduced-motion). Every panel stays
 * mounted (never unmounted) so `aria-controls`/`aria-labelledby` always
 * resolve to a real element even while collapsed; it's hidden from
 * assistive tech and the tab order via `aria-hidden` + `inert` while
 * collapsed, with the visual collapse handled separately by the height
 * animation.
 */
export function Accordion({ items, className, ...props }: AccordionProps) {
  // Salts every derived DOM id so multiple <Accordion> instances on the
  // same page never collide even if their `items` share `id` values.
  const uid = React.useId();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className={cn("divide-y divide-ink/10", className)} {...props}>
      {items.map((item) => {
        const isOpen = openId === item.id;
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
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left font-display text-lg font-medium text-ink transition-colors hover:text-rose-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink focus-visible:ring-offset-2"
              >
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full bg-blush text-rose-ink transition-colors",
                    isOpen && "bg-rose-ink text-white",
                  )}
                >
                  {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
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
              <div className="pb-5 pt-1 font-body text-ink-soft">{item.a}</div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
