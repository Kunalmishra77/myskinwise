import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";
import { INGREDIENT_SLUGS } from "@/content/ingredients";
import { SKIN_TYPE_SLUGS } from "@/content/skin-types";

/**
 * Every route is derived from the data that defines it rather than
 * hand-listed — adding an ingredient to `content/ingredients` or a concern
 * to `SITE.concerns` puts it in the sitemap with no edit here. A
 * hand-maintained sitemap is a sitemap that silently goes stale.
 */
const routes = [
  "",
  "about-us",
  "contact-us",
  "skin-check",
  "learn",
  "assistant",
  "voice",
  "concerns",
  "ingredients",
  "skin-types",
  "privacy-policy",
  "terms-and-conditions",
  "refund-and-cancellation",
  ...SITE.concerns.map((c) => c.slug),
  ...INGREDIENT_SLUGS.map((slug) => `ingredients/${slug}`),
  ...SKIN_TYPE_SLUGS.map((slug) => `skin-types/${slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${SITE.url}/${route}`.replace(/\/$/, "") || SITE.url,
    lastModified: new Date(),
  }));
}
