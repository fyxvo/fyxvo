import type { MetadataRoute } from "next";
import { webEnv } from "../lib/env";

export default function robots(): MetadataRoute.Robots {
  const rules = webEnv.allowIndexing
    ? {
        userAgent: "*",
        allow: "/"
      }
    : {
        userAgent: "*",
        disallow: "/"
      };

  return {
    rules,
    sitemap: new URL("/sitemap.xml", webEnv.siteUrl).toString()
  };
}
