"use client";

/**
 * The studio — one persistent room, lit by data.
 *
 * Scene graph:
 *   environment   floor, walls, ceiling, window, baseboard
 *   landmarks     the desk + monitor + lamp (chapter 0), the photo wall (chapter 1)
 *   interactives  the two photographs (hover warms + lifts their caption)
 *   atmosphere    fog, dust in the lamp beam
 *
 * The Rig reads the conductor each frame: camera from Catmull-Rom position
 * and target curves (lookAt, never Euler), light/fog channels interpolated
 * between the two adjacent chapters. Nothing else computes chapter rules.
 */

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CHAPTERS, LAST, resolveCamera, type Vec3 } from "./chapters";
import type { ConductorState } from "./conductor";
import { surface, tex, texWood, texRug, texFlagField, texScreen, lerp, smoothstep } from "./surfaces";

/* ------------------------------------------------------------ constants */

const ROOM = { w: 5.0, d: 4.2, h: 2.9 }; // meters
/** the west window: center y/z on the wall plane, and its opening */
const WINDOW = { cy: 1.55, cz: -0.2, W: 1.1, H: 1.5 };
const MOBILE_W = 768;

/** mutable light handles — filled by the scene, driven by the rig */
type Lights = {
  key: THREE.DirectionalLight | null;
  lamp: THREE.SpotLight | null;
  bulb: THREE.Mesh | null;
  monitorLight: THREE.PointLight | null;
  screen: THREE.MeshStandardMaterial | null;
  pictures: THREE.SpotLight[];
  outside: THREE.MeshBasicMaterial | null;
  dust: THREE.PointsMaterial | null;
};

/* ------------------------------------------------------------ pbr sets */

type PbrSet = { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture; aoMap: THREE.Texture };

