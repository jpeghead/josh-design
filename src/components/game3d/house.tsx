"use client";

/**
 * THE HOUSE — a one-floor home in Cincinnati Hill, and the game's first act.
 *
 * You wake up at the desk in the OFFICE, surrounded by the relics of a life
 * (real images from the archive, framed). The windows are frosted — you hear
 * the city, you can't see it. The door is shut. The surprises are physical:
 * the office door opens → the HOUSE (living, dining, kitchen) → the front
 * door opens → WHITEHEAD CITY.
 *
 * Rooms (world coords):
 *   OFFICE  x[664,704] z[300,340]   KITCHEN x[704,744] z[300,340]
 *   DINING  x[664,704] z[340,384]   LIVING  x[704,744] z[340,384]
 * Front door on the south wall of the LIVING room.
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

export type Door = {
  id: string;
  hx: number; // hinge x
  hz: number; // hinge z
  axis: "x" | "z"; // wall direction the closed door lies along
  len: number;
  open: number; // 0 closed .. 1 open (animated)
  target: number;
  label: string;
};

/** Mutable door state — the Sim reads this for collision + interaction. */
export const DOORS: Door[] = [
  { id: "office", hx: 704, hz: 336.5, axis: "z", len: 7.5, open: 0, target: 0, label: "open the door" },
  { id: "front", hx: 728, hz: 384, axis: "x", len: 8, open: 0, target: 0, label: "the front door" },
];

/** wall segments as AABBs [x1,z1,x2,z2] — includes door gaps */
export const HOUSE_WALLS: [number, number, number, number][] = (() => {
  const { x1, z1, x2, z2, t } = HOUSE;
  const W: [number, number, number, number][] = [];
  const seg = (a: number, b: number, c: number, d: number) => W.push([a, b, c, d]);
  // outer north / west / east
  seg(x1, z1 - t, x2, z1);
  seg(x1 - t, z1 - t, x1, z2 + t);
  seg(x2, z1 - t, x2 + t, z2 + t);
  // outer south with front-door gap x[724,732]
  seg(x1, z2, 724, z2 + t);
  seg(732, z2, x2, z2 + t);
  // inner wall x=704 (office/kitchen | dining/living) with two gaps:
  //   office→kitchen z[316,324] archway, dining→living z[356,364] archway
  seg(704 - t / 2, z1, 704 + t / 2, 316);
  seg(704 - t / 2, 324, 704 + t / 2, 356);
  seg(704 - t / 2, 364, 704 + t / 2, z2);
  // inner wall z=340 (office|dining, kitchen|living) with gaps:
  //   office door x[684,691.5] (D office), kitchen→living archway x[720,728]
  seg(x1, 340 - t / 2, 684, 340 + t / 2);
  seg(691.5, 340 - t / 2, 720, 340 + t / 2);
  seg(728, 340 - t / 2, x2, 340 + t / 2);
  return W;
})();

/** dynamic blockers for closed doors */
export function doorBlockers(): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  for (const d of DOORS) {
    if (d.open > 0.65) continue;
    if (d.axis === "x") out.push([d.hx - d.len, d.hz - 0.7, d.hx, d.hz + 0.7]);
    else out.push([d.hx - 0.7, d.hz - d.len, d.hx + 0.7, d.hz + d.len * 0]);
  }
  // office door lies along z from hinge northward when closed
  return out.map((b, i) => (DOORS[i] && DOORS[i].axis === "z" ? [DOORS[i].hx - 0.7, DOORS[i].hz - DOORS[i].len, DOORS[i].hx + 0.7, DOORS[i].hz] : b));
}

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
    // grain flecks
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

/* ------------------------------------------------------------ elements */

function Wall({ a, mat }: { a: [number, number, number, number]; mat: THREE.Material }) {
  const [x1, z1, x2, z2] = a;
  return (
    <mesh position={[(x1 + x2) / 2, HOUSE.wallH / 2, (z1 + z2) / 2]} material={mat} castShadow receiveShadow>
      <boxGeometry args={[Math.max(x2 - x1, 0.4), HOUSE.wallH, Math.max(z2 - z1, 0.4)]} />
    </mesh>
  );
}

/** frosted window: glowing translucent pane set into a wall */
function Frosted({ x, z, w, axis, bright = 1 }: { x: number; z: number; w: number; axis: "x" | "z"; bright?: number }) {
  return (
    <group position={[x, 5.6, z]} rotation={[0, axis === "x" ? 0 : Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[w + 0.8, 4.6, 0.5]} />
        <meshStandardMaterial color="#2c2620" roughness={0.7} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, 3.9]} />
        <meshStandardMaterial
          color="#e8d9c2"
          emissive="#ffd9a6"
          emissiveIntensity={0.55 * bright}
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[w, 3.9]} />
        <meshBasicMaterial color="#fff4dd" transparent opacity={0.12} />
      </mesh>
      {/* mullions */}
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[0.18, 3.9, 0.06]} />
        <meshStandardMaterial color="#2c2620" />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[w, 0.18, 0.06]} />
        <meshStandardMaterial color="#2c2620" />
      </mesh>
      <pointLight position={[0, 0, axis === "x" ? -2 : 2]} color="#ffe6c2" intensity={9 * bright} distance={16} decay={1.8} />
    </group>
  );
}

