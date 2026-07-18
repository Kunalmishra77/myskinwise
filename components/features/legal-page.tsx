import { Section } from "@/components/ui/section";
import { Breadcrumb } from "@/components/features/breadcrumb";
import type { LegalSection } from "@/content/legal";

export interface LegalPageProps {
  title: string;
  /** Route path of this page, e.g. "/privacy-policy" — used for the
   * breadcrumb's current-page entry (and its BreadcrumbList JSON-LD). */
  path: string;
  sections: LegalSection[];
  /** Optional accent-tinted banner rendered above the sections, e.g. to
   * flag pending-legal-input clauses (Terms) or an unpublished page
   * (Refund). */
  notice?: string;
}

/**
 * Shared template for the three legal pages (Privacy Policy, Terms and
 * Conditions, Refund and Cancellation — WEBSITE_CONTENT.md §15, §16, §17).
 * Server component: every section is composed straight from `content/legal`,
 * no client-side data fetching needed.
 *
 * A `body` may contain multiple paragraphs separated by a blank line
 * ("\n\n"); each is rendered as its own `<p>`.
 */
export function LegalPage({ title, path, sections, notice }: LegalPageProps) {
  return (
    <Section className="pb-0">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: title, href: path }]} />
      <h1 className="mt-6 font-serif text-4xl font-semibold text-ink md:text-5xl">{title}</h1>

      {notice && (
        <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-ink">
          {notice}
        </div>
      )}

      <div className="mt-10 flex flex-col gap-10 pb-16 md:pb-24">
        {sections.map((section, index) => (
          <div key={section.heading ?? index}>
            {section.heading && (
              <h2 className="text-xl font-semibold text-ink md:text-2xl">{section.heading}</h2>
            )}
            <div className={section.heading ? "mt-3 flex flex-col gap-4" : "flex flex-col gap-4"}>
              {section.body.split("\n\n").map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className="text-base text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
