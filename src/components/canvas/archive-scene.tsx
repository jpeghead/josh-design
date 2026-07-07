"use client";

/**
 * THE DARKROOM — the Archive as a developing batch.
 *
 * A near-black room under breathing safelight red. The work hangs on wires
 * like prints in mid-development. A single golden line — the pencil line the
 * kid never stopped drawing — draws itself through the dark ahead of you,
 * looping a flourish around each batch.
 *
 * The visitor develops the archive: dwell near a print (or agitate it with
 * the pointer) and the image blooms from the paper like silver halide —
 * shadows first, a sparkling frontier, seen red under the safelight, then
 * FIXED into full warm color. Developed prints light their corner of the
 * room and stay developed. You leave having made the exhibit.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { eras, artifacts, accent, floorLabels, type Artifact } from "@/content/archive";

/* ------------------------------------------------------------ constants */

const CH = 24; // distance between batches along the walk
const ERAS = eras.length;
const DWELL = 0.8;
const WIRE_Y = 3.25; // the drying wire height
const DARK = "#0a0405"; // the room
const SAFELIGHT = "#8f1d1d";

/** Print height per era — scale is part of the story. */
const ERA_HEIGHT: Record<string, number> = {
  childhood: 1.3,
  poster: 2.2,
  military: 2.4,
  logos: 1.3,
  web: 1.7,
  app: 1.8,
  today: 1.8,
};

export type SceneRefs = {
  progress: React.RefObject<number>;
  onEra: (i: number) => void;
  onArtifact: (a: Artifact | null) => void;
  onNavigate: (href: string) => void;
  /** Development fraction (0..1) of the print in front of you, or null. */
  onDevelop?: (f: number | null) => void;
};

/* ---------------------------------------------------------------- utils */

const sideOf = (i: number) => (i % 2 === 0 ? -1 : 1);

function dwellCurve(p: number): number {
  const u = THREE.MathUtils.clamp(p, 0, 1) * (ERAS - 1);
  return u - (DWELL * Math.sin(2 * Math.PI * u)) / (2 * Math.PI);
}

function parseAspect(aspect: string): number {
  const [w, h] = aspect.split("/").map(Number);
  return w / h || 1;
}

/* --------------------------------------------------------------- layout */

type Placement = {
  pos: THREE.Vector3;
  rotY: number;
  w: number;
  h: number;
  eraIndex: number;
  swayPhase: number;
};

type EraAnchor = {
  s: number;
  center: THREE.Vector3;
  dwellPoint: THREE.Vector3;
  D: number;
  rowLen: number;
};

const GAP = 0.55;
const MAX_RANK = 11.5;

