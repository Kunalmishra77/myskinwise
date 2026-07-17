/**
 * Renders a <script type="application/ld+json"> tag for structured data
 * (e.g. schema.org Organization). `dangerouslySetInnerHTML` is safe here:
 * `data` is always a JS object we construct ourselves (never raw user
 * input), and `JSON.stringify` output inside a JSON-LD script tag isn't
 * interpreted as HTML/JS, so there's no injection surface. This is the
 * one sanctioned use of dangerouslySetInnerHTML in this codebase.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
