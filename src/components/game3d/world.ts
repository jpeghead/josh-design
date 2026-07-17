/**
 * WHITEHEAD CITY — world data.
 *
 * One composite open-world city stitched from every place the life happened:
 * Ohio Heights (NW, suburbs) · Downtown (NE) · The Base (SE) · the Airport
 * (S) · Vice Strip (W coast, neon) · Cincinnati Hill (E, brick + porch
 * light). Eternal sunset. Ten missions, 1993 → now.
 *
 * Map: 1600×1600 units centered at 0. Roads on a 160-unit grid.
 */

/* ------------------------------------------------------------ districts */

export type District = {
  id: string;
  name: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  hue: string; // minimap tint
};

export const DISTRICTS: District[] = [
  { id: "ohio", name: "OHIO HEIGHTS", x1: -800, z1: -800, x2: -80, z2: -240, hue: "#3f5a3f" },
  { id: "downtown", name: "DOWNTOWN", x1: 80, z1: -800, x2: 800, z2: -160, hue: "#44506a" },
  { id: "strip", name: "VICE STRIP", x1: -800, z1: -160, x2: -320, z2: 560, hue: "#7a4a6a" },
  { id: "cincy", name: "CINCINNATI HILL", x1: 320, z1: -80, x2: 800, z2: 480, hue: "#6a4a3a" },
  { id: "base", name: "THE BASE", x1: 240, z1: 480, x2: 800, z2: 800, hue: "#4a523f" },
  { id: "airport", name: "WHITEHEAD INTL.", x1: -240, z1: 480, x2: 160, z2: 800, hue: "#555f66" },
];

export function districtAt(x: number, z: number): District | null {
  for (const d of DISTRICTS) if (x >= d.x1 && x <= d.x2 && z >= d.z1 && z <= d.z2) return d;
  return null;
}

/* ------------------------------------------------------------ buildings */

export type BuildingSpec = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: [number, number, number];
  neon?: boolean;
};

