import { Home, Camera, MessageCircle, ScanFace, User, type LucideIcon } from "lucide-react";
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
 * Five tabs.
 *
 * This was four, on the reasoning that a fifth costs ~15% of each touch
 * target's width at 320px and there was no fifth destination worth that. The
 * arithmetic still holds — five tabs at 320px is 64px each, comfortably past
 * the 44px minimum — but the premise did not: an audit of the deployed site
 * found the Skin Analyzer had zero inbound links from any page and the voice
 * agent had one, so two of the four primary features were undiscoverable on a
 * phone. A fifth destination is now clearly worth it.
 *
 * What went and what stayed. "Concerns" left the bar: it is content browsing
 * rather than a product action, and the home page already links every concern
 * several times. "Scan" and "Ask" replace it, which puts all four primary
 * features — Skin Check, Analyzer, assistant and (via the assistant) voice —
 * one thumb-tap away.
 *
 * "Skin Check" stays in the middle and raised. Centre is the easiest place to
 * reach one-handed, and it is still the only route that reaches an expert.
 */
export const BOTTOM_NAV: BottomNavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Scan", href: "/skin-check/analyzer", icon: Camera },
  { label: "Skin Check", href: "/skin-check", icon: ScanFace, primary: true },
  { label: "Ask", href: "/assistant", icon: MessageCircle },
  { label: "Me", href: "/me", icon: User },
];

/** Desktop header links. Mirrors SITE.nav, which drives the drawer too. */
export const HEADER_LINKS = SITE.nav;
