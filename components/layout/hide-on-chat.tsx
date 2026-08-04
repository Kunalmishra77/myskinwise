"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Hides shell chrome that does not belong on the full-height chat surface.
 *
 * `/assistant` is a contained conversation that fills the space between the
 * header and the bottom nav and scrolls only its own messages — a marketing
 * footer below it would add page scroll and push the composer around. The
 * bottom nav stays (it carries the "Ask" tab), only the footer is dropped.
 */
const HIDE_ON = new Set(["/assistant"]);

export function HideOnChat({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (HIDE_ON.has(pathname)) return null;
  return <>{children}</>;
}
