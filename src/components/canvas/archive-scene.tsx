"use client";

/**
 * The Archive scene — a walk through seven lit exhibits.
 *
 * Staging rules (learned the hard way):
 *  - Nothing floats. Work stands on the floor with weight and contact shadow.
 *  - Each era is ONE composed scene in its own pool of light, alternating
 *    sides of an S-curve path. Between scenes: quiet.
 *  - The camera arrives, slows, turns its head toward the work, then releases.
 *    Dwell is where the emotion lives — not the motion.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { eras, artifacts, accent, type Artifact } from "@/content/archive";

/* ------------------------------------------------------------ constants */

const CH = 26; // distance between era scenes along the walk
const ERAS = eras.length;
const DWELL = 0.82; // 0..1 — how hard the camera lingers at each scene

/** Base artwork height per era — scale contrast is part of the story. */
const ERA_HEIGHT: Record<string, number> = {
  childhood: 1.4, // a kid's work, small and low
  poster: 2.3, // printed big, mounted on board
  military: 2.5, // prints in the dark, larger than life
  logos: 1.4,
  web: 1.8,
  app: 1.9,
  today: 1.9,
};

export type SceneRefs = {
  progress: React.RefObject<number>;
  onEra: (i: number) => void;
  onArtifact: (a: Artifact | null) => void;
  onNavigate: (href: string) => void;
};

/* ---------------------------------------------------------------- utils */

const eraColors = eras.map((e) => new THREE.Color(e.bg));
const sideOf = (i: number) => (i % 2 === 0 ? -1 : 1);

function rampColor(out: THREE.Color, e: number) {
  const t = THREE.MathUtils.clamp(e, 0, ERAS - 1);
  const i = Math.min(Math.floor(t), ERAS - 2);
  return out.copy(eraColors[i]).lerp(eraColors[i + 1], t - i);
}

/**
 * Dwell curve: progress → era-float with plateaus at each scene.
 * f(u) = u - A·sin(2πu)/2π slows to (1-A) speed at every integer.
 */
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
  quat: THREE.Quaternion;
  w: number;
  h: number;
  eraIndex: number;
};

/**
 * Gallery layout, computed as a whole:
 *  - pieces stand side by side on the floor, parallel to the path
 *  - crowded eras break into salon-style ranks (front row + set-back row)
 *  - the wall's standoff derives from its widest rank, so the full scene
 *    always fits the frame with air around it
 */
type EraAnchor = { s: number; center: THREE.Vector3; dwellPoint: THREE.Vector3; D: number };

const GAP = 0.7;
const MAX_RANK = 12.0; // max meters of artwork per rank

const { LAYOUT, ANCHORS } = (() => {
  const layout = new Map<string, Placement>();
  const anchors: EraAnchor[] = [];

  for (let i = 0; i < ERAS; i++) {
    const era = eras[i];
    const s = sideOf(i);
    const list = artifacts.filter((a) => a.eraId === era.id);

    // Measure pieces.
    const dims = list.map((a, j) => {
      const baseH = ERA_HEIGHT[era.id] ?? 2;
      const h = baseH * (1 + (j % 3 === 1 ? 0.1 : j % 3 === 2 ? -0.08 : 0));
      const w = Math.min(h * parseAspect(a.aspect), 4.4);
      return { w, h };
    });

    // Chunk into ranks.
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
    const rankLen = (r: number[]) =>
      r.reduce((t, j) => t + dims[j].w, 0) + GAP * (r.length - 1);
    const widest = Math.max(...ranks.map(rankLen));

    // Standoff: the whole front rank fits a ~62° horizontal view with air.
    const D = THREE.MathUtils.clamp(2.8 + widest * 0.58, 4.2, 10.5);
    const center = new THREE.Vector3(s * D, 0, -i * CH);
    const dwellPoint = new THREE.Vector3(s * 0.6, 1.58, -i * CH + 0.3);
    anchors.push({ s, center, dwellPoint, D });

    ranks.forEach((rank, r) => {
      const L = rankLen(rank);
      let cursor = -L / 2;
      rank.forEach((j) => {
        const a = list[j];
        const { w, h } = dims[j];
        const zOff = cursor + w / 2;
        cursor += w + GAP;

        const pos = new THREE.Vector3(
          center.x + s * (r * 1.7 + ((j % 2) * 0.3)), // back ranks step away
          h / 2 + 0.015,
          center.z + zOff + (r % 2 ? 0.5 : 0)
        );

        const m = new THREE.Matrix4().lookAt(
          pos,
          new THREE.Vector3(dwellPoint.x, h * 0.42, dwellPoint.z),
          new THREE.Vector3(0, 1, 0)
        );
        const quat = new THREE.Quaternion().setFromRotationMatrix(m);
        const jitter = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          ((j * 29) % 7) / 60 - 0.05
        );
        const lean = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.04);
        quat.multiply(jitter).multiply(lean);

        layout.set(a.id, { pos, quat, w, h, eraIndex: i });
      });
    });
  }
  return { LAYOUT: layout, ANCHORS: anchors };
})();

