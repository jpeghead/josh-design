"use client";

/**
 * THE HOUSE — a one-floor home in Cincinnati Hill, and the game's first act.
 *
 * You wake up at the desk in the OFFICE, surrounded by the relics of a life
 * (real images from the archive, framed). The windows are frosted — you hear
 * the city, you can't see it. The office door opens → the open plan
 * (dining / living / kitchen) → the front door opens → WHITEHEAD CITY.
 *
 * Rooms (world coords):
 *   OFFICE  x[664,704] z[300,340]   KITCHEN x[704,744] z[300,340]
 *   DINING  x[664,704] z[340,384]   LIVING  x[704,744] z[340,384]
 *
 * ONE source of truth: OPENINGS below defines every gap in every wall.
 * Wall AABBs (colliders + meshes), door panels, headers, and jamb trim are
 * all derived from it — a door can never sit inside a solid wall again.
 */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/* ------------------------------------------------------------- geometry */

export const HOUSE = { x1: 664, z1: 300, x2: 744, z2: 384, wallH: 10.5, t: 1.1 };

export const SEAT_POS = new THREE.Vector3(684, 4.4, 317.5);
export const SCREEN = { cx: 684, cy: 4.55, cz: 308.4, hw: 3.7, hh: 2.2 };
export const STAND = { x: 684, z: 321 };
export const DESK_SPOT = { x: 684, z: 314 };

/**
 * Every hole in every wall. Doors are hinged panels; arches are open trim.
 * x-walls run along x at fixed z; z-walls run along z at fixed x.
 */
const OPENINGS = {
  officeDoor: { wall: "z340" as const, from: 682, to: 690 }, // office → dining
  archDL: { wall: "x704s" as const, from: 352, to: 366 }, // dining ↔ living
  archKL: { wall: "z340" as const, from: 712, to: 724 }, // kitchen ↔ living
  frontDoor: { wall: "z384" as const, from: 722, to: 730 }, // living → the city
};

export type Door = {
  id: string;
  hx: number; // hinge x — panel spans [hx, hx+len] along x when closed
  hz: number; // wall line z
  axis: "x";
  len: number;
  open: number; // 0 closed .. 1 open (animated)
  target: number;
  label: string;
};

/** Mutable door state — the Sim reads this for collision + interaction. */
export const DOORS: Door[] = [
  {
    id: "office",
    hx: OPENINGS.officeDoor.from,
    hz: 340,
    axis: "x",
    len: OPENINGS.officeDoor.to - OPENINGS.officeDoor.from,
    open: 0,
    target: 0,
    label: "open the door",
  },
  {
    id: "front",
    hx: OPENINGS.frontDoor.from,
    hz: 384,
    axis: "x",
    len: OPENINGS.frontDoor.to - OPENINGS.frontDoor.from,
    open: 0,
    target: 0,
    label: "the front door",
  },
];

/** wall segments as AABBs [x1,z1,x2,z2] — gaps derived from OPENINGS */
export const HOUSE_WALLS: [number, number, number, number][] = (() => {
  const { x1, z1, x2, z2, t } = HOUSE;
  const W: [number, number, number, number][] = [];
  // outer north / west / east — solid
  W.push([x1, z1 - t, x2, z1]);
  W.push([x1 - t, z1 - t, x1, z2 + t]);
  W.push([x2, z1 - t, x2 + t, z2 + t]);
  // outer south — front door gap
  W.push([x1, z2, OPENINGS.frontDoor.from, z2 + t]);
  W.push([OPENINGS.frontDoor.to, z2, x2, z2 + t]);
  // inner wall x=704: office|kitchen side is SOLID (the office keeps one door);
  // dining|living side has the wide arch
  W.push([704 - t / 2, z1, 704 + t / 2, OPENINGS.archDL.from]);
  W.push([704 - t / 2, OPENINGS.archDL.to, 704 + t / 2, z2]);
  // inner wall z=340: office door gap + kitchen↔living arch
  W.push([x1, 340 - t / 2, OPENINGS.officeDoor.from, 340 + t / 2]);
  W.push([OPENINGS.officeDoor.to, 340 - t / 2, OPENINGS.archKL.from, 340 + t / 2]);
  W.push([OPENINGS.archKL.to, 340 - t / 2, x2, 340 + t / 2]);
  return W;
})();

/**
 * Furniture footprints as AABBs [x1,z1,x2,z2] — the game turns these into
 * physics colliders. Anything a person couldn't walk through belongs here.
 */
export const FURNITURE: [number, number, number, number][] = [
  // office
  [679, 307.7, 689, 312.3], // desk
  [664.6, 304.6, 666.6, 311.4], // bookshelf (west wall)
  [665.2, 332.2, 669.2, 336.2], // poster tubes corner
  // kitchen
  [705.5, 300.5, 743.5, 305.5], // counter along the north wall
  [739.0, 308.7, 743.8, 313.3], // fridge (east wall)
  [715, 318.5, 725, 323.5], // island
  // dining
  [679, 359, 689, 365], // table
  [678.9, 356.4, 681.1, 358.6], // chairs
  [686.9, 356.4, 689.1, 358.6],
  [678.9, 365.4, 681.1, 367.6],
  [686.9, 365.4, 689.1, 367.6],
  [664.6, 368, 666.9, 376], // sideboard (west wall)
  // living
  [741.2, 356, 743.8, 368], // TV console (east wall)
  [729.2, 357.5, 732.8, 366.5], // couch (faces the TV)
  [734.7, 360.6, 739.3, 363.4], // coffee table
];

