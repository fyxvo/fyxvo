import type { MetadataRoute } from "next";
import { webEnv } from "../lib/env";

const appRoutes = [
  "",
  "/dashboard",
  "/docs",
  "/api-keys",
  "/funding",
  "/analytics",
  "/operator",
  "/status"
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return appRoutes.map((route) => ({
    url: new URL(route || "/", webEnv.siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "daily",
    priority: route === "" ? 1 : route === "/status" ? 0.7 : 0.8
  }));
}
