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
import { detectTier, type CanvasTier } from "../canvas/capability";
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
const CAR_START = { x: -530, z: -530 };

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
};

const G: GameState = {
  mode: "foot",
  px: CAR_START.x - 20,
  pz: CAR_START.z + 6,
  pHeading: 0,
  cx: CAR_START.x,
  cz: CAR_START.z,
  cHeading: 0,
  cSpeed: 0,
  mission: -1,
  step: 0,
  phase: "roam",
  phaseT: 0,
};

const keys: Record<string, boolean> = {};

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

function Sun() {
  return (
    <mesh position={[-1800, 240, 900]}>
      <sphereGeometry args={[130, 24, 24]} />
      <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
    </mesh>
  );
}

function Ground() {
  const road = useMemo(roadTexture, []);
  return (
    <group>
      {/* земля base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[1620, 1620]} />
        <meshStandardMaterial color="#2c3038" roughness={1} />
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
            <meshStandardMaterial map={t} roughness={0.95} />
          </mesh>
        );
      })}
      {ROADS_Z.map((z) => {
        const t = road.clone();
        t.repeat.set(1, 40);
        return (
          <mesh key={"rz" + z} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.03, z]}>
            <planeGeometry args={[ROAD, 1600]} />
            <meshStandardMaterial map={t} roughness={0.95} />
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
  const winTex = useMemo(windowTexture, []);
  const { normal, neon } = useMemo(() => {
    const normal: typeof BUILDINGS = [];
    const neon: typeof BUILDINGS = [];
    for (const b of BUILDINGS) (b.neon ? neon : normal).push(b);
    return { normal, neon };
  }, []);

  const normalRef = useRef<THREE.InstancedMesh>(null!);
  const neonRef = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    normal.forEach((b, i) => {
      m.makeScale(b.w, b.h, b.d);
      m.setPosition(b.x, b.h / 2, b.z);
      normalRef.current.setMatrixAt(i, m);
      normalRef.current.setColorAt(i, c.setRGB(...b.color));
    });
    normalRef.current.instanceMatrix.needsUpdate = true;
    if (normalRef.current.instanceColor) normalRef.current.instanceColor.needsUpdate = true;
    neon.forEach((b, i) => {
      m.makeScale(b.w, b.h, b.d);
      m.setPosition(b.x, b.h / 2, b.z);
      neonRef.current.setMatrixAt(i, m);
      const hues = ["#ff5f9e", "#37d3d3", "#c884ff", "#ffb84d"];
      neonRef.current.setColorAt(i, c.set(hues[i % hues.length]));
    });
    neonRef.current.instanceMatrix.needsUpdate = true;
    if (neonRef.current.instanceColor) neonRef.current.instanceColor.needsUpdate = true;
  }, [normal, neon]);

  return (
    <group>
      <instancedMesh ref={normalRef} args={[undefined, undefined, normal.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={winTex} roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={neonRef} args={[undefined, undefined, neon.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={winTex} roughness={0.6} emissive="#ffffff" emissiveIntensity={0.12} />
      </instancedMesh>
    </group>
  );
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
        </group>
      ))}
    </group>
  );
}

function Landmarks() {
  return (
    <group>
      {LANDMARKS.map((l) => {
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
      m.compose(new THREE.Vector3(s.x, 1, s.z), q, new THREE.Vector3(4.4, 2, 9));
      ref.current.setMatrixAt(i, m);
      ref.current.setColorAt(i, c.set(s.hue));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [spots]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, spots.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.35} metalness={0.5} />
    </instancedMesh>
  );
}

/* ----------------------------------------------------- player + vehicle */

function PlayerCar() {
  const grp = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (!grp.current) return;
    grp.current.position.set(G.cx, 0, G.cz);
    grp.current.rotation.y = G.cHeading;
  });
  return (
    <group ref={grp}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[4.6, 1.5, 9.4]} />
        <meshStandardMaterial color="#d8535f" roughness={0.25} metalness={0.6} />
      </mesh>
      <mesh position={[0, 2.2, -0.4]}>
        <boxGeometry args={[4.0, 1.2, 4.6]} />
        <meshStandardMaterial color="#20242c" roughness={0.15} metalness={0.7} />
      </mesh>
      {[
        [-1.9, -3.2],
        [1.9, -3.2],
        [-1.9, 3.2],
        [1.9, 3.2],
      ].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.75, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.75, 0.75, 0.6, 10]} />
          <meshStandardMaterial color="#0c0e12" roughness={0.9} />
        </mesh>
      ))}
      {/* headlights */}
      <mesh position={[-1.4, 1.1, -4.75]}>
        <sphereGeometry args={[0.28, 6, 6]} />
        <meshBasicMaterial color="#ffe9c0" toneMapped={false} />
      </mesh>
      <mesh position={[1.4, 1.1, -4.75]}>
        <sphereGeometry args={[0.28, 6, 6]} />
        <meshBasicMaterial color="#ffe9c0" toneMapped={false} />
      </mesh>
    </group>
  );
}