/** a CC0 texture set, cloned so each surface owns its repeat; color-space explicit */
function usePbr(slug: string, repeat: [number, number]): PbrSet {
  const raw = useTexture({
    map: `/textures/${slug}/${slug}_diff_1k.jpg`,
    normalMap: `/textures/${slug}/${slug}_nor_gl_1k.jpg`,
    roughnessMap: `/textures/${slug}/${slug}_rough_1k.jpg`,
    aoMap: `/textures/${slug}/${slug}_ao_1k.jpg`,
  });
  return useMemo(() => {
    const out = {} as PbrSet;
    (Object.keys(raw) as (keyof PbrSet)[]).forEach((k) => {
      const t = raw[k].clone();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
      t.anisotropy = 8;
      t.channel = 0; // planes carry one uv set
      t.colorSpace = k === "map" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.needsUpdate = true;
      out[k] = t;
    });
    return out;
  }, [raw, repeat[0], repeat[1]]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ------------------------------------------------------------ the room */

function Room({ L }: { L: Lights }) {
  const floor = usePbr("diagonal_parquet", [3.1, 2.6]);
  const wall = usePbr("beige_wall_001", [2.4, 1.4]);
  const wallShort = usePbr("beige_wall_001", [2.0, 1.4]);
  const ceil = usePbr("beige_wall_001", [1.6, 1.3]);
  const rugTex = useMemo(() => texRug(21, [96, 72, 58], [54, 38, 30]), []);
  const rugMat = useMemo(() => surface(rugTex, [1, 1], { normal: 0.5, roughness: 0.95 }), [rugTex]);
  const trim = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e9e3d6", roughness: 0.5 }), []);
  const { w, d, h } = ROOM;
  // the window opening the slabs leave (shared with <Window/>)
  const WT = 0.12; // wall thickness
  const wx = -w / 2 - WT / 2;
  const westSlabs: number[][] = (() => {
    const { cy, cz, W, H } = WINDOW;
    const zl = cz - W / 2, zr = cz + W / 2, yb = cy - H / 2, yt = cy + H / 2;
    return [
      [wx, h / 2, (-d / 2 + zl) / 2, WT, h, zl + d / 2], // left of window
      [wx, h / 2, (zr + d / 2) / 2, WT, h, d / 2 - zr], // right
      [wx, yb / 2, cz, WT, yb, W], // below
      [wx, (yt + h) / 2, cz, WT, h - yt, W], // above
    ];
  })();

  return (
    <group name="environment">
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial {...floor} color="#d6ccbd" normalScale={new THREE.Vector2(0.6, 0.6)} roughness={1} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial {...ceil} color="#efe9df" normalScale={new THREE.Vector2(0.25, 0.25)} roughness={1} />
      </mesh>
      {/* north (behind the desk) */}
      <mesh position={[0, h / 2, -d / 2]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial {...wall} color="#e4dccd" normalScale={new THREE.Vector2(0.45, 0.45)} roughness={1} />
      </mesh>
      {/* south */}
      <mesh position={[0, h / 2, d / 2]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial {...wall} color="#e4dccd" normalScale={new THREE.Vector2(0.45, 0.45)} roughness={1} />
      </mesh>
      {/* west (window) — four shadow-casting slabs around the opening, so the
          sun throws a window-shaped patch across the room instead of lighting
          the far wall flat */}
      {westSlabs.map((b, i) => (
        <mesh key={i} position={[b[0], b[1], b[2]]} castShadow receiveShadow>
          <boxGeometry args={[b[3], b[4], b[5]]} />
          <meshStandardMaterial {...wallShort} color="#e4dccd" normalScale={new THREE.Vector2(0.45, 0.45)} roughness={1} />
        </mesh>
      ))}
      {/* east (the photo wall) */}
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[d, h]} />
        <meshStandardMaterial {...wallShort} color="#e4dccd" normalScale={new THREE.Vector2(0.45, 0.45)} roughness={1} />
      </mesh>
      {/* baseboards — a wall meets a floor with a joint, not a seam */}
      {[
        [0, 0.055, -d / 2 + 0.012, w, 0.11, 0.024],
        [0, 0.055, d / 2 - 0.012, w, 0.11, 0.024],
        [-w / 2 + 0.012, 0.055, 0, 0.024, 0.11, d],
        [w / 2 - 0.012, 0.055, 0, 0.024, 0.11, d],
      ].map((b, i) => (
        <mesh key={i} position={[b[0], b[1], b[2]]} material={trim} castShadow receiveShadow>
          <boxGeometry args={[b[3], b[4], b[5]]} />
        </mesh>
      ))}
      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.004, -0.85]} material={rugMat} receiveShadow>
        <planeGeometry args={[2.2, 1.6]} />
      </mesh>
      <Window L={L} />
    </group>
  );
}

/** west-wall window: wood frame, glass, and a lit "outside" the key light comes from */
function Window({ L }: { L: Lights }) {
  const frameMat = useMemo(() => surface(texWood(29, { base: [58, 40, 28], relief: 1.2 }), [0.4, 0.3], { normal: 0.5 }), []);
  const glass = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, transmission: 0 }),
    []
  );
  const cx = -ROOM.w / 2; // wall plane
  const { cy, cz, W, H } = WINDOW;
  const T = 0.07;
  return (
    <group name="window">
      {/* the world beyond the glass — color is a channel */}
      <mesh position={[cx - 0.3, cy, cz]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[W + 1.2, H + 1.2]} />
        <meshBasicMaterial ref={(m) => { if (m) L.outside = m; }} color="#1b2440" toneMapped={false} />
      </mesh>
      {/* glass */}
      <mesh position={[cx + 0.02, cy, cz]} rotation={[0, Math.PI / 2, 0]} material={glass}>
        <planeGeometry args={[W, H]} />
      </mesh>
      {/* frame: head, sill, jambs, center mullion — proud of the wall */}
      {[
        [cx + 0.04, cy + H / 2 + T / 2, cz, 0.1, T, W + 2 * T],
        [cx + 0.06, cy - H / 2 - T / 2, cz, 0.16, T, W + 2 * T],
        [cx + 0.04, cy, cz - W / 2 - T / 2, 0.1, H, T],
        [cx + 0.04, cy, cz + W / 2 + T / 2, 0.1, H, T],
        [cx + 0.03, cy, cz, 0.06, H, 0.04],
        [cx + 0.03, cy, cz, 0.06, 0.04, W],
      ].map((b, i) => (
        <mesh key={i} position={[b[0], b[1], b[2]]} material={frameMat} castShadow receiveShadow>
          <boxGeometry args={[b[3], b[4], b[5]]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ the desk */

function Desk({ L, fonts }: { L: Lights; fonts: { display: string; mono: string } }) {
  const walnut = useMemo(() => surface(texWood(11, { base: [98, 66, 44], relief: 1.6 }), [1.0, 0.5], { normal: 0.55 }), []);
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2c31", metalness: 0.9, roughness: 0.38 }), []);
  const bezel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#15171b", roughness: 0.42, metalness: 0.2 }), []);
  const screenTex = useMemo(() => {
    const t = tex(texScreen(fonts.display, fonts.mono), { wrap: THREE.ClampToEdgeWrapping, aniso: 8 });
    return t;
  }, [fonts.display, fonts.mono]);
  const screenMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#ffffff", emissiveMap: screenTex, emissiveIntensity: 0.8, roughness: 0.78, metalness: 0 });
    L.screen = m;
    return m;
  }, [screenTex, L]);
  const lampTarget = useMemo(() => new THREE.Object3D(), []);
  const lamp = useGLTF("/models/desk_lamp_arm_01/desk_lamp_arm_01_1k.gltf");
  const chair = useGLTF("/models/dining_chair_02/dining_chair_02_1k.gltf");

  useEffect(() => {
    [lamp.scene, chair.scene].forEach((s) =>
      s.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      })
    );
  }, [lamp.scene, chair.scene]);

  const DZ = -1.72; // desk center z
  return (
    <group name="desk">
      {/* walnut slab — one board, 40 mm */}
      <mesh position={[0, 0.74, DZ]} material={walnut} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.04, 0.75]} />
      </mesh>
      {/* steel legs + a stretcher */}
      {[
        [-0.74, -2.06],
        [0.74, -2.06],
        [-0.74, -1.38],
        [0.74, -1.38],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} material={steel} castShadow>
          <boxGeometry args={[0.04, 0.72, 0.04]} />
        </mesh>
      ))}
      <mesh position={[0, 0.12, -2.06]} material={steel}>
        <boxGeometry args={[1.5, 0.03, 0.03]} />
      </mesh>
      {/* monitor */}
      <mesh position={[0, 0.748, -1.95]} material={bezel}>
        <cylinderGeometry args={[0.12, 0.13, 0.014, 32]} />
      </mesh>
      <mesh position={[0, 0.87, -1.96]} material={bezel}>
        <boxGeometry args={[0.045, 0.24, 0.03]} />
      </mesh>
      <mesh position={[0, 1.05, -1.935]} material={bezel} castShadow>
        <boxGeometry args={[0.62, 0.36, 0.022]} />
      </mesh>
      <mesh position={[0, 1.05, -1.9235]} material={screenMat}>
        <planeGeometry args={[0.59, 0.33]} />
      </mesh>
      <pointLight ref={(l) => { if (l) L.monitorLight = l; }} position={[0, 1.0, -1.68]} color="#f1ece2" intensity={1.4} distance={2.4} decay={2} />
      {/* keyboard, mouse, mug */}
      <mesh position={[-0.06, 0.766, -1.5]} castShadow>
        <boxGeometry args={[0.42, 0.012, 0.14]} />
        <meshStandardMaterial color="#1d1f24" roughness={0.6} />
      </mesh>
      <mesh position={[0.26, 0.772, -1.48]} castShadow>
        <boxGeometry args={[0.06, 0.024, 0.1]} />
        <meshStandardMaterial color="#1d1f24" roughness={0.5} />
      </mesh>
      <mesh position={[0.44, 0.808, -1.56]} castShadow>
        <cylinderGeometry args={[0.04, 0.036, 0.095, 24]} />
        <meshStandardMaterial color="#c8a24b" roughness={0.38} metalness={0.05} />
      </mesh>
      <mesh position={[0.482, 0.81, -1.56]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.026, 0.007, 10, 20]} />
        <meshStandardMaterial color="#c8a24b" roughness={0.38} />
      </mesh>
      {/* the lamp — a real one, and its light */}
      <primitive object={lamp.scene} position={[0.64, 0.76, -1.9]} rotation={[0, -0.75, 0]} scale={0.55} />
      <mesh ref={(m) => { if (m) L.bulb = m; }} position={[0.69, 1.115, -1.95]}>
        <sphereGeometry args={[0.014, 12, 12]} />
        <meshBasicMaterial color={new THREE.Color(2.6, 1.9, 1.1)} toneMapped={false} />
      </mesh>
      <primitive object={lampTarget} position={[0.25, 0.74, -1.55]} />
      <spotLight
        ref={(l) => {
          if (l) {
            L.lamp = l;
            l.target = lampTarget;
          }
        }}
        position={[0.69, 1.12, -1.95]}
        color="#ffb36a"
        intensity={7}
        distance={4.5}
        angle={0.7}
        penumbra={0.55}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      {/* chair, pulled out a little */}
      <primitive object={chair.scene} position={[0.1, 0, -1.2]} rotation={[0, Math.PI + 0.22, 0]} />
      <Dust L={L} />
    </group>
  );
}

