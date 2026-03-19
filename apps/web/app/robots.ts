import type { MetadataRoute } from "next";
import { webEnv } from "../lib/env";

export default function robots(): MetadataRoute.Robots {
  if (!webEnv.allowIndexing) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: new URL("/sitemap.xml", webEnv.siteUrl).toString()
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api-keys", "/funding", "/analytics", "/projects", "/operators", "/settings"]
      }
    ],
    sitemap: new URL("/sitemap.xml", webEnv.siteUrl).toString()
  };
}