/** things you can look at — E near one shows its story */
export type Relic = { x: number; z: number; r: number; label: string; title: string; body: string };
export const RELICS: Relic[] = [
  {
    x: 665.8, z: 306.2, r: 4,
    label: "the folded flag",
    title: "The Flag",
    body: "Parris Island, then MCAS New River. The Corps is where discipline stopped being a word and became a habit.",
  },
  {
    x: 665.8, z: 310.6, r: 3.4,
    label: "the Nikon",
    title: "The Nikon",
    body: "The first camera. Photography taught me to see long before design taught me to ship.",
  },
  {
    x: 667.2, z: 334.2, r: 4.4,
    label: "the poster tubes",
    title: "Poster Tubes",
    body: "Print never left. A few of these hung in shows. Most never left the tube.",
  },
  {
    x: 684, z: 362, r: 7,
    label: "the table",
    title: "The Table",
    body: "Samantha and I have eaten at this table since 2008. Gunner joined in 2009. Nolan in 2021.",
  },
  {
    x: 706.5, z: 346, r: 4.5,
    label: "the photo wall",
    title: "The Photo Wall",
    body: "Samantha — together since junior year, married 2008. And the boys, who change faster than the frames do.",
  },
  {
    x: 737.5, z: 311, r: 5,
    label: "the boys' gallery",
    title: "The Boys' Gallery",
    body: "The fridge shows the most honest work in the house. No revisions, no client notes.",
  },
  {
    x: 707, z: 374, r: 4.5,
    label: "the print",
    title: "Xenomorph",
    body: "A typeface I drew for the fun of it. It keeps turning up in places I don't expect.",
  },
  {
    x: 667, z: 372, r: 4.5,
    label: "the manuscript",
    title: "Mastery is Dead",
    body: "The book — on what expertise means when the tools can fake the output.",
  },
];

export function insideHouse(x: number, z: number): boolean {
  return x > HOUSE.x1 - 2 && x < HOUSE.x2 + 2 && z > HOUSE.z1 - 2 && z < HOUSE.z2 + 2;
}

/* ----------------------------------------------------- procedural looks */

function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#6a4f38";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) {
    const y = i * 32;
    const shade = 0.85 + ((i * 37) % 10) / 32;
    g.fillStyle = `rgb(${Math.round(106 * shade)},${Math.round(79 * shade)},${Math.round(56 * shade)})`;
    g.fillRect(0, y, 256, 30);
    g.fillStyle = "rgba(30,20,12,0.5)";
    g.fillRect(0, y + 30, 256, 2);
    g.fillStyle = "rgba(40,26,16,0.25)";
    for (let k = 0; k < 22; k++) g.fillRect(((i * 53 + k * 41) % 250), y + ((k * 13) % 28), 8 + (k % 12), 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function plasterTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#d8cfbb";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const v = 200 + ((i * 97) % 34);
    g.fillStyle = `rgba(${v},${v - 8},${v - 22},0.06)`;
    g.fillRect((i * 37) % 128, (i * 61) % 128, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const TRIM = "#3d2c1e";

/* ------------------------------------------------------------ elements */

function Wall({ a, mat }: { a: [number, number, number, number]; mat: THREE.Material }) {
  const [x1, z1, x2, z2] = a;
  return (
    <mesh position={[(x1 + x2) / 2, HOUSE.wallH / 2, (z1 + z2) / 2]} material={mat} castShadow receiveShadow>
      <boxGeometry args={[Math.max(x2 - x1, 0.4), HOUSE.wallH, Math.max(z2 - z1, 0.4)]} />
    </mesh>
  );
}

/** header + jambs around an opening — makes every doorway read as built */
function OpeningTrim({ cx, cz, w, along }: { cx: number; cz: number; w: number; along: "x" | "z" }) {
  const headerArgs: [number, number, number] =
    along === "x" ? [w + 1.2, 1.7, HOUSE.t + 0.3] : [HOUSE.t + 0.3, 1.7, w + 1.2];
  const jambArgs: [number, number, number] =
    along === "x" ? [0.6, HOUSE.wallH, HOUSE.t + 0.3] : [HOUSE.t + 0.3, HOUSE.wallH, 0.6];
  const j1: [number, number, number] =
    along === "x" ? [cx - w / 2 - 0.3, HOUSE.wallH / 2, cz] : [cx, HOUSE.wallH / 2, cz - w / 2 - 0.3];
  const j2: [number, number, number] =
    along === "x" ? [cx + w / 2 + 0.3, HOUSE.wallH / 2, cz] : [cx, HOUSE.wallH / 2, cz + w / 2 + 0.3];
  return (
    <group>
      <mesh position={[cx, 9.65, cz]} castShadow>
        <boxGeometry args={headerArgs} />
        <meshStandardMaterial color={TRIM} roughness={0.6} />
      </mesh>
      <mesh position={j1} castShadow>
        <boxGeometry args={jambArgs} />
        <meshStandardMaterial color={TRIM} roughness={0.6} />
      </mesh>
      <mesh position={j2} castShadow>
        <boxGeometry args={jambArgs} />
        <meshStandardMaterial color={TRIM} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** frosted window: glowing translucent pane set into a wall */
function Frosted({ x, z, w, axis, bright = 1, lit = false }: { x: number; z: number; w: number; axis: "x" | "z"; bright?: number; lit?: boolean }) {
  return (
    <group position={[x, 5.6, z]} rotation={[0, axis === "x" ? 0 : Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[w + 0.8, 4.6, 0.5]} />
        <meshStandardMaterial color="#2c2620" roughness={0.7} />
      </mesh>
      {/* pane sits proud of the frame box on BOTH faces — visible in and out */}
      {([0.26, -0.26] as const).map((dz) => (
        <mesh key={dz} position={[0, 0, dz]} rotation={[0, dz < 0 ? Math.PI : 0, 0]}>
          <planeGeometry args={[w, 3.9]} />
          <meshStandardMaterial
            color="#e8d9c2"
            emissive="#ffd9a6"
            emissiveIntensity={0.55 * bright}
            roughness={1}
          />
        </mesh>
      ))}
      {/* mullions */}
      <mesh position={[0, 0, 0.28]}>
        <boxGeometry args={[0.18, 3.9, 0.08]} />
        <meshStandardMaterial color="#2c2620" />
      </mesh>
      <mesh position={[0, 0, 0.28]}>
        <boxGeometry args={[w, 0.18, 0.08]} />
        <meshStandardMaterial color="#2c2620" />
      </mesh>
      {/* sill */}
      <mesh position={[0, -2.15, 0.3]}>
        <boxGeometry args={[w + 1, 0.25, 0.7]} />
        <meshStandardMaterial color={TRIM} roughness={0.6} />
      </mesh>
      {lit && <pointLight position={[0, 0, 2]} color="#ffe6c2" intensity={9 * bright} distance={16} decay={1.8} />}
    </group>
  );
}

/**
 * framed picture with a REAL archive image — mounted flush on a wall face.
 * Place the group AT the wall surface; local +z faces into the room.
 * Frame sits behind, mat and image sit proud of it — nothing floats.
 */
function Framed({ src, x, y, z, w, h, ry = 0 }: { src: string; x: number; y: number; z: number; w: number; h: number; ry?: number }) {
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load(src);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [src]);
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      {/* frame body — against the wall */}
      <mesh position={[0, 0, 0.11]} castShadow>
        <boxGeometry args={[w + 0.7, h + 0.7, 0.22]} />
        <meshStandardMaterial color="#1e1a14" roughness={0.5} />
      </mesh>
      {/* mat */}
      <mesh position={[0, 0, 0.225]}>
        <planeGeometry args={[w + 0.34, h + 0.34]} />
        <meshStandardMaterial color="#ece5d8" roughness={0.9} />
      </mesh>
      {/* the image — the front-most surface */}
      <mesh position={[0, 0, 0.235]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.6} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.14} />
      </mesh>
    </group>
  );
}

/** corner AO strip — the baked-shadow cheat that sells an interior */
function AO({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, z]}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
    </mesh>
  );
}