/** dust suspended in the lamp's cone — seeded, slow, additive */
function Dust({ L }: { L: Lights }) {
  const N = 220;
  const ref = useRef<THREE.Points>(null!);
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(N * 3);
    const speeds = new Float32Array(N);
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = 0.25 + r() * 0.7;
      positions[i * 3 + 1] = 0.76 + r() * 0.36;
      positions[i * 3 + 2] = -2.05 + r() * 0.6;
      speeds[i] = 0.012 + r() * 0.03;
    }
    return { positions, speeds };
  }, []);
  const sprite = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,230,190,1)");
    grad.addColorStop(0.5, "rgba(255,230,190,.35)");
    grad.addColorStop(1, "rgba(255,230,190,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);
  useFrame((_, dt) => {
    const p = ref.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!p) return;
    for (let i = 0; i < N; i++) {
      let y = p.getY(i) + speeds[i] * dt;
      if (y > 1.12) y = 0.76;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin((y + i) * 3.1) * 0.0006);
    }
    p.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={(m) => { if (m) L.dust = m; }}
        map={sprite}
        size={0.0055}
        sizeAttenuation
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#ffd9a6"
      />
    </points>
  );
}

/* ------------------------------------------------------------ the corps wall */

function PhotoWall({ L, onHover, available }: { L: Lights; onHover: (id: string | null) => void; available: () => boolean }) {
  const corps = CHAPTERS[1].artifacts ?? [];
  const urls = corps.map((a) => a.image!) as string[];
  const photos = useTexture(urls);
  useEffect(() => {
    photos.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.needsUpdate = true;
    });
  }, [photos]);
  const frameMat = useMemo(() => surface(texWood(37, { base: [48, 32, 22], relief: 1.0 }), [0.5, 0.3], { normal: 0.4 }), []);
  const matMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f1ece2", roughness: 0.92 }), []);
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b08a3e", metalness: 0.95, roughness: 0.3 }), []);
  const shelfMat = useMemo(() => surface(texWood(43, { base: [64, 44, 30], relief: 1.2 }), [0.8, 0.2], { normal: 0.5 }), []);
  const flagField = useMemo(() => tex(texFlagField(), { wrap: THREE.ClampToEdgeWrapping }), []);
  const hover = useRef<string | null>(null);
  const X = ROOM.w / 2; // east wall plane
  const Y = 1.45;
  const zs = [-0.25, 0.95];

  const targets = useMemo(() => zs.map(() => new THREE.Object3D()), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <group name="photo-wall">
      {corps.slice(0, 2).map((a, i) => {
        const z = zs[i];
        const id = a.id;
        return (
          <group key={id} name={`photo-${id}`}>
            {/* frame, mat, print — mounted flush, in that depth order */}
            <mesh position={[X - 0.017, Y, z]} material={frameMat} castShadow receiveShadow>
              <boxGeometry args={[0.034, 0.48, 0.68]} />
            </mesh>
            <mesh position={[X - 0.0355, Y, z]} rotation={[0, -Math.PI / 2, 0]} material={matMat}>
              <planeGeometry args={[0.62, 0.42]} />
            </mesh>
            <mesh
              position={[X - 0.0365, Y, z]}
              rotation={[0, -Math.PI / 2, 0]}
              onPointerOver={(e) => {
                if (!available()) return;
                e.stopPropagation();
                hover.current = id;
                onHover(id);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                if (hover.current !== id) return;
                hover.current = null;
                onHover(null);
                document.body.style.cursor = "";
              }}
            >
              <planeGeometry args={[0.57, 0.38]} />
              <meshStandardMaterial map={photos[i]} roughness={0.55} />
            </mesh>
            {/* brass picture light over each print */}
            <mesh position={[X - 0.09, Y + 0.33, z]} rotation={[Math.PI / 2, 0, 0]} material={brass} castShadow>
              <cylinderGeometry args={[0.013, 0.013, 0.34, 16]} />
            </mesh>
            <mesh position={[X - 0.045, Y + 0.33, z]} rotation={[0, 0, Math.PI / 2]} material={brass}>
              <cylinderGeometry args={[0.006, 0.006, 0.09, 8]} />
            </mesh>
            <primitive object={targets[i]} position={[X - 0.03, Y, z]} />
            <spotLight
              ref={(l) => {
                if (l) {
                  L.pictures[i] = l;
                  l.target = targets[i];
                }
              }}
              position={[X - 0.12, Y + 0.36, z]}
              color="#ffd9a6"
              intensity={0}
              distance={3}
              angle={0.52}
              penumbra={0.75}
              decay={2}
            />
          </group>
        );
      })}
      {/* the folded flag, cased, on a shelf between the prints */}
      <mesh position={[X - 0.11, 1.0, 0.35]} material={shelfMat} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.03, 1.0]} />
      </mesh>
      <FlagCase x={X - 0.11} y={1.03} z={0.35} frameMat={frameMat} field={flagField} />
    </group>
  );
}


