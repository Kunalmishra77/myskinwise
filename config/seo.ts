import type { Metadata } from "next";
import { SITE } from "@/config/site";
import { IMAGES } from "@/content/assets";

type BuildMetadataInput = {
  /**
   * Bare page-segment title, e.g. "About Us" — NOT "About Us | Skinwise".
   * The root layout's `title.template` ("%s | Skinwise") appends the site
   * suffix exactly once when this renders; adding the suffix here as well
   * would double it (Next applies the template on top of whatever string
   * is returned). Ignored for the literal `<title>` string when
   * `titleAbsolute` is true — see below.
   */
  title: string;
  description: string;
  path: string;
  image?: { src: string; alt: string; width: number; height: number };
  /**
   * When true, bypasses the root layout's title template (via Next's
   * `title: { absolute }`) so `title` renders in `<title>` verbatim, with
   * no "| Skinwise" suffix appended. Use only for titles that are already
   * brand-first (e.g. Home: "Skinwise — Personalized Skincare, Backed by
   * Science"), where applying the template would double the brand name.
   * Every other page should omit this and pass a bare segment title.
   */
  titleAbsolute?: boolean;
};

const defaultImage = IMAGES.logo;

/**
 * Builds page-level `Metadata` (title, description, canonical, OpenGraph,
 * Twitter) so every route shares the same shape and always points back to
 * the canonical `SITE.url`. Canonical/OG url is `SITE.url + path`, except
 * for the home path ("/"), which normalizes to `SITE.url` with no trailing
 * slash — matching the root entry emitted by `app/sitemap.ts` so the two
 * never disagree. Callers must pass a path that already starts with "/".
 *
 * `title` must be a bare page-segment string (no "| Skinwise" suffix) so
 * the root layout's `title.template` can append the suffix exactly once;
 * pass `titleAbsolute: true` for the rare brand-first title that should
 * bypass the template entirely. OpenGraph/Twitter titles are derived here
 * to always match what actually renders in `<title>` for either case.
 */
export function buildMetadata({ title, description, path, image, titleAbsolute }: BuildMetadataInput): Metadata {
  const url = path === "/" ? SITE.url : `${SITE.url}${path}`;
  const ogImage = image ?? defaultImage;
  // Mirrors what Next actually renders in <title>: the root layout's
  // `template: "%s | Skinwise"` applies to plain-string titles, so the
  // rendered title is `${title} | ${SITE.name}` unless `titleAbsolute`
  // bypasses the template and renders `title` verbatim.
  const renderedTitle = titleAbsolute ? title : `${title} | ${SITE.name}`;

  return {
    title: titleAbsolute ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: renderedTitle,
      description,
      url,
      type: "website",
      images: [{ url: ogImage.src, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }],
      siteName: SITE.name,
    },
    twitter: {
      card: "summary_large_image",
      title: renderedTitle,
      description,
      images: [ogImage.src],
    },
  };
}

/**
 * Organization structured data (schema.org) for the site — rendered once
 * in the root layout via <JsonLd data={organizationSchema} />.
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  legalName: SITE.legalEntity,
  url: SITE.url,
  logo: `${SITE.url}${IMAGES.logo.src}`,
  contactPoint: Object.values(SITE.phones).map((phone) => ({
    "@type": "ContactPoint",
    telephone: phone.e164,
    contactType: phone.label,
  })),
};
