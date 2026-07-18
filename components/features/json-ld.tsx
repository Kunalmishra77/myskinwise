/**
 * Renders a <script type="application/ld+json"> tag for structured data
 * (e.g. schema.org Organization, and — from Task 13 — FAQPage built from
 * FAQ answer strings). `dangerouslySetInnerHTML` is safe here: `data` is
 * always a JS object we construct ourselves (never raw user input), and
 * `JSON.stringify` output inside a JSON-LD script tag isn't interpreted
 * as HTML/JS, so there's no injection surface. This is the one sanctioned
 * use of dangerouslySetInnerHTML in this codebase.
 *
 * As defense-in-depth (this component gets reused with content-derived
 * strings), every `<` character is escaped to its Unicode escape sequence
 * (backslash, u, 0, 0, 3, c) so a value containing `</script>` can never
 * break out of the script tag early.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
