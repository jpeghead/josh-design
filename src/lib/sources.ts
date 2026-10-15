import { lab } from "@/content/lab";
import { products } from "@/content/products";
import { projects } from "@/lib/data";
import { orderSources, type Source } from "./citation";

export { resolveCitation, type Source } from "./citation";

/** Everything the grounded models can cite, as the names they tend to use → where it lives on the site. */
export function sources(): Source[] {
  const out: Source[] = [
    { label: "about", href: "/about" },
    { label: "résumé", href: "/resume" },
    { label: "resume", href: "/resume" },
    { label: "process", href: "/process" },
    { label: "products", href: "/products" },
    { label: "writing", href: "/writing" },
    { label: "builds", href: "/lab" },
    { label: "lab", href: "/lab" },
    { label: "build log", href: "/log" },
  ];
  for (const p of projects) out.push({ label: p.title.toLowerCase(), href: p.internalLink ?? `/work/${p.slug}` });
  for (const p of products) out.push({ label: p.name.toLowerCase(), href: `/products/${p.slug}` });
  for (const l of lab) out.push({ label: l.title.toLowerCase(), href: l.href });
  return orderSources(out);
}
