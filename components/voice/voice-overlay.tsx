"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Mic } from "lucide-react";
import { VoiceConversation } from "@/components/voice/voice-conversation";

/**
 * The floating voice assistant, available on every page of the site.
 *
 * A launcher button sits above the bottom navigation; tapping it opens the
 * voice conversation as an overlay, and closing returns to browsing. On the
 * first visit of a session the overlay opens itself once — the brief asked for
 * it to greet on arrival — but it never auto-plays audio (that needs a tap,
 * which is also what unlocks mobile audio), and it remembers dismissal for the
 * session so it is never nagging.
 *
 * Rendered through a portal to <body>, like the nav drawer, so no ancestor's
 * backdrop-filter can clip a fixed overlay.
 *
 * Not shown on /voice (which is the full-page version of the same thing) or on
 * the immersive Skin Check / Analyzer flows, which live outside this shell.
 */
const SESSION_KEY = "sw_voice_opened";

export function VoiceOverlay() {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // Client-only portal target: render nothing until mounted so the server and
  // first client render agree (the portal lands on <body>, outside the tree).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  // Auto-open once per session, shortly after load — but NOT on the dedicated
  // /voice page, and NOT on the homepage, whose AI-first hero ("How can I help
  // you?" → Talk / Chat) is itself the front door and must be what a first-time
  // visitor sees. Opening the overlay on top of it would bury that choice.
  React.useEffect(() => {
    if (pathname === "/voice" || pathname === "/") return;
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 900);
    return () => clearTimeout(t);
  }, [pathname]);

  // Lock body scroll while the overlay is open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || pathname === "/voice") return null;

  const launcher = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open the Skinwise voice assistant"
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] inline-flex size-14 items-center justify-center rounded-full bg-rose-ink text-white shadow-lift transition-transform active:scale-95 lg:right-6 lg:bottom-6"
    >
      <Mic aria-hidden="true" className="size-6" />
    </button>
  );

  const overlay = open ? (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Skinwise voice assistant">
      {/* Backdrop — tap to close and browse the site. Not a focusable
          control (that would duplicate the labelled X and add a stray tab
          stop); keyboard users close with Escape or the X. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      {/* Panel: a bottom sheet on phones, a docked card on desktop. */}
      <div className="absolute inset-x-0 bottom-0 top-16 overflow-hidden rounded-t-3xl bg-warm shadow-lift sm:inset-x-auto sm:right-6 sm:bottom-6 sm:top-auto sm:h-[640px] sm:w-[400px] sm:rounded-3xl">
        <VoiceConversation onClose={() => setOpen(false)} />
      </div>
    </div>
  ) : null;

  return createPortal(
    <>
      {!open && launcher}
      {overlay}
    </>,
    document.body,
  );
}