/** a folded-flag display case: a right-isosceles triangular box, hypotenuse down,
 *  star field glazed on the face that looks into the room */
function FlagCase({ x, y, z, frameMat, field }: { x: number; y: number; z: number; frameMat: THREE.Material; field: THREE.Texture }) {
  const B = 0.58; // base (along the wall)
  const Hh = B / 2; // height of a right isosceles triangle on that base
  const D = 0.09; // depth (into the room)
  const tri = (b: number, hh: number, y0: number) => {
    const sh = new THREE.Shape();
    sh.moveTo(-b, y0);
    sh.lineTo(b, y0);
    sh.lineTo(0, y0 + hh);
    sh.closePath();
    return sh;
  };
  // the case is a triangular frame (outer triangle minus an inset one), so the
  // front is open and glazed and the flag sits inside it
  const geo = useMemo(() => {
    const inset = 0.028;
    const outer = tri(B / 2, Hh, 0);
    const hole = tri(B / 2 - inset * 1.7, Hh - inset * 2.4, inset);
    outer.holes.push(new THREE.Path(hole.getPoints()));
    const g = new THREE.ExtrudeGeometry(outer, { depth: D, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 });
    g.translate(0, -Hh / 2, -D / 2);
    return g;
  }, []);
  const face = useMemo(() => {
    const inset = 0.028;
    const b = B / 2 - inset * 1.7;
    const hh = Hh - inset * 2.4;
    const y0 = -Hh / 2 + inset;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array([-b, y0, 0, b, y0, 0, 0, y0 + hh, 0]);
    const uv = new Float32Array([0, 0, 1, 0, 0.5, 1]);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.setIndex([0, 1, 2]);
    g.computeVertexNormals();
    return g;
  }, []);
  const back = useMemo(() => {
    const g = new THREE.ShapeGeometry(tri(B / 2, Hh, 0));
    g.translate(0, -Hh / 2, 0);
    return g;
  }, []);
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.05, transparent: true, opacity: 0.12, metalness: 0 }), []);
  // the extrude's z axis is the case depth; rotate so it faces -x (into the room)
  return (
    <group position={[x, y + Hh / 2, z]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh geometry={geo} material={frameMat} castShadow receiveShadow />
      {/* back board, then the folded flag's star field a little proud of it, then glass */}
      <mesh geometry={back} position={[0, 0, -D / 2 + 0.004]}>
        <meshStandardMaterial color="#17191f" roughness={0.95} />
      </mesh>
      <mesh geometry={face} position={[0, 0, -D / 2 + 0.03]}>
        <meshStandardMaterial map={field} roughness={0.88} />
      </mesh>
      <mesh geometry={face} position={[0, 0, D / 2 - 0.006]} material={glass} />
    </group>
  );
}

