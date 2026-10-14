/**
 * The chapter ledger — the whole scroll contract as data.
 *
 * World sentence: Start at Josh's desk tonight, where the site you're
 * reading glows on the monitor, and pull back through his studio to the
 * wall where the Corps still hangs — one room, one continuous camera move,
 * the lamp light giving way to the daylight of 2008.
 *
 * Interaction contract: scroll owns the camera and the light; hover warms a
 * photograph and lifts its caption; the DOM carries every word.
 *
 * Topology: continuous geography — one studio. Eras are walls and objects
 * in it; light does the time travel. Units are meters.
 */

import { eras, artifactsByEra, type Era, type Artifact } from "@/content/archive";
import { identityLine } from "@/content/about";

export type Vec3 = [number, number, number];

export type CameraEndpoint = {
  p: Vec3;
  t: Vec3;
  fov: number;
  mobile?: { p?: Vec3; t?: Vec3; fov?: number };
};

/** named light/atmosphere channels, interpolated between adjacent chapters */
export type WorldState = {
  key: number; // window daylight, directional + shadows
  keyColor: string;
  lamp: number; // the desk lamp's pool
  monitor: number; // the screen's practical
  pictures: number; // brass picture lights on the Corps wall
  window: number; // 0 night glass → 1 daylit glass
  ambient: number; // environment + sky fill — near zero at night so blacks stay black
  fog: number;
  fogColor: string;
};

export type Chapter = {
  id: string;
  beat: string;
  landmark: string;
  change: string;
  scrollWeight: number;
  dark: boolean; // drives the header ink
  camera: CameraEndpoint;
  world: WorldState;
  focus: string[];
  copy: { eyebrow: string; title: string; body: string; action?: { label: string; href: string } };
  era?: Era;
  artifacts?: Artifact[];
};

const corps = eras.find((e) => e.id === "military")!;
const corpsArt = artifactsByEra("military").filter((a) => a.image);

export const CHAPTERS: Chapter[] = [
  {
    id: "desk",
    beat: "This is the desk. The site you're reading lives on that screen.",
    landmark: "the monitor",
    change: "Opening frame — seated at the desk, night, lamp on.",
    scrollWeight: 1.15,
    dark: true,
    camera: {
      p: [0.95, 1.42, -0.2],
      t: [0.1, 0.92, -1.85],
      fov: 40,
      mobile: { p: [0.75, 1.5, 0.35], t: [0.15, 0.9, -1.85], fov: 52 },
    },
    world: {
      key: 0.12,
      keyColor: "#6f86b0",
      lamp: 1.0,
      monitor: 1.0,
      pictures: 0.0,
      window: 0.0,
      ambient: 0.06,
      fog: 0.012,
      fogColor: "#07080b",
    },
    focus: ["monitor", "lamp"],
    copy: {
      eyebrow: "Now · at the desk",
      title: "You're reading this at my desk.",
      body: `${identityLine} The site is on the screen. The life that made it is in the room — keep scrolling.`,
    },
  },
  {
    id: "corps",
    beat: corps.blurb,
    landmark: "the photo wall",
    change: "Stand, turn to the east wall: daylight rises, the picture lights come on, the lamp settles.",
    scrollWeight: 1.5,
    dark: false,
    camera: {
      p: [-0.8, 1.5, -0.75],
      t: [2.5, 1.38, -0.72],
      fov: 42,
      mobile: { p: [-1.3, 1.5, 0.3], t: [2.5, 1.4, 0.35], fov: 56 },
    },
    world: {
      key: 1.7,
      keyColor: corps.light,
      lamp: 0.32,
      monitor: 0.6,
      pictures: 1.0,
      window: 1.0,
      ambient: 1.0,
      fog: 0.0,
      fogColor: "#b3aa98",
    },
    focus: ["photo-range", "photo-convoy", "flag"],
    copy: {
      eyebrow: `02 · ${corps.years}`,
      title: corps.title,
      body: corps.blurb,
      action: { label: "The work that followed →", href: "/work" },
    },
    era: corps,
    artifacts: corpsArt,
  },
  {
    id: "handoff",
    beat: "The room holds still; the site takes over.",
    landmark: "the photo wall",
    change: "Pull back a step; the frame settles and hands off to the pages.",
    scrollWeight: 0.9,
    dark: false,
    camera: {
      p: [-1.25, 1.48, -0.95],
      t: [2.5, 1.38, -0.6],
      fov: 44,
      mobile: { p: [-1.7, 1.5, 0.2], t: [2.5, 1.4, 0.35], fov: 58 },
    },
    world: {
      key: 1.5,
      keyColor: corps.light,
      lamp: 0.25,
      monitor: 0.5,
      pictures: 0.9,
      window: 1.0,
      ambient: 0.95,
      fog: 0.0,
      fogColor: "#b3aa98",
    },
    focus: [],
    copy: {
      eyebrow: "Keep walking",
      title: "One continuous walk, 1993 → now.",
      body: "From a kid who drew all day, through the Corps, into the products people carry in their pockets, and out the other side into what I'm building now.",
      action: { label: "See the work →", href: "/work" },
    },
  },
];

export const LAST = CHAPTERS.length - 1;

/** resolve an endpoint for the active breakpoint */
export function resolveCamera(c: CameraEndpoint, mobile: boolean): { p: Vec3; t: Vec3; fov: number } {
  if (!mobile || !c.mobile) return { p: c.p, t: c.t, fov: c.fov };
  return { p: c.mobile.p ?? c.p, t: c.mobile.t ?? c.t, fov: c.mobile.fov ?? c.fov };
}