function DoorMesh({ d, front = false }: { d: Door; front?: boolean }) {
  const grp = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    d.open += (d.target - d.open) * Math.min(dt * 4.5, 1);
    // -y rotation swings the panel from +x toward +z (south / outward)
    if (grp.current) grp.current.rotation.y = -d.open * Math.PI * 0.55;
  });
  const wood = front ? "#5a3a24" : "#4a3626";
  return (
    <group position={[d.hx, 0, d.hz]}>
      {/* threshold */}
      <mesh position={[d.len / 2, 0.04, 0]}>
        <boxGeometry args={[d.len, 0.08, 1.3]} />
        <meshStandardMaterial color={TRIM} roughness={0.8} />
      </mesh>
      <group ref={grp}>
        <mesh position={[d.len / 2, 4.35, 0]} castShadow>
          <boxGeometry args={[d.len, 8.7, 0.35]} />
          <meshStandardMaterial color={wood} roughness={0.55} />
        </mesh>
        {/* panel insets — reads as a real door, both faces */}
        {([0.21, -0.21] as const).map((dz) => (
          <group key={dz}>
            <mesh position={[d.len / 2, 6.1, dz]}>
              <boxGeometry args={[d.len - 1.6, 3.0, 0.05]} />
              <meshStandardMaterial color={front ? "#4c3120" : "#3e2d20"} roughness={0.6} />
            </mesh>
            <mesh position={[d.len / 2, 2.4, dz]}>
              <boxGeometry args={[d.len - 1.6, 2.6, 0.05]} />
              <meshStandardMaterial color={front ? "#4c3120" : "#3e2d20"} roughness={0.6} />
            </mesh>
          </group>
        ))}
        {/* handles on both faces, at the far edge from the hinge */}
        {([0.34, -0.34] as const).map((dz) => (
          <mesh key={dz} position={[d.len - 0.8, 4.35, dz]}>
            <sphereGeometry args={[0.24, 8, 8]} />
            <meshStandardMaterial color="#c8a24b" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {front && (
          <mesh position={[d.len / 2, 0.7, 0.19]}>
            <boxGeometry args={[d.len - 1.6, 0.9, 0.04]} />
            <meshStandardMaterial color="#a8874a" metalness={0.7} roughness={0.35} />
          </mesh>
        )}
      </group>
    </group>
  );
}

/** flush ceiling light — visible fixture where the light comes from */
function CeilingLight({ x, z, intensity = 36, color = "#ffd9a6" }: { x: number; z: number; intensity?: number; color?: string }) {
  return (
    <group position={[x, HOUSE.wallH - 0.05, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.25, 16]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.1, 16]} />
        <meshBasicMaterial color="#ffe9c8" toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.8, 0]} color={color} intensity={intensity} distance={30} decay={1.9} />
    </group>
  );
}

