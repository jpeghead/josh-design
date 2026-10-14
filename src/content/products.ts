/**
 * Things I'm building at Boneyard. My framing, my words. Imagery is used only
 * where a real asset exists in the archive; everything else is a labeled
 * placeholder awaiting a scan/screenshot, so swapping it in is a data change.
 */

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  status: "Live" | "In development" | "Released";
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
    tagline: "Spotify Wrapped for your brain.",
    status: "In development",
    blurb:
      "Point OLO at your own exported AI conversation history and it shows you the shape of how you actually think.",
    detail: [
      "You export your chat history yourself and bring it in — there's no account linking and no third-party access to your accounts.",
      "Privacy-first by design: your data is yours, and the analysis is about you, for you.",
      "The output is a portrait of your own patterns, obsessions, and questions over time.",
    ],
    image: null,
    awaitingAsset: true,
    aspect: "16/10",
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
    slug: "weaver",
    name: "Weaver",
    tagline: "Map the narrative before you write it.",
    status: "In development",
    blurb:
      "A visual canvas for laying out a story's threads — characters, beats, arcs — before a single sentence is committed.",
    detail: [
      "Think on a canvas, not in a blank document.",
      "Made for the messy, spatial part of writing that outlines flatten.",
    ],
    image: null,
    awaitingAsset: true,
    aspect: "16/10",
  },
  {
    slug: "storymode",
    name: "StoryMode",
    tagline: "Game narratives, as audio stories.",
    status: "In development",
    blurb:
      "Turns the narrative of a game into an audio story you can listen to — the plot without the controller.",
    detail: [
      "For the stories inside games that deserve to be heard on their own.",
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
