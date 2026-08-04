import * as React from "react";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/features/footer";
import { VoiceOverlay } from "@/components/voice/voice-overlay";
import { FloatingActions } from "@/components/layout/floating-actions";
import { HideOnChat } from "@/components/layout/hide-on-chat";

/**
 * The application shell: sticky header, page content, footer, and the
 * mobile bottom navigation.
 *
 * Applied via the `(app)` route group's layout, which is what keeps it off
 * the full-screen flows. `/skin-check` deliberately sits outside that group
 * so the assessment renders with no competing chrome — a funnel that shares
 * the screen with navigation gives users four ways to leave on every step.
 * That exclusion is a routing boundary rather than a conditional in this
 * component, so it cannot be defeated by a prop passed from the wrong place.
 *
 * <main> reserves space for the bottom bar with `pb-bottom-nav` (plus the
 * iOS safe-area inset) below `lg`, so no page has to know the bar exists.
 * `scroll-mt` on in-page anchor targets is handled per-section.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main
        id="main"
        className="flex-1 pb-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom))] lg:pb-0"
      >
        {children}
      </main>
      <HideOnChat>
        <Footer />
      </HideOnChat>
      <BottomNav />
      {/* Floating voice assistant, available on every shell page. Portals to
          <body>; not shown on /voice or the full-screen flows. */}
      <VoiceOverlay />
      {/* WhatsApp (bottom-left) + back-to-top (bottom-right, above the mic).
          Organised so nothing collides with the voice launcher or bottom nav. */}
      <FloatingActions />
    </>
  );
}
