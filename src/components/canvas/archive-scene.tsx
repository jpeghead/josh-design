"use client";

/**
 * The Archive scene — one continuous camera move through seven era chambers.
 * No cuts, no flicks: the environment (background, fog, light) transforms
 * continuously as the camera dollies forward. Artifacts hang in space as
 * mounted boards with real thickness; real images where they exist, labeled
 * empty frames where scans are pending.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { eras, artifacts, accent, type Artifact } from "@/content/archive";

/** Chamber depth along the walk (world units per era). */
const CH = 26;
/** Camera Z at progress 0 / 1. */
const Z_START = 10;
const Z_END = -(eras.length - 1) * CH - 8;

export type SceneRefs = {
  /** Scroll progress 0..1, written by the experience shell every frame. */
  progress: React.RefObject<number>;
  /** Called (throttled by value-change) with the era index under the camera. */
  onEra: (i: number) => void;
  /** Called with the artifact nearest the camera (or null). */
  onArtifact: (a: Artifact | null) => void;
  /** Navigate to an internal route (push-in target). */
  onNavigate: (href: string) => void;
};

/* ---------------------------------------------------------------- utils */

const eraColors = eras.map((e) => new THREE.Color(e.bg));

function rampColor(out: THREE.Color, p: number) {
  const t = THREE.MathUtils.clamp(p, 0, 1) * (eras.length - 1);
  const i = Math.min(Math.floor(t), eras.length - 2);
  return out.copy(eraColors[i]).lerp(eraColors[i + 1], t - i);
}

function parseAspect(aspect: string): number {
  const [w, h] = aspect.split("/").map(Number);
  return w / h || 1;
}

/** Deterministic layout: artifacts staggered left/right through their chamber. */
function artifactTransform(a: Artifact) {
  const list = artifacts.filter((x) => x.eraId === a.eraId);
  const j = list.indexOf(a);
  const era = eras.find((e) => e.id === a.eraId)!;
  const side = j % 2 === 0 ? -1 : 1;
  const spread = CH * 0.72;
  const z = -era.index * CH - 3 - (j + 0.5) * (spread / Math.max(list.length, 1));
  const x = side * (2.7 + ((j * 37) % 13) / 9);
  const y = 1.55 + ((j * 23) % 11) / 10;
  const rotY = side * (0.32 + ((j * 17) % 7) / 40);
  return { x, y, z, rotY };
}

/* ------------------------------------------------------- placeholder tex */

function makePlaceholderTexture(a: Artifact, dark: boolean): THREE.CanvasTexture {
  const r = parseAspect(a.aspect);
  const W = 512;
  const H = Math.round(W / r);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;

  g.fillStyle = dark ? "#1d1c1a" : "#efe7d7";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = dark ? "rgba(241,236,226,0.35)" : "rgba(38,34,27,0.35)";
  g.setLineDash([10, 8]);
  g.lineWidth = 2;
  g.strokeRect(18, 18, W - 36, H - 36);

  g.setLineDash([]);
  g.fillStyle = dark ? "rgba(241,236,226,0.5)" : "rgba(38,34,27,0.5)";
  g.font = "500 18px ui-monospace, monospace";
  g.textAlign = "center";
  g.fillText("AWAITING SCAN", W / 2, H / 2 - 16);

  g.fillStyle = dark ? "rgba(241,236,226,0.85)" : "rgba(38,34,27,0.85)";
  g.font = `italic 600 ${Math.min(34, W / 10)}px Georgia, serif`;
  g.fillText(a.title, W / 2, H / 2 + 22, W - 80);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------- artifact */

/**
 * Non-suspending texture: the board exists in the scene from frame one (board
 * tone), the image attaches whenever it finishes decoding. No Suspense, no
 * pop-in of whole objects, no mount-timing races.
 */
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

function ArtifactBoard({ a, refs }: { a: Artifact; refs: SceneRefs }) {
  const era = eras.find((e) => e.id === a.eraId)!;
  const map = useBoardTexture(a, era.dark);
  return <BoardMesh a={a} refs={refs} map={map} />;
}

function BoardMesh({
  a,
  refs,
  map,
}: {
  a: Artifact;
  refs: SceneRefs;
  map: THREE.Texture | null;
}) {
  const group = useRef<THREE.Group>(null!);
  const era = eras.find((e) => e.id === a.eraId)!;
  const { x, y, z, rotY } = useMemo(() => artifactTransform(a), [a]);

  const r = parseAspect(a.aspect);
  const h = r >= 1 ? 2.1 : 2.5;
  const w = Math.min(h * r, 4.4);

  useFrame(({ camera }) => {
    const g = group.current;
    if (!g) return;
    const dz = Math.abs(g.position.z - camera.position.z);
    // Ease toward the camera as it passes — the "inspect" invitation.
    const near = THREE.MathUtils.clamp(1 - dz / 7, 0, 1);
    const k = near * near;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, 1 + k * 0.1, 0.08));
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, rotY * (1 - k * 0.85), 0.07);
  });

  return (
    <group ref={group} position={[x, y, z]} rotation={[0, rotY, 0]}>
      {/* Mounted board — real thickness, hand-cut edge tone */}
      <mesh position={[0, 0, -0.038]}>
        <boxGeometry args={[w + 0.1, h + 0.1, 0.07]} />
        <meshStandardMaterial color={era.dark ? "#2a2925" : "#d8cdb8"} roughness={0.92} />
      </mesh>
      {/* The work itself */}
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
          // emissiveMap lifts the artwork like a gallery picture light —
          // legible even as the rooms darken.
          <meshStandardMaterial
            map={map}
            roughness={0.68}
            emissive="#ffffff"
            emissiveMap={map}
            emissiveIntensity={era.dark ? 0.5 : 0.28}
          />
        ) : (
          <meshStandardMaterial color={era.dark ? "#232220" : "#e6ddca"} roughness={0.8} />
        )}
      </mesh>
    </group>
  );
}

