import type { Metadata } from "next";
import { SITE } from "@/config/site";
import { IMAGES } from "@/content/assets";

type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: { src: string; alt: string; width: number; height: number };
};

const defaultImage = IMAGES.logo;

/**
 * Builds page-level `Metadata` (title, description, canonical, OpenGraph,
 * Twitter) so every route shares the same shape and always points back to
 * the canonical `SITE.url`. Canonical/OG url is `SITE.url + path`, except
 * for the home path ("/"), which normalizes to `SITE.url` with no trailing
 * slash — matching the root entry emitted by `app/sitemap.ts` so the two
 * never disagree. Callers must pass a path that already starts with "/".
 */
export function buildMetadata({ title, description, path, image }: BuildMetadataInput): Metadata {
  const url = path === "/" ? SITE.url : `${SITE.url}${path}`;
  const ogImage = image ?? defaultImage;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: ogImage.src, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }],
      siteName: SITE.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
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