/** hanging pendant — dining table + kitchen island */
function Pendant({ x, z, y = 7.4, intensity = 22 }: { x: number; z: number; y?: number; intensity?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, (HOUSE.wallH + y) / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, HOUSE.wallH - y, 6]} />
        <meshStandardMaterial color="#1a140e" />
      </mesh>
      <mesh position={[0, y, 0]}>
        <cylinderGeometry args={[0.22, 0.85, 0.8, 14, 1, true]} />
        <meshStandardMaterial color="#2c2118" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, y - 0.28, 0]}>
        <sphereGeometry args={[0.24, 10, 10]} />
        <meshBasicMaterial color="#ffe0ae" toneMapped={false} />
      </mesh>
      <pointLight position={[0, y - 0.6, 0]} color="#ffd9a6" intensity={intensity} distance={20} decay={1.9} />
    </group>
  );
}

/* ------------------------------------------------------------ furniture */

function Couch({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[9, 1.6, 3.6]} />
        <meshStandardMaterial color="#5a4f42" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.6, -1.4]}>
        <boxGeometry args={[9, 2.2, 0.9]} />
        <meshStandardMaterial color="#655947" roughness={0.95} />
      </mesh>
      {[-3.2, 0, 3.2].map((dx) => (
        <mesh key={dx} position={[dx, 2.15, 0.2]}>
          <boxGeometry args={[2.6, 0.5, 2.6]} />
          <meshStandardMaterial color="#6b5e4b" roughness={1} />
        </mesh>
      ))}
      {[-4.2, 4.2].map((dx) => (
        <mesh key={dx} position={[dx, 1.9, 0]}>
          <boxGeometry args={[0.7, 1.4, 3.6]} />
          <meshStandardMaterial color="#655947" roughness={0.95} />
        </mesh>
      ))}
      {/* pillows + a thrown blanket — someone lives here */}
      <mesh position={[-3.1, 2.85, -0.85]} rotation={[0.2, 0.25, 0.1]}>
        <boxGeometry args={[1.7, 1.5, 0.55]} />
        <meshStandardMaterial color="#8f6c58" roughness={1} />
      </mesh>
      <mesh position={[3.1, 2.85, -0.85]} rotation={[0.15, -0.3, -0.08]}>
        <boxGeometry args={[1.7, 1.5, 0.55]} />
        <meshStandardMaterial color="#3a4a5a" roughness={1} />
      </mesh>
      <mesh position={[1.2, 2.5, 0.6]} rotation={[0, 0.2, 0.06]}>
        <boxGeometry args={[2.6, 0.22, 2.2]} />
        <meshStandardMaterial color="#7a5a4a" roughness={1} />
      </mesh>
    </group>
  );
}

function Table({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3.1, 0]} castShadow>
        <boxGeometry args={[w, 0.28, d]} />
        <meshStandardMaterial color="#5a4130" roughness={0.5} />
      </mesh>
      {[
        [-w / 2 + 0.5, -d / 2 + 0.5],
        [w / 2 - 0.5, -d / 2 + 0.5],
        [-w / 2 + 0.5, d / 2 - 0.5],
        [w / 2 - 0.5, d / 2 - 0.5],
      ].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 1.5, dz]}>
          <boxGeometry args={[0.35, 3.0, 0.35]} />
          <meshStandardMaterial color="#3e2d20" />
        </mesh>
      ))}
      {/* runner + fruit bowl */}
      <mesh position={[0, 3.26, 0]}>
        <boxGeometry args={[w - 3, 0.04, 1.8]} />
        <meshStandardMaterial color="#8f6c58" roughness={1} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.9, 0.55, 0.45, 12]} />
        <meshStandardMaterial color="#2c2118" roughness={0.5} />
      </mesh>
      {[[-0.25, 0.1], [0.3, -0.12], [0, 0.28]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 3.78, dz]}>
          <sphereGeometry args={[0.26, 8, 8]} />
          <meshStandardMaterial color={["#c8873a", "#a8b04a", "#c8873a"][i]} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function ChairS({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[1.6, 0.2, 1.6]} />
        <meshStandardMaterial color="#4a3626" />
      </mesh>
      <mesh position={[0, 3.3, -0.7]}>
        <boxGeometry args={[1.6, 2.6, 0.18]} />
        <meshStandardMaterial color="#4a3626" />
      </mesh>
      {[
        [-0.6, -0.6],
        [0.6, -0.6],
        [-0.6, 0.6],
        [0.6, 0.6],
      ].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 0.95, dz]}>
          <boxGeometry args={[0.16, 1.9, 0.16]} />
          <meshStandardMaterial color="#32251a" />
        </mesh>
      ))}
    </group>
  );
}