function PlayerFigure() {
  const grp = useRef<THREE.Group>(null!);
  const walk = useRef(0);
  useFrame((_, dt) => {
    if (!grp.current) return;
    grp.current.visible = G.mode === "foot";
    grp.current.position.set(G.px, 0, G.pz);
    grp.current.rotation.y = G.pHeading;
    const moving = keys["w"] || keys["s"] || keys["arrowup"] || keys["arrowdown"] || keys["a"] || keys["d"] || keys["arrowleft"] || keys["arrowright"];
    if (moving && G.mode === "foot") walk.current += dt * 10;
    const sw = Math.sin(walk.current) * 0.5;
    const legs = grp.current.children as THREE.Mesh[];
    if (legs[2]) legs[2].rotation.x = sw;
    if (legs[3]) legs[3].rotation.x = -sw;
  });
  return (
    <group ref={grp}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <capsuleGeometry args={[0.55, 1.6, 4, 8]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.15, 0]}>
        <sphereGeometry args={[0.42, 10, 10]} />
        <meshStandardMaterial color="#north" onUpdate={(m) => ((m as THREE.MeshStandardMaterial).color = new THREE.Color("#c9a582"))} />
      </mesh>
      <mesh position={[-0.26, 1.05, 0]}>
        <capsuleGeometry args={[0.2, 0.9, 4, 6]} />
        <meshStandardMaterial color="#22262e" />
      </mesh>
      <mesh position={[0.26, 1.05, 0]}>
        <capsuleGeometry args={[0.2, 0.9, 4, 6]} />
        <meshStandardMaterial color="#22262e" />
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
        <mesh position={[next.startX, 6, next.startZ]}>
          <cylinderGeometry args={[3.4, 3.4, 12, 18, 1, true]} />
          <meshBasicMaterial color="#e2c078" transparent opacity={0.45} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      )}
      {step && (
        <mesh position={[step.x, 6, step.z]}>
          <cylinderGeometry args={[step.radius ? step.radius * 0.5 : 4, step.radius ? step.radius * 0.5 : 4, 12, 18, 1, true]} />
          <meshBasicMaterial color="#7fd3ff" transparent opacity={0.45} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------------------------------------- the sim */

function Sim({ onHud }: { onHud: (h: HudState) => void }) {
  const { camera } = useThree();
  const camPos = useRef(new THREE.Vector3(G.px - 10, 8, G.pz + 14));
  const lastDistrict = useRef<string | null>(null);
  const districtTimer = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    G.phaseT += dt;

    /* -------- movement -------- */
    const up = keys["w"] || keys["arrowup"];
    const down = keys["s"] || keys["arrowdown"];
    const left = keys["a"] || keys["arrowleft"];
    const right = keys["d"] || keys["arrowright"];
    const run = keys["shift"];

    if (G.mode === "foot") {
      let vx = 0,
        vz = 0;
      if (up) vz -= 1;
      if (down) vz += 1;
      if (left) vx -= 1;
      if (right) vx += 1;
      const len = Math.hypot(vx, vz);
      if (len > 0) {
        vx /= len;
        vz /= len;
        const sp = run ? 26 : 14;
        G.px += vx * sp * dt;
        G.pz += vz * sp * dt;
        G.pHeading = Math.atan2(-vx, -vz) + Math.PI;
      }
      collide(1.4, "p");
    } else {
      // car — arcade
      const accel = up ? 44 : 0;
      const brake = down ? 60 : 0;
      G.cSpeed += (accel - Math.sign(G.cSpeed) * (brake + 8)) * dt;
      if (down && Math.abs(G.cSpeed) < 2) G.cSpeed = -16; // reverse
      G.cSpeed = THREE.MathUtils.clamp(G.cSpeed, -22, 74);
      if (!up && !down) G.cSpeed *= 1 - 1.2 * dt;
      const steer = (left ? 1 : 0) - (right ? 1 : 0);
      G.cHeading += steer * dt * 1.9 * THREE.MathUtils.clamp(Math.abs(G.cSpeed) / 40, 0, 1) * Math.sign(G.cSpeed);
      G.cx -= Math.sin(G.cHeading) * G.cSpeed * dt;
      G.cz -= Math.cos(G.cHeading) * G.cSpeed * dt;
      collide(3.2, "c");
      G.px = G.cx;
      G.pz = G.cz;
    }
    G.px = THREE.MathUtils.clamp(G.px, -WORLD_HALF, WORLD_HALF);
    G.pz = THREE.MathUtils.clamp(G.pz, -WORLD_HALF, WORLD_HALF);
    G.cx = THREE.MathUtils.clamp(G.cx, -WORLD_HALF, WORLD_HALF);
    G.cz = THREE.MathUtils.clamp(G.cz, -WORLD_HALF, WORLD_HALF);

    /* -------- camera chase -------- */
    const tx = G.mode === "car" ? G.cx : G.px;
    const tz = G.mode === "car" ? G.cz : G.pz;
    const th = G.mode === "car" ? G.cHeading : G.pHeading;
    const dist = G.mode === "car" ? 26 : 15;
    const height = G.mode === "car" ? 11 : 7;
    const want = new THREE.Vector3(tx + Math.sin(th) * dist, height, tz + Math.cos(th) * dist);
    camPos.current.lerp(want, 1 - Math.pow(0.0015, dt));
    camera.position.copy(camPos.current);
    camera.lookAt(tx, 2.5, tz);

    /* -------- missions -------- */
    if (G.phase === "roam") {
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
      const okMode = !st.needCar || G.mode === "car";
      if (okMode && Math.hypot(G.px - st.x, G.pz - st.z) < (st.radius ?? 14)) {
        if (G.step + 1 < m.steps.length) {
          G.step++;
        } else {
          G.phase = G.mission === MISSIONS.length - 1 ? "credits" : "passed";
          G.phaseT = 0;
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
      nearCar: G.mode === "foot" && Math.hypot(G.px - G.cx, G.pz - G.cz) < 7,
    });
  });

  return null;
}

function collide(r: number, who: "p" | "c") {
  const x = who === "p" ? G.px : G.cx;
  const z = who === "p" ? G.pz : G.cz;
  let nx = x,
    nz = z;
  for (const b of BUILDINGS) {
    const hw = b.w / 2 + r;
    const hd = b.d / 2 + r;
    const dx = nx - b.x;
    const dz = nz - b.z;
    if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
      const px = hw - Math.abs(dx);
      const pz = hd - Math.abs(dz);
      if (px < pz) nx = b.x + Math.sign(dx) * hw;
      else nz = b.z + Math.sign(dz) * hd;
      if (who === "c") G.cSpeed *= 0.4;
    }
  }
  if (who === "p") {
    G.px = nx;
    G.pz = nz;
  } else {
    G.cx = nx;
    G.cz = nz;
  }
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
};

