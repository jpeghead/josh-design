/**
 * The Archive manifest — the spine of the site.
 *
 * Eras run light → dark, era by era, toward near-black. Each era carries a bg/fg
 * so the ramp is data, not markup. Artifacts are real objects from a life's work.
 *
 * Asset rule: where a real image exists in the export it's referenced; otherwise
 * `image` is null and `awaitingScan` is true, and the UI renders a labeled
 * placeholder at the correct aspect ratio. Swapping in a real scan is a data
 * change here — never a rebuild. We never fabricate childhood art or military
 * photography.
 */

export type EraId =
  | "childhood"
  | "poster"
  | "military"
  | "logos"
  | "web"
  | "app"
  | "today";

export type Era = {
  id: EraId;
  index: number;
  title: string;
  years: string;
  /** One quiet line. The artifacts carry the rest. */
  blurb: string;
  /** Light → dark ramp. Applied as data so the arc is explicit. */
  bg: string;
  fg: string;
  muted: string;
  /** Key-light tint — each era has its own light, not just a background. */
  light: string;
  dark: boolean;
};

export type ArtifactType =
  | "drawing"
  | "painting"
  | "poster"
  | "photograph"
  | "logo"
  | "site"
  | "app"
  | "product"
  | "book";

export type Artifact = {
  id: string;
  eraId: EraId;
  title: string;
  /** Max one quiet caption. e.g. "Age 8. Pencil." */
  caption: string;
  year?: string;
  type: ArtifactType;
  /** Web path when a real asset exists; null → placeholder. */
  image: string | null;
  awaitingScan?: boolean;
  /** Aspect ratio for correct placeholder sizing, e.g. "3/4". */
  aspect: string;
  /** Internal destination (case study / product), never external. */
  href?: string;
};

const GOLD = "#C8A24B";
export const accent = GOLD;

export const eras: Era[] = [
  {
    id: "childhood",
    index: 0,
    title: "Before it was a job",
    years: "The beginning",
    blurb: "A kid who drew and wrote and built all day, every day.",
    bg: "#F3E9D7",
    fg: "#241F17",
    muted: "#97876C",
    light: "#FFD9A0",
    dark: false,
  },
  {
    id: "poster",
    index: 1,
    title: "Printed & cut by hand",
    years: "Learning to make",
    blurb: "Posters designed, printed large-format, glued to board, cut by hand. Still got the scar.",
    bg: "#EAD9BE",
    fg: "#2A2318",
    muted: "#8F7E5F",
    light: "#FFE0AC",
    dark: false,
  },
  {
    id: "military",
    index: 2,
    title: "The Corps",
    years: "2008 – 2013",
    blurb: "Five years behind a camera in places that didn't ask for one. Where it clicked.",
    bg: "#8E8A7A",
    fg: "#14120D",
    muted: "#3E3B30",
    light: "#E8DDBA",
    dark: false,
  },
  {
    id: "logos",
    index: 3,
    title: "Marks & illustration",
    years: "The self-taught years",
    blurb: "Rebuilding other people's sites and covers just to understand how they were made.",
    bg: "#4E4A44",
    fg: "#F1ECE2",
    muted: "#B3AB9C",
    light: "#CBB98D",
    dark: true,
  },
  {
    id: "web",
    index: 4,
    title: "The web era",
    years: "2013 – 2015",
    blurb: "First design job out of the Marines. Designed in the morning, built the front-end by night.",
    bg: "#35363A",
    fg: "#F1ECE2",
    muted: "#9BA3AD",
    light: "#A9BCCE",
    dark: true,
  },
  {
    id: "app",
    index: 5,
    title: "Things people carry",
    years: "2015 – 2023",
    blurb: "The App Store epiphany, made literal. Products that ride in a pocket, everywhere.",
    bg: "#17181B",
    fg: "#F1ECE2",
    muted: "#7E8794",
    light: "#7FA0C9",
    dark: true,
  },
  {
    id: "today",
    index: 6,
    title: "Keep building",
    years: "2024 – Present",
    blurb: "My own studio, my own products. Still just the kid who won't stop making things.",
    bg: "#0A0A0A",
    fg: "#F1ECE2",
    muted: "#7D7A74",
    light: "#C8A24B",
    dark: true,
  },
];