const { LAYOUT, ANCHORS } = (() => {
  const layout = new Map<string, Placement>();
  const anchors: EraAnchor[] = [];

  for (let i = 0; i < ERAS; i++) {
    const era = eras[i];
    const s = sideOf(i);
    const list = artifacts.filter((a) => a.eraId === era.id);

    const dims = list.map((a, j) => {
      const baseH = ERA_HEIGHT[era.id] ?? 1.8;
      const h = baseH * (1 + (j % 3 === 1 ? 0.08 : j % 3 === 2 ? -0.07 : 0));
      const w = Math.min(h * parseAspect(a.aspect), 4.2);
      return { w, h };
    });

    // ranks (front + set-back) for crowded batches
    const ranks: number[][] = [[]];
    let len = 0;
    dims.forEach((d, j) => {
      if (len + d.w > MAX_RANK && ranks[ranks.length - 1].length > 0) {
        ranks.push([]);
        len = 0;
      }
      ranks[ranks.length - 1].push(j);
      len += d.w + GAP;
    });
    const rankLen = (r: number[]) => r.reduce((t, j) => t + dims[j].w, 0) + GAP * (r.length - 1);
    const widest = Math.max(...ranks.map(rankLen));

    const D = THREE.MathUtils.clamp(2.6 + widest * 0.56, 4, 10);
    const center = new THREE.Vector3(s * D, 0, -i * CH);
    const dwellPoint = new THREE.Vector3(s * 0.55, 1.6, -i * CH + 0.3);
    anchors.push({ s, center, dwellPoint, D, rowLen: widest });

    ranks.forEach((rank, r) => {
      const L = rankLen(rank);
      let cursor = -L / 2;
      rank.forEach((j) => {
        const a = list[j];
        const { w, h } = dims[j];
        const zOff = cursor + w / 2;
        cursor += w + GAP;
        const pos = new THREE.Vector3(
          center.x + s * (r * 1.5 + ((j % 2) * 0.22)),
          WIRE_Y - 0.22 - h / 2, // hanging: tops aligned under the wire
          center.z + zOff + (r % 2 ? 0.4 : 0)
        );
        // face the path (plane normal toward walk axis), slight jitter
        const rotY = s * (Math.PI / 2) * -1 + (((j * 29) % 7) / 70 - 0.05) * -s;
        layout.set(a.id, { pos, rotY, w, h, eraIndex: i, swayPhase: (j * 137) % 10 });
      });
    });
  }
  return { LAYOUT: layout, ANCHORS: anchors };
})();

const eraAnchors = (i: number) => ANCHORS[i];

/** Shared, mutable development state — grows, never shrinks. */
const DEVELOP: Record<string, number> = {};
artifacts.forEach((a) => (DEVELOP[a.id] = 0));
/** Mean development per era (drives the room lights). */
function eraDevelopment(i: number): number {
  const list = artifacts.filter((a) => a.eraId === eras[i].id);
  return list.reduce((t, a) => t + (DEVELOP[a.id] ?? 0), 0) / Math.max(list.length, 1);
}

/* ------------------------------------------------------ textures/shader */

function makePlaceholderTexture(a: Artifact): THREE.CanvasTexture {
  const r = parseAspect(a.aspect);
  const W = 512;
  const H = Math.round(W / r);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  // blank photo paper, annotated in red grease pencil
  g.fillStyle = "#efe8da";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(140,30,30,0.75)";
  g.setLineDash([12, 9]);
  g.lineWidth = 3;
  g.strokeRect(20, 20, W - 40, H - 40);
  g.setLineDash([]);
  g.fillStyle = "rgba(140,30,30,0.8)";
  g.font = "600 17px ui-monospace, monospace";
  g.textAlign = "center";
  g.fillText("AWAITING SCAN", W / 2, H / 2 - 14);
  g.font = `italic 700 ${Math.min(30, W / 12)}px Georgia, serif`;
  g.fillText(a.title, W / 2, H / 2 + 24, W - 90);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function usePrintTexture(a: Artifact): THREE.Texture | null {
  const [map, setMap] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!a.image) {
      const t = makePlaceholderTexture(a);
      setMap(t);
      return () => t.dispose();
    }
    let live = true;
    let tex: THREE.Texture | null = null;
    new THREE.TextureLoader().load(a.image, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      if (live) {
        tex = t;
        setMap(t);
      } else t.dispose();
    });
    return () => {
      live = false;
      tex?.dispose();
    };
  }, [a]);
  return map;
}

