import type { MetadataRoute } from "next";
import { siteRoutes } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://luxegift.example.com";

  return siteRoutes().map((route) => ({
    url: `${baseUrl}/${route}`,
    lastModified: new Date(),
    changeFrequency: route.includes("products") ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
