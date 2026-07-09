"use client";

/**
 * THE HOUSE — a one-floor home in Cincinnati Hill, and the game's first act.
 *
 * REAL-WORLD SCALE: 3 units = 1 meter. The player is 6'1" (eye 5.2 units).
 * Every dimension below derives from a real measurement:
 *   ceiling 9 ft (8.7) · doors 36"x80" (2.85 x 6.15) · counters 36" (2.7)
 *   range 30" wide · fridge 36"x71" · dining table 63"x35" · TV 65"
 * House footprint 12 x 10 m (36 x 30 units) — a modest ranch.
 *
 * Rooms (world coords):
 *   OFFICE  x[686,704] z[326,339]   KITCHEN x[704,722] z[326,339]
 *   DINING  x[686,704] z[339,356]   LIVING  x[704,722] z[339,356]
 *
 * ONE source of truth: OPENINGS below defines every gap in every wall.
 * Wall AABBs (colliders + meshes), door panels, headers, and jamb trim are
 * all derived from it — a door can never sit inside a solid wall again.
 */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Model, HangingLamp, usePBR } from "./models";

/* ------------------------------------------------------------- geometry */

export const HOUSE = { x1: 686, z1: 326, x2: 722, z2: 356, wallH: 8.7, t: 0.5 };

export const SCREEN = { cx: 695, cy: 3.55, cz: 328.05, hw: 1.32, hh: 0.78 };
export const SEAT_POS = new THREE.Vector3(695, 3.6, 330.1);
export const STAND = { x: 695, z: 332 };
export const DESK_SPOT = { x: 695, z: 331.3 };

/**
 * Every hole in every wall. Doors are hinged panels; arches are open trim.
 * Door gaps are 36" (2.85); arches 5–6 units (1.7–2 m).
 */
const OPENINGS = {
  officeDoor: { wall: "z339" as const, from: 694, to: 696.85 }, // office → dining
  archDL: { wall: "x704" as const, from: 344, to: 350 }, // dining ↔ living
  archKL: { wall: "z339" as const, from: 710, to: 715 }, // kitchen ↔ living
  frontDoor: { wall: "z356" as const, from: 712, to: 714.85 }, // living → the city
};

const DOOR_H = 6.15; // 80" door leaf + frame

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
    hz: 339,
    axis: "x",
    len: OPENINGS.officeDoor.to - OPENINGS.officeDoor.from,
    open: 0,
    target: 0,
    label: "open the door",
  },
  {
    id: "front",
    hx: OPENINGS.frontDoor.from,
    hz: 356,
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
  // dining|living side has the arch
  W.push([704 - t / 2, z1, 704 + t / 2, OPENINGS.archDL.from]);
  W.push([704 - t / 2, OPENINGS.archDL.to, 704 + t / 2, z2]);
  // inner wall z=339: office door gap + kitchen↔living arch
  W.push([x1, 339 - t / 2, OPENINGS.officeDoor.from, 339 + t / 2]);
  W.push([OPENINGS.officeDoor.to, 339 - t / 2, OPENINGS.archKL.from, 339 + t / 2]);
  W.push([OPENINGS.archKL.to, 339 - t / 2, x2, 339 + t / 2]);
  return W;
})();

/**
 * Furniture footprints as AABBs [x1,z1,x2,z2] — the game turns these into
 * physics colliders. Anything a person couldn't walk through belongs here.
 */
export const FURNITURE: [number, number, number, number][] = [
  // office
  [692.3, 326.7, 697.7, 329.1], // desk
  [686.25, 328.2, 687.45, 333.8], // bookshelf (west wall)
  [686.9, 336.9, 688.3, 338.3], // poster tubes corner
  // kitchen — counter split around the freestanding range
  [704.25, 326.5, 711.1, 328.45],
  [713.5, 326.5, 721.75, 328.45],
  [711.15, 326.6, 713.45, 328.5], // range
  [719.3, 330.3, 721.8, 332.7], // fridge (east wall)
  [708.7, 332.85, 715.3, 336.15], // island
  // dining
  [692.6, 346.15, 697.4, 348.85], // table
  [693.0, 344.6, 694.2, 345.8], // chairs
  [695.8, 344.6, 697.0, 345.8],
  [693.0, 349.2, 694.2, 350.4],
  [695.8, 349.2, 697.0, 350.4],
  [686.25, 348.75, 687.6, 353.25], // sideboard (west wall)
  // living
  [720.5, 344.8, 721.8, 350.2], // TV console (east wall)
  [712.0, 344.3, 715.0, 350.7], // sofa (faces the TV)
  [716.3, 345.6, 718.7, 349.4], // coffee table
  [713.3, 341.0, 715.9, 343.6], // armchair
];

