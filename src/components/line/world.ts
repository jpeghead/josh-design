/**
 * THE LINE — the world model.
 *
 * One unbroken path across a large canvas, authored as ordered strokes.
 * Each stroke carries the era's hand: how steady, how wide, what ink.
 * The line literally gets better at drawing as Josh does.
 */

export type EraStyle =
  | "crayon" // childhood — wobbly, wide, innocent
  | "sketch" // career school / fine art — steadier, hatched
  | "corps" // USMC — taut, precise, documentary
  | "vector" // web — crisp, snapped, no wobble
  | "system" // app era — fine, multiplied, color enters
  | "flow"; // the dive — colored strands

export type Stroke = { pts: [number, number][]; style: EraStyle };

/* ------------------------------------------------------------ seeded rng */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* --------------------------------------------------------- shape helpers */

const R = rng(20090101);

/** wobble a polyline like a kid's hand */
function wob(pts: [number, number][], amp: number): [number, number][] {
  return pts.map(([x, y]) => [x + (R() - 0.5) * 2 * amp, y + (R() - 0.5) * 2 * amp]);
}

/** densify straight segments so wobble + partial draw look organic */
function dense(pts: [number, number][], step = 14): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const d = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.round(d / step));
    for (let k = 0; k < n; k++) out.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function circle(cx: number, cy: number, r: number, from = 0, turns = 1, n = 40): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = from + (i / n) * Math.PI * 2 * turns;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

function wave(x1: number, x2: number, y: number, amp: number, waves: number, n = 60): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    out.push([x1 + (x2 - x1) * f, y + Math.sin(f * Math.PI * 2 * waves) * amp]);
  }
  return out;
}

function spiral(cx: number, cy: number, r0: number, turns: number, n = 160): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const a = f * Math.PI * 2 * turns;
    const r = r0 * (1 - f * 0.92);
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8]);
  }
  return out;
}

/* -------------------------------------------------------------- the path */

export const SPIRAL_C: [number, number] = [4960, 520];

function S(style: EraStyle, pts: [number, number][], amp = 0): Stroke {
  return { style, pts: amp > 0 ? wob(dense(pts), amp) : dense(pts) };
}

