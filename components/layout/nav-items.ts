import { Home, Sparkles, ScanFace, User, type LucideIcon } from "lucide-react";
import { SITE } from "@/config/site";

export type BottomNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Renders raised and filled, breaking the row's rhythm. Exactly one item
   * should set this: the primary conversion action.
   */
  primary?: boolean;
};

/**
 * Four tabs, not five. A fifth costs ~15% of each touch target's width at
 * 320px, and there is no fifth destination worth that.
 *
 * "Skin Check" sits in the middle and is raised because it is the single
 * action the whole product funnels toward — centre is the easiest place to
 * reach one-handed, and the raised treatment stops it reading as merely one
 * option among four.
 */
export const BOTTOM_NAV: BottomNavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Concerns", href: `/${SITE.concerns[0]?.slug ?? ""}`, icon: Sparkles },
  { label: "Skin Check", href: "/skin-check", icon: ScanFace, primary: true },
  { label: "Me", href: "/me", icon: User },
];

/** Desktop header links. Mirrors SITE.nav, which drives the drawer too. */
export const HEADER_LINKS = SITE.nav;
