import type { ReactNode } from "react";
import { Navbar } from "@/components/features/navbar";
import { Footer } from "@/components/features/footer";
import { StickyCTA } from "@/components/features/sticky-cta";

/**
 * Shared chrome for every marketing route: header nav, the routed page
 * content, the mobile sticky CTA bar, and the footer. Living under the
 * `(marketing)` route group means it applies to all marketing pages
 * without adding a URL segment (`/` stays `/`).
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main">{children}</main>
      <StickyCTA />
      <Footer />
    </>
  );
}