export const artifacts: Artifact[] = [
  // Childhood — awaiting real scans
  { id: "child-1", eraId: "childhood", title: "Drawing", caption: "Age 8. Pencil.", type: "drawing", image: null, awaitingScan: true, aspect: "3/4" },
  { id: "child-2", eraId: "childhood", title: "Painting", caption: "Charcoal and canvas, later.", type: "painting", image: null, awaitingScan: true, aspect: "4/5" },
  { id: "child-3", eraId: "childhood", title: "A page of writing", caption: "Always writing something.", type: "drawing", image: null, awaitingScan: true, aspect: "3/4" },

  // Poster era — awaiting real scans
  { id: "poster-1", eraId: "poster", title: "Poster", caption: "Printed. Mounted. Hand-cut.", type: "poster", image: null, awaitingScan: true, aspect: "2/3" },
  { id: "poster-2", eraId: "poster", title: "Poster", caption: "Large-format, glued to board.", type: "poster", image: null, awaitingScan: true, aspect: "2/3" },

  // Military — cleared photography, awaiting supply
  { id: "mil-1", eraId: "military", title: "Range day", caption: "USMC, Combat Photographer.", type: "photograph", image: "/archive/web/sfMnAGTnE16cKd9nm8suW4wk.jpg", aspect: "3/2" },
  { id: "mil-2", eraId: "military", title: "Convoy", caption: "Cleared for release.", type: "photograph", image: "/archive/web/ILQgtzAfoB1DMrSNqEKzs19bQ.jpg", aspect: "3/2" },

  // Marks & illustration — awaiting real scans
  { id: "logo-1", eraId: "logos", title: "Logo", caption: "Self-taught, one video at a time.", type: "logo", image: null, awaitingScan: true, aspect: "1/1" },
  { id: "logo-2", eraId: "logos", title: "Illustration", caption: "Learning by rebuilding.", type: "logo", image: null, awaitingScan: true, aspect: "1/1" },

  // Web era — maps to Differential / NationBuilder
  { id: "web-differential", eraId: "web", title: "Differential", caption: "First design job. Learned to ship.", year: "2013 – 2014", type: "site", image: null, awaitingScan: true, aspect: "16/10", href: "/work/differential" },
  { id: "web-nationbuilder", eraId: "web", title: "NationBuilder", caption: "Software for the people running campaigns.", year: "2014 – 2015", type: "site", image: null, awaitingScan: true, aspect: "16/10", href: "/work/nationbuilder" },

  // App era — the marquee case studies
  { id: "app-saucey", eraId: "app", title: "Saucey", caption: "On-demand, before the category existed.", year: "2015 – 2017", type: "app", image: null, awaitingScan: true, aspect: "9/16", href: "/work/saucey" },
  { id: "app-hush", eraId: "app", title: "Hush", caption: "First designer in. Left as Head of Design.", year: "2017 – 2019", type: "app", image: null, awaitingScan: true, aspect: "9/16", href: "/work/hush" },
  { id: "app-spin", eraId: "app", title: "Spin", caption: "Built the design org. Apple & Google.", year: "2019 – 2022", type: "app", image: "/archive/web/lUfbKLTE61YByqT1TJBRTeMjA.jpg", aspect: "1/1", href: "/work/spin" },
  { id: "app-spin-quiz", eraId: "app", title: "Ride Smart quiz", caption: "Safety, made playable.", year: "2020", type: "app", image: "/archive/web/drPyB0qigdiXyCjHkK3HdKQsuE.jpg", aspect: "1/1", href: "/work/spin" },
  { id: "app-spin-brand", eraId: "app", title: "Spin, in the wild", caption: "A brand that lived on streets.", year: "2019 – 2022", type: "app", image: "/archive/web/dPjaqyIJCrIhH7ybw1Id4MdMDzs.jpg", aspect: "2/1", href: "/work/spin" },
  { id: "app-spin-street", eraId: "app", title: "Riders", caption: "Designed for the sidewalk, not the deck.", year: "2019 – 2022", type: "app", image: "/archive/web/RAOF0jiw87qsIU7GR1OeKHsHEs.jpg", aspect: "3/2", href: "/work/spin" },
  { id: "app-vgv", eraId: "app", title: "Very Good Ventures", caption: "Flutter design system. Google I/O 2023.", year: "2022 – 2023", type: "app", image: null, awaitingScan: true, aspect: "16/10", href: "/work/vgv" },

  // Today — products & books (real asset where it exists)
  { id: "today-olo", eraId: "today", title: "OLO", caption: "Spotify Wrapped for your brain.", type: "product", image: null, awaitingScan: true, aspect: "16/10", href: "/products" },
  { id: "today-weaver", eraId: "today", title: "Weaver", caption: "Map the narrative before you write it.", type: "product", image: null, awaitingScan: true, aspect: "16/10", href: "/products" },
  { id: "today-xeno", eraId: "today", title: "Xenomorph Typeface", caption: "A made thing, offered free.", type: "product", image: "/framer/cms/downloads/xenomorph-typeface__image.png", aspect: "4/3", href: "/products" },
  { id: "today-book", eraId: "today", title: "Mastery is Dead", caption: "The quiet collapse of expertise.", type: "book", image: null, awaitingScan: true, aspect: "2/3", href: "/writing" },
];

export function artifactsByEra(eraId: EraId): Artifact[] {
  return artifacts.filter((a) => a.eraId === eraId);
}