/** things you can look at — E near one shows its story */
export type Relic = { x: number; z: number; r: number; label: string; title: string; body: string };
export const RELICS: Relic[] = [
  {
    x: 686.9, z: 329.6, r: 2.4,
    label: "the folded flag",
    title: "The Flag",
    body: "Parris Island, then MCAS New River. The Corps is where discipline stopped being a word and became a habit.",
  },
  {
    x: 686.9, z: 332.4, r: 2.2,
    label: "the Nikon",
    title: "The Nikon",
    body: "The first camera. Photography taught me to see long before design taught me to ship.",
  },
  {
    x: 687.6, z: 337.6, r: 2.6,
    label: "the poster tubes",
    title: "Poster Tubes",
    body: "Print never left. A few of these hung in shows. Most never left the tube.",
  },
  {
    x: 695, z: 347.5, r: 3.8,
    label: "the table",
    title: "The Table",
    body: "Samantha and I have eaten at this table since 2008. Gunner joined in 2009. Nolan in 2021.",
  },
  {
    x: 705.4, z: 341.8, r: 3,
    label: "the photo wall",
    title: "The Photo Wall",
    body: "Samantha — together since junior year, married 2008. And the boys, who change faster than the frames do.",
  },
  {
    x: 719.5, z: 331.5, r: 3,
    label: "the boys' gallery",
    title: "The Boys' Gallery",
    body: "The fridge shows the most honest work in the house. No revisions, no client notes.",
  },
  {
    x: 705.4, z: 352.6, r: 3,
    label: "the print",
    title: "Xenomorph",
    body: "A typeface I drew for the fun of it. It keeps turning up in places I don't expect.",
  },
  {
    x: 687.2, z: 351, r: 3,
    label: "the manuscript",
    title: "Mastery is Dead",
    body: "The book — on what expertise means when the tools can fake the output.",
  },
];

export function insideHouse(x: number, z: number): boolean {
  return x > HOUSE.x1 - 2 && x < HOUSE.x2 + 2 && z > HOUSE.z1 - 2 && z < HOUSE.z2 + 2;
}

const TRIM = "#3d2c1e";

/* ------------------------------------------------------------ elements */

function Wall({ a, mat }: { a: [number, number, number, number]; mat: THREE.Material }) {
  const [x1, z1, x2, z2] = a;
  return (
    <mesh position={[(x1 + x2) / 2, HOUSE.wallH / 2, (z1 + z2) / 2]} material={mat} castShadow receiveShadow>
      <boxGeometry args={[Math.max(x2 - x1, 0.3), HOUSE.wallH, Math.max(z2 - z1, 0.3)]} />
    </mesh>
  );
}

