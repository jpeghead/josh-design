"use client";

/**
 * WHITEHEAD CITY — a GTA-style open world of one life.
 *
 * Third person. WASD/arrows to move, SHIFT to run, E to enter/exit the car,
 * W/S throttle & brake, A/D steer. Drive into the gold column to start a
 * mission; follow the blue column; MISSION PASSED rolls the year forward.
 * Eternal sunset, neon strip, minimap, district name cards. Ten missions,
 * 1993 → now.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { Environment, Preload, useProgress } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider, useRapier, type RapierRigidBody } from "@react-three/rapier";
import { detectTier, type CanvasTier } from "../canvas/capability";
import { DesktopOverlay, type DeskRect } from "./desktop";
import {
  House,
  HOUSE,
  HOUSE_WALLS,
  FURNITURE,
  RELICS,
  DOORS,
  insideHouse,
  SEAT_POS,
  SCREEN,
  STAND,
  DESK_SPOT,
} from "./house";
import { startAmbience, setAmbienceInside, sfxFootstep, sfxJump, sfxLand } from "./ambience";
import { retroFacade, retroAsphalt, retroSidewalk, retroConcrete } from "./retro";
import { WEAPON, FIRE, RANGE, RANGE_SCORE, ViewModel, Shooter, ShotFX, Range } from "./weapons";
import {
  BUILDINGS,
  DISTRICTS,
  LANDMARKS,
  MISSIONS,
  ROADS_X,
  ROADS_Z,
  ROAD,
  districtAt,
} from "./world";

/* ------------------------------------------------------------- shared */

const WORLD_HALF = 790;

const SEAT_LOOK = new THREE.Vector3(SCREEN.cx, SCREEN.cy, SCREEN.cz);

/** the story card shown after inspecting a relic (E near one) */
const CAPTION = { title: "", body: "", until: 0 };

/** rolling frame stats — shown by the ?fps=1 overlay */
const PERF = { fps: 0, worstMs: 0, py: 0, grounded: true };

function FrameStats() {
  const acc = useRef({ t: 0, n: 0, worst: 0 });
  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt;
    a.n += 1;
    a.worst = Math.max(a.worst, dt);
    if (a.t >= 0.5) {
      PERF.fps = Math.round(a.n / a.t);
      PERF.worstMs = Math.round(a.worst * 1000);
      PERF.py = Math.round(PHYS.py * 100) / 100;
      PERF.grounded = PHYS.grounded;
      a.t = 0;
      a.n = 0;
      a.worst = 0;
    }
  });
  return null;
}

/** DOM side of the fps overlay — polls PERF so the canvas never re-renders */
function FpsReadout() {
  const [v, setV] = useState({ fps: 0, worstMs: 0, py: 0, grounded: true });
  useEffect(() => {
    const id = setInterval(() => setV({ ...PERF }), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-40 font-mono text-[12px] text-[#7dff9a]" style={{ textShadow: "0 1px 4px #000" }}>
      {v.fps} fps · worst {v.worstMs} ms · y {v.py} {v.grounded ? "G" : "A"}
    </div>
  );
}

function nearestRelic(x: number, z: number) {
  let best: (typeof RELICS)[number] | null = null;
  let bestD = Infinity;
  for (const r of RELICS) {
    const d = Math.hypot(x - r.x, z - r.z);
    if (d < r.r && d < bestD) {
      best = r;
      bestD = d;
    }
  }
  return best;
}
const CAR_START = { x: 719, z: 363.5 }; // the driveway, past the porch
const EYE = 5.2; // 6'1" player, 3 units = 1 m

/** first-person look state — written by pointer-lock mouse, read by Sim */
const LOOK = { yaw: 0, pitch: -0.04, locked: false, fallback: false };

type Mode = "foot" | "car";

type GameState = {
  mode: Mode;
  px: number;
  pz: number;
  pHeading: number;
  cx: number;
  cz: number;
  cHeading: number;
  cSpeed: number;
  mission: number; // index into MISSIONS; -1 before first
  step: number;
  phase: "roam" | "brief" | "active" | "passed" | "credits";
  phaseT: number;
  deskMode: "desk" | "toWorld" | "world" | "toDesk";
  deskT: number; // 0 = seated at the screen, 1 = standing in the world
};

const G: GameState = {
  mode: "foot",
  px: STAND.x,
  pz: STAND.z,
  pHeading: 0,
  cx: CAR_START.x,
  cz: CAR_START.z,
  cHeading: 0,
  cSpeed: 0,
  mission: -1,
  step: 0,
  phase: "roam",
  phaseT: 0,
  deskMode: "desk",
  deskT: 0,
};

const keys: Record<string, boolean> = {};

/** cross-component physics requests (input handlers live outside the Canvas) */
const PHYS = {
  playerTeleport: null as [number, number] | null,
  carTeleport: null as [number, number] | null,
  footSpeed: 0,
  py: 2.75, // body center height (2.75 = standing on the ground plane)
  grounded: true,
};

/** one place to tune the drive feel */
const CAR_TUNE = {
  engineForce: 2600,
  brakeForce: 6,
  maxSteer: 0.52,
  suspensionRest: 0.85,
  suspensionStiffness: 34,
  wheelRadius: 0.95,
  wheelFriction: 2.2,
};

/* ------------------------------------------------------- procedural tex */

function windowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1a1d24";
  g.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 122; y += 12) {
    for (let x = 6; x < 58; x += 12) {
      const lit = Math.random() < 0.42;
      g.fillStyle = lit ? (Math.random() < 0.3 ? "#ffd9a0" : "#9fb9d9") : "#242832";
      g.fillRect(x, y, 7, 8);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function roadTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#20242a";
  g.fillRect(0, 0, 64, 256);
  g.fillStyle = "#c9b98a";
  g.fillRect(29, 24, 6, 68);
  g.fillRect(29, 160, 6, 68);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, "rgba(255,214,160,0.9)");
  grad.addColorStop(1, "rgba(255,214,160,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function signTexture(label: string, hue: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0c0f14";
  g.fillRect(0, 0, 256, 64);
  g.font = "900 34px Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = hue;
  g.shadowBlur = 18;
  g.fillStyle = hue;
  g.fillText(label, 128, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function siteScreenTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 304;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f4eee2";
  g.fillRect(0, 0, 512, 304);
  g.fillStyle = "#26221b";
  g.font = "italic 700 64px Georgia, serif";
  g.fillText("Josh", 36, 120);
  g.fillText("Whitehead", 36, 186);
  g.fillStyle = "#8a8172";
  for (let i = 0; i < 3; i++) g.fillRect(36, 222 + i * 18, 300 - i * 60, 8);
  g.fillStyle = "#C8A24B";
  g.fillRect(36, 282, 90, 10);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* --------------------------------------------------------------- city */

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {},
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          varying vec3 vP;
          void main(){
            float h = normalize(vP).y;
            vec3 top = vec3(0.13,0.09,0.25);
            vec3 mid = vec3(0.85,0.38,0.34);
            vec3 low = vec3(1.0,0.72,0.42);
            vec3 c = h > 0.25 ? mix(mid, top, smoothstep(0.25, 0.9, h))
                              : mix(low, mid, smoothstep(-0.05, 0.25, h));
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    []
  );
  return (
    <mesh material={mat}>
      <sphereGeometry args={[2600, 24, 16]} />
    </mesh>
  );
}

/** shadow-casting sun that follows the player so shadows stay crisp */
function ShadowSun() {
  const ref = useRef<THREE.DirectionalLight>(null!);
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const L = ref.current;
    if (!L) return;
    L.position.set(G.px - 140, 190, G.pz + 90);
    target.position.set(G.px, 0, G.pz);
    target.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={ref}
        castShadow
        intensity={1.1}
        color="#ffb37a"
        target={target}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-camera-far={400}
        shadow-bias={-0.0004}
      />
    </>
  );
}

function Sun() {
  return (
    <mesh position={[-1800, 240, 900]}>
      <sphereGeometry args={[130, 24, 24]} />
      <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
    </mesh>
  );
}

function Ground() {
  const road = useMemo(() => retroAsphalt(1, 1), []);
  const lot = useMemo(() => retroConcrete(140, 140), []);
  return (
    <group>
      {/* ground base — worn lot concrete, tinted dark */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[3800, 3800]} />
        <meshLambertMaterial map={lot} color="#7a7c80" />
      </mesh>
      {/* water frame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[4200, 4200]} />
        <meshStandardMaterial color="#1a2340" roughness={0.25} metalness={0.4} />
      </mesh>
      {/* roads */}
      {ROADS_X.map((x) => {
        const t = road.clone();
        t.repeat.set(1, 40);
        return (
          <mesh key={"rx" + x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]}>
            <planeGeometry args={[ROAD, 1600]} />
            <meshLambertMaterial map={t} />
          </mesh>
        );
      })}
      {ROADS_Z.map((z) => {
        const t = road.clone();
        t.repeat.set(1, 40);
        return (
          <mesh key={"rz" + z} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.03, z]}>
            <planeGeometry args={[ROAD, 1600]} />
            <meshLambertMaterial map={t} />
          </mesh>
        );
      })}
      {/* runway */}
      <mesh rotation={[-Math.PI / 2, 0, 0.2]} position={[-40, 0.04, 700]}>
        <planeGeometry args={[36, 360]} />
        <meshStandardMaterial color="#171a1f" roughness={1} />
      </mesh>
    </group>
  );
}

