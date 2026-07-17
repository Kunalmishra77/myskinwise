"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/**
 * Visual-only newsletter signup. Submission is intentionally a no-op —
 * there is no backend endpoint to send the email to yet.
 */
export function SubscribeForm() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // TODO(subproject-B): wire subscribe
      }}
      className="flex w-full max-w-sm gap-2"
    >
      <label htmlFor="footer-subscribe-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-subscribe-email"
        type="email"
        name="email"
        placeholder="Enter your email"
        className="min-w-0 flex-1 rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/60 focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <Button type="submit" variant="secondary">
        Subscribe
      </Button>
    </form>
  );
}