/* ----------------------------------------------------------- thresholds */

function Thresholds() {
  return (
    <>
      {eras.slice(1).map((era) => (
        <mesh key={era.id} position={[0, 0.02, -era.index * CH + CH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 0.05]} />
          <meshBasicMaterial color={accent} transparent opacity={0.55} />
        </mesh>
      ))}
    </>
  );
}

/* ----------------------------------------------------------------- dust */

function Dust() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const n = 1600;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = Math.random() * 5.5;
      arr[i * 3 + 2] = 16 - Math.random() * (Math.abs(Z_END) + 40);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.11) * 0.35;
      ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.05) * 0.03;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.5}
        color="#cfc6b4"
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* --------------------------------------------------------------- finale */

function Finale({ refs }: { refs: SceneRefs }) {
  const group = useRef<THREE.Points>(null!);
  const zC = Z_END - 4;

  const [positions, colors] = useMemo(() => {
    const n = 3200;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const palette = [...eraColors, new THREE.Color(accent), new THREE.Color(accent)];
    for (let i = 0; i < n; i++) {
      // A loose torus-cloud the camera lands inside — traces of every era.
      const a = Math.random() * Math.PI * 2;
      const rad = 2.4 + Math.random() * 3.2;
      pos[i * 3] = Math.cos(a) * rad * (0.7 + Math.random() * 0.6);
      pos[i * 3 + 1] = 1.6 + (Math.random() - 0.5) * 3.4;
      pos[i * 3 + 2] = zC + Math.sin(a) * rad * 0.5 - Math.random() * 3;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame(({ clock, pointer }) => {
    const g = group.current;
    if (!g) return;
    const p = refs.progress.current ?? 0;
    const active = THREE.MathUtils.clamp((p - 0.82) / 0.18, 0, 1);
    g.rotation.y = clock.elapsedTime * (0.03 + active * 0.12);
    // The room answers the visitor — the field leans toward the pointer.
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pointer.y * 0.12 * active, 0.04);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -pointer.x * 0.15 * active, 0.04);
    const s = 1 + Math.sin(clock.elapsedTime * 0.6) * 0.02 * active;
    g.scale.setScalar(s);
  });

  return (
    <points ref={group} position={[0, 0, 0]}>
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

/* ------------------------------------------------------------ rig/world */

function Rig({ refs }: { refs: SceneRefs }) {
  const { scene, camera } = useThree();
  const bg = useMemo(() => new THREE.Color(), []);
  const key = useRef<THREE.DirectionalLight>(null!);
  const lantern = useRef<THREE.PointLight>(null!);
  const ambient = useRef<THREE.AmbientLight>(null!);
  const floorMat = useRef<THREE.MeshStandardMaterial>(null!);
  const lastEra = useRef(-1);
  const nearest = useRef<string | null>(null);

  useMemo(() => {
    scene.fog = new THREE.Fog("#f4eee2", 7, 44);
  }, [scene]);

  useFrame(() => {
    const p = THREE.MathUtils.clamp(refs.progress.current ?? 0, 0, 1);

    // --- continuous dolly with gentle drift (never a cut) ---
    const z = THREE.MathUtils.lerp(Z_START, Z_END, p);
    const sway = Math.sin(p * Math.PI * 2.6) * 1.5;
    const bob = Math.sin(p * Math.PI * 7) * 0.1;
    camera.position.set(sway, 1.7 + bob, z);
    camera.lookAt(sway * 0.35, 1.5, z - 9);

    // --- the environment transforms with the eras ---
    rampColor(bg, p);
    scene.background = bg;
    const fog = scene.fog as THREE.Fog;
    fog.color.copy(bg);

    if (ambient.current) ambient.current.intensity = THREE.MathUtils.lerp(1.15, 0.38, p);
    if (key.current) {
      key.current.position.set(camera.position.x + 4, 7, z + 6);
      key.current.target.position.set(camera.position.x, 1.2, z - 8);
      key.current.target.updateMatrixWorld();
      key.current.intensity = THREE.MathUtils.lerp(1.5, 0.7, p);
    }
    if (lantern.current) {
      lantern.current.position.set(camera.position.x, 2.6, z - 3.5);
      lantern.current.intensity = THREE.MathUtils.lerp(0.0, 2.2, THREE.MathUtils.clamp((p - 0.3) / 0.5, 0, 1));
    }
    if (floorMat.current) floorMat.current.color.copy(bg).multiplyScalar(0.86);

    // --- era + nearest-artifact callbacks (cheap, change-gated) ---
    const eraIdx = Math.min(Math.round(p * (eras.length - 1)), eras.length - 1);
    if (eraIdx !== lastEra.current) {
      lastEra.current = eraIdx;
      refs.onEra(eraIdx);
    }

    let best: Artifact | null = null;
    let bestD = 7;
    for (const a of artifacts) {
      const t = artifactTransform(a);
      // Signed window: favor what's ahead of the camera, allow a sliver behind.
      const ahead = z - t.z; // > 0 → artifact lies ahead on the walk
      if (ahead < -1.5 || ahead > 7) continue;
      const d = Math.abs(ahead);
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
    const id = best?.id ?? null;
    if (id !== nearest.current) {
      nearest.current = id;
      refs.onArtifact(best);
    }

    // Dev-only scene probe for QA tooling.
    if (process.env.NODE_ENV !== "production") {
      let meshes = 0;
      scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) meshes++;
      });
      (window as unknown as Record<string, unknown>).__archiveDebug = {
        p,
        cam: camera.position.toArray().map((n) => +n.toFixed(2)),
        meshes,
        bg: "#" + bg.getHexString(),
        era: eraIdx,
      };
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={1.1} color="#fff6e8" />
      <directionalLight ref={key} intensity={1.4} color="#fff2dc" />
      {/* The safelight lantern that travels with you into the dark */}
      <pointLight ref={lantern} intensity={0} color={accent} distance={16} decay={1.6} />
      {/* Museum floor, tinted by the ramp */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, Z_END / 2]}>
        <planeGeometry args={[70, Math.abs(Z_END) + 90]} />
        <meshStandardMaterial ref={floorMat} color="#e9e2d2" roughness={0.96} />
      </mesh>
    </>
  );
}

/* ---------------------------------------------------------------- scene */

export function ArchiveScene({ refs }: { refs: SceneRefs }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 52, near: 0.1, far: 90, position: [0, 1.7, Z_START] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0 }}
      aria-hidden
    >
      <Rig refs={refs} />
      {artifacts.map((a) => (
        <ArtifactBoard key={a.id} a={a} refs={refs} />
      ))}
      <Thresholds />
      <Dust />
      <Finale refs={refs} />
      <EffectComposer>
        <Noise opacity={0.055} />
        <Vignette darkness={0.62} offset={0.28} />
      </EffectComposer>
    </Canvas>
  );
}