/** office bookshelf — flag + Nikon live here; local -z is its back */
function Shelf({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 3.6, 0]} castShadow>
        <boxGeometry args={[6.4, 7.2, 1.5]} />
        <meshStandardMaterial color="#3a2c1f" roughness={0.7} />
      </mesh>
      {[1.4, 3.4, 5.4].map((y) => (
        <mesh key={y} position={[0, y, 0.15]}>
          <boxGeometry args={[5.9, 0.14, 1.3]} />
          <meshStandardMaterial color="#54402d" />
        </mesh>
      ))}
      {[-2.2, -1.6, -1.0, -0.4, 0.4, 1.2].map((dx, i) => (
        <mesh key={i} position={[dx, 4.2 + (i % 2) * 0.06, 0.35]}>
          <boxGeometry args={[0.42, 1.5 - (i % 3) * 0.14, 0.9]} />
          <meshStandardMaterial color={i === 3 ? "#c8a24b" : ["#5a3a34", "#3a4a5a", "#4a4238", "#5c5245", "#374238"][i % 5]} roughness={0.7} />
        </mesh>
      ))}
      {/* the Nikon on the middle shelf */}
      <group position={[1.8, 6.0, 0.3]}>
        <mesh>
          <boxGeometry args={[1.3, 0.8, 0.7]} />
          <meshStandardMaterial color="#15181d" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.5, 12]} />
          <meshStandardMaterial color="#0c0e12" roughness={0.3} />
        </mesh>
      </group>
      {/* folded flag */}
      <mesh position={[-1.6, 6.0, 0.3]} rotation={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.5, 3]} />
        <meshStandardMaterial color="#1c2434" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Sideboard({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[2.2, 3.4, 8]} />
        <meshStandardMaterial color="#3a2c1f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.45, 0]}>
        <boxGeometry args={[2.4, 0.16, 8.2]} />
        <meshStandardMaterial color="#54402d" roughness={0.5} />
      </mesh>
      {/* the manuscript — a gold-spined stack */}
      {[0, 0.28, 0.56].map((dy, i) => (
        <mesh key={i} position={[0.2, 3.68 + dy, -2.2 + i * 0.12]} rotation={[0, i * 0.12, 0]}>
          <boxGeometry args={[1.6, 0.26, 2.3]} />
          <meshStandardMaterial color={i === 2 ? "#c8a24b" : "#ece5d8"} roughness={0.7} />
        </mesh>
      ))}
      {/* small lamp */}
      <group position={[0, 3.5, 2.6]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.08, 0.3, 1, 8]} />
          <meshStandardMaterial color="#1a140e" />
        </mesh>
        <mesh position={[0, 1.35, 0]}>
          <cylinderGeometry args={[0.45, 0.6, 0.8, 10, 1, true]} />
          <meshStandardMaterial color="#e8d9c2" emissive="#ffd9a6" emissiveIntensity={0.6} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 1.2, 0]} color="#ffd9a6" intensity={6} distance={10} decay={1.9} />
      </group>
    </group>
  );
}

function Plant({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.75, 0.55, 1.6, 10]} />
        <meshStandardMaterial color="#7a4a34" roughness={0.9} />
      </mesh>
      {[0, 1.1, 2.2, 3.4, 4.5].map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.45, 2.4 + (i % 3) * 0.5, Math.cos(a) * 0.45]} rotation={[0.5, a, 0]}>
          <coneGeometry args={[0.5, 2.4, 5]} />
          <meshStandardMaterial color={i % 2 ? "#3d5a34" : "#4a6a3e"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function FloorLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.2, 12]} />
        <meshStandardMaterial color="#1a140e" />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 6.2, 6]} />
        <meshStandardMaterial color="#1a140e" />
      </mesh>
      <mesh position={[0, 6.6, 0]}>
        <cylinderGeometry args={[0.85, 1.15, 1.5, 12, 1, true]} />
        <meshStandardMaterial color="#e8d9c2" emissive="#ffd9a6" emissiveIntensity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 6.2, 0]} color="#ffd9a6" intensity={12} distance={16} decay={1.9} />
    </group>
  );
}

