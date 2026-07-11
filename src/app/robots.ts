import type { MetadataRoute } from "next";

const SITE = "https://nexonet.ar";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // No indexar el panel admin ni los endpoints de API.
      disallow: ["/admin", "/api"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