/** The silver-halide development shader. */
const DEVELOP_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const DEVELOP_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uReveal;   // 0 → blank wet paper, 1 → fixed print
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int k = 0; k < 3; k++) { v += a * vnoise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

    // paper border like a real print
    float b = 0.035;
    float inImage = step(b, vUv.x) * step(vUv.x, 1.0 - b) * step(b, vUv.y) * step(vUv.y, 1.0 - b);

    // dense (dark) areas develop first, noise breaks the frontier
    float field = fbm(vUv * 5.0) * 0.55 + (1.0 - lum) * 0.45;
    float d = smoothstep(0.06, 0.0, field - uReveal * 1.18);

    // safelight phase → fixer phase
    float fixed_ = smoothstep(0.7, 1.0, uReveal);
    vec3 underRed = tex.rgb * vec3(0.8, 0.1, 0.08) + vec3(0.02, 0.0, 0.0);
    vec3 img = mix(underRed, tex.rgb * 1.06, fixed_);

    // wet blank paper, faint red sheen
    vec3 blank = vec3(0.014, 0.005, 0.005);
    // paper border develops toward warm white
    vec3 border = mix(vec3(0.026, 0.009, 0.008), vec3(0.86, 0.8, 0.68), d * (0.25 + 0.75 * fixed_));

    // sparkling development frontier
    float frontier = smoothstep(0.0, 0.09, d) * (1.0 - smoothstep(0.09, 0.5, d)) * (1.0 - fixed_);
    vec3 sparkle = frontier * vec3(1.0, 0.55, 0.25)
      * (0.3 + 0.45 * vnoise(vUv * 90.0 + uTime * 2.0));

    vec3 col = mix(border, mix(blank, img, d) + sparkle, inImage);
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Golden line that draws itself: discard beyond the head. */
const LINE_FRAG = /* glsl */ `
  uniform float uHead;
  uniform float uGlow;
  varying vec2 vUv;
  void main() {
    if (vUv.x > uHead) discard;
    float tail = smoothstep(uHead - 0.02, uHead, vUv.x); // bright tip
    vec3 gold = vec3(0.82, 0.64, 0.3) * (0.85 + tail * 1.6);
    gl_FragColor = vec4(gold * uGlow, uGlow >= 1.0 ? 1.0 : 0.32);
  }
`;

/* ------------------------------------------------------------ the line */

function buildBaseCurve(): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  pts.push(new THREE.Vector3(-4.2, 0.25, 10.5));
  pts.push(new THREE.Vector3(-2.6, 0.5, 8.5));
  for (let i = 0; i < ERAS; i++) {
    const { s, center, rowLen } = eraAnchors(i);
    const z = -i * CH;
    pts.push(new THREE.Vector3(-s * 1.6, 1.35 + (i % 2) * 0.5, z + CH * 0.55));
    const lx = center.x - s * 1.1;
    const half = Math.min(rowLen / 2 + 0.8, 6);
    pts.push(new THREE.Vector3(lx, WIRE_Y + 0.35, z + half * 0.7));
    pts.push(new THREE.Vector3(lx - s * 0.7, WIRE_Y + 0.75, z));
    pts.push(new THREE.Vector3(lx, WIRE_Y + 0.3, z - half * 0.7));
    pts.push(new THREE.Vector3(-s * 1.2, 1.5, z - CH * 0.38));
  }
  pts.push(new THREE.Vector3(0, 1.5, -(ERAS - 1) * CH - 7));
  pts.push(new THREE.Vector3(0, 2.1, -(ERAS - 1) * CH - 13));
  return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.35);
}

const BASE_CURVE = buildBaseCurve();

/** Find the curve parameter closest to a world z (the walk runs along -z). */
function tAtZ(z: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let k = 0; k <= 400; k++) {
    const t = k / 400;
    const d = Math.abs(BASE_CURVE.getPointAt(t).z - z);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

/** Birth points on the braid: Gunner (Nov 2009, NC), Nolan (2021, LA). */
const T_GUNNER = tAtZ(-53);
const T_NOLAN = tAtZ(-127);

/**
 * A thread of the family braid: the base path offset by a rotating radius —
 * two big threads intertwined the whole way, kid threads orbiting wider
 * from their birth point onward.
 */
function buildThread(phase: number, radius: number, tStart = 0): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const N = 420;
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3();
  const upv = new THREE.Vector3();
  for (let k = 0; k <= N; k++) {
    const t = tStart + (1 - tStart) * (k / N);
    const P = BASE_CURVE.getPointAt(t);
    const T = BASE_CURVE.getTangentAt(t);
    side.crossVectors(T, up).normalize();
    upv.crossVectors(side, T).normalize();
    const theta = t * Math.PI * 26 + phase;
    // birth: kid threads flare out of the braid, then settle into orbit
    const flare = tStart > 0 ? THREE.MathUtils.smoothstep((t - tStart) / 0.03, 0, 1) : 1;
    const r = radius * flare;
    P.addScaledVector(side, Math.cos(theta) * r).addScaledVector(upv, Math.sin(theta) * r);
    pts.push(P);
  }
  return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.1);
}

