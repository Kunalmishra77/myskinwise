"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { SITE } from "@/config/site";
import { IMAGES } from "@/content/assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Desktop-only dropdown for a nav item with `children` (currently "Skin
 * Problem" -> the 3 concerns). Opens on hover AND on focus/click so it is
 * reachable by mouse, touch and keyboard alike; closes on Escape or when
 * focus/pointer leaves the whole trigger+menu group.
 */
function NavDropdown({ label, children }: { label: string; children: { label: string; href: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const menuId = React.useId();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => setOpen(false), []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
    }
  };

  const onBlur = (event: React.FocusEvent) => {
    // Only close once focus has left the entire trigger+menu group.
    if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
      close();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={close}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
        onFocus={() => setOpen(true)}
        className="inline-flex items-center gap-1 font-medium text-ink transition hover:text-accent-ink"
      >
        {label}
        <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      <div
        id={menuId}
        role="menu"
        aria-label={label}
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "absolute left-0 top-full z-50 mt-2 min-w-48 rounded-xl border border-ink/10 bg-surface py-2 shadow-lg",
          !open && "pointer-events-none opacity-0",
        )}
      >
        {children.map((child) => (
          <Link
            key={child.href}
            href={child.href}
            role="menuitem"
            className="block px-4 py-2 text-sm text-ink transition hover:bg-canvas hover:text-accent-ink"
          >
            {child.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

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
 * whatever opened it (the hamburger button) when it unmounts.
 */
function MobileDrawer({ onClose, triggerRef }: { onClose: () => void; triggerRef: React.RefObject<HTMLButtonElement | null> }) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();

  // Lock body scroll while the drawer is open, and restore the previous
  // value on close/unmount.
  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Move focus into the drawer on open, and restore it to the trigger
  // (hamburger button) on close/unmount.
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
      className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden"
    >
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-4">
        <span id={titleId} className="font-serif text-lg text-ink">
          {SITE.name}
        </span>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="rounded-full p-2 text-ink transition hover:bg-canvas"
        >
          <X aria-hidden="true" className="size-6" />
        </button>
      </div>
      <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 py-4">
        <ul className="flex flex-col gap-1">
          {SITE.nav.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <div className="py-2">
                  <span className="block font-medium text-ink">{item.label}</span>
                  <ul className="mt-1 flex flex-col gap-1 pl-4">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onClose}
                          className="block py-2 text-muted transition hover:text-accent-ink"
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
                  className="block py-2 font-medium text-ink transition hover:text-accent-ink"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Button asChild onClick={onClose}>
            <Link href="/pigmentation">Analyse your skin</Link>
          </Button>
        </div>
      </nav>
    </div>
  );
}

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const hamburgerRef = React.useRef<HTMLButtonElement>(null);
  const drawerId = React.useId();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="shrink-0">
          <Image src={IMAGES.logo.src} alt={IMAGES.logo.alt} width={56} height={32} priority />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {SITE.nav.map((item) =>
            item.children ? (
              <NavDropdown key={item.label} label={item.label}>
                {item.children}
              </NavDropdown>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="font-medium text-ink transition hover:text-accent-ink"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden md:block">
          <Button asChild>
            <Link href="/pigmentation">Analyse your skin</Link>
          </Button>
        </div>

        <button
          ref={hamburgerRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          onClick={() => setDrawerOpen(true)}
          className="rounded-full p-2 text-ink transition hover:bg-canvas md:hidden"
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
