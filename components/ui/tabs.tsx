"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[];
}

export function Tabs({ tabs, className, ...props }: TabsProps) {
  // Salts every derived DOM id so multiple <Tabs> instances on the same page
  // (e.g. concern pages rendering tabs per ingredient sub-type) never collide
  // even if their `tabs` share the same caller-supplied `id` values.
  const uid = React.useId();
  const [activeId, setActiveId] = React.useState<string>(() => tabs[0]?.id ?? "");
  const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  const focusTab = (id: string) => {
    tabRefs.current.get(id)?.focus();
  };

  const selectAndFocus = (index: number) => {
    const tab = tabs[index];
    if (!tab) return;
    setActiveId(tab.id);
    focusTab(tab.id);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = tabs.length - 1;

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        selectAndFocus(index === lastIndex ? 0 : index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        selectAndFocus(index === 0 ? lastIndex : index - 1);
        break;
      case "Home":
        event.preventDefault();
        selectAndFocus(0);
        break;
      case "End":
        event.preventDefault();
        selectAndFocus(lastIndex);
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn(className)} {...props}>
      <div role="tablist" className="flex gap-4 border-b border-ink/10">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeId;
          const tabId = `tab-${uid}-${tab.id}`;
          const panelId = `panel-${uid}-${tab.id}`;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
                else tabRefs.current.delete(tab.id);
              }}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "-mb-px border-b-2 border-transparent px-1 py-2 text-sm font-medium transition-colors",
                // `text-ink` (not `accent-ink`) for the active label keeps
                // contrast unambiguously safe across every background these
                // tabs render on; `border-accent` still carries the rose
                // brand color as the active indicator.
                isActive ? "border-accent text-ink" : "border-transparent text-muted",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const tabId = `tab-${uid}-${tab.id}`;
        const panelId = `panel-${uid}-${tab.id}`;

        if (!isActive) return null;

        return (
          <div key={tab.id} role="tabpanel" id={panelId} aria-labelledby={tabId} className="py-4">
            {tab.content}
          </div>
        );
      })}
    </div>
  );
}
