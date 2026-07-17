"use client";

import { useEffect } from "react";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

/**
 * Branded error boundary for the `(marketing)` route group. Must be a
 * client component (Next.js requirement for `error.tsx`) since it needs
 * the `reset` callback to attempt re-rendering the segment.
 */
export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the console (and, eventually, an error-reporting service) so
    // the underlying error isn't silently swallowed by the boundary.
    console.error(error);
  }, [error]);

  return (
    <Section className="text-center">
      <h1 className="font-serif text-4xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-4 text-ink/70">
        We hit an unexpected error loading this page. Please try again.
      </p>
      <div className="mt-8 flex justify-center">
        <Button onClick={reset}>Try again</Button>
      </div>
    </Section>
  );
}