/** header + jambs around an opening — makes every doorway read as built */
function OpeningTrim({ cx, cz, w, along }: { cx: number; cz: number; w: number; along: "x" | "z" }) {
  const headerH = HOUSE.wallH - DOOR_H;
  const headerY = (DOOR_H + HOUSE.wallH) / 2;
  const headerArgs: [number, number, number] =
    along === "x" ? [w + 0.8, headerH, HOUSE.t + 0.2] : [HOUSE.t + 0.2, headerH, w + 0.8];
  const jambArgs: [number, number, number] =
    along === "x" ? [0.4, HOUSE.wallH, HOUSE.t + 0.2] : [HOUSE.t + 0.2, HOUSE.wallH, 0.4];
  const j1: [number, number, number] =
    along === "x" ? [cx - w / 2 - 0.2, HOUSE.wallH / 2, cz] : [cx, HOUSE.wallH / 2, cz - w / 2 - 0.2];
  const j2: [number, number, number] =
    along === "x" ? [cx + w / 2 + 0.2, HOUSE.wallH / 2, cz] : [cx, HOUSE.wallH / 2, cz + w / 2 + 0.2];
  return (
    <group>
      <mesh position={[cx, headerY, cz]} castShadow>
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

/** frosted window: glowing translucent pane set into a wall (sill ~0.9 m) */
function Frosted({ x, z, w, axis, bright = 1 }: { x: number; z: number; w: number; axis: "x" | "z"; bright?: number }) {
  return (
    <group position={[x, 4.8, z]} rotation={[0, axis === "x" ? 0 : Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[w + 0.6, 4.4, 0.5]} />
        <meshStandardMaterial color="#2c2620" roughness={0.7} />
      </mesh>
      {/* pane sits proud of the frame box on BOTH faces — visible in and out */}
      {([0.26, -0.26] as const).map((dz) => (
        <mesh key={dz} position={[0, 0, dz]} rotation={[0, dz < 0 ? Math.PI : 0, 0]}>
          <planeGeometry args={[w, 3.8]} />
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
        <boxGeometry args={[0.12, 3.8, 0.08]} />
        <meshStandardMaterial color="#2c2620" />
      </mesh>
      <mesh position={[0, 0, 0.28]}>
        <boxGeometry args={[w, 0.12, 0.08]} />
        <meshStandardMaterial color="#2c2620" />
      </mesh>
      {/* sill */}
      <mesh position={[0, -2.05, 0.3]}>
        <boxGeometry args={[w + 0.8, 0.2, 0.6]} />
        <meshStandardMaterial color={TRIM} roughness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * framed picture with a REAL archive image — mounted flush on a wall face.
 * Place the group AT the wall surface; local +z faces into the room.
 */
function Framed({ src, x, y, z, w, h, ry = 0 }: { src: string; x: number; y: number; z: number; w: number; h: number; ry?: number }) {
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load(src);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [src]);
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 0, 0.08]} castShadow>
        <boxGeometry args={[w + 0.4, h + 0.4, 0.16]} />
        <meshStandardMaterial color="#1e1a14" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.165]}>
        <planeGeometry args={[w + 0.2, h + 0.2]} />
        <meshStandardMaterial color="#ece5d8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.175]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.6} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.14} />
      </mesh>
    </group>
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
  const leafH = DOOR_H - 0.1;
  return (
    <group position={[d.hx, 0, d.hz]}>
      {/* threshold */}
      <mesh position={[d.len / 2, 0.03, 0]}>
        <boxGeometry args={[d.len, 0.06, 0.8]} />
        <meshStandardMaterial color={TRIM} roughness={0.8} />
      </mesh>
      <group ref={grp}>
        <mesh position={[d.len / 2, leafH / 2, 0]} castShadow>
          <boxGeometry args={[d.len, leafH, 0.15]} />
          <meshStandardMaterial color={wood} roughness={0.55} />
        </mesh>
        {/* panel insets, both faces */}
        {([0.09, -0.09] as const).map((dz) => (
          <group key={dz}>
            <mesh position={[d.len / 2, 4.3, dz]}>
              <boxGeometry args={[d.len - 0.7, 2.2, 0.03]} />
              <meshStandardMaterial color={front ? "#4c3120" : "#3e2d20"} roughness={0.6} />
            </mesh>
            <mesh position={[d.len / 2, 1.7, dz]}>
              <boxGeometry args={[d.len - 0.7, 1.9, 0.03]} />
              <meshStandardMaterial color={front ? "#4c3120" : "#3e2d20"} roughness={0.6} />
            </mesh>
          </group>
        ))}
        {/* handles at 40" on both faces */}
        {([0.18, -0.18] as const).map((dz) => (
          <mesh key={dz} position={[d.len - 0.35, 3.05, dz]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color="#c8a24b" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {front && (
          <mesh position={[d.len / 2, 0.45, 0.09]}>
            <boxGeometry args={[d.len - 0.7, 0.55, 0.03]} />
            <meshStandardMaterial color="#a8874a" metalness={0.7} roughness={0.35} />
          </mesh>
        )}
      </group>
    </group>
  );
}

/** flush ceiling light — visible fixture where the light comes from */
function CeilingLight({ x, z, intensity = 30, color = "#ffd9a6" }: { x: number; z: number; intensity?: number; color?: string }) {
  return (
    <group position={[x, HOUSE.wallH - 0.04, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.18, 16]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 16]} />
        <meshBasicMaterial color="#ffe9c8" toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.7, 0]} color={color} intensity={intensity} distance={20} decay={1.9} />
    </group>
  );
}

/** office bookshelf (1.8 m wide, 2 m tall) — flag + Nikon live here */
function Shelf({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[5.4, 6, 1.05]} />
        <meshStandardMaterial color="#3a2c1f" roughness={0.7} />
      </mesh>
      {[1.2, 2.9, 4.6].map((y) => (
        <mesh key={y} position={[0, y, 0.1]}>
          <boxGeometry args={[5.0, 0.1, 0.95]} />
          <meshStandardMaterial color="#54402d" />
        </mesh>
      ))}
      {[-1.9, -1.4, -0.9, -0.4, 0.3, 0.9].map((dx, i) => (
        <mesh key={i} position={[dx, 3.6 + (i % 2) * 0.04, 0.25]}>
          <boxGeometry args={[0.32, 1.15 - (i % 3) * 0.1, 0.7]} />
          <meshStandardMaterial color={i === 3 ? "#c8a24b" : ["#5a3a34", "#3a4a5a", "#4a4238", "#5c5245", "#374238"][i % 5]} roughness={0.7} />
        </mesh>
      ))}
      {/* the Nikon */}
      <group position={[1.5, 5.05, 0.2]}>
        <mesh>
          <boxGeometry args={[0.95, 0.6, 0.5]} />
          <meshStandardMaterial color="#15181d" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.36, 12]} />
          <meshStandardMaterial color="#0c0e12" roughness={0.3} />
        </mesh>
      </group>
      {/* folded flag */}
      <mesh position={[-1.3, 5.0, 0.2]} rotation={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.38, 3]} />
        <meshStandardMaterial color="#1c2434" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Sideboard({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[1.3, 2.5, 4.5]} />
        <meshStandardMaterial color="#3a2c1f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.56, 0]}>
        <boxGeometry args={[1.45, 0.12, 4.65]} />
        <meshStandardMaterial color="#54402d" roughness={0.5} />
      </mesh>
      {/* the manuscript — a gold-spined stack */}
      {[0, 0.2, 0.4].map((dy, i) => (
        <mesh key={i} position={[0.1, 2.72 + dy, -1.3 + i * 0.08]} rotation={[0, i * 0.12, 0]}>
          <boxGeometry args={[1.05, 0.18, 1.5]} />
          <meshStandardMaterial color={i === 2 ? "#c8a24b" : "#ece5d8"} roughness={0.7} />
        </mesh>
      ))}
      {/* small lamp — emissive shade, no light cost */}
      <group position={[0, 2.6, 1.5]}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.06, 0.2, 0.7, 8]} />
          <meshStandardMaterial color="#1a140e" />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.32, 0.44, 0.55, 10, 1, true]} />
          <meshStandardMaterial color="#e8d9c2" emissive="#ffd9a6" emissiveIntensity={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/** floor lamp (5'8") — emissive shade, no light cost */
function FloorLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.12, 12]} />
        <meshStandardMaterial color="#1a140e" />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 4.5, 6]} />
        <meshStandardMaterial color="#1a140e" />
      </mesh>
      <mesh position={[0, 4.75, 0]}>
        <cylinderGeometry args={[0.55, 0.75, 1.0, 12, 1, true]} />
        <meshStandardMaterial color="#e8d9c2" emissive="#ffd9a6" emissiveIntensity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CoatRack({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.7, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 5.4, 8]} />
        <meshStandardMaterial color="#3a2c1f" />
      </mesh>
      {/* hook arms */}
      {[0.5, 1.7, 2.9, 4.1].map((a2, i) => (
        <mesh key={i} position={[Math.sin(a2) * 0.32, 5.15, Math.cos(a2) * 0.32]} rotation={[0.5 * Math.cos(a2), a2, -0.5]}>
          <cylinderGeometry args={[0.035, 0.035, 0.75, 5]} />
          <meshStandardMaterial color="#3a2c1f" />
        </mesh>
      ))}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 10]} />
        <meshStandardMaterial color="#3a2c1f" />
      </mesh>
      {/* a hung jacket */}
      <mesh position={[0.3, 4.05, 0.12]} rotation={[0.06, 0.3, -0.1]}>
        <boxGeometry args={[0.95, 1.8, 0.45]} />
        <meshStandardMaterial color="#4a5a3a" roughness={1} />
      </mesh>
      {/* shoes by the door */}
      <mesh position={[1.1, 0.2, 0.6]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.5, 0.36, 1.15]} />
        <meshStandardMaterial color="#2c2118" roughness={0.9} />
      </mesh>
      <mesh position={[1.75, 0.2, 0.5]} rotation={[0, 0.15, 0]}>
        <boxGeometry args={[0.5, 0.36, 1.15]} />
        <meshStandardMaterial color="#5a2a24" roughness={0.9} />
      </mesh>
      <mesh position={[1.45, 0.15, -0.45]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.36, 0.26, 0.85]} />
        <meshStandardMaterial color="#8f6c58" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Kitchen() {
  return (
    <group>
      {/* counter run along the north wall — split around the range.
          36" counters: base to 2.4, slab top at 2.55. */}
      {[[707.68, 6.85], [717.63, 8.25]].map(([cx, w]) => (
        <group key={cx}>
          <mesh position={[cx, 1.2, 327.48]} castShadow>
            <boxGeometry args={[w, 2.4, 1.95]} />
            <meshStandardMaterial color="#4c443a" roughness={0.6} />
          </mesh>
          <mesh position={[cx, 2.48, 327.53]}>
            <boxGeometry args={[w, 0.15, 2.1]} />
            <meshStandardMaterial color="#d8d2c4" roughness={0.25} />
          </mesh>
        </group>
      ))}
      {/* cabinet seams */}
      {[706, 708.4, 710.6, 714.2, 716.4, 719.6].map((cx) => (
        <mesh key={cx} position={[cx, 1.2, 328.46]}>
          <boxGeometry args={[0.04, 2.1, 0.03]} />
          <meshStandardMaterial color="#2c2620" />
        </mesh>
      ))}
      {/* the range — 30" wide, 36" tall, matches the counters */}
      <Model slug="electric_stove" position={[712.3, 0.06, 327.6]} scale={3.1} />
      {/* hood + duct */}
      <mesh position={[712.3, 5.35, 327.2]} castShadow>
        <boxGeometry args={[2.9, 1.2, 2]} />
        <meshStandardMaterial color="#b9bdc2" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[712.3, 7.35, 327.2]}>
        <boxGeometry args={[1.5, 2.8, 1.5]} />
        <meshStandardMaterial color="#a4a8ad" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* sink + faucet */}
      <mesh position={[717.5, 2.56, 327.5]}>
        <boxGeometry args={[2.4, 0.05, 1.5]} />
        <meshStandardMaterial color="#9aa0a6" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[717.5, 3.0, 326.9]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.1, 6]} />
        <meshStandardMaterial color="#b9bdc2" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* fridge — 36" wide, 71" tall, on the east wall */}
      <mesh position={[720.55, 2.7, 331.5]} castShadow>
        <boxGeometry args={[2.4, 5.4, 2.4]} />
        <meshStandardMaterial color="#b9bdc2" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[719.32, 3.0, 330.9]}>
        <boxGeometry args={[0.06, 1.8, 0.09]} />
        <meshStandardMaterial color="#7a8086" metalness={0.6} />
      </mesh>
      {/* kids' drawings on the fridge face */}
      <Framed src="/framer/cms/blog/do-i-still-care-about-this__image.jpeg" x={719.3} y={3.7} z={331.5} w={1.1} h={0.85} ry={-Math.PI / 2} />
      {/* island (7' x 3'6", 36" tall) + stools */}
      <mesh position={[712, 1.2, 334.5]} castShadow>
        <boxGeometry args={[6.6, 2.4, 3.3]} />
        <meshStandardMaterial color="#4c443a" roughness={0.6} />
      </mesh>
      <mesh position={[712, 2.48, 334.5]}>
        <boxGeometry args={[6.9, 0.15, 3.6]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.25} />
      </mesh>
      {[333.6, 335.4].map((sz) => (
        <group key={sz} position={[716.4, 0, sz]}>
          <mesh position={[0, 0.98, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 1.95, 8]} />
            <meshStandardMaterial color="#1a140e" />
          </mesh>
          <mesh position={[0, 2.02, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.15, 10]} />
            <meshStandardMaterial color="#5a4130" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* gold mug + cutting board on the island */}
      <mesh position={[713.2, 2.78, 334.9]}>
        <cylinderGeometry args={[0.18, 0.16, 0.42, 10]} />
        <meshStandardMaterial color="#c8a24b" roughness={0.4} />
      </mesh>
      <mesh position={[711, 2.6, 334.1]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[1.5, 0.08, 1.0]} />
        <meshStandardMaterial color="#8f6c58" roughness={0.8} />
      </mesh>
      {/* wall clock */}
      <group position={[721.7, 5.6, 336]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.1, 20]} />
          <meshStandardMaterial color="#ece5d8" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.18, 0.06]}>
          <boxGeometry args={[0.05, 0.36, 0.02]} />
          <meshStandardMaterial color="#1a140e" />
        </mesh>
        <mesh position={[0.13, 0.06, 0.06]} rotation={[0, 0, -1.1]}>
          <boxGeometry args={[0.05, 0.26, 0.02]} />
          <meshStandardMaterial color="#1a140e" />
        </mesh>
      </group>
      {/* island pendants — one carries the room light */}
      <HangingLamp x={710.8} z={334.5} ceiling={HOUSE.wallH} scale={1.15} intensity={16} />
      <HangingLamp x={713.2} z={334.5} ceiling={HOUSE.wallH} scale={1.15} lit={false} />
    </group>
  );
}

