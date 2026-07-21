"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { IMAGES } from "@/content/assets";
import { Button } from "@/components/home/ui/button";
import { MagneticButton } from "@/components/home/ui/magnetic-button";
import { cn } from "@/lib/utils";

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Analyzer", href: "#analyzer" },
  { label: "AI Chat", href: "#chat" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Concerns", href: "#concerns" },
  { label: "Results", href: "#results" },
];

/** Returns the focusable elements inside `container`, in DOM order. */
function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

/**
 * Mobile nav drawer: a focus-trapped modal dialog. Traps Tab/Shift+Tab
 * within its focusable elements, closes on Escape, and hands focus back to
 * the hamburger button that opened it on close/unmount.
 */
function MobileDrawer({
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
        <span id={titleId} className="font-display text-lg italic text-ink">
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
      <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="flex flex-col gap-1">
          {NAV_LINKS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={onClose}
                className="block py-3 font-body text-base font-medium text-ink transition hover:text-rose-ink"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="outline" asChild onClick={onClose}>
            <a href="#chat">Try AI Chat</a>
          </Button>
          <Button variant="dark" asChild onClick={onClose}>
            <a href="#analyzer">Analyze My Skin</a>
          </Button>
        </div>
      </nav>
    </div>
  );
}

/**
 * Sticky translucent blurred nav bar. Logo left, center anchor links to the
 * homepage's own in-page sections, "Try AI Chat" (outline) + "Analyze My
 * Skin" (dark solid, magnetic) right. Collapses to a hamburger + accessible
 * focus-trapped drawer below `lg`.
 */
export function Nav() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const hamburgerRef = React.useRef<HTMLButtonElement>(null);
  const drawerId = React.useId();

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-warm/75 backdrop-blur-xl">
      <div
        aria-hidden={drawerOpen || undefined}
        inert={drawerOpen}
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8"
      >
        <Link href="/" className="shrink-0" aria-label="Skinwise home">
          <Image
            src={IMAGES.logo.src}
            alt={IMAGES.logo.alt}
            width={IMAGES.logo.width}
            height={IMAGES.logo.height}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-body text-sm font-medium text-ink transition-colors hover:text-rose-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="outline" size="sm" asChild>
            <a href="#chat">Try AI Chat</a>
          </Button>
          <MagneticButton>
            <Button variant="dark" size="sm" asChild>
              <a href="#analyzer">Analyze My Skin</a>
            </Button>
          </MagneticButton>
        </div>

        <button
          ref={hamburgerRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "rounded-full p-2 text-ink transition hover:bg-blush lg:hidden",
          )}
        >
          <Menu aria-hidden="true" className="size-6" />
        </button>
      </div>

      {drawerOpen && (
        <div id={drawerId}>
          <MobileDrawer onClose={() => setDrawerOpen(false)} triggerRef={hamburgerRef} />
        </div>
      )}
    </header>
  );
}
