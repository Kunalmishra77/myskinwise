import { redirect } from "next/navigation";

/**
 * The new engine now powers the canonical scan at /skin-check/analyzer (all the
 * "Scan" links point there), so this temporary URL just redirects to it — one
 * scanner, one address.
 */
export default function ScanPage() {
  redirect("/skin-check/analyzer");
}
