import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/me", "/login", "/register", "/api/"],
    },
    sitemap: "https://www.emulatornds.online/sitemap.xml",
  };
}
