/**
 * Shared shape for the three legal pages (Privacy Policy, Terms and
 * Conditions, Refund and Cancellation — WEBSITE_CONTENT.md §15, §16, §17).
 *
 * `body` may contain multiple paragraphs separated by a blank line
 * ("\n\n"); `<LegalPage>` (components/features/legal-page.tsx) splits on
 * that boundary when rendering.
 */
export type LegalSection = {
  heading?: string;
  body: string;
};

export type LegalContent = {
  title: string;
  /**
   * Optional top-of-page notice banner, e.g. flagging that a page has
   * placeholder clauses (Terms) or is not yet published (Refund).
   */
  notice?: string;
  sections: LegalSection[];
};