function CoatRack({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3.4, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 6.8, 6]} />
        <meshStandardMaterial color="#3a2c1f" />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.65, 0.65, 0.3, 10]} />
        <meshStandardMaterial color="#3a2c1f" />
      </mesh>
      {/* a hung jacket */}
      <mesh position={[0.35, 5.6, 0.1]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[1.4, 2.6, 0.7]} />
        <meshStandardMaterial color="#4a5a3a" roughness={1} />
      </mesh>
      {/* shoes by the door */}
      <mesh position={[1.6, 0.28, 0.8]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.7, 0.5, 1.7]} />
        <meshStandardMaterial color="#2c2118" roughness={0.9} />
      </mesh>
      <mesh position={[2.5, 0.28, 0.7]} rotation={[0, 0.15, 0]}>
        <boxGeometry args={[0.7, 0.5, 1.7]} />
        <meshStandardMaterial color="#5a2a24" roughness={0.9} />
      </mesh>
      <mesh position={[2.1, 0.2, -0.6]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.5, 0.36, 1.2]} />
        <meshStandardMaterial color="#8f6c58" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Kitchen() {
  return (
    <group>
      {/* counter run along the north wall */}
      <mesh position={[724.5, 1.8, 303]} castShadow>
        <boxGeometry args={[38, 3.6, 5]} />
        <meshStandardMaterial color="#4c443a" roughness={0.6} />
      </mesh>
      <mesh position={[724.5, 3.65, 303]}>
        <boxGeometry args={[38, 0.25, 5.3]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.25} />
      </mesh>
      {/* cabinet seams */}
      {[710, 715, 720, 729, 734, 739].map((cx) => (
        <mesh key={cx} position={[cx, 1.8, 305.53]}>
          <boxGeometry args={[0.06, 3.2, 0.04]} />
          <meshStandardMaterial color="#2c2620" />
        </mesh>
      ))}
      {/* stove inset + burners + hood */}
      <mesh position={[712, 3.79, 303]}>
        <boxGeometry args={[4.6, 0.06, 4.6]} />
        <meshStandardMaterial color="#15181d" roughness={0.4} />
      </mesh>
      {[[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].map(([dx, dz], i) => (
        <mesh key={i} position={[712 + dx, 3.84, 303 + dz]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.05, 12]} />
          <meshStandardMaterial color="#0c0e12" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[712, 7.2, 302.2]} castShadow>
        <boxGeometry args={[4.8, 1.9, 3]} />
        <meshStandardMaterial color="#b9bdc2" roughness={0.35} metalness={0.5} />
      </mesh>
      {/* duct up to the ceiling — hoods don't float */}
      <mesh position={[712, 9.25, 302.2]}>
        <boxGeometry args={[2.2, 2.3, 2.2]} />
        <meshStandardMaterial color="#a4a8ad" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* sink + faucet */}
      <mesh position={[732, 3.79, 303]}>
        <boxGeometry args={[3.6, 0.06, 3]} />
        <meshStandardMaterial color="#9aa0a6" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[732, 4.4, 301.6]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 1.6, 6]} />
        <meshStandardMaterial color="#b9bdc2" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* fridge on the east wall */}
      <mesh position={[741.4, 4.4, 311]} castShadow>
        <boxGeometry args={[4.8, 8.8, 4.6]} />
        <meshStandardMaterial color="#b9bdc2" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[738.95, 4.6, 309.9]}>
        <boxGeometry args={[0.1, 2.6, 0.12]} />
        <meshStandardMaterial color="#7a8086" metalness={0.6} />
      </mesh>
      {/* kids' drawings on the fridge face */}
      <Framed src="/framer/cms/blog/do-i-still-care-about-this__image.jpeg" x={738.9} y={5.6} z={311} w={1.6} h={1.2} ry={-Math.PI / 2} />
      {/* island + stools */}
      <mesh position={[720, 1.7, 321]} castShadow>
        <boxGeometry args={[10, 3.4, 5]} />
        <meshStandardMaterial color="#4c443a" roughness={0.6} />
      </mesh>
      <mesh position={[720, 3.55, 321]}>
        <boxGeometry args={[10.4, 0.25, 5.4]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.25} />
      </mesh>
      {[716.8, 720, 723.2].map((sx) => (
        <group key={sx} position={[sx, 0, 325.3]}>
          <mesh position={[0, 1.25, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 2.5, 8]} />
            <meshStandardMaterial color="#1a140e" />
          </mesh>
          <mesh position={[0, 2.6, 0]}>
            <cylinderGeometry args={[0.75, 0.75, 0.22, 10]} />
            <meshStandardMaterial color="#5a4130" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* gold mug + cutting board on the island */}
      <mesh position={[722, 4.0, 321.6]}>
        <cylinderGeometry args={[0.32, 0.28, 0.6, 10]} />
        <meshStandardMaterial color="#c8a24b" roughness={0.4} />
      </mesh>
      <mesh position={[718, 3.72, 320.4]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[2.2, 0.1, 1.4]} />
        <meshStandardMaterial color="#8f6c58" roughness={0.8} />
      </mesh>
      {/* wall clock */}
      <group position={[743.85, 7.6, 322]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.14, 20]} />
          <meshStandardMaterial color="#ece5d8" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.28, 0.09]}>
          <boxGeometry args={[0.07, 0.56, 0.03]} />
          <meshStandardMaterial color="#1a140e" />
        </mesh>
        <mesh position={[0.2, 0.1, 0.09]} rotation={[0, 0, -1.1]}>
          <boxGeometry args={[0.07, 0.4, 0.03]} />
          <meshStandardMaterial color="#1a140e" />
        </mesh>
      </group>
      {/* island pendants */}
      <Pendant x={717.5} z={321} y={7.2} intensity={14} />
      <Pendant x={722.5} z={321} y={7.2} intensity={14} />
    </group>
  );
}

/* ------------------------------------------------------------ the house */