export const STROKES: Stroke[] = [
  // —— childhood: the first marks ——————————————————————————————
  S("crayon", wave(160, 380, 520, 26, 2), 3.5),
  // the sun — every kid draws the sun first
  S(
    "crayon",
    (() => {
      const pts: [number, number][] = [
        [380, 520],
        [402, 430],
        [374, 302],
      ];
      for (const q of circle(330, 302, 44, 0, 1, 24)) pts.push(q);
      // rays
      for (let r = 0; r < 5; r++) {
        const a = -0.6 + r * 1.25;
        pts.push([330 + Math.cos(a) * 44, 302 + Math.sin(a) * 44]);
        pts.push([330 + Math.cos(a) * 66, 302 + Math.sin(a) * 66]);
        pts.push([330 + Math.cos(a) * 44, 302 + Math.sin(a) * 44]);
      }
      pts.push([420, 520]);
      return pts;
    })(),
    3
  ),
  // rocket
  S(
    "crayon",
    [
      [420, 520],
      [560, 470],
      [590, 380],
      [630, 330],
      [670, 372],
      [676, 452],
      [640, 500],
      [600, 520],
      [575, 560],
      [560, 515],
      [520, 545],
      [560, 470],
    ],
    3.2
  ),
  // hop to star
  S("crayon", wave(640, 880, 560, 30, 1.4), 3),
  S(
    "crayon",
    [
      [880, 560],
      [905, 630],
      [975, 632],
      [922, 672],
      [942, 738],
      [880, 698],
      [820, 738],
      [840, 672],
      [788, 632],
      [857, 630],
      [880, 560],
    ],
    3
  ),
  // to the house
  S("crayon", wave(900, 1180, 560, 24, 1.6), 3),
  S(
    "crayon",
    [
      [1180, 560],
      [1180, 470],
      [1150, 470],
      [1250, 385],
      [1350, 470],
      [1320, 470],
      [1320, 560],
      [1180, 560],
      [1230, 560],
      [1230, 505],
      [1275, 505],
      [1275, 560],
    ],
    2.8
  ),
  // the heart — J + S
  S("crayon", wave(1320, 1480, 545, 20, 1.2), 2.6),
  S(
    "crayon",
    [
      [1480, 545],
      [1478, 525],
      [1490, 508],
      [1512, 508],
      [1524, 525],
      [1536, 508],
      [1558, 508],
      [1570, 525],
      [1568, 548],
      [1524, 592],
      [1480, 545],
    ],
    2.2
  ),

  // —— career school / fine art: the hand steadies ——————————————
  S("sketch", wave(1560, 1800, 545, 16, 1.4), 1.6),
  // a canvas on an easel + perspective lines
  S(
    "sketch",
    [
      [1800, 545],
      [1810, 430],
      [1990, 418],
      [1996, 560],
      [1810, 572],
      [1810, 430],
    ],
    1.2
  ),
  S(
    "sketch",
    [
      [1996, 560],
      [2040, 640],
      [1900, 585],
      [1770, 645],
      [1810, 572],
    ],
    1.2
  ),
  // a life study on the canvas — the first time the line draws a person
  S(
    "sketch",
    (() => {
      const pts: [number, number][] = [[1810, 572]];
      for (const q of circle(1878, 452, 13, Math.PI * 1.5, 1, 14)) pts.push(q);
      pts.push([1874, 466], [1888, 492], [1866, 516], [1892, 542], [1996, 560]);
      return pts;
    })(),
    1
  ),
  // perspective study: lines to a vanishing point
  S(
    "sketch",
    [
      [2040, 640],
      [2210, 470],
      [2110, 452],
      [2210, 470],
      [2120, 520],
      [2210, 470],
      [2150, 585],
      [2210, 470],
    ],
    0.9
  ),

  // —— the Corps: taut, exact ————————————————————————————————
  S("corps", wave(2210, 2420, 480, 10, 1), 0.5),
  // the camera
  S(
    "corps",
    [
      [2420, 480],
      [2420, 430],
      [2455, 430],
      [2470, 408],
      [2560, 408],
      [2575, 430],
      [2700, 430],
      [2700, 560],
      [2420, 560],
      [2420, 480],
    ],
    0.35
  ),
  S("corps", circle(2560, 495, 46), 0.35),
  S("corps", circle(2560, 495, 26), 0.3),
  // route: four duty stations, four tight loops
  S(
    "corps",
    (() => {
      const pts: [number, number][] = [[2700, 495]];
      const stops: [number, number][] = [
        [2820, 560],
        [2930, 470],
        [3040, 560],
        [3150, 480],
      ];
      for (const [sx, sy] of stops) {
        pts.push([sx, sy]);
        for (const p of circle(sx, sy, 14, 0, 1, 12)) pts.push(p);
        pts.push([sx, sy]);
      }
      pts.push([3260, 520]);
      return pts;
    })(),
    0.4
  ),
  // 2008 — the knot (married + enlisted, one line, tied)
  S(
    "corps",
    (() => {
      const pts: [number, number][] = [[3260, 520]];
      for (const p of circle(3320, 520, 34, Math.PI, 1.25, 30)) pts.push(p);
      for (const p of circle(3360, 520, 22, 0, -1.25, 24)) pts.push(p);
      pts.push([3430, 520]);
      return pts;
    })(),
    0.35
  ),
  // Gunner — a small bright loop off the line
  S(
    "corps",
    (() => {
      const pts: [number, number][] = [[3430, 520]];
      for (const p of circle(3470, 486, 20, Math.PI * 0.5, 1, 20)) pts.push(p);
      pts.push([3510, 520]);
      return pts;
    })(),
    0.3
  ),

  // —— west, and the web: the line goes vector ————————————————
  S("vector", [
    [3510, 520],
    [3600, 520],
    [3640, 470],
    [3700, 470],
  ]),
  // browser window
  S("vector", [
    [3700, 470],
    [3700, 380],
    [4080, 380],
    [4080, 660],
    [3700, 660],
    [3700, 380],
  ]),
  S("vector", [
    [3700, 420],
    [4080, 420],
  ]),
  S("vector", circle(3722, 400, 6, 0, 1, 10)),
  S("vector", circle(3744, 400, 6, 0, 1, 10)),
  // content blocks
  S("vector", [
    [3730, 460],
    [3900, 460],
    [3900, 500],
    [3730, 500],
    [3730, 460],
  ]),
  S("vector", [
    [3730, 530],
    [4050, 530],
  ]),
  S("vector", [
    [3730, 556],
    [4010, 556],
  ]),
  S("vector", [
    [3730, 582],
    [4040, 582],
  ]),
  // the cursor — the tool that replaced the pencil, drawn by the pencil
  S("vector", [
    [4040, 582],
    [3952, 468],
    [3992, 508],
    [3962, 510],
    [3952, 468],
  ]),

  // —— the app era: the system multiplies —————————————————————
  S("system", [
    [4080, 520],
    [4160, 520],
  ]),
  // two phones + flow
  S("system", [
    [4160, 520],
    [4160, 400],
    [4168, 388],
    [4252, 388],
    [4260, 400],
    [4260, 640],
    [4252, 652],
    [4168, 652],
    [4160, 640],
    [4160, 400],
  ]),
  S("system", [
    [4260, 520],
    [4330, 520],
    [4322, 508],
    [4330, 520],
    [4322, 532],
  ]),
  S("system", [
    [4330, 520],
    [4330, 412],
    [4338, 400],
    [4422, 400],
    [4430, 412],
    [4430, 628],
    [4422, 640],
    [4338, 640],
    [4330, 628],
    [4330, 412],
  ]),
  // Nolan — the second small bright loop
  S(
    "system",
    (() => {
      const pts: [number, number][] = [[4430, 520]];
      for (const q of circle(4470, 486, 20, Math.PI * 0.5, 1, 20)) pts.push(q);
      pts.push([4510, 520]);
      return pts;
    })()
  ),
  // home again — the childhood house, redrawn by the hand that left
  S("system", [
    [4510, 520],
    [4536, 520],
    [4536, 472],
    [4520, 472],
    [4584, 414],
    [4648, 472],
    [4632, 472],
    [4632, 520],
    [4536, 520],
  ]),
  S("system", [
    [4566, 520],
    [4566, 488],
    [4602, 488],
    [4602, 520],
    [4680, 520],
  ]),
  // strands begin — the one line echoes into color
  S("flow", wave(4680, 4880, 520, 34, 2.2)),
  // the dive
  S("flow", spiral(SPIRAL_C[0], SPIRAL_C[1], 190, 4, 220)),
];

