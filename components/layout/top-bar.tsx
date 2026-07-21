"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, MessageCircle } from "lucide-react";
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
          className="-ml-2 rounded-full p-2 text-ink transition hover:bg-blush lg:hidden"
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

        <nav aria-label="Sections" className="hidden items-center gap-8 lg:flex">
          {SITE.nav
            .filter((item) => item.href !== "#")
            .map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-body text-sm font-medium text-ink transition-colors hover:text-rose-ink"
              >
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={waHref(SITE.whatsapp.e164)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="inline-flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-blush"
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
