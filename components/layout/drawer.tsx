"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Camera, ClipboardList, FlaskConical, Home, Layers, LifeBuoy, Mic,
  MessageCircle, Package, Sparkles, User, X,
} from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/language-toggle";

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

  const panel = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[100] flex flex-col bg-warm lg:hidden"
    >
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <span id={titleId} className="font-display text-xl italic text-ink">
          Menu
        </span>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-blush"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>
      </div>

      <nav
        aria-label="All pages"
        className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4"
      >
        {/*
          The four product actions lead, as a grid of real targets rather
          than a text list. On a phone this is the whole reason someone opens
          the menu, and it used to be buried under marketing links.
        */}
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Start here
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {PRIMARY.map(({ href, label, sub, Icon, accent }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className={`flex h-full flex-col gap-1 rounded-2xl p-4 transition ${
                  accent
                    ? "bg-rose-ink text-white shadow-soft"
                    : "bg-surface text-ink shadow-soft hover:shadow-lift"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className={`size-5 ${accent ? "text-white" : "text-rose-ink"}`}
                />
                <span className="mt-1 font-body text-sm font-semibold">{label}</span>
                <span className={`text-xs ${accent ? "text-white" : "text-ink-soft"}`}>{sub}</span>
              </Link>
            </li>
          ))}
        </ul>

        {SECTIONS.map((section) => (
          <div key={section.title} className="mt-6">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {section.title}
            </p>
            <ul className="mt-1 flex flex-col">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="flex min-h-11 items-center gap-3 rounded-xl px-1 py-2.5 font-body text-ink transition hover:bg-blush hover:text-rose-ink"
                  >
                    {link.Icon ? (
                      <link.Icon aria-hidden="true" className="size-4 text-rose-ink" />
                    ) : null}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-7 flex flex-col gap-2">
          <Button asChild className="w-full" onClick={onClose}>
            <Link href="/skin-check/analyzer">Scan your skin</Link>
          </Button>
          <Button asChild variant="outline" className="w-full" onClick={onClose}>
            <a href={waHref(SITE.whatsapp.e164)} target="_blank" rel="noopener noreferrer">
              Message us on WhatsApp
            </a>
          </Button>
        </div>
      </nav>
    </div>
  );

  /*
   * Rendered through a portal to <body>, and this is not stylistic.
   *
   * The drawer is mounted inside <header>, which carries `backdrop-blur-xl`.
   * A backdrop-filter establishes a containing block for `position: fixed`
   * descendants, so `fixed inset-0` resolved against the 56px-tall header
   * instead of the viewport: the menu opened as a 390x56 sliver tucked behind
   * the header and looked, to a user, like the button did nothing at all.
   * Measured at 390x56 in a real browser before this change.
   *
   * The e2e test did not catch it because Playwright's toBeVisible() only
   * requires a non-zero box, which a 56px sliver satisfies. The test now
   * asserts the panel actually covers the viewport.
   */
  // The drawer only ever mounts in response to a click, so `document` is
  // guaranteed to exist by this point; the guard is for safety during any
  // future server render, not a hydration workaround.
  if (typeof document === "undefined") return null;
  return createPortal(panel, document.body);
}

/** The four product actions, surfaced first. */
const PRIMARY = [
  { href: "/skin-check/analyzer", label: "Skin Scanner", sub: "AI reads your photo", Icon: Camera, accent: true },
  { href: "/skin-check", label: "Skin Check", sub: "Guided questions", Icon: ClipboardList, accent: false },
  { href: "/voice", label: "Talk to Skinwise", sub: "Voice assistant", Icon: Mic, accent: false },
  { href: "/assistant", label: "Ask Skinwise", sub: "Text assistant", Icon: MessageCircle, accent: false },
] as const;

const SECTIONS = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Home", Icon: Home },
      { href: "/concerns", label: "Skin concerns", Icon: Sparkles },
      { href: "/ingredients", label: "Ingredients", Icon: FlaskConical },
      { href: "/skin-types", label: "Skin types", Icon: Layers },
      { href: "/products", label: "Formulations", Icon: Package },
      { href: "/learn", label: "Learn", Icon: LifeBuoy },
    ],
  },
  {
    title: "Your Skinwise",
    links: [
      { href: "/me", label: "My Skinwise", Icon: User },
      { href: "/consultation", label: "Consultation status", Icon: ClipboardList },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about-us", label: "Our expertise", Icon: undefined },
      { href: "/contact-us", label: "Contact", Icon: undefined },
      { href: "/privacy-policy", label: "Privacy policy", Icon: undefined },
      { href: "/terms-and-conditions", label: "Terms & conditions", Icon: undefined },
    ],
  },
] as const;