/** framed picture with a REAL archive image */
function Framed({ src, x, y, z, w, h, ry = 0 }: { src: string; x: number; y: number; z: number; w: number; h: number; ry?: number }) {
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load(src);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [src]);
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[w + 0.5, h + 0.5, 0.16]} />
        <meshStandardMaterial color="#1e1a14" roughness={0.5} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.6} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.12} />
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

function DoorMesh({ d }: { d: Door }) {
  const grp = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    d.open += (d.target - d.open) * Math.min(dt * 4.5, 1);
    if (grp.current) grp.current.rotation.y = (d.axis === "x" ? 1 : -1) * d.open * Math.PI * 0.52;
  });
  return (
    <group position={[d.hx, 0, d.hz]}>
      <group ref={grp}>
        <mesh position={d.axis === "x" ? [-d.len / 2, 4.6, 0] : [0, 4.6, -d.len / 2]} castShadow>
          <boxGeometry args={d.axis === "x" ? [d.len, 9.2, 0.35] : [0.35, 9.2, d.len]} />
          <meshStandardMaterial color="#4a3626" roughness={0.55} />
        </mesh>
        {/* handle */}
        <mesh position={d.axis === "x" ? [-d.len + 0.7, 4.6, 0.3] : [0.3, 4.6, -d.len + 0.7]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#c8a24b" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
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
      {/* books — one gold spine */}
      {[-2.2, -1.6, -1.0, -0.4, 0.4, 1.2].map((dx, i) => (
        <mesh key={i} position={[dx, 4.2 + (i % 2) * 0.06, 0.35]}>
          <boxGeometry args={[0.42, 1.5 - (i % 3) * 0.14, 0.9]} />
          <meshStandardMaterial color={i === 3 ? "#c8a24b" : ["#5a3a34", "#3a4a5a", "#4a4238", "#5c5245", "#374238"][i % 5]} roughness={0.7} />
        </mesh>
      ))}
      {/* the Nikon on the top shelf */}
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

function Kitchen() {
  return (
    <group>
      {/* counters along north + east */}
      <mesh position={[724, 1.8, 303.5]} castShadow>
        <boxGeometry args={[38, 3.6, 5]} />
        <meshStandardMaterial color="#4c443a" roughness={0.6} />
      </mesh>
      <mesh position={[724, 3.65, 303.5]}>
        <boxGeometry args={[38, 0.25, 5.3]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.25} />
      </mesh>
      {/* fridge */}
      <mesh position={[740, 4.4, 312]} castShadow>
        <boxGeometry args={[4.6, 8.8, 4.6]} />
        <meshStandardMaterial color="#b9bdc2" roughness={0.35} metalness={0.5} />
      </mesh>
      {/* kids' drawings taped to the fridge */}
      <Framed src="/framer/cms/blog/do-i-still-care-about-this__image.jpeg" x={737.6} y={5.4} z={312} w={1.6} h={1.2} ry={-Math.PI / 2} />
      {/* island */}
      <mesh position={[722, 1.7, 320]} castShadow>
        <boxGeometry args={[10, 3.4, 5]} />
        <meshStandardMaterial color="#4c443a" roughness={0.6} />
      </mesh>
      <mesh position={[722, 3.55, 320]}>
        <boxGeometry args={[10.4, 0.25, 5.4]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.25} />
      </mesh>
      {/* gold mug on the island */}
      <mesh position={[724, 4.0, 320.6]}>
        <cylinderGeometry args={[0.32, 0.28, 0.6, 10]} />
        <meshStandardMaterial color="#c8a24b" roughness={0.4} />
      </mesh>
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

      {/* walls */}
      {HOUSE_WALLS.map((a, i) => (
        <Wall key={i} a={a} mat={wallMat} />
      ))}
      {/* baseboard AO strips along main walls */}
      <AO x={684} z={302.5} w={38} d={4} />
      <AO x={684} z={338} w={38} d={4} />
      <AO x={666.5} z={320} w={4} d={36} />
      <AO x={724} z={381.5} w={38} d={4} />
      <AO x={741.5} z={362} w={4} d={40} />

      {/* frosted windows — the city is a sound, not a view */}
      <Frosted x={HOUSE.x1 + 0.1} z={318} w={7} axis="z" />
      <Frosted x={HOUSE.x1 + 0.1} z={362} w={7} axis="z" bright={0.8} />
      <Frosted x={722} z={HOUSE.z1 + 0.1} w={8} axis="x" bright={0.9} />
      <Frosted x={HOUSE.x2 - 0.1} z={352} w={8} axis="z" bright={1.1} />

      {/* doors */}
      {DOORS.map((d) => (
        <DoorMesh key={d.id} d={d} />
      ))}

      {/* -------- OFFICE: the relic room -------- */}
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
      </group>
      {/* the relics — REAL archive images on the office walls */}
      <Framed src="/archive/web/sfMnAGTnE16cKd9nm8suW4wk.jpg" x={672} y={6.2} z={301} w={4.6} h={3.1} />
      <Framed src="/archive/web/ILQgtzAfoB1DMrSNqEKzs19bQ.jpg" x={696} y={6.2} z={301} w={4.6} h={3.1} />
      <Framed src="/archive/web/drPyB0qigdiXyCjHkK3HdKQsuE.jpg" x={702.9} y={5.8} z={318} w={3.4} h={3.4} ry={-Math.PI / 2} />
      <Framed src="/archive/web/dPjaqyIJCrIhH7ybw1Id4MdMDzs.jpg" x={702.9} y={5.6} z={328} w={4.8} h={2.5} ry={-Math.PI / 2} />
      {/* poster tubes in the corner + scooter against the wall */}
      <group position={[667, 0, 334]}>
        {[0, 0.9, 1.7].map((dx, i) => (
          <mesh key={i} position={[dx, 3.1, 0]} rotation={[0, 0, 0.16 - i * 0.1]}>
            <cylinderGeometry args={[0.34, 0.34, 6.2, 8]} />
            <meshStandardMaterial color={["#8a7a5a", "#6a5a4a", "#7a6a55"][i]} roughness={0.9} />
          </mesh>
        ))}
      </group>
      <Shelf x={676} z={302.4} />

      {/* -------- LIVING -------- */}
      <Couch x={724} z={376} ry={Math.PI} />
      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[724, 0.1, 364]}>
        <planeGeometry args={[16, 11]} />
        <meshStandardMaterial color="#7a5a4a" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[724, 0.12, 364]}>
        <planeGeometry args={[14.6, 9.6]} />
        <meshStandardMaterial color="#8f6c58" roughness={1} />
      </mesh>
      {/* TV on console */}
      <mesh position={[724, 1.4, 344]} castShadow>
        <boxGeometry args={[10, 1.6, 2.4]} />
        <meshStandardMaterial color="#3a2c1f" roughness={0.6} />
      </mesh>
      <mesh position={[724, 5.2, 343.4]}>
        <boxGeometry args={[9.4, 5.2, 0.4]} />
        <meshStandardMaterial color="#0c0e12" roughness={0.2} />
      </mesh>
      <mesh position={[724, 5.2, 343.65]}>
        <planeGeometry args={[8.8, 4.6]} />
        <meshStandardMaterial color="#131824" emissive="#22344a" emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      {/* family photo wall — Spin era + the boys' art */}
      <Framed src="/archive/web/RAOF0jiw87qsIU7GR1OeKHsHEs.jpg" x={712} y={6.4} z={382.9} w={4.4} h={3} ry={Math.PI} />
      <Framed src="/framer/cms/downloads/xenomorph-typeface__image.png" x={736} y={6.4} z={382.9} w={3.4} h={3} ry={Math.PI} />

      {/* -------- DINING -------- */}
      <Table x={684} z={362} w={10} d={6} />
      <ChairS x={680} z={357.5} ry={0} />
      <ChairS x={688} z={357.5} ry={0} />
      <ChairS x={680} z={366.5} ry={Math.PI} />
      <ChairS x={688} z={366.5} ry={Math.PI} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[684, 0.1, 362]}>
        <planeGeometry args={[15, 11]} />
        <meshStandardMaterial color="#5a4a44" roughness={1} />
      </mesh>

      {/* -------- KITCHEN -------- */}
      <Kitchen />

      {/* -------- practicals: warm home lighting -------- */}
      <pointLight position={[684, 9.2, 318]} color="#ffd9a6" intensity={42} distance={30} decay={1.9} />
      <pointLight position={[684, 9.2, 362]} color="#ffd9a6" intensity={34} distance={28} decay={1.9} />
      <pointLight position={[724, 9.2, 320]} color="#fff0d8" intensity={34} distance={28} decay={1.9} />
      <pointLight position={[724, 9.2, 364]} color="#ffd9a6" intensity={40} distance={30} decay={1.9} />
      {/* desk lamp — the warm heart of the office */}
      <pointLight position={[688, 4.6, 309]} color="#ffca7a" intensity={16} distance={14} decay={1.8} />
      {/* porch light outside the front door */}
      <pointLight position={[728, 6, 388]} color="#ffd9a0" intensity={20} distance={20} decay={1.8} />
      <mesh position={[731.4, 7.2, 384.6]}>
        <sphereGeometry args={[0.36, 8, 8]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>
    </group>
  );
}