function Minimap({ h }: { h: HudState }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    const S = 150;
    c.width = S * 2;
    c.height = S * 2;
    g.scale(2, 2);
    const w2m = (v: number) => ((v + 800) / 1600) * S;
    // bg water + land
    g.fillStyle = "#141c33";
    g.fillRect(0, 0, S, S);
    g.fillStyle = "#242a31";
    g.fillRect(w2m(-790), w2m(-790), w2m(790) - w2m(-790), w2m(790) - w2m(-790));
    for (const d of DISTRICTS) {
      g.fillStyle = d.hue + "55";
      g.fillRect(w2m(d.x1), w2m(d.z1), w2m(d.x2) - w2m(d.x1), w2m(d.z2) - w2m(d.z1));
    }
    g.strokeStyle = "#3a414b";
    g.lineWidth = 1.4;
    for (const x of ROADS_X) {
      g.beginPath();
      g.moveTo(w2m(x), 0);
      g.lineTo(w2m(x), S);
      g.stroke();
    }
    for (const z of ROADS_Z) {
      g.beginPath();
      g.moveTo(0, w2m(z));
      g.lineTo(S, w2m(z));
      g.stroke();
    }
    // target
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
      g.fillStyle = bc;
      g.beginPath();
      g.arc(w2m(bx), w2m(bz), 4, 0, Math.PI * 2);
      g.fill();
    }
    // player arrow
    g.save();
    g.translate(w2m(h.px), w2m(h.pz));
    g.rotate(-h.heading);
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(0, -5);
    g.lineTo(3.4, 4);
    g.lineTo(-3.4, 4);
    g.closePath();
    g.fill();
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
  const [started, setStarted] = useState(false);
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
  });

  useEffect(() => setTier(detectTier()), []);

  useEffect(() => {
    if (tier === "full") {
      document.documentElement.classList.add("canvas-mode", "chapter-dark");
      document.body.style.overflow = "hidden";
      return () => {
        document.documentElement.classList.remove("canvas-mode", "chapter-dark");
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
      if (!started) setStarted(true);
      if (k === "e") {
        if (G.mode === "foot" && Math.hypot(G.px - G.cx, G.pz - G.cz) < 7) {
          G.mode = "car";
        } else if (G.mode === "car" && Math.abs(G.cSpeed) < 4) {
          G.mode = "foot";
          G.px = G.cx + Math.cos(G.cHeading) * 5;
          G.pz = G.cz - Math.sin(G.cHeading) * 5;
          G.cSpeed = 0;
        }
      }
    };
    const up = (ev: KeyboardEvent) => (keys[ev.key.toLowerCase()] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [tier, started]);

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
      setStarted(true);
    }
  }, [tier]);

  if (tier !== "full") return null;

  const m = hud.mission >= 0 ? MISSIONS[hud.mission] : null;
  const year = m ? m.year : "1993";

  return (
    <section aria-label="Whitehead City — the game" data-canvas-walk className="fixed inset-0 z-0 bg-black">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 60, near: 0.5, far: 4200, position: [G.px - 10, 8, G.pz + 14] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows={false}
      >
        <Suspense fallback={null}>
          <Sky />
          <Sun />
          <hemisphereLight args={["#ff9a6a", "#2a1f3d", 0.85]} />
          <directionalLight position={[-600, 300, 400]} intensity={1.1} color="#ffb37a" />
          <fog attach="fog" args={["#5a3a55", 220, 1500]} />
          <Ground />
          <Buildings />
          <Palms />
          <StreetLights />
          <Landmarks />
          <ParkedCars />
          <PlayerCar />
          <PlayerFigure />
          <MissionMarkers tick={hud.mission * 100 + hud.step * 10 + (hud.phase === "active" ? 1 : 0)} />
          <Sim onHud={setHud} />
          <EffectComposer>
            <Bloom intensity={0.6} luminanceThreshold={0.62} mipmapBlur />
            <Noise opacity={0.035} />
            <Vignette darkness={0.5} offset={0.25} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* ------------------------------ HUD ------------------------------ */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* title screen */}
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 text-center backdrop-blur-[2px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-[#e2c078]">
              Josh Whitehead presents
            </p>
            <h1 className="mt-4 font-display text-6xl italic tracking-tight text-white sm:text-8xl" style={{ textShadow: "0 4px 40px rgba(226,192,120,0.4)" }}>
              Whitehead City
            </h1>
            <p className="mt-4 max-w-md px-6 text-white/70">
              Every place a life happened, stitched into one city. Ten missions, 1993 → now.
            </p>
            <p className="mt-8 animate-pulse font-mono text-xs uppercase tracking-[0.3em] text-[#e2c078]">
              Press any key to start
            </p>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              WASD drive/walk · SHIFT run · E enter/exit car
            </p>
          </div>
        )}

        {/* year, top-right */}
        <div className="absolute right-6 top-20 text-right sm:right-10">
          <span className="font-display text-5xl italic text-white/90" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
            {year}
          </span>
          {hud.mode === "car" && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
              {Math.round(hud.speed * 1.6)} km/h
            </p>
          )}
        </div>

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
            </p>
            {m.steps[hud.step].needCar && hud.mode === "foot" && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff9a6a]">You'll need the car — E to get in</p>
            )}
          </div>
        )}

        {/* MISSION PASSED */}
        {hud.phase === "passed" && m && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <h2 className="font-display text-6xl italic text-[#e2c078]" style={{ textShadow: "0 4px 40px rgba(0,0,0,0.9)" }}>
              MISSION PASSED
            </h2>
            <p className="mt-3 max-w-md px-6 text-white/85" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
              {m.passed}
            </p>
          </div>
        )}

        {/* district card */}
        {hud.district && hud.phase !== "passed" && (
          <div className="absolute bottom-24 right-6 sm:right-10">
            <p className="font-display text-3xl italic text-white/90" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.9)" }}>
              {hud.district}
            </p>
          </div>
        )}

        {/* enter-car hint */}
        {hud.nearCar && started && (
          <div className="absolute inset-x-0 bottom-[18%] flex justify-center">
            <p className="border border-white/20 bg-black/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/85">
              E — get in the car
            </p>
          </div>
        )}

        {/* minimap */}
        <div className="absolute bottom-6 left-6">
          <Minimap h={hud} />
        </div>

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
