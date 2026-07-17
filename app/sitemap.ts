import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

const routes = [
  "",
  "about-us",
  "contact-us",
  "privacy-policy",
  "terms-and-conditions",
  "refund-and-cancellation",
  ...SITE.concerns.map((c) => c.slug),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${SITE.url}/${route}`.replace(/\/$/, "") || SITE.url,
    lastModified: new Date(),
  }));
}