/* ---------------------------------------------------- length precompute */

export type Seg = { x1: number; y1: number; x2: number; y2: number; len: number; si: number };

export const SEGS: Seg[] = [];
export let TOTAL = 0;
for (let si = 0; si < STROKES.length; si++) {
  const pts = STROKES[si].pts;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    SEGS.push({ x1, y1, x2, y2, len, si });
    TOTAL += len;
  }
}

export function pointAtLen(L: number): [number, number] {
  let acc = 0;
  for (const s of SEGS) {
    if (acc + s.len >= L) {
      const f = (L - acc) / s.len;
      return [s.x1 + (s.x2 - s.x1) * f, s.y1 + (s.y2 - s.y1) * f];
    }
    acc += s.len;
  }
  const last = SEGS[SEGS.length - 1];
  return [last.x2, last.y2];
}

/* ------------------------------------------------------------ era style */

export const STYLE: Record<
  EraStyle,
  {
    width: number;
    color: string;
    alpha: number;
    echo?: { dx: number; dy: number; color: string; a?: number }[];
  }
> = {
  crayon: {
    width: 5,
    color: "#33291f",
    alpha: 0.92,
    // a second, slightly offset pass — wax on paper tooth
    echo: [{ dx: 1.7, dy: 1.4, color: "#33291f", a: 0.26 }],
  },
  sketch: { width: 3.2, color: "#2b241b", alpha: 0.95 },
  corps: { width: 2.6, color: "#232019", alpha: 1 },
  vector: { width: 2.2, color: "#1f2c3d", alpha: 1 },
  system: {
    width: 2,
    color: "#1f2c3d",
    alpha: 1,
    echo: [
      { dx: 7, dy: 7, color: "#C8A24B" },
      { dx: -7, dy: -7, color: "#C87F6B" },
    ],
  },
  flow: {
    width: 2.4,
    color: "#C8A24B",
    alpha: 1,
    echo: [
      { dx: 9, dy: 6, color: "#C87F6B" },
      { dx: -9, dy: -6, color: "#7FA0C9" },
      { dx: 16, dy: -10, color: "#A8C4A2" },
    ],
  },
};