function eraAnchors(i: number): EraAnchor {
  return ANCHORS[i];
}

/* ------------------------------------------------------- shared textures */

let shadowTex: THREE.CanvasTexture | null = null;
function getShadowTexture(): THREE.CanvasTexture {
  if (shadowTex) return shadowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

function makePlaceholderTexture(a: Artifact, dark: boolean): THREE.CanvasTexture {
  const r = parseAspect(a.aspect);
  const W = 512;
  const H = Math.round(W / r);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = dark ? "#201f1c" : "#efe6d3";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = dark ? "rgba(241,236,226,0.3)" : "rgba(38,34,27,0.3)";
  g.setLineDash([10, 8]);
  g.lineWidth = 2;
  g.strokeRect(18, 18, W - 36, H - 36);
  g.setLineDash([]);
  g.fillStyle = dark ? "rgba(241,236,226,0.45)" : "rgba(38,34,27,0.45)";
  g.font = "500 17px ui-monospace, monospace";
  g.textAlign = "center";
  g.fillText("AWAITING SCAN", W / 2, H / 2 - 14);
  g.fillStyle = dark ? "rgba(241,236,226,0.85)" : "rgba(38,34,27,0.85)";
  g.font = `italic 600 ${Math.min(32, W / 11)}px Georgia, serif`;
  g.fillText(a.title, W / 2, H / 2 + 22, W - 90);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function useBoardTexture(a: Artifact, dark: boolean): THREE.Texture | null {
  const [map, setMap] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!a.image) {
      const t = makePlaceholderTexture(a, dark);
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
  }, [a, dark]);
  return map;
}

/* ------------------------------------------------------------- artifact */

function ArtifactPiece({ a, refs }: { a: Artifact; refs: SceneRefs }) {
  const era = eras.find((e) => e.id === a.eraId)!;
  const map = useBoardTexture(a, era.dark);
  const group = useRef<THREE.Group>(null!);
  const place = LAYOUT.get(a.id)!;
  const { w, h } = place;

  useFrame(({ camera }) => {
    const g = group.current;
    if (!g) return;
    // A quiet acknowledgement as you stand before it — a breath, not a pop.
    const d = g.position.distanceTo(camera.position);
    const near = THREE.MathUtils.clamp(1 - d / 8, 0, 1);
    const k = near * near;
    const target = 1 + k * 0.03;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, target, 0.06));
  });

  return (
    <group ref={group} position={place.pos} quaternion={place.quat}>
      {/* contact shadow — weight on the floor */}
      <mesh
        position={[0, -h / 2 + 0.005, 0.15]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[w * 1.35, w * 0.5]} />
        <meshBasicMaterial
          map={getShadowTexture()}
          transparent
          opacity={era.dark ? 0.55 : 0.34}
          depthWrite={false}
        />
      </mesh>
      {/* mounted board — thickness, hand-cut edge */}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[w + 0.09, h + 0.09, 0.075]} />
        <meshStandardMaterial color={era.dark ? "#26251f" : "#d9cdb4"} roughness={0.93} />
      </mesh>
      {/* the work */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = a.href ? "pointer" : "default";
          refs.onArtifact(a);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
          refs.onArtifact(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (a.href) refs.onNavigate(a.href);
        }}
      >
        <planeGeometry args={[w, h]} />
        {map ? (
          <meshStandardMaterial
            map={map}
            roughness={0.7}
            emissive="#ffffff"
            emissiveMap={map}
            emissiveIntensity={era.dark ? 0.42 : 0.2}
          />
        ) : (
          <meshStandardMaterial color={era.dark ? "#232220" : "#e6dcc6"} roughness={0.85} />
        )}
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------ exhibits */

