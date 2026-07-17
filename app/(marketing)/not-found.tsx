import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found | Skinwise",
};

/**
 * Branded 404 shown for any unmatched route under the `(marketing)` group.
 * Server component — no client interactivity is needed here.
 */
export default function NotFound() {
  return (
    <Section className="text-center">
      <h1 className="font-serif text-4xl font-semibold text-ink">Page not found</h1>
      <p className="mt-4 text-ink/70">
        Sorry, we couldn&apos;t find the page you were looking for. It may have
        been moved or no longer exists.
      </p>
      <div className="mt-8 flex justify-center">
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </Section>
  );
}
