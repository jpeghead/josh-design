import type { MetadataRoute } from "next";
import { projects } from "@/lib/data";
import { portedEssays } from "@/content/writing";

const base = "https://josh.design";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["/", "/work", "/resume", "/lab", "/lab/local", "/lab/particles", "/lab/agents", "/lab/ask", "/lab/site", "/process", "/products", "/products/olo/app", "/writing", "/about", "/contact"].map(
    (route) => ({
      url: `${base}${route}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: route === "/" ? 1 : 0.8,
    })
  );

  const workRoutes = projects
    .filter((p) => p.tier === "case-study")
    .map((p) => ({
      url: `${base}/work/${p.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    }));

  const writingRoutes = portedEssays.map((e) => ({
    url: `${base}/writing/${e.slug}`,
    lastModified: e.date ? new Date(e.date) : now,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...workRoutes, ...writingRoutes];
}