function SceneLights() {
  const spots = useRef<(THREE.SpotLight | null)[]>([]);
  const targets = useMemo(
    () =>
      eras.map((_, i) => {
        const { center } = eraAnchors(i);
        const t = new THREE.Object3D();
        t.position.set(center.x, 1.1, center.z);
        return t;
      }),
    []
  );

  useFrame(({ camera }) => {
    for (let i = 0; i < ERAS; i++) {
      const s = spots.current[i];
      if (!s) continue;
      // Only nearby scenes burn bright — pools of light in the walk.
      const dz = Math.abs(-i * CH - camera.position.z);
      const near = THREE.MathUtils.clamp(1 - dz / (CH * 1.15), 0, 1);
      s.intensity = 14 * near * near + 0.6;
    }
  });

  return (
    <>
      {eras.map((era, i) => {
        const { s, center } = eraAnchors(i);
        return (
          <group key={era.id}>
            <primitive object={targets[i]} />
            <spotLight
              ref={(el: THREE.SpotLight | null) => {
                spots.current[i] = el;
                if (el) el.target = targets[i];
              }}
              position={[center.x - s * 1.6, 6.4, center.z + 2.6]}
              angle={0.62}
              penumbra={0.95}
              distance={22}
              decay={1.5}
              color={era.light}
              intensity={2}
            />
          </group>
        );
      })}
    </>
  );
}

/* ----------------------------------------------------------------- dust */

function Dust() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const n = 1500;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = Math.random() * 5.5;
      arr[i * 3 + 2] = 14 - Math.random() * (ERAS * CH + 36);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.1) * 0.3;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        sizeAttenuation
        transparent
        opacity={0.38}
        color="#d8cfbc"
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* --------------------------------------------------------------- finale */

