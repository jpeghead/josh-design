import type { MetadataRoute } from "next";
import { projects, journal } from "@/lib/data";

const base = "https://josh.design";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["/", "/work", "/about", "/journal", "/contact"].map(
    (route) => ({
      url: `${base}${route}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: route === "/" ? 1 : 0.8,
    })
  );

  const workRoutes = projects.map((p) => ({
    url: `${base}/work/${p.slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  const journalRoutes = journal.map((j) => ({
    url: `${base}/journal/${j.slug}`,
    lastModified: new Date(j.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...workRoutes, ...journalRoutes];
}
