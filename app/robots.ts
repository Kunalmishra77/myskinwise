import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Keep the internal workspace and the API out of search indexes. /admin
    // is already auth-gated, but there is no reason for it to be crawled or
    // to surface in results.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