export function House() {
  const wood = useMemo(woodTexture, []);
  const plaster = useMemo(plasterTexture, []);
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: plaster, roughness: 0.95 }), [plaster]);

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(HOUSE.x1 + HOUSE.x2) / 2, 0.06, (HOUSE.z1 + HOUSE.z2) / 2]} receiveShadow>
        <planeGeometry args={[HOUSE.x2 - HOUSE.x1, HOUSE.z2 - HOUSE.z1]} />
        <meshStandardMaterial map={wood} roughness={0.55} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[(HOUSE.x1 + HOUSE.x2) / 2, HOUSE.wallH, (HOUSE.z1 + HOUSE.z2) / 2]}>
        <planeGeometry args={[HOUSE.x2 - HOUSE.x1, HOUSE.z2 - HOUSE.z1]} />
        <meshStandardMaterial color="#cfc6b4" emissive="#41382c" emissiveIntensity={0.5} roughness={1} />
      </mesh>
      {/* roof cap (seen from the street) */}
      <mesh position={[(HOUSE.x1 + HOUSE.x2) / 2, HOUSE.wallH + 1.4, (HOUSE.z1 + HOUSE.z2) / 2]}>
        <boxGeometry args={[HOUSE.x2 - HOUSE.x1 + 3, 2.6, HOUSE.z2 - HOUSE.z1 + 3]} />
        <meshStandardMaterial color="#241d16" roughness={1} />
      </mesh>

      {/* walls — derived from OPENINGS, so gaps are always where doors are */}
      {HOUSE_WALLS.map((a, i) => (
        <Wall key={i} a={a} mat={wallMat} />
      ))}

      {/* opening trim — headers + jambs make every passage read as built */}
      <OpeningTrim cx={686} cz={340} w={8} along="x" /> {/* office door */}
      <OpeningTrim cx={704} cz={359} w={14} along="z" /> {/* dining ↔ living arch */}
      <OpeningTrim cx={718} cz={340} w={12} along="x" /> {/* kitchen ↔ living arch */}
      <OpeningTrim cx={726} cz={384} w={8} along="x" /> {/* front door */}

      {/* baseboard AO strips */}
      <AO x={684} z={302.5} w={38} d={4} />
      <AO x={666.5} z={320} w={4} d={36} />
      <AO x={666.5} z={362} w={4} d={36} />
      <AO x={724} z={381.5} w={38} d={4} />
      <AO x={741.5} z={362} w={4} d={40} />

      {/* frosted windows — the city is a sound, not a view */}
      <Frosted x={684} z={HOUSE.z1 + 0.35} w={6} axis="x" lit /> {/* office, behind the monitor */}
      <Frosted x={HOUSE.x1 + 0.35} z={318} w={7} axis="z" />
      <Frosted x={HOUSE.x1 + 0.35} z={352} w={7} axis="z" bright={0.8} />
      <Frosted x={724} z={HOUSE.z1 + 0.35} w={8} axis="x" bright={0.9} lit /> {/* kitchen */}
      <Frosted x={HOUSE.x2 - 0.35} z={376} w={6} axis="z" bright={1.1} lit /> {/* living */}
      <Frosted x={712} z={HOUSE.z2 - 0.35} w={7} axis="x" bright={0.9} /> {/* living, south */}

      {/* doors — panels exactly fill their gaps */}
      <DoorMesh d={DOORS[0]} />
      <DoorMesh d={DOORS[1]} front />

      {/* -------- OFFICE: the relic room -------- */}
      {/* rug under the desk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[684, 0.1, 313]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#4a4238" roughness={1} />
      </mesh>
      {/* the desk (monitor faces the seat to the south) */}
      <group>
        <mesh position={[684, 3.0, 310]} castShadow>
          <boxGeometry args={[10, 0.35, 4.6]} />
          <meshStandardMaterial color="#4a3a2c" roughness={0.5} />
        </mesh>
        {[-4.4, 4.4].map((dx) => (
          <mesh key={dx} position={[684 + dx, 1.5, 310]}>
            <boxGeometry args={[0.4, 3.0, 4.2]} />
            <meshStandardMaterial color="#2e2620" roughness={0.8} />
          </mesh>
        ))}
        {/* monitor */}
        <mesh position={[684, 3.5, 308.2]}>
          <boxGeometry args={[1.4, 0.8, 0.5]} />
          <meshStandardMaterial color="#181b20" roughness={0.4} />
        </mesh>
        <mesh position={[SCREEN.cx, SCREEN.cy, SCREEN.cz - 0.1]}>
          <boxGeometry args={[SCREEN.hw * 2 + 0.35, SCREEN.hh * 2 + 0.35, 0.22]} />
          <meshStandardMaterial color="#0c0e12" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* keyboard + gold mug */}
        <mesh position={[683.6, 3.28, 311.4]}>
          <boxGeometry args={[2.6, 0.14, 0.95]} />
          <meshStandardMaterial color="#22262e" roughness={0.7} />
        </mesh>
        <mesh position={[687, 3.5, 311.6]}>
          <cylinderGeometry args={[0.3, 0.26, 0.6, 10]} />
          <meshStandardMaterial color="#c8a24b" roughness={0.4} />
        </mesh>
        {/* chair */}
        <mesh position={[684, 1.9, 315]}>
          <boxGeometry args={[2.2, 0.35, 2.2]} />
          <meshStandardMaterial color="#1c1f26" roughness={0.7} />
        </mesh>
        <mesh position={[684, 3.4, 316.2]}>
          <boxGeometry args={[2.2, 2.8, 0.4]} />
          <meshStandardMaterial color="#1c1f26" roughness={0.7} />
        </mesh>
        <mesh position={[684, 0.95, 315]}>
          <cylinderGeometry args={[0.18, 0.18, 1.8, 6]} />
          <meshStandardMaterial color="#0e1014" />
        </mesh>
        {/* bin */}
        <mesh position={[689.6, 0.8, 308]}>
          <cylinderGeometry args={[0.55, 0.45, 1.6, 10]} />
          <meshStandardMaterial color="#2c2620" roughness={0.8} />
        </mesh>
      </group>
      {/* the relics — REAL archive images, flush on the wall faces */}
      <Framed src="/archive/web/sfMnAGTnE16cKd9nm8suW4wk.jpg" x={671.5} y={6.2} z={300.05} w={4.6} h={3.1} />
      <Framed src="/archive/web/ILQgtzAfoB1DMrSNqEKzs19bQ.jpg" x={696.5} y={6.2} z={300.05} w={4.6} h={3.1} />
      <Framed src="/archive/web/drPyB0qigdiXyCjHkK3HdKQsuE.jpg" x={703.4} y={5.8} z={316} w={3.4} h={3.4} ry={-Math.PI / 2} />
      <Framed src="/archive/web/dPjaqyIJCrIhH7ybw1Id4MdMDzs.jpg" x={703.4} y={5.8} z={330} w={4.8} h={2.5} ry={-Math.PI / 2} />
      {/* poster tubes in the corner */}
      <group position={[667, 0, 334]}>
        {[0, 0.9, 1.7].map((dx, i) => (
          <mesh key={i} position={[dx, 3.1, 0]} rotation={[0, 0, 0.16 - i * 0.1]}>
            <cylinderGeometry args={[0.34, 0.34, 6.2, 8]} />
            <meshStandardMaterial color={["#8a7a5a", "#6a5a4a", "#7a6a55"][i]} roughness={0.9} />
          </mesh>
        ))}
      </group>
      {/* bookshelf on the west wall — flag + Nikon */}
      <Shelf x={665.6} z={308} ry={Math.PI / 2} />

      {/* -------- DINING -------- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[684, 0.09, 362]}>
        <planeGeometry args={[15, 11]} />
        <meshStandardMaterial color="#5a4a44" roughness={1} />
      </mesh>
      <Table x={684} z={362} w={10} d={6} />
      <ChairS x={680} z={357.5} ry={0} />
      <ChairS x={688} z={357.5} ry={0} />
      <ChairS x={680} z={366.5} ry={Math.PI} />
      <ChairS x={688} z={366.5} ry={Math.PI} />
      <Pendant x={684} z={362} y={7.6} intensity={26} />
      <Sideboard x={665.75} z={372} />
      <Framed src="/archive/web/lUfbKLTE61YByqT1TJBRTeMjA.jpg" x={664.1} y={7} z={372} w={4} h={2.6} ry={Math.PI / 2} />
      <Plant x={667} z={342.8} s={1.1} />

      {/* -------- LIVING -------- */}
      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[734, 0.1, 362]}>
        <planeGeometry args={[15, 12]} />
        <meshStandardMaterial color="#7a5a4a" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[734, 0.12, 362]}>
        <planeGeometry args={[13.6, 10.6]} />
        <meshStandardMaterial color="#8f6c58" roughness={1} />
      </mesh>
      {/* TV on a console against the east wall */}
      <mesh position={[742.5, 1.4, 362]} castShadow>
        <boxGeometry args={[2.4, 1.6, 11]} />
        <meshStandardMaterial color="#3a2c1f" roughness={0.6} />
      </mesh>
      <mesh position={[743.2, 5.2, 362]}>
        <boxGeometry args={[0.4, 5.2, 9.4]} />
        <meshStandardMaterial color="#0c0e12" roughness={0.2} />
      </mesh>
      <mesh position={[742.95, 5.2, 362]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8.8, 4.6]} />
        <meshStandardMaterial color="#131824" emissive="#22344a" emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      {/* soundbar */}
      <mesh position={[742.4, 2.35, 362]}>
        <boxGeometry args={[0.6, 0.35, 7]} />
        <meshStandardMaterial color="#15181d" roughness={0.6} />
      </mesh>
      {/* couch faces the TV; coffee table between */}
      <Couch x={731} z={362} ry={-Math.PI / 2} />
      <group position={[737, 0, 362]}>
        <mesh position={[0, 1.35, 0]} castShadow>
          <boxGeometry args={[4.4, 0.22, 2.6]} />
          <meshStandardMaterial color="#5a4130" roughness={0.5} />
        </mesh>
        {[[-1.9, -1], [1.9, -1], [-1.9, 1], [1.9, 1]].map(([dx, dz], i) => (
          <mesh key={i} position={[dx, 0.65, dz]}>
            <boxGeometry args={[0.24, 1.3, 0.24]} />
            <meshStandardMaterial color="#3e2d20" />
          </mesh>
        ))}
        {/* remote + book on the table */}
        <mesh position={[-0.8, 1.52, 0.4]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[0.9, 0.1, 0.34]} />
          <meshStandardMaterial color="#15181d" />
        </mesh>
        <mesh position={[0.9, 1.55, -0.3]} rotation={[0, -0.2, 0]}>
          <boxGeometry args={[1.4, 0.18, 1.9]} />
          <meshStandardMaterial color="#5a3a34" roughness={0.8} />
        </mesh>
      </group>
      {/* the photo wall — on the arch wall, facing the living room */}
      <Framed src="/archive/web/RAOF0jiw87qsIU7GR1OeKHsHEs.jpg" x={704.65} y={6.4} z={346} w={4.4} h={3} ry={Math.PI / 2} />
      <Framed src="/framer/cms/downloads/xenomorph-typeface__image.png" x={704.65} y={6.4} z={374} w={3.4} h={3} ry={Math.PI / 2} />
      <FloorLamp x={706.8} z={381} />
      <Plant x={742} z={382} s={1.2} />

      {/* -------- ENTRY (inside the front door) -------- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[726, 0.09, 380.5]}>
        <planeGeometry args={[7, 4.5]} />
        <meshStandardMaterial color="#3e332a" roughness={1} />
      </mesh>
      <CoatRack x={734.5} z={381.8} />

      {/* -------- KITCHEN -------- */}
      <Kitchen />

      {/* -------- lighting: visible fixtures, warm home light -------- */}
      <CeilingLight x={684} z={318} intensity={40} />
      <CeilingLight x={684} z={352} intensity={30} />
      <CeilingLight x={724} z={314} intensity={30} color="#fff0d8" />
      <CeilingLight x={730} z={358} intensity={36} />
      {/* desk lamp — the warm heart of the office */}
      <pointLight position={[688, 4.6, 309]} color="#ffca7a" intensity={16} distance={14} decay={1.8} />

      {/* -------- porch -------- */}
      <mesh position={[726, 0.25, 387]} receiveShadow>
        <boxGeometry args={[10, 0.5, 6]} />
        <meshStandardMaterial color="#5a544a" roughness={0.9} />
      </mesh>
      <mesh position={[726, 0.08, 391]}>
        <boxGeometry args={[8, 0.16, 2]} />
        <meshStandardMaterial color="#4c463e" roughness={0.9} />
      </mesh>
      {/* doormat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[726, 0.52, 386.4]}>
        <planeGeometry args={[3.4, 2]} />
        <meshStandardMaterial color="#6a5a44" roughness={1} />
      </mesh>
      {/* porch light beside the door */}
      <mesh position={[731.4, 7.2, 384.7]}>
        <sphereGeometry args={[0.36, 8, 8]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>
      <pointLight position={[728, 6, 388]} color="#ffd9a0" intensity={20} distance={20} decay={1.8} />
    </group>
  );
}
