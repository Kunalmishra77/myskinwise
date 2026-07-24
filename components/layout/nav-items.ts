import { Home, Camera, MessageCircle, Mic, User, type LucideIcon } from "lucide-react";
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
 * Five tabs, with the Skin Scanner centred and raised as the primary action.
 *
 * The centre slot used to be the Skin Check. That was the single biggest
 * source of product confusion: the Scanner and the Skin Check are different
 * experiences — one reads a photo, the other asks questions — and the most
 * prominent button on a phone led to the questionnaire. Someone hunting for
 * "the AI scanner" pressed the big centre button and got a form, which reads
 * as the scanner being a questionnaire.
 *
 * Centre is now Scan, because it is the product's most distinctive action and
 * the easiest target to reach one-handed. Voice sits immediately left of it as
 * the second-most prominent action. The Skin Check is not demoted out of the
 * product — it is one tap from the Scanner screen, the home page and the menu
 * — it simply no longer impersonates the Scanner.
 *
 * Five tabs at 320px is 64px each, comfortably past the 44px minimum.
 */
export const BOTTOM_NAV: BottomNavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Voice", href: "/voice", icon: Mic },
  { label: "Scan", href: "/skin-check/analyzer", icon: Camera, primary: true },
  { label: "Ask", href: "/assistant", icon: MessageCircle },
  { label: "Me", href: "/me", icon: User },
];

/** Desktop header links. Mirrors SITE.nav, which drives the drawer too. */
export const HEADER_LINKS = SITE.nav;