function mulberry(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry(19870522);

export const ROAD = 28; // road width
export const BLOCK = 160; // grid pitch

/** grid roads at multiples of BLOCK from -800..800 (skip water margin) */
export const ROADS_X: number[] = [-640, -480, -320, -160, 0, 160, 320, 480, 640];
export const ROADS_Z: number[] = [-640, -480, -320, -160, 0, 160, 480, 640];

function onRoad(x: number, z: number, margin = ROAD * 0.5 + 6): boolean {
  for (const rx of ROADS_X) if (Math.abs(x - rx) < margin) return true;
  for (const rz of ROADS_Z) if (Math.abs(z - rz) < margin) return true;
  return false;
}

export const BUILDINGS: BuildingSpec[] = [];

function scatterDistrict(
  d: District,
  count: number,
  hMin: number,
  hMax: number,
  base: [number, number, number],
  jitter: number,
  neonChance = 0
) {
  let placed = 0;
  let guard = 0;
  while (placed < count && guard++ < count * 45) {
    const w = 22 + rnd() * 26;
    const dep = 22 + rnd() * 26;
    const x = d.x1 + 30 + rnd() * (d.x2 - d.x1 - 60);
    const z = d.z1 + 30 + rnd() * (d.z2 - d.z1 - 60);
    if (onRoad(x, z, ROAD * 0.5 + Math.max(w, dep) * 0.5 + 4)) continue;
    // keep landmark clearings — inflate by the building's own footprint
    const pad = Math.max(w, dep) / 2;
    if (LANDMARK_CLEAR.some((c) => Math.abs(x - c[0]) < c[2] + pad && Math.abs(z - c[1]) < c[2] + pad)) continue;
    const h = hMin + rnd() * (hMax - hMin);
    const j = () => 1 - jitter / 2 + rnd() * jitter;
    BUILDINGS.push({
      x,
      z,
      w,
      d: dep,
      h,
      color: [base[0] * j(), base[1] * j(), base[2] * j()],
      neon: rnd() < neonChance,
    });
    placed++;
  }
}

/* landmark clearings [x, z, half-size] — declared before scatter uses them */
export const LANDMARK_CLEAR: [number, number, number][] = [
  [-560, -560, 50], // childhood home
  [-240, -400, 55], // high school / career school
  [560, -400, 50], // recruiting office downtown
  [520, 575, 70], // base gate + barracks
  [580, 726, 60], // the rifle range
  [-40, 575, 90], // terminal
  [-560, 240, 60], // strip offices
  [-560, 60, 55], // keynote hall
  [704, 341, 45], // the REAL house footprint (x 686-722, z 326-356) + yard
  [440, 120, 55], // hospital
  [640, 320, 55], // boneyard studio
];

scatterDistrict(DISTRICTS[0], 95, 10, 20, [0.42, 0.4, 0.36], 0.35); // ohio suburbs
scatterDistrict(DISTRICTS[1], 105, 40, 150, [0.35, 0.38, 0.45], 0.4); // downtown towers
scatterDistrict(DISTRICTS[2], 85, 16, 44, [0.5, 0.36, 0.5], 0.5, 0.45); // vice strip
scatterDistrict(DISTRICTS[3], 95, 12, 26, [0.5, 0.36, 0.3], 0.35); // cincy brick
scatterDistrict(DISTRICTS[4], 50, 8, 14, [0.36, 0.4, 0.33], 0.25); // base barracks
scatterDistrict(DISTRICTS[5], 22, 10, 22, [0.42, 0.46, 0.5], 0.3); // airport outbuildings

/* ------------------------------------------------------------ landmarks */

export type Landmark = {
  id: string;
  x: number;
  z: number;
  label: string;
  kind: "home" | "school" | "office" | "gate" | "terminal" | "neon" | "hall" | "hospital" | "studio" | "house";
};

export const LANDMARKS: Landmark[] = [
  { id: "childhood", x: -560, z: -560, label: "HOME", kind: "home" },
  { id: "school", x: -240, z: -400, label: "CAREER SCHOOL", kind: "school" },
  { id: "recruiter", x: 560, z: -400, label: "USMC RECRUITING", kind: "office" },
  { id: "basegate", x: 520, z: 575, label: "THE BASE", kind: "gate" },
  { id: "terminal", x: -40, z: 575, label: "WHITEHEAD INTL.", kind: "terminal" },
  { id: "saucey", x: -600, z: 200, label: "SAUCEY", kind: "neon" },
  { id: "hush", x: -560, z: 280, label: "HUSH", kind: "neon" },
  { id: "spin", x: -520, z: 360, label: "SPIN HQ", kind: "neon" },
  { id: "keynote", x: -560, z: 60, label: "KEYNOTE HALL", kind: "hall" },
  { id: "hospital", x: 440, z: 120, label: "ST. SIGNAL", kind: "hospital" },
  // the REAL walkable house (house.tsx) — landmark points at the curb out front
  { id: "house", x: 713.4, z: 364, label: "THE HOUSE", kind: "house" },
  { id: "boneyard", x: 640, z: 320, label: "BONEYARD STUDIO", kind: "studio" },
];

export const lm = (id: string) => LANDMARKS.find((l) => l.id === id)!;

/* ------------------------------------------------------------- missions */

export type MissionStep = {
  text: string;
  x: number;
  z: number;
  radius?: number;
  needCar?: boolean;
  /** step completes after this many range plates instead of arrival */
  targets?: number;
};

export type Mission = {
  id: string;
  title: string;
  year: string;
  brief: string;
  startX: number;
  startZ: number;
  steps: MissionStep[];
  passed: string; // MISSION PASSED subtitle
};

export const MISSIONS: Mission[] = [
  {
    id: "m1",
    title: "THE KID",
    year: "1993",
    brief: "Ohio Heights. You drew all day, every day. Get to school — show somebody.",
    startX: lm("childhood").x,
    startZ: lm("childhood").z + 30,
    steps: [{ text: "Walk to CAREER SCHOOL with your drawings", x: lm("school").x, z: lm("school").z, radius: 18 }],
    passed: "Drawing was never a choice.",
  },
  {
    id: "m2",
    title: "PORTFOLIO",
    year: "2005",
    brief: "Career school taught film, photo, code, music. Take the car. Bring all of it.",
    startX: lm("school").x,
    startZ: lm("school").z + 26,
    steps: [
      { text: "Get in the car", x: lm("school").x + 26, z: lm("school").z + 26, radius: 10 },
      { text: "Drive your portfolio DOWNTOWN", x: 320, z: -480, radius: 22, needCar: true },
    ],
    passed: "Anything they'd teach — he took.",
  },
  {
    id: "m3",
    title: "OORAH",
    year: "2008",
    brief: "Married in June. Same year, a different signature: the recruiting office.",
    startX: 320,
    startZ: -480 + 26,
    steps: [
      { text: "Report to USMC RECRUITING", x: lm("recruiter").x, z: lm("recruiter").z, radius: 18 },
      { text: "Qualify at the RIFLE RANGE", x: 580, z: 736, radius: 16, targets: 5 },
      { text: "Drive to THE BASE gate", x: lm("basegate").x, z: lm("basegate").z - 40, radius: 24, needCar: true },
    ],
    passed: "Parris Island → Camp Geiger → Fort Meade → MCAS New River.",
  },
  {
    id: "m4",
    title: "SHUTTER",
    year: "2010",
    brief: "Combat photographer. The base sees everything through your lens today.",
    startX: lm("basegate").x,
    startZ: lm("basegate").z - 60,
    steps: [
      { text: "Photograph the MOTOR POOL", x: 660, z: 700, radius: 16 },
      { text: "Photograph the PARADE DECK", x: 380, z: 720, radius: 16 },
      { text: "Photograph the FLIGHT LINE", x: 300, z: 560, radius: 16 },
    ],
    passed: "Gunner arrives Nov 1, 2009. The camera never stops.",
  },
  {
    id: "m5",
    title: "GO WEST",
    year: "2014",
    brief: "Discharged 2013. Cincinnati first — then the whole family bets on LA.",
    startX: 300,
    startZ: 560 - 30,
    steps: [
      { text: "Drive to WHITEHEAD INTL.", x: lm("terminal").x, z: lm("terminal").z - 30, radius: 26, needCar: true },
      { text: "Board the flight at the TERMINAL", x: lm("terminal").x, z: lm("terminal").z, radius: 14 },
    ],
    passed: "Wheels up. Everything owned fits in checked bags.",
  },
  {
    id: "m6",
    title: "SHIP IT",
    year: "2015 – 2019",
    brief: "Vice Strip. Three doors, one designer: first in, Head of Design out.",
    startX: -640,
    startZ: 140,
    steps: [
      { text: "Deliver the build to SAUCEY", x: lm("saucey").x, z: lm("saucey").z, radius: 16 },
      { text: "Deliver the redesign to HUSH", x: lm("hush").x, z: lm("hush").z, radius: 16 },
      { text: "Take the org chart to SPIN HQ", x: lm("spin").x, z: lm("spin").z, radius: 16 },
    ],
    passed: "3.5★ → 4.8★. App of the Day. First designer → Head of Design. Twice.",
  },
  {
    id: "m7",
    title: "KEYNOTE",
    year: "2020",
    brief: "Cupertino calls: Spin App Clips on the iOS 14 stage. Don't be late.",
    startX: lm("spin").x,
    startZ: lm("spin").z + 26,
    steps: [{ text: "Get to KEYNOTE HALL", x: lm("keynote").x, z: lm("keynote").z, radius: 18, needCar: true }],
    passed: "WWDC 2020. Featured. Breathe.",
  },
  {
    id: "m8",
    title: "SIGNAL",
    year: "2021",
    brief: "It's time. Cross the city to ST. SIGNAL — Nolan is not going to wait.",
    startX: lm("keynote").x,
    startZ: lm("keynote").z + 26,
    steps: [{ text: "GET TO THE HOSPITAL", x: lm("hospital").x, z: lm("hospital").z, radius: 20, needCar: true }],
    passed: "Nolan. 2021. The second hand on the clock.",
  },
  {
    id: "m9",
    title: "THE LONG DRIVE HOME",
    year: "2023",
    brief: "LA is done. Pack the years, point the car east — Cincinnati Hill.",
    startX: lm("hospital").x,
    startZ: lm("hospital").z + 26,
    steps: [{ text: "Bring the family to THE HOUSE", x: lm("house").x, z: lm("house").z, radius: 18, needCar: true }],
    passed: "The porch light was already on.",
  },
  {
    id: "m10",
    title: "BONEYARD",
    year: "NOW",
    brief: "Your own shingle. Walk to the studio — everything you make next is yours.",
    startX: lm("house").x,
    startZ: lm("house").z + 26,
    steps: [{ text: "Open BONEYARD STUDIO", x: lm("boneyard").x, z: lm("boneyard").z, radius: 16 }],
    passed: "OLO · Weaver · SignalScan · the books. Still just the kid.",
  },
];