function Buildings() {
  const texLow = useMemo(() => retroFacade(1, 1, 2), []);
  const texMid = useMemo(() => retroFacade(1, 1, 4), []);
  const texHigh = useMemo(() => retroFacade(1, 1, 8), []);
  const { low, mid, high, neon } = useMemo(() => {
    const low: typeof BUILDINGS = [];
    const mid: typeof BUILDINGS = [];
    const high: typeof BUILDINGS = [];
    const neon: typeof BUILDINGS = [];
    for (const b of BUILDINGS) {
      if (b.neon) neon.push(b);
      else if (b.h < 26) low.push(b);
      else if (b.h < 70) mid.push(b);
      else high.push(b);
    }
    return { low, mid, high, neon };
  }, []);

  const lowRef = useRef<THREE.InstancedMesh>(null!);
  const midRef = useRef<THREE.InstancedMesh>(null!);
  const highRef = useRef<THREE.InstancedMesh>(null!);
  const neonRef = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    const fill = (ref: React.RefObject<THREE.InstancedMesh>, list: typeof BUILDINGS, neonTint = false) => {
      if (!ref.current) return;
      list.forEach((b, i) => {
        m.makeScale(b.w, b.h, b.d);
        m.setPosition(b.x, b.h / 2, b.z);
        ref.current!.setMatrixAt(i, m);
        if (neonTint) {
          const hues = ["#ff5f9e", "#37d3d3", "#c884ff", "#ffb84d"];
          ref.current!.setColorAt(i, c.set(hues[i % hues.length]));
        } else {
          ref.current!.setColorAt(i, c.setRGB(...b.color));
        }
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    };
    fill(lowRef, low);
    fill(midRef, mid);
    fill(highRef, high);
    fill(neonRef, neon, true);
  }, [low, mid, high, neon]);

  return (
    <group>
      <instancedMesh ref={lowRef} args={[undefined, undefined, low.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial map={texLow} />
      </instancedMesh>
      <instancedMesh ref={midRef} args={[undefined, undefined, mid.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial map={texMid} />
      </instancedMesh>
      <instancedMesh ref={highRef} args={[undefined, undefined, high.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial map={texHigh} />
      </instancedMesh>
      <instancedMesh ref={neonRef} args={[undefined, undefined, neon.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial map={texMid} emissive="#ffffff" emissiveIntensity={0.12} />
      </instancedMesh>
    </group>
  );
}

function Sidewalks() {
  const walkX = useMemo(() => retroSidewalk(1, 260), []);
  const walkZ = useMemo(() => retroSidewalk(260, 1), []);
  return (
    <group>
      {ROADS_X.map((x) => (
        <group key={"sx" + x}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x - ROAD / 2 - 3, 0.05, 0]}>
            <planeGeometry args={[6, 1600]} />
            <meshLambertMaterial map={walkX} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x + ROAD / 2 + 3, 0.05, 0]}>
            <planeGeometry args={[6, 1600]} />
            <meshLambertMaterial map={walkX} />
          </mesh>
        </group>
      ))}
      {ROADS_Z.map((z) => (
        <group key={"sz" + z}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, z - ROAD / 2 - 3]}>
            <planeGeometry args={[1600, 6]} />
            <meshLambertMaterial map={walkZ} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, z + ROAD / 2 + 3]}>
            <planeGeometry args={[1600, 6]} />
            <meshLambertMaterial map={walkZ} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** distant skyline ring — depth beyond the playable island */
function Skyline() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const spots = useMemo(() => {
    const out: { x: number; z: number; w: number; h: number }[] = [];
    const r = mulberrySky(777);
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2 + r() * 0.06;
      const rad = 1500 + r() * 350;
      out.push({ x: Math.cos(a) * rad, z: Math.sin(a) * rad, w: 40 + r() * 90, h: 60 + r() * 220 });
    }
    return out;
  }, []);
  useEffect(() => {
    const m = new THREE.Matrix4();
    spots.forEach((sp, i) => {
      m.makeScale(sp.w, sp.h, sp.w);
      m.setPosition(sp.x, sp.h / 2 - 8, sp.z);
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, spots.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#231b33" />
    </instancedMesh>
  );
}

function mulberrySky(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function Palms() {
  const trunks = useRef<THREE.InstancedMesh>(null!);
  const heads = useRef<THREE.InstancedMesh>(null!);
  const spots = useMemo(() => {
    const out: [number, number, number][] = [];
    // strip boulevard + coast
    for (let z = -120; z <= 520; z += 46) out.push([-740, z, 7 + (z % 3)]);
    for (let z = -80; z <= 480; z += 60) out.push([-458, z, 6 + (z % 3)]);
    for (let x = -700; x <= 100; x += 64) out.push([x, 770, 7]);
    return out;
  }, []);

  useEffect(() => {
    const m = new THREE.Matrix4();
    spots.forEach(([x, z, h], i) => {
      m.makeScale(1, h, 1);
      m.setPosition(x, h / 2, z);
      trunks.current.setMatrixAt(i, m);
      m.makeScale(4.6, 2.4, 4.6);
      m.setPosition(x, h + 0.6, z);
      heads.current.setMatrixAt(i, m);
    });
    trunks.current.instanceMatrix.needsUpdate = true;
    heads.current.instanceMatrix.needsUpdate = true;
  }, [spots]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]}>
        <cylinderGeometry args={[0.32, 0.5, 1, 6]} />
        <meshStandardMaterial color="#4a3c2e" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, spots.length]}>
        <coneGeometry args={[1, 1, 7]} />
        <meshStandardMaterial color="#2f5d3a" roughness={1} />
      </instancedMesh>
    </group>
  );
}

function StreetLights() {
  const glow = useMemo(glowTexture, []);
  const spots = useMemo(() => {
    const out: [number, number][] = [];
    for (const x of ROADS_X) for (const z of ROADS_Z) out.push([x + ROAD / 2 + 2, z + ROAD / 2 + 2]);
    return out;
  }, []);
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[0.14, 0.18, 10, 5]} />
            <meshStandardMaterial color="#22262c" />
          </mesh>
          <sprite position={[0, 10.4, 0]} scale={[6, 6, 1]}>
            <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          {/* warm pool on the pavement */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
            <circleGeometry args={[7, 16]} />
            <meshBasicMaterial map={glow} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Landmarks() {
  return (
    <group>
      {LANDMARKS.map((l) => {
        // the real house is its own geometry (house.tsx) — no placeholder
        if (l.id === "house") return null;
        switch (l.kind) {
          case "home":
          case "house":
            return (
              <group key={l.id} position={[l.x, 0, l.z]}>
                <mesh position={[0, 4, 0]}>
                  <boxGeometry args={[22, 8, 16]} />
                  <meshStandardMaterial color={l.kind === "house" ? "#6a4636" : "#5a5346"} />
                </mesh>
                <mesh position={[0, 9.5, 0]} rotation={[0, Math.PI / 4, 0]}>
                  <coneGeometry args={[16, 6, 4]} />
                  <meshStandardMaterial color="#3a3028" />
                </mesh>
                {/* the porch light */}
                <mesh position={[8, 3.4, 9]}>
                  <sphereGeometry args={[0.5, 8, 8]} />
                  <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
                </mesh>
                <pointLight position={[8, 4, 10]} color="#ffd9a0" intensity={40} distance={40} />
              </group>
            );
          case "school":
          case "office":
          case "hall":
          case "hospital":
            return (
              <group key={l.id} position={[l.x, 0, l.z]}>
                <mesh position={[0, 9, 0]}>
                  <boxGeometry args={[34, 18, 24]} />
                  <meshStandardMaterial color={l.kind === "hospital" ? "#5d6a72" : "#565e6a"} />
                </mesh>
                <mesh position={[0, 20.5, 0]}>
                  <planeGeometry args={[28, 6]} />
                  <meshBasicMaterial map={signTexture(l.label, l.kind === "hospital" ? "#ff6a6a" : "#ffd9a0")} transparent toneMapped={false} />
                </mesh>
              </group>
            );
          case "neon":
            return (
              <group key={l.id} position={[l.x, 0, l.z]}>
                <mesh position={[0, 8, 0]}>
                  <boxGeometry args={[26, 16, 22]} />
                  <meshStandardMaterial color="#3b3644" roughness={0.6} />
                </mesh>
                <mesh position={[0, 18.5, 0]}>
                  <planeGeometry args={[24, 6]} />
                  <meshBasicMaterial
                    map={signTexture(l.label, l.id === "saucey" ? "#ffb84d" : l.id === "hush" ? "#ff5f9e" : "#ff7a3d")}
                    transparent
                    toneMapped={false}
                  />
                </mesh>
              </group>
            );
          case "gate":
            return (
              <group key={l.id} position={[l.x, 0, l.z]}>
                <mesh position={[-16, 4, 0]}>
                  <boxGeometry args={[6, 8, 4]} />
                  <meshStandardMaterial color="#4a523f" />
                </mesh>
                <mesh position={[16, 4, 0]}>
                  <boxGeometry args={[6, 8, 4]} />
                  <meshStandardMaterial color="#4a523f" />
                </mesh>
                <mesh position={[0, 8.5, 0]}>
                  <boxGeometry args={[40, 3, 3]} />
                  <meshStandardMaterial color="#3c4434" />
                </mesh>
                <mesh position={[0, 8.6, 1.8]}>
                  <planeGeometry args={[30, 2.4]} />
                  <meshBasicMaterial map={signTexture("MCAS WHITEHEAD", "#c8e0a0")} transparent toneMapped={false} />
                </mesh>
              </group>
            );
          case "terminal":
            return (
              <group key={l.id} position={[l.x, 0, l.z]}>
                <mesh position={[0, 7, 0]}>
                  <boxGeometry args={[70, 14, 26]} />
                  <meshStandardMaterial color="#5a636c" roughness={0.5} metalness={0.3} />
                </mesh>
                <mesh position={[44, 13, 0]}>
                  <cylinderGeometry args={[3, 3.6, 26, 8]} />
                  <meshStandardMaterial color="#48505a" />
                </mesh>
                <mesh position={[44, 27.5, 0]}>
                  <boxGeometry args={[10, 4, 10]} />
                  <meshStandardMaterial color="#3c444e" emissive="#9fb9d9" emissiveIntensity={0.25} />
                </mesh>
                <mesh position={[0, 16.5, 14]}>
                  <planeGeometry args={[46, 5]} />
                  <meshBasicMaterial map={signTexture("WHITEHEAD INTL.", "#9fd3ff")} transparent toneMapped={false} />
                </mesh>
              </group>
            );
          case "studio":
            return (
              <group key={l.id} position={[l.x, 0, l.z]}>
                <mesh position={[0, 6, 0]}>
                  <boxGeometry args={[28, 12, 20]} />
                  <meshStandardMaterial color="#2e2a26" roughness={0.7} />
                </mesh>
                <mesh position={[0, 14.5, 0]}>
                  <planeGeometry args={[24, 5]} />
                  <meshBasicMaterial map={signTexture("BONEYARD", "#e2c078")} transparent toneMapped={false} />
                </mesh>
              </group>
            );
        }
      })}
    </group>
  );
}

function ParkedCars() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const spots = useMemo(() => {
    const out: { x: number; z: number; rot: number; hue: string }[] = [];
    const hues = ["#8a4a52", "#4a6a8a", "#7a7a6a", "#5a4a7a", "#996a3a"];
    let i = 0;
    for (const x of ROADS_X)
      for (const z of ROADS_Z) {
        if ((x + z) % 480 !== 0) continue;
        out.push({ x: x + ROAD / 2 + 5, z: z + 34, rot: Math.PI / 2, hue: hues[i++ % hues.length] });
      }
    return out;
  }, []);
  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    spots.forEach((s, i) => {
      q.setFromEuler(new THREE.Euler(0, s.rot, 0));
      m.compose(new THREE.Vector3(s.x, 1.9, s.z), q, new THREE.Vector3(5.4, 3.8, 13.2));
      ref.current.setMatrixAt(i, m);
      ref.current.setColorAt(i, c.set(s.hue));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [spots]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, spots.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial />
    </instancedMesh>
  );
}

function ScreenGlow() {
  const screenTex = useMemo(siteScreenTexture, []);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(() => {
    if (matRef.current) matRef.current.opacity = THREE.MathUtils.clamp((G.deskT - 0.5) / 0.32, 0.03, 1);
  });
  return (
    <mesh position={[SCREEN.cx, SCREEN.cy, SCREEN.cz + 0.05]}>
      <planeGeometry args={[SCREEN.hw * 2, SCREEN.hh * 2]} />
      <meshBasicMaterial ref={matRef} map={screenTex} transparent opacity={0.03} toneMapped={false} />
    </mesh>
  );
}

/* --------------------------------------------------------------- traffic */

const TRAFFIC_HUES = ["#3a6ea5", "#7a7a6a", "#8a4a52", "#4a5a45", "#6a5a3a", "#40404a", "#a05a3a"];

type NpcCar = {
  corners: [number, number][]; // 4 lane-offset corners, clockwise
  segLen: number[];
  perim: number;
  d: number; // distance along perimeter
  speed: number;
  hue: string;
};

function makeTraffic(n: number): NpcCar[] {
  const r = mulberrySky(4242);
  const out: NpcCar[] = [];
  const L = 5.5; // lane offset
  for (let i = 0; i < n; i++) {
    const xi = Math.floor(r() * (ROADS_X.length - 1));
    const zi = Math.floor(r() * (ROADS_Z.length - 1));
    const x1 = ROADS_X[xi];
    const x2 = ROADS_X[xi + 1];
    const z1 = ROADS_Z[zi];
    const z2 = ROADS_Z[zi + 1];
    // clockwise right-hand loop on the road centerlines
    const corners: [number, number][] = [
      [x1 + L, z1 + L],
      [x2 - L, z1 + L],
      [x2 - L, z2 - L],
      [x1 + L, z2 - L],
    ];
    const segLen: number[] = [];
    let perim = 0;
    for (let k = 0; k < 4; k++) {
      const a = corners[k];
      const b = corners[(k + 1) % 4];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segLen.push(len);
      perim += len;
    }
    out.push({ corners, segLen, perim, d: r() * perim, speed: 18 + r() * 16, hue: TRAFFIC_HUES[i % TRAFFIC_HUES.length] });
  }
  return out;
}

function Traffic() {
  const cars = useMemo(() => makeTraffic(18), []);
  const refs = useRef<THREE.Group[]>([]);
  useFrame((_, dt) => {
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      const g = refs.current[i];
      if (!g) continue;
      c.d = (c.d + c.speed * dt) % c.perim;
      // find segment
      let acc = 0,
        seg = 0;
      while (seg < 3 && acc + c.segLen[seg] < c.d) {
        acc += c.segLen[seg];
        seg++;
      }
      const a = c.corners[seg];
      const b = c.corners[(seg + 1) % 4];
      const f = (c.d - acc) / c.segLen[seg];
      const x = a[0] + (b[0] - a[0]) * f;
      const z = a[1] + (b[1] - a[1]) * f;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      g.position.set(x, 0, z);
      g.rotation.y = Math.atan2(-dx, -dz);
    }
  });
  return (
    <group>
      {cars.map((c, i) => (
        <group
          key={i}
          ref={(el: THREE.Group | null) => {
            if (el) refs.current[i] = el;
          }}
        >
          <mesh position={[0, 1.3, 0]}>
            <boxGeometry args={[5.2, 1.5, 12.6]} />
            <meshLambertMaterial color={c.hue} />
          </mesh>
          <mesh position={[0, 2.7, 0.25]}>
            <boxGeometry args={[4.5, 1.3, 5.4]} />
            <meshLambertMaterial color="#151920" />
          </mesh>
          <mesh position={[-1.8, 1.4, -6.35]}>
            <sphereGeometry args={[0.28, 6, 6]} />
            <meshBasicMaterial color="#ffe9c0" toneMapped={false} />
          </mesh>
          <mesh position={[1.8, 1.4, -6.35]}>
            <sphereGeometry args={[0.28, 6, 6]} />
            <meshBasicMaterial color="#ffe9c0" toneMapped={false} />
          </mesh>
          <mesh position={[0, 1.4, 6.35]}>
            <boxGeometry args={[4.4, 0.28, 0.1]} />
            <meshBasicMaterial color="#ff4444" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------- pedestrians */

type Ped = { x: number; z: number; axis: "x" | "z"; a: number; b: number; d: number; dir: number; speed: number; hue: string };

function makePeds(n: number): Ped[] {
  const r = mulberrySky(909);
  const hues = ["#3b4250", "#5a4636", "#4a4a52", "#6a3a3a", "#3a4a3a", "#7a6a4a"];
  const out: Ped[] = [];
  for (let i = 0; i < n; i++) {
    const onX = r() < 0.5;
    if (onX) {
      const line = ROADS_X[Math.floor(r() * ROADS_X.length)] + (r() < 0.5 ? -ROAD / 2 - 3 : ROAD / 2 + 3);
      const a = -700 + r() * 300;
      out.push({ x: line, z: a, axis: "z", a, b: a + 120 + r() * 200, d: r(), dir: r() < 0.5 ? 1 : -1, speed: 3 + r() * 2, hue: hues[i % hues.length] });
    } else {
      const line = ROADS_Z[Math.floor(r() * ROADS_Z.length)] + (r() < 0.5 ? -ROAD / 2 - 3 : ROAD / 2 + 3);
      const a = -700 + r() * 300;
      out.push({ x: a, z: line, axis: "x", a, b: a + 120 + r() * 200, d: r(), dir: r() < 0.5 ? 1 : -1, speed: 3 + r() * 2, hue: hues[i % hues.length] });
    }
  }
  return out;
}

function Pedestrians() {
  const peds = useMemo(() => makePeds(20), []);
  const refs = useRef<THREE.Group[]>([]);
  const legRefs = useRef<THREE.Mesh[][]>([]);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    for (let i = 0; i < peds.length; i++) {
      const p = peds[i];
      const g = refs.current[i];
      if (!g) continue;
      p.d += p.dir * p.speed * dt;
      const span = p.b - p.a;
      if (p.d > span) {
        p.d = span;
        p.dir = -1;
      } else if (p.d < 0) {
        p.d = 0;
        p.dir = 1;
      }
      const pos = p.a + p.d;
      if (p.axis === "z") {
        g.position.set(p.x, 0, pos);
        g.rotation.y = p.dir > 0 ? 0 : Math.PI;
      } else {
        g.position.set(pos, 0, p.z);
        g.rotation.y = p.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      }
      const sw = Math.sin(t.current * 6 + i) * 0.5;
      const legs = legRefs.current[i];
      if (legs) {
        if (legs[0]) legs[0].rotation.x = sw;
        if (legs[1]) legs[1].rotation.x = -sw;
      }
    }
  });
  return (
    <group>
      {peds.map((p, i) => (
        <group
          key={i}
          ref={(el: THREE.Group | null) => {
            if (el) refs.current[i] = el;
          }}
        >
          <mesh position={[0, 2.2, 0]}>
            <capsuleGeometry args={[0.42, 1.0, 4, 6]} />
            <meshStandardMaterial color={p.hue} roughness={0.9} />
          </mesh>
          <mesh position={[0, 3.35, 0]}>
            <sphereGeometry args={[0.34, 8, 8]} />
            <meshStandardMaterial color="#caa07f" roughness={0.7} />
          </mesh>
          <mesh
            ref={(el: THREE.Mesh | null) => {
              if (el) ((legRefs.current[i] ??= [])[0] = el);
            }}
            position={[-0.2, 0.9, 0]}
          >
            <capsuleGeometry args={[0.16, 0.85, 4, 5]} />
            <meshStandardMaterial color="#22262e" />
          </mesh>
          <mesh
            ref={(el: THREE.Mesh | null) => {
              if (el) ((legRefs.current[i] ??= [])[1] = el);
            }}
            position={[0.2, 0.9, 0]}
          >
            <capsuleGeometry args={[0.16, 0.85, 4, 5]} />
            <meshStandardMaterial color="#22262e" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------- physics */

/** ground, map borders, buildings, house walls — all fixed cuboids */
function StaticColliders() {
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        {/* ground slab */}
        <CuboidCollider args={[820, 2, 820]} position={[0, -2, 0]} />
        {/* map borders */}
        <CuboidCollider args={[4, 30, 820]} position={[WORLD_HALF + 8, 15, 0]} />
        <CuboidCollider args={[4, 30, 820]} position={[-WORLD_HALF - 8, 15, 0]} />
        <CuboidCollider args={[820, 30, 4]} position={[0, 15, WORLD_HALF + 8]} />
        <CuboidCollider args={[820, 30, 4]} position={[0, 15, -WORLD_HALF - 8]} />
        {/* buildings */}
        {BUILDINGS.map((b, i) => (
          <CuboidCollider key={i} args={[b.w / 2, b.h / 2, b.d / 2]} position={[b.x, b.h / 2, b.z]} />
        ))}
        {/* house walls */}
        {HOUSE_WALLS.map((w, i) => (
          <CuboidCollider
            key={"hw" + i}
            args={[Math.max((w[2] - w[0]) / 2, 0.25), 6, Math.max((w[3] - w[1]) / 2, 0.25)]}
            position={[(w[0] + w[2]) / 2, 6, (w[1] + w[3]) / 2]}
          />
        ))}
        {/* house ceiling — jumping indoors bumps your head, not the roof */}
        <CuboidCollider
          args={[(HOUSE.x2 - HOUSE.x1) / 2, 0.3, (HOUSE.z2 - HOUSE.z1) / 2]}
          position={[(HOUSE.x1 + HOUSE.x2) / 2, HOUSE.wallH + 0.3, (HOUSE.z1 + HOUSE.z2) / 2]}
        />
        {/* furniture — you can't walk through a couch */}
        {FURNITURE.map((f, i) => (
          <CuboidCollider
            key={"fn" + i}
            args={[Math.max((f[2] - f[0]) / 2, 0.2), 2.5, Math.max((f[3] - f[1]) / 2, 0.2)]}
            position={[(f[0] + f[2]) / 2, 2.5, (f[1] + f[3]) / 2]}
          />
        ))}
      </RigidBody>
      <DoorColliders />
    </group>
  );
}

/** door blockers that switch off as the door swings open */
function DoorColliders() {
  const refs = useRef<(RapierRigidBody | null)[]>([]);
  useFrame(() => {
    DOORS.forEach((d, i) => {
      const rb = refs.current[i];
      if (!rb) return;
      const col = rb.collider(0);
      if (col) col.setEnabled(d.open < 0.5);
    });
  });
  return (
    <>
      {DOORS.map((d, i) => {
        const cx = d.hx + d.len / 2;
        const cz = d.hz;
        return (
          <RigidBody
            key={d.id}
            type="fixed"
            colliders={false}
            ref={(el: RapierRigidBody | null) => {
              refs.current[i] = el;
            }}
          >
            <CuboidCollider args={[d.len / 2, 5, 0.45]} position={[cx, 5, cz]} />
          </RigidBody>
        );
      })}
    </>
  );
}

/* GoldSrc-feel movement (3 units = 1 m; speeds from the 1998 handbook) */
const MOVE = {
  run: 24.4, // ~8.1 m/s — HL1 run speed
  walk: 12.2, // shift to walk
  accel: 10, // ground acceleration (x wishspeed / s)
  airAccel: 10, // air acceleration against the 0.76 m/s air cap
  airCap: 2.3, // classic air-control speed cap
  friction: 6,
  stopSpeed: 7.6, // friction floor — kills drift instantly at low speed
  gravity: 61, // ~20 m/s² — games run heavy gravity on purpose
  jumpVel: 20.4, // ~1.1 m jump apex
  baseY: 2.75, // body center when standing on flat ground
};

/** the player: kinematic capsule + Rapier character controller */
function PlayerBody() {
  const body = useRef<RapierRigidBody>(null!);
  const { world } = useRapier();
  // created lazily on the first live frame — a controller made during render
  // can belong to a physics world that no longer exists (dev double-mount)
  const ctrlRef = useRef<ReturnType<typeof world.createCharacterController> | null>(null);
  const vel = useRef<[number, number, number]>([0, 0, 0]); // vx, vy, vz
  const stepDist = useRef(0);

  useFrame((_, rawDt) => {
    const rb = body.current;
    if (!rb) return;
    if (!ctrlRef.current) {
      const c = world.createCharacterController(0.08);
      c.setSlideEnabled(true);
      c.enableAutostep(0.9, 0.3, true); // curbs + thresholds
      c.enableSnapToGround(0.45);
      ctrlRef.current = c;
    }
    const ctrl = ctrlRef.current;
    const dt = Math.min(rawDt, 0.05);

    if (PHYS.playerTeleport) {
      rb.setNextKinematicTranslation({ x: PHYS.playerTeleport[0], y: MOVE.baseY, z: PHYS.playerTeleport[1] });
      G.px = PHYS.playerTeleport[0];
      G.pz = PHYS.playerTeleport[1];
      PHYS.py = MOVE.baseY;
      vel.current = [0, 0, 0];
      PHYS.playerTeleport = null;
      return;
    }
    if (G.mode !== "foot" || G.deskMode !== "world") {
      PHYS.footSpeed = 0;
      // keep the body parked at the player's logical spot
      rb.setNextKinematicTranslation({ x: G.px, y: MOVE.baseY, z: G.pz });
      PHYS.py = MOVE.baseY;
      vel.current = [0, 0, 0];
      return;
    }

    const up = keys["w"] || keys["arrowup"];
    const down = keys["s"] || keys["arrowdown"];
    const left = keys["a"] || keys["arrowleft"];
    const right = keys["d"] || keys["arrowright"];
    const walk = keys["shift"];
    const jump = keys[" "];

    // wish direction from the camera yaw
    const fx = -Math.sin(LOOK.yaw);
    const fz = -Math.cos(LOOK.yaw);
    let wx = 0,
      wz = 0;
    if (up) {
      wx += fx;
      wz += fz;
    }
    if (down) {
      wx -= fx;
      wz -= fz;
    }
    if (right) {
      wx += -fz;
      wz += fx;
    }
    if (left) {
      wx -= -fz;
      wz -= fx;
    }
    const wLen = Math.hypot(wx, wz);
    if (wLen > 0) {
      wx /= wLen;
      wz /= wLen;
    }
    const wishSpeed = wLen > 0 ? (walk ? MOVE.walk : MOVE.run) : 0;

    const v = vel.current;
    const grounded = PHYS.grounded;

    if (grounded) {
      // friction (Quake-style: low speeds decay against stopSpeed)
      const speed = Math.hypot(v[0], v[2]);
      if (speed > 0.01) {
        const control = Math.max(speed, MOVE.stopSpeed);
        const newSpeed = Math.max(0, speed - control * MOVE.friction * dt);
        const k = newSpeed / speed;
        v[0] *= k;
        v[2] *= k;
      } else {
        v[0] = 0;
        v[2] = 0;
      }
      // accelerate toward the wish
      if (wishSpeed > 0) {
        const cur = v[0] * wx + v[2] * wz;
        const add = Math.min(wishSpeed - cur, MOVE.accel * wishSpeed * dt);
        if (add > 0) {
          v[0] += wx * add;
          v[2] += wz * add;
        }
      }
      if (jump) {
        v[1] = MOVE.jumpVel;
        PHYS.grounded = false;
        sfxJump();
      } else {
        v[1] = 0;
      }
    } else {
      // air control: accelerate only up to the air cap along the wish
      if (wishSpeed > 0) {
        const capped = Math.min(wishSpeed, MOVE.airCap);
        const cur = v[0] * wx + v[2] * wz;
        const add = Math.min(capped - cur, MOVE.airAccel * wishSpeed * dt);
        if (add > 0) {
          v[0] += wx * add;
          v[2] += wz * add;
        }
      }
      v[1] -= MOVE.gravity * dt;
    }

    const move = { x: v[0] * dt, y: v[1] * dt, z: v[2] * dt };
    const col = rb.collider(0);
    const t = rb.translation();
    let ox = move.x,
      oy = move.y,
      oz = move.z;
    if (col) {
      ctrl.computeColliderMovement(col, move);
      const out = ctrl.computedMovement();
      ox = out.x;
      oy = out.y;
      oz = out.z;
      const wasAirborne = !PHYS.grounded;
      PHYS.grounded = ctrl.computedGrounded();
      if (PHYS.grounded && wasAirborne) {
        sfxLand(Math.min(-v[1] / 30, 1));
        v[1] = 0;
      }
      // velocity clipping — don't store speed against walls or ceilings
      if (dt > 0) {
        v[0] = ox / dt;
        v[2] = oz / dt;
        if (!PHYS.grounded && v[1] > 0 && oy < move.y - 0.001) v[1] = 0;
      }
    }
    const ny = Math.max(t.y + oy, MOVE.baseY - 0.001);
    rb.setNextKinematicTranslation({ x: t.x + ox, y: ny, z: t.z + oz });
    G.px = t.x + ox;
    G.pz = t.z + oz;
    PHYS.py = ny;
    G.pHeading = LOOK.yaw;

    // footsteps by distance covered on the ground
    const hSpeed = Math.hypot(v[0], v[2]);
    PHYS.footSpeed = hSpeed;
    if (PHYS.grounded && hSpeed > 3) {
      stepDist.current += hSpeed * dt;
      const stride = hSpeed > MOVE.walk + 2 ? 2.6 : 2.1;
      if (stepDist.current > stride) {
        stepDist.current = 0;
        sfxFootstep(insideHouse(G.px, G.pz));
      }
    } else {
      stepDist.current = 0;
    }
  });

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[STAND.x, 2.75, STAND.z]}
    >
      <CuboidCollider args={[0.55, 2.7, 0.55]} />
    </RigidBody>
  );
}

/** the car: dynamic chassis on a raycast-vehicle controller — real suspension */
function CarBody() {
  const chassis = useRef<RapierRigidBody>(null!);
  const { world } = useRapier();
  const vehicle = useRef<ReturnType<typeof world.createVehicleController> | null>(null);

  useFrame((_, rawDt) => {
    const rb = chassis.current;
    if (!rb) return;
    const dt = Math.min(rawDt, 0.05);

    if (!vehicle.current) {
      const v = world.createVehicleController(rb);
      const h = -0.4; // wheel mount height on chassis
      const pts: [number, number, boolean][] = [
        [-2.4, -4.05, true], // front left (steered)
        [2.4, -4.05, true], // front right
        [-2.4, 4.05, false],
        [2.4, 4.05, false],
      ];
      pts.forEach(([wx, wz]) => {
        v.addWheel(
          { x: wx, y: h, z: wz },
          { x: 0, y: -1, z: 0 },
          { x: 1, y: 0, z: 0 },
          CAR_TUNE.suspensionRest,
          CAR_TUNE.wheelRadius
        );
      });
      for (let i = 0; i < 4; i++) {
        v.setWheelSuspensionStiffness(i, CAR_TUNE.suspensionStiffness);
        v.setWheelFrictionSlip(i, CAR_TUNE.wheelFriction);
        v.setWheelSuspensionCompression(i, 2.4);
        v.setWheelSuspensionRelaxation(i, 3.6);
        v.setWheelMaxSuspensionTravel(i, 1.4);
      }
      vehicle.current = v;
    }
    const v = vehicle.current;

    if (PHYS.carTeleport) {
      rb.setTranslation({ x: PHYS.carTeleport[0], y: 3, z: PHYS.carTeleport[1] }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      PHYS.carTeleport = null;
    }

    const driving = G.mode === "car" && G.deskMode === "world";
    if (driving) rb.wakeUp();
    const up = keys["w"] || keys["arrowup"];
    const down = keys["s"] || keys["arrowdown"];
    const left = keys["a"] || keys["arrowleft"];
    const right = keys["d"] || keys["arrowright"];

    const force = driving ? (up ? -CAR_TUNE.engineForce : down ? CAR_TUNE.engineForce * 0.7 : 0) : 0;
    const steer = driving ? ((left ? 1 : 0) - (right ? 1 : 0)) * CAR_TUNE.maxSteer : 0;
    v.setWheelEngineForce(0, force);
    v.setWheelEngineForce(1, force);
    v.setWheelSteering(0, steer);
    v.setWheelSteering(1, steer);
    const brake = driving ? 0 : CAR_TUNE.brakeForce;
    v.setWheelBrake(2, brake);
    v.setWheelBrake(3, brake);

    v.updateVehicle(dt);

    // sync logical state from physics
    const t = rb.translation();
    const r = rb.rotation();
    G.cx = t.x;
    G.cz = t.z;
    // yaw from quaternion
    G.cHeading = Math.atan2(2 * (r.w * r.y + r.x * r.z), 1 - 2 * (r.y * r.y + r.x * r.x));
    const lv = rb.linvel();
    const fwdX = -Math.sin(G.cHeading);
    const fwdZ = -Math.cos(G.cHeading);
    G.cSpeed = lv.x * fwdX + lv.z * fwdZ;
  });

  return (
    <RigidBody
      ref={chassis}
      type="dynamic"
      colliders={false}
      position={[CAR_START.x, 3, CAR_START.z]}
      angularDamping={2}
      linearDamping={0.05}
    >
      <CuboidCollider args={[2.7, 0.75, 6.6]} position={[0, 0, 0]} mass={26} />
    </RigidBody>
  );
}

/* ----------------------------------------------------- player + vehicle */

function PlayerCar() {
  const grp = useRef<THREE.Group>(null!);
  const wheels = useRef<THREE.Mesh[]>([]);
  const spin = useRef(0);
  useFrame((_, dt) => {
    if (!grp.current) return;
    grp.current.position.set(G.cx, 0, G.cz);
    grp.current.rotation.y = G.cHeading;
    spin.current += (G.cSpeed / 0.95) * dt;
    for (const w of wheels.current) if (w) w.rotation.x = spin.current;
  });
  return (
    <group ref={grp}>
      {/* body — a real sedan footprint, muscle stance */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[5.4, 1.5, 13.2]} />
        <meshLambertMaterial color="#a83a3a" />
      </mesh>
      {/* hood + trunk */}
      <mesh position={[0, 2.2, -4.4]}>
        <boxGeometry args={[5.2, 0.35, 3.8]} />
        <meshLambertMaterial color="#a83a3a" />
      </mesh>
      <mesh position={[0, 2.2, 4.7]}>
        <boxGeometry args={[5.2, 0.35, 3.2]} />
        <meshLambertMaterial color="#a83a3a" />
      </mesh>
      {/* cabin with dark glass */}
      <mesh position={[0, 2.95, 0.2]}>
        <boxGeometry args={[4.7, 1.35, 5.6]} />
        <meshLambertMaterial color="#151920" />
      </mesh>
      {/* rocker stripe */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[5.5, 0.22, 12.4]} />
        <meshLambertMaterial color="#e8dcc4" />
      </mesh>
      {[
        [-2.4, -4.05],
        [2.4, -4.05],
        [-2.4, 4.05],
        [2.4, 4.05],
      ].map(([wx, wz], i) => (
        <mesh
          key={i}
          ref={(el: THREE.Mesh | null) => {
            if (el) wheels.current[i] = el;
          }}
          position={[wx, 0.95, wz]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.95, 0.95, 0.7, 12]} />
          <meshLambertMaterial color="#0c0e12" />
        </mesh>
      ))}
      {/* headlights + taillights */}
      {[-1.9, 1.9].map((x) => (
        <mesh key={"h" + x} position={[x, 1.55, -6.65]}>
          <sphereGeometry args={[0.3, 6, 6]} />
          <meshBasicMaterial color="#ffe9c0" toneMapped={false} />
        </mesh>
      ))}
      {[-1.9, 1.9].map((x) => (
        <mesh key={"t" + x} position={[x, 1.55, 6.65]}>
          <boxGeometry args={[0.85, 0.26, 0.1]} />
          <meshBasicMaterial color="#ff4444" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Digital Josh — bald, full auburn beard, orange tee. Low-poly, reads instantly. */
function PlayerFigure() {
  const grp = useRef<THREE.Group>(null!);
  const lLeg = useRef<THREE.Mesh>(null!);
  const rLeg = useRef<THREE.Mesh>(null!);
  const lArm = useRef<THREE.Mesh>(null!);
  const rArm = useRef<THREE.Mesh>(null!);
  const walk = useRef(0);

  useFrame((_, dt) => {
    if (!grp.current) return;
    grp.current.visible = G.mode === "foot" && G.deskT > 0.45;
    grp.current.position.set(G.px, 0, G.pz);
    grp.current.rotation.y = G.pHeading;
    const moving =
      keys["w"] || keys["s"] || keys["arrowup"] || keys["arrowdown"] || keys["a"] || keys["d"] || keys["arrowleft"] || keys["arrowright"];
    if (moving && G.mode === "foot") walk.current += dt * (keys["shift"] ? 13 : 9);
    const sw = moving ? Math.sin(walk.current) * 0.55 : 0;
    if (lLeg.current) lLeg.current.rotation.x = sw;
    if (rLeg.current) rLeg.current.rotation.x = -sw;
    if (lArm.current) lArm.current.rotation.x = -sw * 0.8;
    if (rArm.current) rArm.current.rotation.x = sw * 0.8;
    // idle breath
    grp.current.children[0].position.y = 2.45 + (moving ? 0 : Math.sin(walk.current * 0.15 + performance.now() / 900) * 0.03);
  });

  const skin = "#d9ad91";
  const beard = "#7a4526";
  const tee = "#e05a1e";
  const jeans = "#2c3340";

  return (
    <group ref={grp}>
      {/* torso — the orange tee */}
      <mesh position={[0, 2.45, 0]}>
        <capsuleGeometry args={[0.62, 1.2, 4, 10]} />
        <meshStandardMaterial color={tee} roughness={0.85} />
      </mesh>
      {/* head — bald, skin */}
      <mesh position={[0, 4.28, 0]}>
        <sphereGeometry args={[0.46, 14, 12]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      {/* the beard — full, jaw-wrapping */}
      <mesh position={[0, 4.02, -0.16]} scale={[0.92, 0.78, 0.82]}>
        <sphereGeometry args={[0.46, 12, 10]} />
        <meshStandardMaterial color={beard} roughness={0.95} />
      </mesh>
      {/* brow shadow */}
      <mesh position={[0, 4.42, -0.34]} scale={[0.7, 0.14, 0.3]}>
        <sphereGeometry args={[0.46, 8, 6]} />
        <meshStandardMaterial color="#b98e72" roughness={0.8} />
      </mesh>
      {/* arms — skin (tee sleeves end high) */}
      <mesh ref={lArm} position={[-0.78, 3.1, 0]} rotation={[0, 0, 0.12]}>
        <capsuleGeometry args={[0.17, 1.15, 4, 6]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      <mesh ref={rArm} position={[0.78, 3.1, 0]} rotation={[0, 0, -0.12]}>
        <capsuleGeometry args={[0.17, 1.15, 4, 6]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      {/* legs — jeans */}
      <mesh ref={lLeg} position={[-0.28, 1.1, 0]}>
        <capsuleGeometry args={[0.21, 1.0, 4, 6]} />
        <meshStandardMaterial color={jeans} />
      </mesh>
      <mesh ref={rLeg} position={[0.28, 1.1, 0]}>
        <capsuleGeometry args={[0.21, 1.0, 4, 6]} />
        <meshStandardMaterial color={jeans} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------- markers */

function MissionMarkers({ tick }: { tick: number }) {
  void tick;
  const m = G.mission >= 0 ? MISSIONS[G.mission] : null;
  const next = G.mission + 1 < MISSIONS.length ? MISSIONS[G.mission + 1] : null;
  const showStart = G.phase === "roam" && next;
  const step = m && G.phase === "active" ? m.steps[G.step] : null;
  return (
    <group>
      {showStart && next && (
        <group position={[next.startX, 0, next.startZ]}>
          <mesh position={[0, 6, 0]}>
            <cylinderGeometry args={[3.4, 3.4, 12, 18, 1, true]} />
            <meshBasicMaterial color="#e2c078" transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          {/* sky beam — visible across the map, GTA-school wayfinding */}
          <mesh position={[0, 150, 0]}>
            <cylinderGeometry args={[1.2, 2.6, 300, 10, 1, true]} />
            <meshBasicMaterial color="#e2c078" transparent opacity={0.16} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      )}
      {step && (
        <group position={[step.x, 0, step.z]}>
          <mesh position={[0, 6, 0]}>
            <cylinderGeometry args={[step.radius ? step.radius * 0.5 : 4, step.radius ? step.radius * 0.5 : 4, 12, 18, 1, true]} />
            <meshBasicMaterial color="#7fd3ff" transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          <mesh position={[0, 150, 0]}>
            <cylinderGeometry args={[1.2, 2.6, 300, 10, 1, true]} />
            <meshBasicMaterial color="#7fd3ff" transparent opacity={0.14} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* ------------------------------------------------------------- the sim */

function Sim({ onHud }: { onHud: (h: HudState) => void }) {
  const { camera, size } = useThree();
  const camPos = useRef(new THREE.Vector3(SEAT_POS.x, SEAT_POS.y, SEAT_POS.z));
  const footVel = useRef(0);
  const bobT = useRef(0);
  const lastDir = useRef<[number, number]>([0, -1]);
  const lastDistrict = useRef<string | null>(null);
  const districtTimer = useRef(0);
  const stepKey = useRef("");
  const stepHitsBase = useRef(0);
  const v3 = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    G.phaseT += dt;

    /* -------- the desk: seated ↔ world -------- */
    if (G.deskMode === "toWorld") G.deskT = Math.min(G.deskT + dt / 1.7, 1);
    if (G.deskMode === "toDesk") G.deskT = Math.max(G.deskT - dt / 1.4, 0);
    if (G.deskMode === "toWorld" && G.deskT >= 1) G.deskMode = "world";
    if (G.deskMode === "toDesk" && G.deskT <= 0) G.deskMode = "desk";
    const atDesk = G.deskMode !== "world";

    /* -------- movement -------- */
    const up = keys["w"] || keys["arrowup"];
    const down = keys["s"] || keys["arrowdown"];
    const left = keys["a"] || keys["arrowleft"];
    const right = keys["d"] || keys["arrowright"];
    const run = keys["shift"];

    // movement lives in PlayerBody / CarBody (Rapier). Riding along:
    if (G.mode === "car" && !atDesk) {
      G.px = G.cx;
      G.pz = G.cz;
    }
    bobT.current += PHYS.footSpeed * dt * 0.42;
    void up;
    void down;
    void left;
    void right;
    void run;

    /* -------- camera: FP on foot, chase in car, seat blend at desk -------- */
    const tx = G.mode === "car" ? G.cx : G.px;
    const tz = G.mode === "car" ? G.cz : G.pz;
    const th = G.mode === "car" ? G.cHeading : G.pHeading;
    if (G.deskMode === "world" && G.mode === "foot") {
      // first person
      const bob = PHYS.grounded ? Math.sin(bobT.current * 2.3) * 0.055 * Math.min(PHYS.footSpeed / MOVE.run, 1) : 0;
      camera.position.set(G.px, EYE + (PHYS.py - MOVE.baseY) + bob, G.pz);
      camera.rotation.set(LOOK.pitch, LOOK.yaw, 0, "YXZ");
      camPos.current.copy(camera.position);
    } else if (G.deskMode === "world") {
      // car chase
      const want = new THREE.Vector3(tx + Math.sin(th) * 26, 11, tz + Math.cos(th) * 26);
      camPos.current.lerp(want, 1 - Math.pow(0.0015, dt));
      camera.position.copy(camPos.current);
      camera.lookAt(tx, 2.5, tz);
    } else {
      // seated ↔ standing FP blend
      const k = THREE.MathUtils.smoothstep(G.deskT, 0, 1);
      const standPos = v3.set(G.px, EYE, G.pz);
      camera.position.lerpVectors(SEAT_POS, standPos, k);
      camPos.current.copy(camera.position);
      const fwd = new THREE.Vector3(
        SEAT_LOOK.x + (G.px - Math.sin(LOOK.yaw) * 10 - SEAT_LOOK.x) * k,
        SEAT_LOOK.y + (EYE + -Math.sin(LOOK.pitch) * 10 - SEAT_LOOK.y) * k,
        SEAT_LOOK.z + (G.pz - Math.cos(LOOK.yaw) * 10 - SEAT_LOOK.z) * k
      );
      camera.lookAt(fwd);
    }

    /* -------- project the monitor screen for the DOM handoff -------- */
    let deskRect: DeskRect | null = null;
    if (atDesk) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      const corners: [number, number][] = [
        [-SCREEN.hw, -SCREEN.hh],
        [SCREEN.hw, -SCREEN.hh],
        [-SCREEN.hw, SCREEN.hh],
        [SCREEN.hw, SCREEN.hh],
      ];
      for (const [ox, oy] of corners) {
        v3.set(SCREEN.cx + ox, SCREEN.cy + oy, SCREEN.cz);
        v3.project(camera);
        const sx = ((v3.x + 1) / 2) * size.width;
        const sy = ((1 - v3.y) / 2) * size.height;
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
      }
      // blend from fullscreen (seated) toward the true projection
      const k = THREE.MathUtils.smoothstep(G.deskT, 0, 1);
      deskRect = {
        x: minX * k,
        y: minY * k,
        w: size.width + (maxX - minX - size.width) * k,
        h: size.height + (maxY - minY - size.height) * k,
      };
    }

    /* -------- missions (world only) -------- */
    if (G.deskMode !== "world") {
      // no mission logic at the desk
    } else if (G.phase === "roam") {
      const next = G.mission + 1 < MISSIONS.length ? MISSIONS[G.mission + 1] : null;
      if (next && Math.hypot(G.px - next.startX, G.pz - next.startZ) < 6) {
        G.mission++;
        G.step = 0;
        G.phase = "brief";
        G.phaseT = 0;
      }
    } else if (G.phase === "brief") {
      if (G.phaseT > 3.4) {
        G.phase = "active";
        G.phaseT = 0;
      }
    } else if (G.phase === "active") {
      const m = MISSIONS[G.mission];
      const st = m.steps[G.step];
      const key = `${G.mission}:${G.step}`;
      if (stepKey.current !== key) {
        stepKey.current = key;
        stepHitsBase.current = RANGE_SCORE.hits;
      }
      const okMode = !st.needCar || G.mode === "car";
      const done = st.targets
        ? RANGE_SCORE.hits - stepHitsBase.current >= st.targets
        : okMode && Math.hypot(G.px - st.x, G.pz - st.z) < (st.radius ?? 14);
      if (done) {
        if (G.step + 1 < m.steps.length) {
          G.step++;
        } else {
          G.phase = G.mission === MISSIONS.length - 1 ? "credits" : "passed";
          G.phaseT = 0;
          try {
            localStorage.setItem(
              "wc-save",
              JSON.stringify({ mission: G.mission, hits: RANGE_SCORE.hits, best: RANGE_SCORE.best })
            );
          } catch {}
        }
      }
    } else if (G.phase === "passed") {
      if (G.phaseT > 3.6) {
        G.phase = "roam";
        G.phaseT = 0;
      }
    }

    /* -------- district cards -------- */
    const d = districtAt(G.px, G.pz);
    if (d && d.id !== lastDistrict.current) {
      lastDistrict.current = d.id;
      districtTimer.current = 3;
    }
    if (districtTimer.current > 0) districtTimer.current -= dt;

    /* -------- HUD sync -------- */
    onHud({
      mode: G.mode,
      mission: G.mission,
      step: G.step,
      phase: G.phase,
      px: G.px,
      pz: G.pz,
      heading: th,
      speed: Math.abs(G.cSpeed),
      district: districtTimer.current > 0 ? (d?.name ?? null) : null,
      nearCar: G.deskMode === "world" && G.mode === "foot" && Math.hypot(G.px - G.cx, G.pz - G.cz) < 7,
      deskMode: G.deskMode,
      deskT: G.deskT,
      deskRect,
      nearDesk:
        G.deskMode === "world" && G.mode === "foot" && Math.hypot(G.px - DESK_SPOT.x, G.pz - DESK_SPOT.z) < 3.6,
      locked: LOOK.locked,
      inHouse: insideHouse(G.px, G.pz),
      doorPrompt: (() => {
        if (G.deskMode !== "world" || G.mode !== "foot") return null;
        for (const d of DOORS) {
          const cx = d.hx + d.len / 2;
          if (Math.hypot(G.px - cx, G.pz - d.hz) < 4.2)
            return d.open > 0.5 ? "E — close the door" : d.id === "front" ? "E — open the front door" : "E — open the door";
        }
        return null;
      })(),
      relicPrompt: (() => {
        if (G.deskMode !== "world" || G.mode !== "foot") return null;
        const r = nearestRelic(G.px, G.pz);
        return r ? `E — ${r.label}` : null;
      })(),
      caption:
        CAPTION.until > performance.now() ? { title: CAPTION.title, body: CAPTION.body } : null,
      weapon: WEAPON.slot,
      lockFallback: LOOK.fallback,
      stepHits: Math.max(0, RANGE_SCORE.hits - stepHitsBase.current),
      objective: (() => {
        if (G.deskMode !== "world") return null;
        let tx = 0,
          tz = 0,
          label = "",
          color = "#e2c078";
        if (G.phase === "roam") {
          const nx = G.mission + 1 < MISSIONS.length ? MISSIONS[G.mission + 1] : null;
          if (!nx) return null;
          tx = nx.startX;
          tz = nx.startZ;
          label = `MISSION: ${nx.title}`;
        } else if (G.phase === "active") {
          const mm = MISSIONS[G.mission];
          const st = mm.steps[G.step];
          tx = st.x;
          tz = st.z;
          label = st.text.toUpperCase();
          color = "#7fd3ff";
        } else {
          return null;
        }
        const dx = tx - G.px;
        const dz = tz - G.pz;
        const heading = G.mode === "car" ? G.cHeading : LOOK.yaw;
        // bearing relative to facing: 0 = ahead
        const world = Math.atan2(-dx, -dz);
        let rel = world - heading;
        while (rel > Math.PI) rel -= Math.PI * 2;
        while (rel < -Math.PI) rel += Math.PI * 2;
        return { label, dist: Math.round(Math.hypot(dx, dz) / 3), bearing: rel, color };
      })(),
      range:
        Math.hypot(G.px - RANGE.x, G.pz - RANGE.z) < 70
          ? { hits: RANGE_SCORE.hits, streak: RANGE_SCORE.streak, best: RANGE_SCORE.best }
          : null,
    });
  });

  return null;
}

/* ---------------------------------------------------------------- HUD */

type HudState = {
  mode: Mode;
  mission: number;
  step: number;
  phase: GameState["phase"];
  px: number;
  pz: number;
  heading: number;
  speed: number;
  district: string | null;
  nearCar: boolean;
  deskMode: GameState["deskMode"];
  deskT: number;
  deskRect: DeskRect | null;
  nearDesk: boolean;
  locked: boolean;
  inHouse: boolean;
  doorPrompt: string | null;
  relicPrompt: string | null;
  caption: { title: string; body: string } | null;
  weapon: number;
  range: { hits: number; streak: number; best: number } | null;
  lockFallback: boolean;
  stepHits: number;
  objective: { label: string; dist: number; bearing: number; color: string } | null;
};

function Minimap({ h }: { h: HudState }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    const S = 150;
    const WIN = 380; // world units across the radar — zoomed to street level
    c.width = S * 2;
    c.height = S * 2;
    g.scale(2, 2);
    const mx = (v: number) => ((v - h.px) / WIN) * S + S / 2;
    const mz = (v: number) => ((v - h.pz) / WIN) * S + S / 2;
    g.save();
    g.beginPath();
    g.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    g.clip();
    // ground
    g.fillStyle = "#20242c";
    g.fillRect(0, 0, S, S);
    for (const d of DISTRICTS) {
      g.fillStyle = d.hue + "44";
      g.fillRect(mx(d.x1), mz(d.z1), ((d.x2 - d.x1) / WIN) * S, ((d.z2 - d.z1) / WIN) * S);
    }
    // roads at radar scale
    g.strokeStyle = "#4a505a";
    g.lineWidth = (ROAD / WIN) * S;
    for (const x of ROADS_X) {
      g.beginPath();
      g.moveTo(mx(x), 0);
      g.lineTo(mx(x), S);
      g.stroke();
    }
    for (const z of ROADS_Z) {
      g.beginPath();
      g.moveTo(0, mz(z));
      g.lineTo(S, mz(z));
      g.stroke();
    }
    // the house — home marker
    g.fillStyle = "#c8a24b";
    g.fillRect(mx(704) - 2, mz(341) - 2, 4, 4);
    // objective blip, clamped to the rim like GTA
    const m = h.mission >= 0 ? MISSIONS[h.mission] : null;
    const next = h.mission + 1 < MISSIONS.length ? MISSIONS[h.mission + 1] : null;
    let bx: number | null = null,
      bz: number | null = null,
      bc = "#e2c078";
    if (h.phase === "active" && m) {
      bx = m.steps[h.step].x;
      bz = m.steps[h.step].z;
      bc = "#7fd3ff";
    } else if (h.phase === "roam" && next) {
      bx = next.startX;
      bz = next.startZ;
    }
    if (bx !== null && bz !== null) {
      let px = mx(bx) - S / 2;
      let pz = mz(bz) - S / 2;
      const len = Math.hypot(px, pz);
      const rim = S / 2 - 8;
      if (len > rim) {
        px = (px / len) * rim;
        pz = (pz / len) * rim;
      }
      g.fillStyle = bc;
      g.beginPath();
      g.arc(S / 2 + px, S / 2 + pz, 4.5, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#00000088";
      g.lineWidth = 1;
      g.stroke();
    }
    // player arrow, center
    g.save();
    g.translate(S / 2, S / 2);
    g.rotate(-h.heading);
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(0, -6);
    g.lineTo(4, 5);
    g.lineTo(-4, 5);
    g.closePath();
    g.fill();
    g.restore();
    g.restore();
  });
  return (
    <canvas
      ref={ref}
      className="h-[150px] w-[150px] rounded-full border-2 border-black/60 shadow-2xl"
      style={{ background: "#141c33" }}
    />
  );
}

/* --------------------------------------------------------------- game */

export function CityGame() {
  const [tier, setTier] = useState<CanvasTier | null>(null);
  const { progress } = useProgress();
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    if (progress >= 100 && !booted) {
      const id = setTimeout(() => setBooted(true), 450);
      return () => clearTimeout(id);
    }
  }, [progress, booted]);
  const [crash, setCrash] = useState<string | null>(null);
  useEffect(() => {
    const report = (msg: string) => {
      try {
        localStorage.setItem("wc-crash", `${new Date().toISOString()} ${msg}`.slice(0, 500));
      } catch {}
      setCrash(msg.slice(0, 200));
    };
    const onErr = (e: ErrorEvent) => report(e.error?.stack ?? e.message);
    const onRej = (e: PromiseRejectionEvent) => report(String(e.reason?.stack ?? e.reason));
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    const canvas = document.querySelector("[data-game-canvas] canvas, canvas");
    const onLost = (ev: Event) => {
      ev.preventDefault();
      report("WebGL context lost (GPU reset) — reloading");
      setTimeout(() => window.location.reload(), 1200);
    };
    canvas?.addEventListener("webglcontextlost", onLost);
    const prev = localStorage.getItem("wc-crash");
    if (prev) console.warn("[game] previous session crash:", prev);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
      canvas?.removeEventListener("webglcontextlost", onLost);
    };
  }, []);
  const [fpsOn, setFpsOn] = useState(false);
  useEffect(() => {
    setFpsOn(new URLSearchParams(window.location.search).get("fps") === "1");
  }, []);
  const [hud, setHud] = useState<HudState>({
    mode: "foot",
    mission: -1,
    step: 0,
    phase: "roam",
    px: G.px,
    pz: G.pz,
    heading: 0,
    speed: 0,
    district: null,
    nearCar: false,
    deskMode: G.deskMode,
    deskT: G.deskT,
    deskRect: null,
    nearDesk: false,
    locked: false,
    inHouse: true,
    doorPrompt: null,
    relicPrompt: null,
    caption: null,
    weapon: 0,
    range: null,
    lockFallback: false,
    stepHits: 0,
    objective: null,
  });

  useEffect(() => {
    setAmbienceInside(hud.inHouse);
  }, [hud.inHouse]);

  useEffect(() => setTier(detectTier()), []);

  useEffect(() => {
    if (tier === "full") {
      document.documentElement.classList.add("canvas-mode", "chapter-dark", "game-mode");
      document.body.style.overflow = "hidden";
      return () => {
        document.documentElement.classList.remove("canvas-mode", "chapter-dark", "game-mode");
        document.body.style.overflow = "";
      };
    }
  }, [tier]);

  /* input */
  useEffect(() => {
    if (tier !== "full") return;
    const down = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) ev.preventDefault();
      keys[k] = true;
      startAmbience();
      if (k === "escape" && G.deskMode === "desk") {
        G.deskMode = "toWorld";
        LOOK.yaw = 0;
        LOOK.pitch = -0.04;
        return;
      }
      if (G.deskMode !== "world") return;
      if (k === "f" && G.mode === "foot" && WEAPON.slot > 0) {
        FIRE.pending = true;
        return;
      }
      if ((k === "1" || k === "2") && G.mode === "foot") {
        const slot = (k === "1" ? 1 : 2) as 1 | 2;
        WEAPON.slot = WEAPON.slot === slot ? 0 : slot;
        return;
      }
      if (k === "e" && G.mode === "foot") {
        // doors first — the surprises
        for (const d of DOORS) {
          const cx = d.hx + d.len / 2;
          if (Math.hypot(G.px - cx, G.pz - d.hz) < 4.2) {
            d.target = d.target > 0.5 ? 0 : 1;
            return;
          }
        }
        // relics — the stories on the shelves
        const relic = nearestRelic(G.px, G.pz);
        if (relic) {
          CAPTION.title = relic.title;
          CAPTION.body = relic.body;
          CAPTION.until = performance.now() + 9000;
          return;
        }
        // sit back down
        if (Math.hypot(G.px - DESK_SPOT.x, G.pz - DESK_SPOT.z) < 3.6) {
          WEAPON.slot = 0;
          G.deskMode = "toDesk";
          G.px = STAND.x;
          G.pz = STAND.z;
          PHYS.playerTeleport = [STAND.x, STAND.z];
          return;
        }
      }
      if (k === "e") {
        if (G.mode === "foot" && Math.hypot(G.px - G.cx, G.pz - G.cz) < 7) {
          WEAPON.slot = 0;
          G.mode = "car";
        } else if (G.mode === "car" && Math.abs(G.cSpeed) < 6) {
          G.mode = "foot";
          const ex = G.cx + Math.cos(G.cHeading) * 7;
          const ez = G.cz - Math.sin(G.cHeading) * 7;
          G.px = ex;
          G.pz = ez;
          PHYS.playerTeleport = [ex, ez];
          LOOK.yaw = G.cHeading;
          G.cSpeed = 0;
        }
      }
    };
    const up = (ev: KeyboardEvent) => (keys[ev.key.toLowerCase()] = false);
    const blur = () => Object.keys(keys).forEach((k) => (keys[k] = false));
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [tier]);

  /* mouse look — pointer lock when the browser allows it, drag-look when
     it doesn't (webviews and some settings deny lock silently). */
  useEffect(() => {
    if (tier !== "full") return;
    const el =
      (document.querySelector("[data-game-canvas]") as HTMLElement | null) ??
      (document.querySelector("[data-canvas-walk]") as HTMLElement | null);
    if (!el) return;
    let dragging = false;
    let dragDist = 0;
    const tryLock = () => {
      try {
        const res = el.requestPointerLock() as unknown;
        if (res && typeof (res as Promise<void>).catch === "function") {
          (res as Promise<void>).catch(() => {
            LOOK.fallback = true;
            console.warn("[game] pointer lock rejected — drag-look enabled");
          });
        }
      } catch {
        LOOK.fallback = true;
      }
    };
    const onClick = () => {
      startAmbience();
      if (G.deskMode !== "world") return;
      if (!LOOK.locked && !LOOK.fallback) {
        tryLock();
        return;
      }
      if (LOOK.locked && G.mode === "foot" && WEAPON.slot > 0) FIRE.pending = true;
    };
    const onDown = (ev: MouseEvent) => {
      if (ev.button !== 0 || LOOK.locked || G.deskMode !== "world") return;
      dragging = true;
      dragDist = 0;
    };
    const onUp = () => {
      // in fallback mode a clean tap (no drag) fires the equipped weapon
      if (dragging && LOOK.fallback && dragDist < 5 && G.mode === "foot" && WEAPON.slot > 0) {
        FIRE.pending = true;
      }
      dragging = false;
    };
    const onLockChange = () => {
      LOOK.locked = document.pointerLockElement === el;
      if (LOOK.locked) LOOK.fallback = false;
    };
    const onLockError = () => {
      LOOK.fallback = true;
      console.warn("[game] pointer lock error — drag-look enabled");
    };
    const onMove = (ev: MouseEvent) => {
      const looking = LOOK.locked || (dragging && G.deskMode === "world");
      if (!looking) return;
      if (dragging && !LOOK.locked) dragDist += Math.abs(ev.movementX) + Math.abs(ev.movementY);
      LOOK.yaw -= ev.movementX * 0.0021;
      LOOK.pitch = THREE.MathUtils.clamp(LOOK.pitch - ev.movementY * 0.0021, -1.25, 1.25);
    };
    el.addEventListener("click", onClick);
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("pointerlockerror", onLockError);
    document.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointerlockerror", onLockError);
      document.removeEventListener("mousemove", onMove);
    };
  }, [tier]);

  /* saved progress — missions survive a reload */
  useEffect(() => {
    if (tier !== "full") return;
    try {
      const raw = localStorage.getItem("wc-save");
      if (!raw) return;
      const sv = JSON.parse(raw) as { mission?: number; hits?: number; best?: number };
      if (typeof sv.mission === "number" && sv.mission > G.mission) G.mission = sv.mission;
      if (typeof sv.hits === "number") RANGE_SCORE.hits = sv.hits;
      if (typeof sv.best === "number") RANGE_SCORE.best = sv.best;
    } catch {}
  }, [tier]);

  /* QA deep link: /?room=1 stand in the office */
  useEffect(() => {
    if (tier !== "full") return;
    if (new URLSearchParams(window.location.search).get("room") === "1") {
      G.deskMode = "world";
      G.deskT = 1;
      G.px = 696.5;
      G.pz = 334.5;
      PHYS.playerTeleport = [696.5, 334.5];
      LOOK.yaw = Math.PI - 0.35; // facing the desk
      LOOK.pitch = 0;
    }
  }, [tier]);

  /* QA deep link: /?p=x,z,yaw stand anywhere */
  useEffect(() => {
    if (tier !== "full") return;
    const raw = new URLSearchParams(window.location.search).get("p");
    if (!raw) return;
    const [x, z, yaw] = raw.split(",").map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    G.deskMode = "world";
    G.deskT = 1;
    G.px = x;
    G.pz = z;
    PHYS.playerTeleport = [x, z];
    LOOK.yaw = Number.isFinite(yaw) ? yaw : 0;
    LOOK.pitch = 0;
  }, [tier]);

  /* QA deep link: /?m=5 jump to mission start */
  useEffect(() => {
    if (tier !== "full") return;
    const v = Number(new URLSearchParams(window.location.search).get("m"));
    if (Number.isFinite(v) && v >= 1 && v <= MISSIONS.length) {
      const m = MISSIONS[v - 1];
      G.mission = v - 2;
      G.phase = "roam";
      G.px = m.startX + 10;
      G.pz = m.startZ + 10;
      G.cx = m.startX + 18;
      G.cz = m.startZ + 18;
      PHYS.playerTeleport = [G.px, G.pz];
      PHYS.carTeleport = [G.cx, G.cz];
      G.deskMode = "world";
      G.deskT = 1;
    }
  }, [tier]);

  if (tier !== "full") return null;

  const m = hud.mission >= 0 ? MISSIONS[hud.mission] : null;

  return (
    <section aria-label="Whitehead City — the game" data-canvas-walk className="fixed inset-0 z-0 bg-black">
      <Canvas
        data-game-canvas
        dpr={[1, 1.25]}
        camera={{ fov: 74, near: 0.3, far: 4200, position: [G.px - 10, 8, G.pz + 14] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
      >
        <Suspense fallback={null}>
          <Sky />
          <Sun />
          <Environment files="/hdri/sunset.hdr" background={false} />
          <hemisphereLight args={["#ffb98a", "#3a2f4d", 1.15]} />
          <ambientLight color="#ffd9b0" intensity={0.22} />
          <ShadowSun />
          <fog attach="fog" args={["#5a3a55", 260, 2300]} />
          <Physics gravity={[0, -32, 0]}>
          <StaticColliders />
          <PlayerBody />
          <CarBody />
          <Ground />
          <Sidewalks />
          <Skyline />
          <Buildings />
          <Palms />
          <StreetLights />
          <Landmarks />
          <ParkedCars />
          <Traffic />
          <Pedestrians />
          <House />
          <ScreenGlow />
          <PlayerCar />
          <MissionMarkers tick={hud.mission * 100 + hud.step * 10 + (hud.phase === "active" ? 1 : 0)} />
          <Sim onHud={setHud} />
          <FrameStats />
          <Range />
          <Shooter />
          <ShotFX />
          <ViewModel />
          </Physics>
          <Preload all />
          <EffectComposer multisampling={2}>
            <Bloom intensity={0.6} luminanceThreshold={0.62} mipmapBlur />
            <Noise opacity={0.035} />
            <Vignette darkness={0.5} offset={0.25} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* crash banner — the flight recorder speaks */}
      {crash && (
        <div className="absolute inset-x-0 top-10 z-[60] flex justify-center">
          <p className="max-w-2xl border border-red-400/60 bg-black/85 px-4 py-2 font-mono text-[11px] text-red-300">
            CRASH · {crash} — copy this to Josh&rsquo;s next report
          </p>
        </div>
      )}

      {/* loading gate — everything preloads behind this, so nothing pops in */}
      {!booted && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500"
          style={{ opacity: progress >= 100 ? 0 : 1, pointerEvents: "none" }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-[#e2c078]">Whitehead City</p>
          <div className="mt-5 h-[3px] w-56 overflow-hidden rounded bg-white/10">
            <div className="h-full bg-[#e2c078] transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 font-mono text-[10px] tracking-[0.2em] text-white/40">{Math.round(progress)}%</p>
        </div>
      )}

      {fpsOn && <FpsReadout />}

      {/* -------------------- the desk (the site itself) -------------------- */}
      <DesktopOverlay
        mode={hud.deskMode}
        rect={hud.deskRect}
        opacity={hud.deskMode === "desk" ? 1 : Math.max(0, 1 - Math.max(0, hud.deskT - 0.55) / 0.3)}
        onStepBack={() => {
          if (G.deskMode === "desk") G.deskMode = "toWorld";
        }}
      />

      {/* ------------------------------ HUD ------------------------------ */}
      <div className="pointer-events-none absolute inset-0 z-10" style={{ opacity: hud.deskMode === "world" ? 1 : hud.deskMode === "toWorld" ? Math.max(0, (hud.deskT - 0.7) / 0.3) : 0 }}>
        {/* crosshair */}
        {hud.deskMode === "world" && hud.mode === "foot" && (hud.locked || hud.lockFallback) && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
            {hud.weapon > 0 && (
              <>
                <div className="absolute left-1/2 top-1/2 h-[2px] w-2 -translate-x-[14px] -translate-y-1/2 bg-white/70" />
                <div className="absolute left-1/2 top-1/2 h-[2px] w-2 translate-x-[6px] -translate-y-1/2 bg-white/70" />
                <div className="absolute left-1/2 top-1/2 h-2 w-[2px] -translate-x-1/2 -translate-y-[14px] bg-white/70" />
                <div className="absolute left-1/2 top-1/2 h-2 w-[2px] -translate-x-1/2 translate-y-[6px] bg-white/70" />
              </>
            )}
          </div>
        )}

        {/* weapon slots — bottom right, HL-style */}
        {hud.deskMode === "world" && hud.mode === "foot" && (
          <div className="absolute bottom-6 right-6 flex gap-2 sm:right-10">
            {[
              [1, "X-ACTO"],
              [2, "PISTOL"],
            ].map(([n, label]) => (
              <div
                key={n}
                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] ${
                  hud.weapon === n
                    ? "border-[#e2c078] bg-black/70 text-[#e2c078]"
                    : "border-white/15 bg-black/40 text-white/40"
                }`}
              >
                <kbd className="font-semibold">{n}</kbd> {label}
              </div>
            ))}
          </div>
        )}

        {/* range scorecard */}
        {hud.range && hud.deskMode === "world" && (
          <div className="absolute left-6 top-32 sm:left-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#e2c078]">The Range</p>
            <p className="mt-1 font-mono text-[13px] uppercase tracking-[0.15em] text-white/85" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>
              Hits {hud.range.hits} · Streak {hud.range.streak} · Best {hud.range.best}
            </p>
            {hud.weapon === 0 && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Press 2 for the pistol</p>
            )}
          </div>
        )}

        {/* click to look */}
        {hud.deskMode === "world" && hud.mode === "foot" && !hud.locked && (
          <div className="absolute inset-x-0 top-[12%] flex justify-center">
            <p className="flex items-center gap-3 rounded-md border border-[#e2c078]/60 bg-black/70 px-6 py-3 font-mono text-[13px] uppercase tracking-[0.25em] text-white shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#e2c078]" />
              {hud.lockFallback ? "Drag to look · F to fire" : "Click to look around"}
            </p>
          </div>
        )}

        {/* interaction prompt — doors first, then relics */}
        {(hud.doorPrompt || hud.relicPrompt) && !hud.caption && (
          <div className="absolute inset-x-0 bottom-[30%] flex justify-center">
            <p className="border border-white/20 bg-black/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/85">
              {hud.doorPrompt ?? hud.relicPrompt}
            </p>
          </div>
        )}

        {/* relic story card */}
        {hud.caption && (
          <div className="absolute inset-x-0 bottom-[18%] flex justify-center">
            <div className="max-w-md border border-white/15 bg-black/70 px-8 py-5 text-center backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#e2c078]">{hud.caption.title}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-white/85">{hud.caption.body}</p>
            </div>
          </div>
        )}

        {/* welcome cards — the house first, the city after */}
        {hud.deskMode === "world" && hud.mission === -1 && hud.phase === "roam" && hud.inHouse && (
          <div className="absolute inset-x-0 top-[16%] flex justify-center">
            <div className="max-w-md px-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#e2c078]">Home</p>
              <p className="mt-2 text-white/85" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
                Look around. It&rsquo;s all here.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {[
                  ["WASD", "move"],
                  ["Mouse", "look"],
                  ["E", "interact"],
                ].map(([key, act]) => (
                  <span key={key} className="flex items-center gap-2">
                    <kbd className="rounded-md border border-white/30 bg-black/50 px-2.5 py-1 font-mono text-[12px] font-semibold text-white shadow-[0_2px_0_rgba(255,255,255,0.15)]">
                      {key}
                    </kbd>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">{act}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        {hud.deskMode === "world" && hud.mission === -1 && hud.phase === "roam" && !hud.inHouse && (
          <div className="absolute inset-x-0 top-[16%] flex justify-center">
            <div className="max-w-md px-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#e2c078]">Whitehead City</p>
              <p className="mt-2 text-white/85" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
                The house was sitting in a whole world. Your life is out here — follow the gold light.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <kbd className="rounded-md border border-white/30 bg-black/50 px-2.5 py-1 font-mono text-[12px] font-semibold text-white shadow-[0_2px_0_rgba(255,255,255,0.15)]">
                  E
                </kbd>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">the car is in the driveway</span>
              </div>
            </div>
          </div>
        )}

        {/* waypoint — objective, distance, bearing arrow */}
        {hud.objective && hud.phase !== "passed" && hud.phase !== "credits" && hud.phase !== "brief" && (
          <div className="absolute inset-x-0 top-8 flex justify-center">
            <div className="flex items-center gap-3 rounded-md border border-white/15 bg-black/60 px-4 py-2">
              <span
                className="inline-block font-mono text-[15px]"
                style={{ color: hud.objective.color, transform: `rotate(${hud.objective.bearing}rad)` }}
              >
                ↑
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/85">
                {hud.objective.label}
              </span>
              <span className="font-mono text-[11px] tabular-nums" style={{ color: hud.objective.color }}>
                {hud.objective.dist}m
              </span>
            </div>
          </div>
        )}

        {/* speed readout — car only */}
        {hud.mode === "car" && (
          <div className="absolute bottom-8 right-6 text-right sm:right-10">
            <p className="font-mono text-2xl text-white/90" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
              {Math.round(hud.speed * 1.6)}
              <span className="ml-1 text-[10px] uppercase tracking-[0.2em] text-white/50">km/h</span>
            </p>
          </div>
        )}

        {/* mission brief card */}
        {hud.phase === "brief" && m && (
          <div className="absolute inset-x-0 bottom-[22%] flex justify-center">
            <div className="max-w-lg px-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#e2c078]">{m.year}</p>
              <h2 className="mt-1 font-display text-5xl italic text-[#e2c078]" style={{ textShadow: "0 3px 30px rgba(0,0,0,0.9)" }}>
                {m.title}
              </h2>
              <p className="mt-3 text-white/85" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
                {m.brief}
              </p>
            </div>
          </div>
        )}

        {/* objective, top-left */}
        {hud.phase === "active" && m && (
          <div className="absolute left-6 top-20 max-w-xs sm:left-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#e2c078]">{m.title}</p>
            <p className="mt-1 text-lg font-medium text-white" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
              {m.steps[hud.step].text}
              {m.steps[hud.step].targets ? ` — ${Math.min(hud.stepHits, m.steps[hud.step].targets!)}/${m.steps[hud.step].targets}` : ""}
            </p>
            {m.steps[hud.step].needCar && hud.mode === "foot" && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff9a6a]">You'll need the car — E to get in</p>
            )}
          </div>
        )}

        {/* MISSION PASSED */}
        {hud.phase === "passed" && m && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ background: "radial-gradient(60% 50% at 50% 50%, rgba(226,192,120,0.14), transparent 70%)" }}>
            <h2 className="font-display text-6xl italic text-[#e2c078]" style={{ textShadow: "0 4px 40px rgba(0,0,0,0.9)" }}>
              MISSION PASSED
            </h2>
            <p className="mt-3 max-w-md px-6 text-white/85" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
              {m.passed}
            </p>
          </div>
        )}

        {/* district card */}
        {hud.district && hud.mode === "car" && hud.phase !== "passed" && (
          <div className="absolute bottom-24 right-6 sm:right-10">
            <p className="font-display text-3xl italic text-white/90" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.9)" }}>
              {hud.district}
            </p>
          </div>
        )}

        {/* sit-back-down hint */}
        {hud.nearDesk && hud.deskMode === "world" && !hud.doorPrompt && !hud.relicPrompt && !hud.caption && (
          <div className="absolute inset-x-0 bottom-[26%] flex justify-center">
            <p className="border border-white/20 bg-black/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/85">
              E — sit back down at the desk
            </p>
          </div>
        )}

        {/* enter-car hint */}
        {hud.nearCar && (
          <div className="absolute inset-x-0 bottom-[18%] flex justify-center">
            <p className="border border-white/20 bg-black/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/85">
              E — get in the car
            </p>
          </div>
        )}

        {/* minimap — city gear stays outside the house */}
        {!hud.inHouse && (
          <div className="absolute bottom-6 left-6">
            <Minimap h={hud} />
          </div>
        )}

        {/* credits */}
        {hud.phase === "credits" && (
          <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-center backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#e2c078]">Whitehead City · 1993 → now</p>
            <h2 className="mt-3 font-display text-5xl italic text-white sm:text-6xl">
              Still just the kid who
              <br />
              won&rsquo;t stop making things.
            </h2>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
              Starring: Samantha · Gunner · Nolan
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 font-mono text-xs uppercase tracking-widest">
              <button
                onClick={() => {
                  G.phase = "roam";
                  G.phaseT = 0;
                }}
                className="border border-white/25 px-5 py-2.5 text-white transition-colors hover:border-gold hover:text-gold"
              >
                Keep exploring
              </button>
              <Link href="/work" className="border border-white/25 px-5 py-2.5 text-white transition-colors hover:border-gold hover:text-gold">
                The work
              </Link>
              <Link href="/products" className="border border-white/25 px-5 py-2.5 text-white transition-colors hover:border-gold hover:text-gold">
                The products
              </Link>
              <Link href="/contact" className="border border-gold bg-gold px-5 py-2.5 text-ink transition-opacity hover:opacity-85">
                Send a signal →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
