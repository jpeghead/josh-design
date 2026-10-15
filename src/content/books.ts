/**
 * The books, presented on-site. No retailer links — the work lives here.
 */

export type Book = {
  slug: string;
  title: string;
  subtitle?: string;
  kind: "Nonfiction" | "Novel";
  year: string;
  status: "Out now" | "Forthcoming" | "In progress";
  blurb: string;
  cover: string | null;
  awaitingAsset?: boolean;
  link?: { label: string; href: string };
  site?: string;
};

export const books: Book[] = [
  {
    slug: "mastery-is-dead",
    title: "Mastery is Dead",
    subtitle: "The Quiet Collapse of Expertise",
    kind: "Nonfiction",
    year: "2026",
    status: "Out now",
    blurb:
      "A field manual for the collapse of expertise: how AI is restructuring twenty-five white-collar careers, what survives, what doesn't, and what to do if you work in one. 618 pages, paperback.",
    cover: "/img/products/mastery-is-dead.png",
    link: { label: "Paperback on Amazon", href: "https://www.amazon.com/dp/B0H3ZC9FDN" },
    site: "https://masteryisdead.com",
  },
  {
    slug: "the-harmony-protocol",
    title: "The Harmony Protocol",
    kind: "Novel",
    year: "",
    status: "In progress",
    blurb: "A science-fiction novel.",
    cover: null,
    awaitingAsset: true,
  },
];