/* ------------------------------------------------------------ the house */

export function House() {
  const floorTex = usePBR("diagonal_parquet", 12, 10);
  const wallTex = usePBR("beige_wall_001", 4, 1.4);
  const rugLiving = usePBR("fabric_pattern_07", 2.6, 2);
  const rugDining = usePBR("fabric_pattern_07", 2.2, 1.7);
  const rugOffice = usePBR("fabric_pattern_07", 2.2, 1.6);
  const porchTex = usePBR("concrete_floor_01", 1.4, 0.9);
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ ...wallTex, normalScale: new THREE.Vector2(0.5, 0.5) }),
    [wallTex]
  );

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(HOUSE.x1 + HOUSE.x2) / 2, 0.06, (HOUSE.z1 + HOUSE.z2) / 2]} receiveShadow>
        <planeGeometry args={[HOUSE.x2 - HOUSE.x1, HOUSE.z2 - HOUSE.z1]} />
        <meshStandardMaterial {...floorTex} envMapIntensity={0.35} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[(HOUSE.x1 + HOUSE.x2) / 2, HOUSE.wallH, (HOUSE.z1 + HOUSE.z2) / 2]}>
        <planeGeometry args={[HOUSE.x2 - HOUSE.x1, HOUSE.z2 - HOUSE.z1]} />
        <meshStandardMaterial color="#cfc6b4" emissive="#8a7c66" emissiveIntensity={0.45} roughness={1} />
      </mesh>
      {/* roof cap (seen from the street) */}
      <mesh position={[(HOUSE.x1 + HOUSE.x2) / 2, HOUSE.wallH + 0.8, (HOUSE.z1 + HOUSE.z2) / 2]}>
        <boxGeometry args={[HOUSE.x2 - HOUSE.x1 + 2, 1.6, HOUSE.z2 - HOUSE.z1 + 2]} />
        <meshStandardMaterial color="#241d16" roughness={1} />
      </mesh>

      {/* walls — derived from OPENINGS, so gaps are always where doors are */}
      {HOUSE_WALLS.map((a, i) => (
        <Wall key={i} a={a} mat={wallMat} />
      ))}

      {/* opening trim — headers + jambs make every passage read as built */}
      <OpeningTrim cx={695.4} cz={339} w={2.85} along="x" /> {/* office door */}
      <OpeningTrim cx={704} cz={347} w={6} along="z" /> {/* dining ↔ living arch */}
      <OpeningTrim cx={712.5} cz={339} w={5} along="x" /> {/* kitchen ↔ living arch */}
      <OpeningTrim cx={713.4} cz={356} w={2.85} along="x" /> {/* front door */}

      {/* frosted windows — the city is a sound, not a view */}
      <Frosted x={695} z={HOUSE.z1 + 0.28} w={4.2} axis="x" /> {/* office, behind the monitor */}
      <Frosted x={HOUSE.x1 + 0.28} z={335} w={4.5} axis="z" />
      <Frosted x={HOUSE.x1 + 0.28} z={343.5} w={4.2} axis="z" bright={0.8} />
      <Frosted x={717.5} z={HOUSE.z1 + 0.28} w={4.2} axis="x" bright={0.9} /> {/* kitchen, over the sink */}
      <Frosted x={HOUSE.x2 - 0.28} z={353} w={3.6} axis="z" bright={1.1} /> {/* living */}
      <Frosted x={718} z={HOUSE.z2 - 0.28} w={4.2} axis="x" bright={0.9} /> {/* living, south */}

      {/* doors — panels exactly fill their gaps */}
      <DoorMesh d={DOORS[0]} />
      <DoorMesh d={DOORS[1]} front />

      {/* -------- OFFICE: the relic room -------- */}
      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[695, 0.1, 332.5]}>
        <planeGeometry args={[10, 7]} />
        <meshStandardMaterial {...rugOffice} color="#8a8078" />
      </mesh>
      {/* the desk (1.8 m x 0.8 m, 30" tall; monitor faces the seat) */}
      <group>
        <mesh position={[695, 2.25, 327.9]} castShadow>
          <boxGeometry args={[5.4, 0.12, 2.4]} />
          <meshStandardMaterial color="#4a3a2c" roughness={0.5} />
        </mesh>
        {[[-2.5, -0.9], [2.5, -0.9], [-2.5, 0.9], [2.5, 0.9]].map(([dx, dz], i) => (
          <mesh key={i} position={[695 + dx, 1.1, 327.9 + dz]}>
            <boxGeometry args={[0.14, 2.2, 0.14]} />
            <meshStandardMaterial color="#2e2620" roughness={0.8} />
          </mesh>
        ))}
        {/* monitor — a 40" panel on a stand */}
        <mesh position={[695, 2.5, 328.0]}>
          <boxGeometry args={[0.5, 0.45, 0.3]} />
          <meshStandardMaterial color="#181b20" roughness={0.4} />
        </mesh>
        <mesh position={[SCREEN.cx, SCREEN.cy, SCREEN.cz - 0.08]}>
          <boxGeometry args={[SCREEN.hw * 2 + 0.16, SCREEN.hh * 2 + 0.16, 0.12]} />
          <meshStandardMaterial color="#0c0e12" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* keyboard + mouse + gold mug */}
        <mesh position={[694.8, 2.35, 329.2]}>
          <boxGeometry args={[1.6, 0.07, 0.55]} />
          <meshStandardMaterial color="#22262e" roughness={0.7} />
        </mesh>
        <mesh position={[696.2, 2.34, 329.25]}>
          <boxGeometry args={[0.25, 0.09, 0.4]} />
          <meshStandardMaterial color="#22262e" roughness={0.6} />
        </mesh>
        <mesh position={[696.9, 2.52, 328.6]}>
          <cylinderGeometry args={[0.18, 0.16, 0.42, 10]} />
          <meshStandardMaterial color="#c8a24b" roughness={0.4} />
        </mesh>
        {/* desk lamp — a real one */}
        <Model slug="desk_lamp_arm_01" position={[697.4, 2.32, 327.4]} rotation={[0, -0.7, 0]} scale={1.0} />
        {/* task chair */}
        <mesh position={[695, 1.45, 330.4]}>
          <boxGeometry args={[1.5, 0.14, 1.5]} />
          <meshStandardMaterial color="#1c1f26" roughness={0.7} />
        </mesh>
        <mesh position={[695, 2.55, 331.1]}>
          <boxGeometry args={[1.5, 2.0, 0.16]} />
          <meshStandardMaterial color="#1c1f26" roughness={0.7} />
        </mesh>
        <mesh position={[695, 0.72, 330.4]}>
          <cylinderGeometry args={[0.09, 0.09, 1.45, 6]} />
          <meshStandardMaterial color="#0e1014" />
        </mesh>
        <mesh position={[695, 0.06, 330.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.75, 10]} />
          <meshStandardMaterial color="#0e1014" />
        </mesh>
        {/* bin */}
        <mesh position={[698.6, 0.66, 327.8]}>
          <cylinderGeometry args={[0.4, 0.33, 1.3, 10]} />
          <meshStandardMaterial color="#2c2620" roughness={0.8} />
        </mesh>
      </group>
      {/* the relics — REAL archive images, flush on the wall faces (center 5'4") */}
      <Framed src="/archive/web/sfMnAGTnE16cKd9nm8suW4wk.jpg" x={690.3} y={4.9} z={326.3} w={3.4} h={2.3} />
      <Framed src="/archive/web/ILQgtzAfoB1DMrSNqEKzs19bQ.jpg" x={699.7} y={4.9} z={326.3} w={3.4} h={2.3} />
      <Framed src="/archive/web/drPyB0qigdiXyCjHkK3HdKQsuE.jpg" x={703.72} y={4.7} z={331} w={2.8} h={2.8} ry={-Math.PI / 2} />
      <Framed src="/archive/web/dPjaqyIJCrIhH7ybw1Id4MdMDzs.jpg" x={703.72} y={4.7} z={336} w={3.4} h={1.8} ry={-Math.PI / 2} />
      {/* poster tubes in the corner */}
      <group position={[687.6, 0, 337.6]}>
        {[0, 0.5, 0.95].map((dx, i) => (
          <mesh key={i} position={[dx, 1.35, 0]} rotation={[0, 0, 0.14 - i * 0.09]}>
            <cylinderGeometry args={[0.16, 0.16, 2.7, 8]} />
            <meshStandardMaterial color={["#8a7a5a", "#6a5a4a", "#7a6a55"][i]} roughness={0.9} />
          </mesh>
        ))}
      </group>
      {/* bookshelf on the west wall — flag + Nikon */}
      <Shelf x={686.85} z={331} ry={Math.PI / 2} />

      {/* -------- DINING -------- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[695, 0.09, 347.5]}>
        <planeGeometry args={[8.5, 6.5]} />
        <meshStandardMaterial {...rugDining} color="#a89486" />
      </mesh>
      {/* table 63" x 35", top 29" */}
      <Model slug="wooden_table_02" position={[695, 0.1, 347.5]} scale={[4.2, 3.1, 3.8]} />
      <Model slug="dining_chair_02" position={[693.6, 0.08, 345.2]} rotation={[0, 0.1, 0]} scale={2.9} />
      <Model slug="dining_chair_02" position={[696.4, 0.08, 345.2]} rotation={[0, -0.07, 0]} scale={2.9} />
      <Model slug="dining_chair_02" position={[693.6, 0.08, 349.8]} rotation={[0, Math.PI + 0.05, 0]} scale={2.9} />
      <Model slug="dining_chair_02" position={[696.4, 0.08, 349.8]} rotation={[0, Math.PI - 0.12, 0]} scale={2.9} />
      <HangingLamp x={695} z={347.5} ceiling={HOUSE.wallH} scale={1.3} intensity={22} />
      <Sideboard x={686.95} z={351} />
      <Model slug="potted_plant_02" position={[686.95, 2.62, 349.6]} scale={1.2} shadow={false} />
      <Framed src="/archive/web/lUfbKLTE61YByqT1TJBRTeMjA.jpg" x={686.3} y={5.1} z={351} w={3.2} h={2.1} ry={Math.PI / 2} />

      {/* -------- LIVING -------- */}
      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[716, 0.1, 347.5]}>
        <planeGeometry args={[10.5, 8]} />
        <meshStandardMaterial {...rugLiving} />
      </mesh>
      {/* TV console (6' x 16") + 65" TV on the east wall */}
      <mesh position={[721.15, 0.75, 347.5]} castShadow>
        <boxGeometry args={[1.2, 1.5, 5.4]} />
        <meshStandardMaterial color="#3a2c1f" roughness={0.6} />
      </mesh>
      <mesh position={[721.62, 3.7, 347.5]}>
        <boxGeometry args={[0.15, 2.5, 4.35]} />
        <meshStandardMaterial color="#0c0e12" roughness={0.2} />
      </mesh>
      <mesh position={[721.52, 3.7, 347.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[4.15, 2.3]} />
        <meshStandardMaterial color="#131824" emissive="#22344a" emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      {/* soundbar */}
      <mesh position={[720.85, 1.62, 347.5]}>
        <boxGeometry args={[0.35, 0.22, 3.4]} />
        <meshStandardMaterial color="#15181d" roughness={0.6} />
      </mesh>
      {/* sofa faces the TV; coffee table between */}
      <Model slug="sofa_02" position={[713.5, 0.08, 347.5]} rotation={[0, Math.PI / 2, 0]} scale={3.6} />
      <mesh position={[713.1, 1.75, 345.6]} rotation={[0.15, 0.9, 0.1]} castShadow>
        <boxGeometry args={[1.1, 0.95, 0.4]} />
        <meshStandardMaterial color="#8f6c58" roughness={1} />
      </mesh>
      <mesh position={[713.1, 1.75, 349.4]} rotation={[0.12, -1.2, -0.08]} castShadow>
        <boxGeometry args={[1.1, 0.95, 0.4]} />
        <meshStandardMaterial color="#3a4a5a" roughness={1} />
      </mesh>
      <Model slug="CoffeeTable_01" position={[717.5, 0.08, 347.5]} rotation={[0, Math.PI / 2, 0]} scale={2.6} />
      {/* remote + book on the table */}
      <mesh position={[717.1, 1.48, 347.9]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.6, 0.07, 0.24]} />
        <meshStandardMaterial color="#15181d" />
      </mesh>
      <mesh position={[718, 1.5, 347.0]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[1.0, 0.13, 1.35]} />
        <meshStandardMaterial color="#5a3a34" roughness={0.8} />
      </mesh>
      {/* armchair + side table complete the corner */}
      <Model slug="ArmChair_01" position={[714.6, 0.08, 342.3]} rotation={[0, 2.4, 0]} scale={3.2} />
      <Model slug="Ottoman_01" position={[716.9, 0.08, 343.4]} rotation={[0, 0.8, 0]} scale={2.8} />
      <Model slug="side_table_01" position={[712.7, 0.08, 351.9]} scale={2.6} />
      <Model slug="potted_plant_02" position={[712.7, 1.5, 351.9]} scale={1.1} shadow={false} />
      {/* the photo wall — on the arch wall, facing the living room */}
      <Framed src="/archive/web/RAOF0jiw87qsIU7GR1OeKHsHEs.jpg" x={704.28} y={4.8} z={341.8} w={3.3} h={2.25} ry={Math.PI / 2} />
      <Framed src="/framer/cms/downloads/xenomorph-typeface__image.png" x={704.28} y={4.6} z={352.6} w={2.4} h={2.1} ry={Math.PI / 2} />
      <FloorLamp x={705.4} z={354.5} />
      <Model slug="potted_plant_01" position={[720.6, 0.08, 354.6]} scale={2.6} shadow={false} />

      {/* -------- ENTRY (inside the front door) -------- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[713.4, 0.09, 354.6]}>
        <planeGeometry args={[3.2, 2.2]} />
        <meshStandardMaterial color="#3e332a" roughness={1} />
      </mesh>
      <CoatRack x={710.6} z={354.4} />

      {/* -------- KITCHEN -------- */}
      <Kitchen />

      {/* -------- lighting: 6 real lights total, fixtures for the rest -------- */}
      <CeilingLight x={695} z={333} intensity={32} />
      <CeilingLight x={716} z={347.5} intensity={30} />
      <CeilingLight x={695} z={351.5} intensity={18} />

      {/* -------- porch -------- */}
      <mesh position={[713.4, 0.17, 357.4]} receiveShadow>
        <boxGeometry args={[4.5, 0.35, 2.6]} />
        <meshStandardMaterial {...porchTex} />
      </mesh>
      <mesh position={[713.4, 0.06, 359.1]}>
        <boxGeometry args={[3.5, 0.12, 1.1]} />
        <meshStandardMaterial color="#4c463e" roughness={0.9} />
      </mesh>
      {/* doormat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[713.4, 0.36, 357.2]}>
        <planeGeometry args={[2.2, 1.3]} />
        <meshStandardMaterial color="#6a5a44" roughness={1} />
      </mesh>
      {/* -------- yard -------- */}
      {/* lawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[704, 0.04, 361.5]}>
        <planeGeometry args={[42, 13]} />
        <meshStandardMaterial color="#4a5638" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[684.5, 0.04, 341]}>
        <planeGeometry args={[5, 34]} />
        <meshStandardMaterial color="#4a5638" roughness={1} />
      </mesh>
      {/* path: porch → street */}
      <mesh position={[713.4, 0.07, 363.6]}>
        <boxGeometry args={[2.1, 0.08, 8]} />
        <meshStandardMaterial color="#6a655c" roughness={0.9} />
      </mesh>
      {/* driveway */}
      <mesh position={[718.6, 0.06, 362.8]}>
        <boxGeometry args={[7.5, 0.07, 12.5]} />
        <meshStandardMaterial color="#55504a" roughness={0.95} />
      </mesh>
      {/* mailbox at the curb */}
      <group position={[708.5, 0, 366.5]}>
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.18, 3.2, 0.18]} />
          <meshStandardMaterial color="#3a2c1f" />
        </mesh>
        <mesh position={[0, 3.35, 0]}>
          <boxGeometry args={[0.75, 0.7, 1.4]} />
          <meshStandardMaterial color="#2c3440" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0.42, 3.42, 0.55]}>
          <boxGeometry args={[0.06, 0.35, 0.1]} />
          <meshStandardMaterial color="#c8a24b" metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
      {/* porch light beside the door */}
      <mesh position={[715.4, 5.6, 356.35]}>
        <sphereGeometry args={[0.24, 8, 8]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>
      <pointLight position={[713.4, 5, 358]} color="#ffd9a0" intensity={16} distance={16} decay={1.8} />
    </group>
  );
}