/* ------------------------------------------------------------ the rig */

function Rig({ cond, step, L, onChapter, onReady }: { cond: React.MutableRefObject<ConductorState>; step: (dt: number) => ConductorState; L: Lights; onChapter: (i: number) => void; onReady: () => void }) {
  const { camera, scene, size, gl } = useThree();
  const mobile = size.width < MOBILE_W;
  const curves = useMemo(() => {
    const res = CHAPTERS.map((c) => resolveCamera(c.camera, mobile));
    const P = new THREE.CatmullRomCurve3(res.map((r) => new THREE.Vector3(...r.p)), false, "centripetal", 0.42);
    const T = new THREE.CatmullRomCurve3(res.map((r) => new THREE.Vector3(...r.t)), false, "centripetal", 0.42);
    return { P, T, res };
  }, [mobile]);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const cA = useMemo(() => new THREE.Color(), []);
  const cB = useMemo(() => new THREE.Color(), []);
  const lastIndex = useRef(-1);
  const readyFrames = useRef(0);
  const hemi = useMemo(() => {
    let h: THREE.HemisphereLight | null = null;
    scene.traverse((o) => { if ((o as THREE.HemisphereLight).isHemisphereLight) h = o as THREE.HemisphereLight; });
    return h as THREE.HemisphereLight | null;
  }, [scene]);

  // dev hook: window.__arch lets a composition be tuned live (never shipped)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __arch?: unknown };
    w.__arch = { scene, camera, L, cond, override: null as null | { p?: Vec3; t?: Vec3; fov?: number } };
    return () => { delete w.__arch; };
  }, [scene, camera, L, cond]);

  // environment: a neutral room for reflections, no download
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.05;
    scene.fog = new THREE.FogExp2(0x07080b, 0.012);
    scene.background = new THREE.Color(0x07080b);
    pmrem.dispose();
    return () => {
      env.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const s = step(dt);
    const a = CHAPTERS[s.index];
    const b = CHAPTERS[s.next];
    const t = smoothstep(0, 1, s.local);

    // camera — one curve, parameterized by chapter progress
    const u = LAST > 0 ? s.smooth / LAST : 0;
    curves.P.getPoint(u, pos);
    curves.T.getPoint(u, tgt);
    let fov = lerp(curves.res[s.index].fov, curves.res[s.next].fov, t);
    // tall screens: pull back and open up rather than crop the landmark
    const tall = Math.max(0, size.height / size.width - 1.15);
    if (tall > 0) {
      dir.subVectors(pos, tgt).normalize();
      pos.addScaledVector(dir, tall * 0.35);
      fov += tall * 4;
    }
    if (process.env.NODE_ENV !== "production") {
      const ov = (window as unknown as { __arch?: { override: null | { p?: Vec3; t?: Vec3; fov?: number } } }).__arch?.override;
      if (ov) {
        if (ov.p) pos.set(...ov.p);
        if (ov.t) tgt.set(...ov.t);
        if (ov.fov) fov = ov.fov;
      }
    }
    camera.position.copy(pos);
    camera.lookAt(tgt);
    const pc = camera as THREE.PerspectiveCamera;
    if (Math.abs(pc.fov - fov) > 0.01) {
      pc.fov = fov;
      pc.updateProjectionMatrix();
    }

    // world-state channels — resolved once, applied everywhere
    const wa = a.world;
    const wb = b.world;
    if (L.key) {
      L.key.intensity = lerp(wa.key, wb.key, t);
      L.key.color.lerpColors(cA.set(wa.keyColor), cB.set(wb.keyColor), t);
    }
    const lampV = lerp(wa.lamp, wb.lamp, t);
    if (L.lamp) L.lamp.intensity = 7 * lampV;
    if (L.bulb) L.bulb.visible = lampV > 0.15;
    if (L.dust) L.dust.opacity = 0.4 * lampV;
    const monV = lerp(wa.monitor, wb.monitor, t);
    if (L.monitorLight) L.monitorLight.intensity = 1.4 * monV;
    if (L.screen) L.screen.emissiveIntensity = 0.45 + 0.4 * monV;
    const picV = lerp(wa.pictures, wb.pictures, t);
    L.pictures.forEach((p) => p && (p.intensity = 3.4 * picV));
    const winV = lerp(wa.window, wb.window, t);
    if (L.outside) {
      // night glass is dim blue; day glass is the era's light, bright enough to bloom
      L.outside.color.lerpColors(cA.set("#1b2440").multiplyScalar(0.7), cB.set(b.world.keyColor).multiplyScalar(1.6), winV);
    }
    const ambV = lerp(wa.ambient, wb.ambient, t);
    scene.environmentIntensity = 0.05 + 0.55 * ambV;
    if (hemi) hemi.intensity = 0.02 + 0.34 * ambV;
    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) {
      fog.density = lerp(wa.fog, wb.fog, t);
      fog.color.lerpColors(cA.set(wa.fogColor), cB.set(wb.fogColor), t);
      (scene.background as THREE.Color).copy(fog.color);
    }

    // the poster lifts only once the landmarks exist and a few real frames have drawn
    if (readyFrames.current >= 0) {
      if (L.screen && L.lamp && L.pictures.length > 0) readyFrames.current++;
      if (readyFrames.current > 3) {
        readyFrames.current = -1;
        onReady();
      }
    }

    // DOM ownership uses EXACT progress, event-based
    const ex = Math.min(LAST, Math.floor(s.exact + 0.5));
    if (ex !== lastIndex.current) {
      lastIndex.current = ex;
      onChapter(ex);
    }
  });
  return null;
}

