"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { SITE } from "@/config/site";
import { Button } from "@/components/ui/button";

/** Returns the focusable elements inside `container`, in DOM order. */
function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

/**
 * Full-screen navigation drawer, implemented as a focus-trapped modal
 * dialog.
 *
 * The trap, scroll lock and focus restoration below are ported wholesale
 * from the marketing Navbar this shell replaces — that implementation was
 * correct and is deliberately not rewritten. Specifically it: traps
 * Tab/Shift+Tab inside the dialog, closes on Escape, locks body scroll
 * while open (restoring the previous value rather than assuming ""), moves
 * focus to the close button on open, and returns focus to the trigger on
 * unmount so keyboard users do not land back at the top of the document.
 */
export function Drawer({
  onClose,
  triggerRef,
}: {
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  React.useEffect(() => {
    closeButtonRef.current?.focus();
    const trigger = triggerRef.current;
    return () => {
      trigger?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = getFocusable(dialogRef.current);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !dialogRef.current.contains(active)) {
        event.preventDefault();
        last?.focus();
      }
    } else if (active === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 flex flex-col bg-warm lg:hidden"
    >
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-4">
        <span id={titleId} className="font-display text-xl italic text-ink">
          Menu
        </span>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="rounded-full p-2 text-ink transition hover:bg-blush"
        >
          <X aria-hidden="true" className="size-6" />
        </button>
      </div>

      <nav aria-label="All pages" className="flex-1 overflow-y-auto px-4 py-4">
        <ul className="flex flex-col gap-1">
          {SITE.nav.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <div className="py-2">
                  <span className="block font-body font-semibold text-ink">{item.label}</span>
                  <ul className="mt-1 flex flex-col gap-1 pl-4">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onClose}
                          className="block py-2.5 text-ink-soft transition hover:text-rose-ink"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block py-3 font-body font-semibold text-ink transition hover:text-rose-ink"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Button asChild className="w-full" onClick={onClose}>
            <Link href="/skin-check">Start your Skin Check</Link>
          </Button>
        </div>
      </nav>
    </div>
  );
}
