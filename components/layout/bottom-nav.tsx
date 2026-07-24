"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV } from "@/components/layout/nav-items";

/**
 * Mobile bottom navigation — the app-shell affordance that makes the site
 * feel like an installed app rather than a page.
 *
 * Mobile only (`lg:hidden`): on desktop the header carries navigation, and
 * a bottom bar on a large screen reads as a phone layout that was stretched
 * rather than designed.
 *
 * This bar replaced a separate sticky call/WhatsApp CTA bar. Both could not
 * coexist — two fixed bottom bars consume ~120px of a 667px viewport, which
 * is a fifth of the screen permanently spent on chrome. WhatsApp moved to
 * the header instead, where it is still one tap away.
 *
 * Content clearance is handled by `--spacing-bottom-nav` (app/globals.css),
 * which AppShell applies as bottom padding to <main>, so no page needs to
 * know this bar exists.
 */
/**
 * The single tab that owns the current route.
 *
 * A plain `startsWith` breaks as soon as one tab's path is a prefix of
 * another's: `/skin-check/analyzer` starts with `/skin-check`, so both the
 * Scan tab and the Skin Check tab would light up at once and the bar would
 * lie about where you are. Longest match wins, and a prefix only counts when
 * it ends at a path boundary — otherwise `/skin-check-old` would match
 * `/skin-check`.
 */
function activeHref(pathname: string): string | null {
  let best: string | null = null;
  for (const { href } of BOTTOM_NAV) {
    const matches = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}

export function BottomNav() {
  const pathname = usePathname();
  const current = activeHref(pathname);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 lg:hidden",
        "border-t border-ink/10 bg-surface/90 backdrop-blur-xl",
        // Extends the bar's background into the iOS home-indicator area
        // while keeping the touch targets themselves above it.
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {BOTTOM_NAV.map((item) => {
          const isActive = current === item.href;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <li key={item.href} className="flex flex-1 justify-center">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className="group flex w-full flex-col items-center justify-center gap-1"
                >
                  {/*
                    Pulled upward out of the bar so it reads as raised. The
                    -mt keeps the 44px+ touch target intact — the element
                    moves, it does not shrink.
                  */}
                  <span
                    className={cn(
                      "-mt-6 flex size-14 items-center justify-center rounded-full",
                      "bg-rose-ink text-white shadow-lift ring-4 ring-surface",
                      "transition-transform duration-200 group-active:scale-95",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <span
                    className={cn(
                      "font-body text-[11px] font-semibold leading-none",
                      isActive ? "text-rose-ink" : "text-ink-soft",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-1 rounded-2xl transition-colors",
                  isActive ? "text-rose-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span className="font-body text-[11px] font-semibold leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
