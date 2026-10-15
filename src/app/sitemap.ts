import type { MetadataRoute } from "next";
import { projects } from "@/lib/data";
import { portedEssays } from "@/content/writing";
import { products } from "@/content/products";

const base = "https://josh.design";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["/", "/work", "/resume", "/lab", "/lab/local", "/lab/particles", "/lab/agents", "/lab/ask", "/lab/site", "/lab/city", "/lab/studio", "/lab/line", "/lab/room", "/process", "/log", "/products", "/lab/portrait", "/writing", "/about", "/contact"].map(
    (route) => ({
      url: `${base}${route}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: route === "/" ? 1 : 0.8,
    })
  );

  const workRoutes = projects
    .filter((p) => !p.internalLink)
    .map((p) => ({
      url: `${base}/work/${p.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: p.tier === "case-study" ? 0.7 : 0.5,
    }));

  const productRoutes = products.map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const writingRoutes = portedEssays.map((e) => ({
    url: `${base}/writing/${e.slug}`,
    lastModified: e.date ? new Date(e.date) : now,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...workRoutes, ...productRoutes, ...writingRoutes];
}
