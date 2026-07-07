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
};

export const books: Book[] = [
  {
    slug: "mastery-is-dead",
    title: "Mastery is Dead",
    subtitle: "The Quiet Collapse of Expertise",
    kind: "Nonfiction",
    year: "2026",
    status: "Forthcoming",
    blurb:
      "On what happens to skill, craft, and expertise when the tools get good enough to fake the output — and what's actually worth mastering now.",
    cover: null,
    awaitingAsset: true,
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
