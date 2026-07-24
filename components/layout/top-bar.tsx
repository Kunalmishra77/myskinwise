"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, MessageCircle, Sparkles } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { IMAGES } from "@/content/assets";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/layout/drawer";

/**
 * Sticky app header.
 *
 * Mobile: menu trigger, logo, WhatsApp. WhatsApp lives here rather than in
 * a second fixed bottom bar — see BottomNav for why only one bottom bar can
 * exist. It stays a single tap either way.
 *
 * Desktop (lg+): the same bar grows real navigation links and CTAs, because
 * the bottom nav is mobile-only. This is a different layout for a different
 * screen, not the mobile bar stretched wide.
 */
export function TopBar() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const drawerId = React.useId();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-warm/80 backdrop-blur-xl">
      {/*
        Hidden from assistive tech and made non-interactive while the drawer
        is open, so a screen reader's browse cursor and the tab order cannot
        reach the header underneath the modal. `drawerOpen` flips back to
        false in the same commit the drawer unmounts in, so this is no longer
        inert by the time the drawer's cleanup effect restores focus here.
      */}
      <div
        aria-hidden={drawerOpen || undefined}
        inert={drawerOpen}
        className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 lg:h-16 lg:px-8"
      >
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          onClick={() => setDrawerOpen(true)}
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-blush lg:hidden"
        >
          <Menu aria-hidden="true" className="size-6" />
        </button>

        <Link href="/" aria-label="Skinwise home" className="shrink-0">
          <Image
            src={IMAGES.logo.src}
            alt={IMAGES.logo.alt}
            width={IMAGES.logo.width}
            height={IMAGES.logo.height}
            priority
            className="h-8 w-auto lg:h-9"
          />
        </Link>

        {/*
          Grouped items used to be dropped entirely: the filter removed every
          entry with href="#", which is how a group is declared. That silently
          deleted "Skin Problem" from the desktop header — so a desktop
          visitor could not reach a concern page from the navigation at all —
          and would have done the same to the "Skin AI" group. They render as
          real menus now.
        */}
        <nav aria-label="Sections" className="hidden items-center gap-8 lg:flex">
          {SITE.nav.map((item) =>
            item.children?.length ? (
              <NavGroup key={item.label} label={item.label} items={item.children} />
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="font-body text-sm font-medium text-ink transition-colors hover:text-rose-ink"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/assistant"
            aria-label="Ask the Skinwise assistant"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-blush"
          >
            <Sparkles aria-hidden="true" className="size-5" />
          </Link>
          <a
            href={waHref(SITE.whatsapp.e164)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-blush"
          >
            <MessageCircle aria-hidden="true" className="size-5" />
          </a>
          <Button size="sm" asChild className="hidden lg:inline-flex">
            <Link href="/skin-check">Start Skin Check</Link>
          </Button>
        </div>
      </div>

      {drawerOpen && (
        <div id={drawerId}>
          <Drawer onClose={() => setDrawerOpen(false)} triggerRef={menuButtonRef} />
        </div>
      )}
    </header>
  );
}

/**
 * A desktop header dropdown.
 *
 * Opens on hover for mouse users and on focus for keyboard users, via
 * `focus-within` — so tabbing into the group reveals its links without any
 * key handling of our own, and there is no state to get out of sync. The
 * trigger is a real <button> with aria-haspopup rather than a styled span, so
 * assistive tech announces it as a menu rather than as text that happens to
 * sit above some links.
 *
 * The bridging padding matters: without it the pointer crosses a dead gap
 * between the trigger and the panel, the hover drops, and the menu closes
 * under the cursor.
 */
function NavGroup({ label, items }: { label: string; items: { label: string; href: string }[] }) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="true"
        className="flex items-center gap-1 font-body text-sm font-medium text-ink transition-colors hover:text-rose-ink focus-visible:outline-none focus-visible:text-rose-ink"
      >
        {label}
        <ChevronDown aria-hidden="true" className="size-4" />
      </button>

      <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility] group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <ul className="min-w-[15rem] rounded-2xl border border-ink/10 bg-surface p-2 shadow-lift">
          {items.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                className="block rounded-xl px-3 py-2.5 font-body text-sm text-ink transition-colors hover:bg-blush hover:text-rose-ink focus-visible:outline-none focus-visible:bg-blush focus-visible:text-rose-ink"
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