type ThreadSpec = {
  id: string;
  phase: number;
  radius: number;
  tube: number;
  color: string;
  glowColor: string;
  tStart: number;
};

const THREADS: ThreadSpec[] = [
  // Josh — gold. Samantha — rose. Together since junior year, the whole way.
  { id: "josh", phase: 0, radius: 0.085, tube: 0.011, color: "0.82, 0.64, 0.30", glowColor: "0.82, 0.64, 0.30", tStart: 0 },
  { id: "sam", phase: Math.PI, radius: 0.085, tube: 0.011, color: "0.85, 0.42, 0.34", glowColor: "0.85, 0.42, 0.34", tStart: 0 },
  // The boys — brighter, smaller, orbiting wider.
  { id: "gunner", phase: Math.PI / 2, radius: 0.19, tube: 0.006, color: "1.0, 0.86, 0.55", glowColor: "1.0, 0.86, 0.55", tStart: T_GUNNER },
  { id: "nolan", phase: (3 * Math.PI) / 2, radius: 0.19, tube: 0.006, color: "1.0, 0.86, 0.55", glowColor: "1.0, 0.86, 0.55", tStart: T_NOLAN },
];

function threadFrag(color: string) {
  return `
  uniform float uHead;
  uniform float uGlow;
  varying vec2 vUv;
  void main() {
    if (vUv.x > uHead) discard;
    float tail = smoothstep(uHead - 0.02, uHead, vUv.x);
    vec3 c = vec3(${color}) * (0.85 + tail * 1.6);
    gl_FragColor = vec4(c * uGlow, uGlow >= 1.0 ? 1.0 : 0.32);
  }`;
}

