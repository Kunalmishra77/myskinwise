import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Applies the app shell (header, footer, mobile bottom navigation) to every
 * route in the `(app)` group. Route groups do not add a URL segment, so
 * `/`, `/acne`, `/me` and the rest keep their existing paths.
 *
 * Full-screen flows — currently `/skin-check` — live outside this group
 * precisely so they do not inherit the shell.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
