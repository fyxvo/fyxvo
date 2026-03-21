import type { MetadataRoute } from "next";
import { webEnv } from "../lib/env";

export default function robots(): MetadataRoute.Robots {
  // Only block all crawling for explicitly-configured staging/preview environments.
  // Default (env var absent) should crawl normally — blocking was the bug causing no Google snippets.
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING === "false") {
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
        disallow: [
          "/dashboard",
          "/settings",
          "/api-keys",
          "/funding",
          "/analytics",
          "/projects",
          "/transactions",
          "/widget",
          "/admin"
        ]
      }
    ],
    sitemap: new URL("/sitemap.xml", webEnv.siteUrl).toString()
  };
}
