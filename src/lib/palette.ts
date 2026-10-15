import { lab } from "@/content/lab";
import { products } from "@/content/products";
import { projects } from "@/lib/data";
import { portedEssays } from "@/content/writing";

export type PaletteItem = { group: string; title: string; hint?: string; href: string; external?: boolean; keywords?: string };

/** Everything the palette can jump to. Built on the server so no essay HTML reaches the client. */
export function paletteItems(): PaletteItem[] {
  const pages: PaletteItem[] = [
    { group: "Pages", title: "Home", href: "/" },
    { group: "Pages", title: "Builds", hint: "things you can run", href: "/lab" },
    { group: "Pages", title: "Process", hint: "how the work gets made", href: "/process" },
    { group: "Pages", title: "Work", hint: "case studies", href: "/work" },
    { group: "Pages", title: "Products", hint: "Boneyard", href: "/products" },
    { group: "Pages", title: "Writing", href: "/writing" },
    { group: "Pages", title: "About", hint: "the story", href: "/about" },
    { group: "Pages", title: "Build log", hint: "every commit", href: "/log" },
    { group: "Pages", title: "Résumé", href: "/resume" },
    { group: "Pages", title: "Contact", href: "/contact" },
  ];
  const builds = lab.map((l) => ({ group: "Builds", title: l.title, hint: l.kind, href: l.href, keywords: l.built }));
  const prods = products.map((p) => ({ group: "Products", title: p.name, hint: p.tagline, href: `/products/${p.slug}` }));
  const work = projects.map((p) => ({ group: "Work", title: p.title, hint: `${p.role} · ${p.timeline}`, href: p.internalLink ?? `/work/${p.slug}` }));
  const essays = portedEssays.map((e) => ({ group: "Writing", title: e.title, hint: e.description, href: `/writing/${e.slug}` }));
  const links: PaletteItem[] = [
    { group: "Elsewhere", title: "GitHub", hint: "jpeghead/josh-design", href: "https://github.com/jpeghead/josh-design", external: true },
    { group: "Elsewhere", title: "Email", hint: "josh@josh.design", href: "mailto:josh@josh.design", external: true },
    { group: "Elsewhere", title: "RSS", href: "/feed.xml", external: true },
  ];
  return [...pages, ...builds, ...prods, ...work, ...essays, ...links];
}