function FamilyBraid({ refs }: { refs: SceneRefs }) {
  const mats = useRef<THREE.ShaderMaterial[]>([]);

  const threads = useMemo(
    () =>
      THREADS.map((spec) => {
        const curve = buildThread(spec.phase, spec.radius, spec.tStart);
        return {
          spec,
          coreGeo: new THREE.TubeGeometry(curve, 1000, spec.tube, 5, false),
          glowGeo: new THREE.TubeGeometry(curve, 500, spec.tube * 2.8, 5, false),
        };
      }),
    []
  );

  useFrame(() => {
    const p = THREE.MathUtils.clamp(refs.progress.current ?? 0, 0, 1);
    const head = THREE.MathUtils.clamp(p * 0.94 + 0.055, 0, 1);
    for (const m of mats.current) {
      if (!m) continue;
      const tStart = m.userData.tStart as number;
      // kid threads draw on their own clock, from birth
      m.uniforms.uHead.value =
        tStart > 0 ? THREE.MathUtils.clamp((head - tStart) / (1 - tStart), 0, 1) : head;
    }
  });

  let mi = 0;
  return (
    <>
      {threads.map(({ spec, coreGeo, glowGeo }) => (
        <group key={spec.id}>
          <mesh geometry={coreGeo}>
            <shaderMaterial
              ref={(el: THREE.ShaderMaterial | null) => {
                if (el) {
                  el.userData.tStart = spec.tStart;
                  mats.current[mi++] = el;
                }
              }}
              vertexShader={DEVELOP_VERT}
              fragmentShader={threadFrag(spec.color)}
              uniforms={{ uHead: { value: 0 }, uGlow: { value: 1.0 } }}
            />
          </mesh>
          <mesh geometry={glowGeo}>
            <shaderMaterial
              ref={(el: THREE.ShaderMaterial | null) => {
                if (el) {
                  el.userData.tStart = spec.tStart;
                  mats.current[mi++] = el;
                }
              }}
              vertexShader={DEVELOP_VERT}
              fragmentShader={threadFrag(spec.glowColor)}
              uniforms={{ uHead: { value: 0 }, uGlow: { value: 0.33 } }}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
      {/* the wedding ring — 2008, the year everything doubled down */}
      <mesh position={BASE_CURVE.getPointAt(tAtZ(-44)).toArray()} rotation={[Math.PI / 2.6, 0.4, 0]}>
        <torusGeometry args={[0.34, 0.022, 10, 48]} />
        <meshStandardMaterial
          color="#c8a24b"
          emissive="#c8a24b"
          emissiveIntensity={0.9}
          roughness={0.25}
          metalness={0.9}
        />
      </mesh>
    </>
  );
}

/* ----------------------------------------------------- floor tape labels */

function makeLabelTexture(text: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 96;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 1024, 96);
  g.font = "600 34px ui-monospace, monospace";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const grd = g.createLinearGradient(0, 0, 1024, 0);
  grd.addColorStop(0, "rgba(190,120,80,0)");
  grd.addColorStop(0.5, "rgba(215,150,95,0.95)");
  grd.addColorStop(1, "rgba(190,120,80,0)");
  g.fillStyle = grd;
  g.fillText(text.toUpperCase(), 512, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function FloorLabels() {
  const labels = useMemo(
    () =>
      floorLabels.map((l) => ({
        ...l,
        tex: makeLabelTexture(l.text),
        w: Math.min(3.2 + l.text.length * 0.075, 9),
      })),
    []
  );
  return (
    <>
      {labels.map((l, i) => (
        <mesh
          key={i}
          position={[i % 2 === 0 ? -0.4 : 0.4, 0.02, l.z]}
          rotation={[-Math.PI / 2, 0, (i % 2 === 0 ? 1 : -1) * 0.06]}
        >
          <planeGeometry args={[l.w, l.w * 0.094]} />
          <meshBasicMaterial map={l.tex} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* --------------------------------------------- remote years: the signals */

function SignalPulses() {
  const HOME = useMemo(() => new THREE.Vector3(1.6, 2.0, -114), []);
  const FAR = useMemo(() => new THREE.Vector3(-17, 3.4, -124), []);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        HOME,
        new THREE.Vector3(-7, 4.6, -118),
        FAR,
      ]),
    [HOME, FAR]
  );
  const lineGeo = useMemo(() => new THREE.TubeGeometry(curve, 100, 0.004, 4, false), [curve]);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const N = 7;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const m = pulses.current[i];
      if (!m) continue;
      const out = i % 2 === 0; // work goes out, home pulls back
      let f = (t * 0.11 + i / N) % 1;
      if (!out) f = 1 - f;
      curve.getPointAt(f, m.position);
      const s = 0.5 + Math.sin(t * 5 + i) * 0.2;
      m.scale.setScalar(s);
    }
  });

  return (
    <group>
      <mesh geometry={lineGeo}>
        <meshBasicMaterial color="#5c4a33" transparent opacity={0.5} />
      </mesh>
      {Array.from({ length: N }, (_, i) => (
        <mesh
          key={i}
          ref={(el: THREE.Mesh | null) => {
            pulses.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#e2c078" : "#f1ece2"} />
        </mesh>
      ))}
      {/* the far city — a cold glow you never move to */}
      <mesh position={FAR}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#9fb9d9" />
      </mesh>
      <pointLight position={FAR} color="#7fa0c9" intensity={2.2} distance={9} decay={1.8} />
    </group>
  );
}

/* ------------------------------------------------------- the home beacon */

function HomeBeacon() {
  const light = useRef<THREE.PointLight>(null!);
  useFrame(({ clock }) => {
    if (light.current)
      light.current.intensity = 2.6 + Math.sin(clock.elapsedTime * 1.1) * 0.5;
  });
  const z = -(ERAS - 1) * CH - 11;
  return (
    <group position={[0, 0, z]}>
      {/* a porch light in the dark — where it started, where it ends */}
      <mesh position={[0, 2.6, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#ffd9a0" />
      </mesh>
      <pointLight ref={light} position={[0, 2.6, 0]} color="#ffd9a0" distance={14} decay={1.6} intensity={2.6} />
    </group>
  );
}

/* -------------------------------------------------------------- prints */

function Print({ a, refs }: { a: Artifact; refs: SceneRefs }) {
  const map = usePrintTexture(a);
  const group = useRef<THREE.Group>(null!);
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const agit = useRef(0);
  const place = LAYOUT.get(a.id)!;
  const { w, h } = place;

  const uniforms = useMemo(
    () => ({
      uMap: { value: null as THREE.Texture | null },
      uReveal: { value: 0 },
      uTime: { value: 0 },
    }),
    []
  );
  useEffect(() => {
    uniforms.uMap.value = map;
  }, [map, uniforms]);

  useFrame(({ camera, clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;

    // gentle clothesline sway; agitation kicks it
    g.rotation.z = Math.sin(t * 0.55 + place.swayPhase) * 0.018 + agit.current * Math.sin(t * 9) * 0.02;
    agit.current = Math.max(0, agit.current - delta * 1.4);

    // development: dwell develops slowly, agitation develops fast
    const d = g.position.distanceTo(camera.position);
    const near = THREE.MathUtils.clamp(1 - d / 7.5, 0, 1);
    const rate = near * near * 0.22 + agit.current * near * 1.1;
    if (rate > 0.001 && map) {
      DEVELOP[a.id] = Math.min(1, DEVELOP[a.id] + rate * delta * 1.6);
    }
    if (mat.current) {
      mat.current.uniforms.uReveal.value = DEVELOP[a.id];
      mat.current.uniforms.uTime.value = t;
    }
  });

  return (
    <group ref={group} position={place.pos} rotation={[0, place.rotY, 0]}>
      {/* hanging strings + clips */}
      {([-1, 1] as const).map((e) => (
        <group key={e}>
          <mesh position={[e * (w / 2 - 0.12), h / 2 + 0.12, 0]}>
            <cylinderGeometry args={[0.0045, 0.0045, 0.24, 4]} />
            <meshBasicMaterial color="#3a3129" />
          </mesh>
          <mesh position={[e * (w / 2 - 0.12), h / 2 + 0.02, 0.006]}>
            <boxGeometry args={[0.05, 0.09, 0.028]} />
            <meshStandardMaterial color="#7a4c22" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* the print itself — develops under your attention */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = a.href ? "pointer" : "default";
          refs.onArtifact(a);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          agit.current = Math.min(1.2, agit.current + 0.08); // agitate to develop
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
          refs.onArtifact(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (a.href && DEVELOP[a.id] > 0.35) refs.onNavigate(a.href);
        }}
      >
        <planeGeometry args={[w, h]} />
        <shaderMaterial
          ref={mat}
          vertexShader={DEVELOP_VERT}
          fragmentShader={DEVELOP_FRAG}
          uniforms={uniforms}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------- wires + room glow */

function Wires() {
  return (
    <>
      {eras.map((era, i) => {
        const { center, rowLen } = eraAnchors(i);
        return (
          <mesh
            key={era.id}
            position={[center.x, WIRE_Y, center.z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.008, 0.008, rowLen + 2.4, 5]} />
            <meshStandardMaterial color="#4a4038" roughness={0.6} metalness={0.6} />
          </mesh>
        );
      })}
    </>
  );
}

/** Per-era room light: red pool → warms as its prints develop. */
function BatchLights() {
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  const red = useMemo(() => new THREE.Color(SAFELIGHT), []);
  const warms = useMemo(() => eras.map((e) => new THREE.Color(e.light)), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(({ camera }) => {
    for (let i = 0; i < ERAS; i++) {
      const L = lights.current[i];
      if (!L) continue;
      const dev = eraDevelopment(i);
      const dz = Math.abs(-i * CH - camera.position.z);
      const near = THREE.MathUtils.clamp(1 - dz / (CH * 1.2), 0, 1);
      tmp.copy(red).lerp(warms[i], dev);
      L.color.copy(tmp);
      L.intensity = (1.2 + dev * 5.5) * (0.25 + near * near);
    }
  });

  return (
    <>
      {eras.map((era, i) => {
        const { s, center } = eraAnchors(i);
        return (
          <pointLight
            key={era.id}
            ref={(el: THREE.PointLight | null) => {
              lights.current[i] = el;
            }}
            position={[center.x - s * 1.8, WIRE_Y + 1.1, center.z]}
            distance={16}
            decay={1.7}
            intensity={1}
            color={SAFELIGHT}
          />
        );
      })}
    </>
  );
}

/* ----------------------------------------------------------------- dust */

function Dust() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const n = 1700;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 22;
      arr[i * 3 + 1] = Math.random() * 5;
      arr[i * 3 + 2] = 14 - Math.random() * (ERAS * CH + 34);
    }
    return arr;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = Math.sin(clock.elapsedTime * 0.09) * 0.28;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        sizeAttenuation
        transparent
        opacity={0.5}
        color="#b3402f"
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* --------------------------------------------------------------- finale */

function Finale({ refs }: { refs: SceneRefs }) {
  const group = useRef<THREE.Points>(null!);
  const zC = -(ERAS - 1) * CH - 9;
  const [positions, colors] = useMemo(() => {
    const n = 3400;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const palette = [
      new THREE.Color(accent),
      new THREE.Color(accent),
      new THREE.Color("#e2c078"),
      new THREE.Color(SAFELIGHT),
      new THREE.Color("#f1ece2"),
    ];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = 2.2 + Math.random() * 3.4;
      pos[i * 3] = Math.cos(a) * rad * (0.7 + Math.random() * 0.6);
      pos[i * 3 + 1] = 1.7 + (Math.random() - 0.5) * 3.2;
      pos[i * 3 + 2] = zC + Math.sin(a) * rad * 0.5 - Math.random() * 3;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [zC]);

  useFrame(({ clock, pointer }) => {
    const g = group.current;
    if (!g) return;
    const p = refs.progress.current ?? 0;
    const active = THREE.MathUtils.clamp((p - 0.85) / 0.15, 0, 1);
    g.rotation.y = clock.elapsedTime * (0.03 + active * 0.13);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pointer.y * 0.12 * active, 0.04);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -pointer.x * 0.16 * active, 0.04);
  });

  return (
    <points ref={group}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ rig */

function Rig({ refs }: { refs: SceneRefs }) {
  const { scene, camera } = useThree();
  const safelight = useRef<THREE.PointLight>(null!);
  const lastEra = useRef(-1);
  const nearest = useRef<string | null>(null);
  const lastDev = useRef(-1);
  const gaze = useMemo(() => new THREE.Vector3(), []);
  const bg = useMemo(() => new THREE.Color(DARK), []);

  useMemo(() => {
    scene.background = bg;
    scene.fog = new THREE.Fog(DARK, 5, 30);
  }, [scene, bg]);

  useFrame(({ clock, pointer }) => {
    const p = THREE.MathUtils.clamp(refs.progress.current ?? 0, 0, 1);
    const e = dwellCurve(p);
    const i = Math.round(THREE.MathUtils.clamp(e, 0, ERAS - 1));
    const { dwellPoint, center } = eraAnchors(i);

    const lead = 1 - THREE.MathUtils.smoothstep(p, 0, 0.05);
    const presence = THREE.MathUtils.clamp(1 - Math.abs(e - i) * 2.2, 0, 1) * (1 - lead);
    const w = presence * presence * (3 - 2 * presence);

    const z = 2 - e * CH + lead * 10;
    const x = THREE.MathUtils.lerp(0, dwellPoint.x, w) + pointer.x * 0.22;
    const y = 1.62 + Math.sin(e * Math.PI * 2) * 0.04 * (1 - w) + pointer.y * 0.12;
    camera.position.set(x, y, z);

    const ahead = 1 - w;
    gaze.set(
      center.x * w + x * ahead * 0.3,
      (WIRE_Y - 0.9) * w + 1.5 * ahead,
      (center.z - 0.2) * w + (z - 10) * ahead
    );
    camera.lookAt(gaze);

    // breathing safelight travels with you
    if (safelight.current) {
      safelight.current.position.set(x * 0.6, 2.9, z - 2.2);
      safelight.current.intensity = 2.1 + Math.sin(clock.elapsedTime * 1.7) * 0.35;
    }

    if (i !== lastEra.current) {
      lastEra.current = i;
      refs.onEra(i);
    }

    // nearest print + its development fraction → HUD
    let best: Artifact | null = null;
    if (w > 0.4) {
      let bestD = 9;
      for (const a of artifacts) {
        const pl = LAYOUT.get(a.id)!;
        if (pl.eraIndex !== i) continue;
        const d = pl.pos.distanceTo(camera.position);
        if (d < bestD) {
          bestD = d;
          best = a;
        }
      }
    }
    const id = best?.id ?? null;
    if (id !== nearest.current) {
      nearest.current = id;
      refs.onArtifact(best);
      lastDev.current = -1;
    }
    if (refs.onDevelop) {
      const f = best ? DEVELOP[best.id] : null;
      const q = f === null ? null : Math.round(f * 20) / 20;
      if (q !== lastDev.current) {
        lastDev.current = q ?? -1;
        refs.onDevelop(q);
      }
    }

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__archiveDebug = {
        p,
        era: i,
        w: +w.toFixed(2),
        cam: camera.position.toArray().map((n) => +n.toFixed(1)),
        dev: best ? +DEVELOP[best.id].toFixed(2) : null,
      };
    }
  });

  return (
    <>
      <ambientLight intensity={0.32} color="#4a1210" />
      {/* the breathing safelight */}
      <pointLight ref={safelight} color={SAFELIGHT} distance={18} decay={1.5} intensity={2} />
      {/* floor — wet darkroom concrete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (-(ERAS - 1) * CH) / 2]}>
        <planeGeometry args={[80, ERAS * CH + 90]} />
        <meshStandardMaterial color="#120809" roughness={0.4} metalness={0.35} />
      </mesh>
    </>
  );
}

/* ---------------------------------------------------------------- scene */

export function ArchiveScene({ refs }: { refs: SceneRefs }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 50, near: 0.1, far: 80, position: [0, 1.62, 12] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0 }}
      aria-hidden
    >
      <Rig refs={refs} />
      <FamilyBraid refs={refs} />
      <FloorLabels />
      <SignalPulses />
      <HomeBeacon />
      <Wires />
      <BatchLights />
      {artifacts.map((a) => (
        <Print key={a.id} a={a} refs={refs} />
      ))}
      <Dust />
      <Finale refs={refs} />
      <EffectComposer>
        <Bloom intensity={0.85} luminanceThreshold={0.5} mipmapBlur />
        <Noise opacity={0.06} />
        <Vignette darkness={0.72} offset={0.22} />
      </EffectComposer>
    </Canvas>
  );
}
