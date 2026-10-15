/**
 * Things I'm building at Boneyard. My framing, my words. Imagery is used only
 * where a real asset exists in the archive; everything else is a labeled
 * placeholder awaiting a scan/screenshot, so swapping it in is a data change.
 */

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  status: "Live" | "Live beta" | "Site live" | "In development" | "Released";
  blurb: string;
  detail: string[];
  image: string | null;
  awaitingAsset?: boolean;
  aspect: string;
  /** Where the product lives, if it's out in the world. */
  link?: { label: string; href: string };
  /** Images shown on the product page, in order. */
  gallery?: string[];
};

export const products: Product[] = [
  {
    slug: "olo",
    name: "OLO",
    tagline: "A companion for the work between windows.",
    status: "Site live",
    blurb:
      "OLO is a character that lives on your Mac: ask it, teach it Memory, review Activity, and see which abilities and recording states are actually available.",
    detail: [
      "A desktop companion, not a chat window: it sits with you across the work and remembers what you teach it.",
      "Privacy by design: you can see what it can do and what it is recording at any moment.",
    ],
    image: "/img/products/olo.jpg",
    aspect: "1200/630",
    link: { label: "olomode.com", href: "https://olomode.com" },
  },
  {
    slug: "weaver",
    name: "Weaver",
    tagline: "Your channel remembers, and it writes.",
    status: "Site live",
    blurb:
      "Weaver keeps everything your channel has established — subjects, takes, running bits, cast — and writes every new script from all of it.",
    detail: ["Opening the writers' room: a memory of the channel first, then the writing.", "Built for creators who publish on a schedule and can't start from a blank page every time."],
    image: "/img/products/weaver.png",
    aspect: "1200/630",
    link: { label: "useweaver.app", href: "https://useweaver.app" },
  },
  {
    slug: "storymode",
    name: "StoryMode",
    tagline: "Never played it. Still want the story?",
    status: "Site live",
    blurb: "The stories of games you never finished. Listen to full game stories — narrated, not played.",
    detail: ["Video game narratives as audiobooks: the plot without the controller.", "Browse by game, pick today's story, and listen in about fifteen minutes."],
    image: "/img/products/storymode.jpg",
    aspect: "1200/630",
    link: { label: "playstorymode.app", href: "https://playstorymode.app" },
  },
  {
    slug: "signalscan",
    name: "SignalScan",
    tagline: "Public-signal intelligence.",
    status: "In development",
    blurb:
      "Reads the public signal around a person or brand and turns scattered traces into a legible picture.",
    detail: [
      "Aggregates what's already public and organizes it into something you can actually reason about.",
      "Built for the moment before a meeting, a hire, or a deal — when you want context, fast.",
    ],
    image: null,
    awaitingAsset: true,
    aspect: "16/10",
  },
  {
    slug: "xenomorph",
    name: "Xenomorph Typeface",
    tagline: "A display face for a favorite sci-fi.",
    status: "Released",
    blurb: "A fun typeface inspired by one of my favorite sci-fi films.",
    detail: ["A made thing, offered as a free resource."],
    image: "/framer/cms/downloads/xenomorph-typeface__image.png",
    aspect: "4/3",
    link: { label: "Get it on Gumroad", href: "https://jpeghead.gumroad.com/l/xenomorphtypefacebyjoshwhitehead" },
    gallery: [
      "/framer/cms/downloads/xenomorph-typeface__image.png",
      "/framer/cms/downloads/xenomorph-typeface__image-2.png",
      "/framer/cms/downloads/xenomorph-typeface__image-3.png",
    ],
  },
];