/* ------------------------------------------------------------ the world */

export type WorldProps = {
  cond: React.MutableRefObject<ConductorState>;
  step: (dt: number) => ConductorState;
  onChapter: (i: number) => void;
  onHover: (id: string | null) => void;
  onLost: () => void;
  onReady: () => void;
  fonts: { display: string; mono: string };
};

export function World({ cond, step, onChapter, onHover, onLost, onReady, fonts }: WorldProps) {
  const L = useMemo<Lights>(() => ({ key: null, lamp: null, bulb: null, monitorLight: null, screen: null, pictures: [], outside: null, dust: null }), []);
  const keyTarget = useMemo(() => new THREE.Object3D(), []);
  const mobile = typeof window !== "undefined" && window.innerWidth < MOBILE_W;
  const available = () => cond.current.exact > 0.55 && cond.current.exact < LAST + 0.5;

  return (
    <Canvas
      shadows="soft"
      dpr={mobile ? [1, 1.35] : [1, 1.75]}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 34, near: 0.08, far: 40, position: [0.3, 1.15, -0.62] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        scene.background = new THREE.Color(0x0b0d12);
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onLost();
        });
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <hemisphereLight args={["#cfd8e3", "#2a241e", 0.04]} />
      <primitive object={keyTarget} position={[2.5, 1.4, 0.6]} />
      <directionalLight
        ref={(l) => {
          if (l) {
            L.key = l;
            l.target = keyTarget;
          }
        }}
        position={[-6.0, 2.2, -1.0]}
        color="#6f86b0"
        intensity={0.12}
        castShadow
        shadow-mapSize-width={mobile ? 1024 : 4096}
        shadow-mapSize-height={mobile ? 1024 : 4096}
        shadow-camera-left={-3.7}
        shadow-camera-right={3.7}
        shadow-camera-top={3.7}
        shadow-camera-bottom={-3.7}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      />
      <Suspense fallback={null}>
        <Room L={L} />
        <Desk L={L} fonts={fonts} />
        <PhotoWall L={L} onHover={onHover} available={available} />
      </Suspense>
      <Rig cond={cond} step={step} L={L} onChapter={onChapter} onReady={onReady} />
      <EffectComposer multisampling={mobile ? 0 : 4}>
        <Bloom intensity={0.55} luminanceThreshold={0.96} luminanceSmoothing={0.12} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.42} />
      </EffectComposer>
    </Canvas>
  );
}

useGLTF.preload("/models/desk_lamp_arm_01/desk_lamp_arm_01_1k.gltf");
useGLTF.preload("/models/dining_chair_02/dining_chair_02_1k.gltf");
