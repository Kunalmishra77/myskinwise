import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE } from "@/config/site";
import { JsonLd } from "@/components/features/json-ld";

export type BreadcrumbItem = { label: string; href: string };

/**
 * Accessible breadcrumb trail: every item but the last links to its page;
 * the last item is the current page, rendered as plain text with
 * `aria-current="page"` rather than a (self-referential) link. Chevron
 * separators are `aria-hidden` so assistive tech only announces the item
 * labels, not the decoration between them.
 *
 * Also emits a `BreadcrumbList` JSON-LD block (schema.org) built from the
 * same `items`, with absolute URLs via `SITE.url`, so search engines can
 * render the breadcrumb trail in results.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${SITE.url}${item.href}`,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="text-ink">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="transition hover:text-accent-ink">
                  {item.label}
                </Link>
              )}
              {!isLast && <ChevronRight aria-hidden="true" className="size-4" />}
            </li>
          );
        })}
      </ol>
      <JsonLd data={jsonLd} />
    </nav>
  );
}
