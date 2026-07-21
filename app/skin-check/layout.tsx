import type { ReactNode } from "react";

/**
 * Full-screen layout for the Skin Check flow — deliberately no header, no
 * footer, no bottom navigation.
 *
 * This route sits outside the `(app)` route group for exactly this reason.
 * An assessment that shares the screen with site navigation hands the user
 * four ways to abandon it on every single step, and progress through the
 * funnel is the only thing this screen is for. The flow supplies its own
 * progress header and back control instead.
 */
export default function SkinCheckLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-dvh flex-col bg-warm">{children}</div>;
}