/* ------------------------------------------- framed real work (clickable) */

export type WorldFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
  src?: string;
  label: string;
  href: string;
  at: number; // t at which it fades in
  rot?: number;
};

export const FRAMES: WorldFrame[] = [
  // the Corps — his photographs, taped beside the camera the line drew
  { x: 2400, y: 190, w: 300, h: 200, src: "/archive/web/sfMnAGTnE16cKd9nm8suW4wk.jpg", label: "Range day — USMC", href: "/work", at: 0.36, rot: -2.5 },
  { x: 2740, y: 620, w: 300, h: 200, src: "/archive/web/ILQgtzAfoB1DMrSNqEKzs19bQ.jpg", label: "Convoy — cleared for release", href: "/work", at: 0.4, rot: 2 },
  // the web era — inside the browser the line drew
  { x: 3920, y: 445, w: 130, h: 88, label: "Differential · 2013 →", href: "/work/differential", at: 0.56 },
  { x: 3920, y: 596, w: 130, h: 50, label: "NationBuilder · 2014 →", href: "/work/nationbuilder", at: 0.58 },
  // the app era — real work on the phones the line drew
  { x: 4166, y: 394, w: 88, h: 252, src: "/archive/web/lUfbKLTE61YByqT1TJBRTeMjA.jpg", label: "Spin — the rider app", href: "/work/spin", at: 0.64 },
  { x: 4336, y: 406, w: 88, h: 228, src: "/archive/web/drPyB0qigdiXyCjHkK3HdKQsuE.jpg", label: "Ride Smart quiz", href: "/work/spin", at: 0.67 },
];

/* -------------------------------------------------------------- captions */

export type Caption = {
  /** world-x window: caption shows while the pen is inside it */
  x1?: number;
  x2?: number;
  /** t window: used for the dive/finale, after the pen stops mattering */
  a?: number;
  b?: number;
  text: string;
  sub?: string;
};

/** Sparse. One at a time. Long dwell. Synced to the pen, not the clock. */
export const CAPTIONS: Caption[] = [
  { x1: 300, x2: 1150, text: "A kid in Ohio who drew all day, every day." },
  { x1: 1400, x2: 1790, text: "Samantha. Since junior year.", sub: "In the line from here on." },
  { x1: 1810, x2: 2390, text: "Career school, then fine art.", sub: "Film, photo, code, music — anything they'd teach." },
  { x1: 2420, x2: 3240, text: "The Marines made me a photographer.", sub: "Parris Island · Camp Geiger · Fort Meade · MCAS New River" },
  { x1: 3255, x2: 3590, text: "Married in June. Enlisted the same year.", sub: "Gunner — November 1, 2009." },
  { x1: 3610, x2: 4090, text: "Taught myself to ship.", sub: "Cincinnati, then the jump west to Los Angeles." },
  { x1: 4110, x2: 4420, text: "First designer in, Head of Design out. Twice.", sub: "Saucey · Hush · Spin · VGV — tap the work to open it." },
  { x1: 4432, x2: 5000, text: "Nolan, 2021. Then we brought the whole line home.", sub: "Cincinnati, Ohio · 2023 — same house shape, steadier hand." },
  { a: 0.745, b: 0.83, text: "Somewhere along the way, the line stopped being something I drew —" },
  { a: 0.845, b: 0.915, text: "— and became somewhere I live.", sub: "OLO · Weaver · SignalScan · StoryMode · Mastery is Dead" },
];