function Finale({ refs }: { refs: SceneRefs }) {
  const group = useRef<THREE.Points>(null!);
  const zC = -(ERAS - 1) * CH - 7;

  const [positions, colors] = useMemo(() => {
    const n = 3200;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const palette = [...eraColors, new THREE.Color(accent), new THREE.Color(accent)];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = 2.4 + Math.random() * 3.4;
      pos[i * 3] = Math.cos(a) * rad * (0.7 + Math.random() * 0.6);
      pos[i * 3 + 1] = 1.6 + (Math.random() - 0.5) * 3.4;
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
    const active = THREE.MathUtils.clamp((p - 0.84) / 0.16, 0, 1);
    g.rotation.y = clock.elapsedTime * (0.03 + active * 0.12);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pointer.y * 0.12 * active, 0.04);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -pointer.x * 0.15 * active, 0.04);
    g.scale.setScalar(1 + Math.sin(clock.elapsedTime * 0.6) * 0.02 * active);
  });

  return (
    <points ref={group}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ rig */

function Rig({ refs }: { refs: SceneRefs }) {
  const { scene, camera } = useThree();
  const bg = useMemo(() => new THREE.Color(), []);
  const ambient = useRef<THREE.AmbientLight>(null!);
  const lantern = useRef<THREE.PointLight>(null!);
  const floorMat = useRef<THREE.MeshStandardMaterial>(null!);
  const lastEra = useRef(-1);
  const nearest = useRef<string | null>(null);
  const gaze = useMemo(() => new THREE.Vector3(0, 1.4, 0), []);

  useMemo(() => {
    scene.fog = new THREE.Fog("#F3E9D7", 6, 42);
  }, [scene]);

  useFrame((_, delta) => {
    const p = THREE.MathUtils.clamp(refs.progress.current ?? 0, 0, 1);
    const e = dwellCurve(p); // era-float with dwell plateaus
    const i = Math.round(THREE.MathUtils.clamp(e, 0, ERAS - 1));
    const { dwellPoint } = eraAnchors(i);

    // Lead-in: open pulled back from the first exhibit — it waits ahead in
    // the light. The first scroll carries you to it.
    const lead = 1 - THREE.MathUtils.smoothstep(p, 0, 0.055);

    // How present we are at scene i (1 = standing in the exhibit).
    const presence = THREE.MathUtils.clamp(1 - Math.abs(e - i) * 2.2, 0, 1) * (1 - lead);
    const w = presence * presence * (3 - 2 * presence); // smoothstep

    // --- camera: S-curve path, easing toward each exhibit, then releasing ---
    const z = 2 - e * CH + lead * 10;
    const x = THREE.MathUtils.lerp(0, dwellPoint.x, w);
    const y = 1.62 + Math.sin(e * Math.PI * 2.2) * 0.05 * (1 - w);
    camera.position.set(x, y, z);

    // Gaze: down the walk between scenes; toward the work when arrived.
    const { center } = eraAnchors(i);
    const ahead = 1 - w;
    gaze.set(
      center.x * w + x * ahead * 0.3,
      1.25 * w + 1.45 * ahead,
      (center.z - 0.4) * w + (z - 10) * ahead
    );
    camera.lookAt(gaze);

    // --- environment ramp ---
    rampColor(bg, e);
    scene.background = bg;
    (scene.fog as THREE.Fog).color.copy(bg);

    if (ambient.current) {
      ambient.current.intensity = THREE.MathUtils.lerp(0.62, 0.18, e / (ERAS - 1));
      ambient.current.color.set(eras[i].light).lerp(new THREE.Color("#ffffff"), 0.5);
    }
    if (lantern.current) {
      lantern.current.position.set(x, 2.4, z - 2.5);
      lantern.current.intensity = THREE.MathUtils.lerp(0, 1.6, THREE.MathUtils.clamp((e - 3) / 2.4, 0, 1));
    }
    if (floorMat.current) floorMat.current.color.copy(bg).multiplyScalar(0.9);

    // --- HUD callbacks ---
    if (i !== lastEra.current) {
      lastEra.current = i;
      refs.onEra(i);
    }
    // Caption the exhibit while standing in it.
    let best: Artifact | null = null;
    if (w > 0.45) {
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
    }

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__archiveDebug = {
        p,
        e: +e.toFixed(2),
        era: i,
        presence: +w.toFixed(2),
        cam: camera.position.toArray().map((n) => +n.toFixed(1)),
      };
    }
    void delta;
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.6} color="#fff2dd" />
      {/* the gold safelight that joins the walk as the rooms go dark */}
      <pointLight ref={lantern} intensity={0} color={accent} distance={15} decay={1.6} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (-(ERAS - 1) * CH) / 2]}>
        <planeGeometry args={[80, ERAS * CH + 100]} />
        <meshStandardMaterial ref={floorMat} color="#e9e0cb" roughness={0.97} />
      </mesh>
    </>
  );
}

/* ---------------------------------------------------------------- scene */

export function ArchiveScene({ refs }: { refs: SceneRefs }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 50, near: 0.1, far: 90, position: [0, 1.62, 2] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0 }}
      aria-hidden
    >
      <Rig refs={refs} />
      <SceneLights />
      {artifacts.map((a) => (
        <ArtifactPiece key={a.id} a={a} refs={refs} />
      ))}
      <Dust />
      <Finale refs={refs} />
      <EffectComposer>
        <Noise opacity={0.04} />
        <Vignette darkness={0.46} offset={0.3} />
      </EffectComposer>
    </Canvas>
  );
}
