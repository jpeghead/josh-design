"use client";

/**
 * WEAPONS — the something-to-do layer. Two slots in the 90s-FPS spirit,
 * all original low-poly work per STYLE.md:
 *   1 — the X-Acto (a designer's melee)
 *   2 — the pistol (boxy 90s semi-auto)
 * Hitscan with tracers, impact puffs, synthesized foley, and a steel-plate
 * RIFLE RANGE at THE BASE that tips targets and keeps score.
 *
 * No imports from game.tsx (avoids cycles): game code drives this module
 * through WEAPON/FIRE and reads RANGE_SCORE back for the HUD.
 */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider, useRapier } from "@react-three/rapier";
import { retroConcrete, retroWood } from "./retro";
import { sfxShot, sfxSwing, sfxPlate } from "./ambience";

/* ------------------------------------------------------------- state */

export const WEAPON = {
  slot: 0 as 0 | 1 | 2, // 0 holstered · 1 knife · 2 pistol
  cool: 0, // seconds until next shot
  swing: 0, // knife swing anim 1→0
  recoil: 0, // pistol recoil anim 1→0
  flashUntil: 0, // muzzle flash cutoff (performance.now ms)
};

/** set by the DOM click handler; consumed by <Shooter> on the next frame */
export const FIRE = { pending: false };

export const RANGE = { x: 580, z: 726 };
export const RANGE_SCORE = { hits: 0, streak: 0, best: 0 };

type Plate = { x: number; z: number; downUntil: number };
const TARGETS: Plate[] = [
  { x: 566, z: 714, downUntil: 0 },
  { x: 573, z: 710, downUntil: 0 },
  { x: 580, z: 708, downUntil: 0 },
  { x: 587, z: 710, downUntil: 0 },
  { x: 594, z: 714, downUntil: 0 },
];
const PLATE_Y = 4.55; // plate center height — flat eye-height fire connects
const PLATE_R = 1.15;

/* ---------------------------------------------------------------- FX */

const FX: {
  tracer: ((a: THREE.Vector3, b: THREE.Vector3) => void) | null;
  puff: ((p: THREE.Vector3) => void) | null;
} = { tracer: null, puff: null };

function puffTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(16, 16, 2, 16, 16, 15);
  grad.addColorStop(0, "rgba(220,210,190,0.85)");
  grad.addColorStop(1, "rgba(220,210,190,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

/** pooled tracers + impact puffs — no allocation at fire time */
export function ShotFX() {
  const puffTex = useMemo(puffTexture, []);
  const tracers = useRef<{ line: THREE.Line; until: number }[]>([]);
  const puffs = useRef<{ spr: THREE.Sprite; until: number }[]>([]);
  const group = useRef<THREE.Group>(null!);
  const nextT = useRef(0);
  const nextP = useRef(0);

  const pool = useMemo(() => {
    const g = new THREE.Group();
    const ts: { line: THREE.Line; until: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const mat = new THREE.LineBasicMaterial({ color: "#ffe2a8", transparent: true, opacity: 0 });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      g.add(line);
      ts.push({ line, until: 0 });
    }
    const ps: { spr: THREE.Sprite; until: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.SpriteMaterial({ map: puffTex, transparent: true, opacity: 0, depthWrite: false });
      const spr = new THREE.Sprite(mat);
      spr.scale.setScalar(0.001);
      g.add(spr);
      ps.push({ spr, until: 0 });
    }
    tracers.current = ts;
    puffs.current = ps;
    return g;
  }, [puffTex]);

  useMemo(() => {
    FX.tracer = (a, b) => {
      const slot = tracers.current[nextT.current++ % tracers.current.length];
      const pos = slot.line.geometry.getAttribute("position") as THREE.BufferAttribute;
      pos.setXYZ(0, a.x, a.y, a.z);
      pos.setXYZ(1, b.x, b.y, b.z);
      pos.needsUpdate = true;
      (slot.line.material as THREE.LineBasicMaterial).opacity = 0.9;
      slot.until = performance.now() + 70;
    };
    FX.puff = (p) => {
      const slot = puffs.current[nextP.current++ % puffs.current.length];
      slot.spr.position.copy(p);
      slot.spr.scale.setScalar(0.4);
      (slot.spr.material as THREE.SpriteMaterial).opacity = 0.85;
      slot.until = performance.now() + 260;
    };
  }, []);

  useFrame(() => {
    const now = performance.now();
    for (const t of tracers.current) {
      const m = t.line.material as THREE.LineBasicMaterial;
      if (now > t.until) m.opacity = 0;
    }
    for (const p of puffs.current) {
      const m = p.spr.material as THREE.SpriteMaterial;
      if (now > p.until) {
        m.opacity = 0;
      } else if (m.opacity > 0) {
        p.spr.scale.multiplyScalar(1.09);
        m.opacity *= 0.86;
      }
    }
  });

  return <primitive ref={group} object={pool} />;
}

/* ------------------------------------------------------------ shooter */

const rayOrigin = new THREE.Vector3();
const rayDir = new THREE.Vector3();
const hitPoint = new THREE.Vector3();
const muzzle = new THREE.Vector3();
const tmpV = new THREE.Vector3();

/** consumes FIRE.pending: raycast, plates, fx, foley, cooldowns */
export function Shooter() {
  const { world, rapier } = useRapier();

  useFrame(({ camera }, dt) => {
    WEAPON.cool = Math.max(0, WEAPON.cool - dt);
    WEAPON.swing = Math.max(0, WEAPON.swing - dt * 3.2);
    WEAPON.recoil = Math.max(0, WEAPON.recoil - dt * 5);

    if (!FIRE.pending) return;
    FIRE.pending = false;
    if (WEAPON.slot === 0 || WEAPON.cool > 0) return;

    camera.getWorldDirection(rayDir);
    rayOrigin.copy(camera.position).addScaledVector(rayDir, 1.3); // clear own capsule
    const reach = WEAPON.slot === 1 ? 2.6 : 400;

    // world hit via physics
    const ray = new rapier.Ray(
      { x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z },
      { x: rayDir.x, y: rayDir.y, z: rayDir.z }
    );
    const hit = world.castRay(ray, reach, true);
    const worldT = hit ? hit.timeOfImpact : Infinity;

    // steel plates (analytic spheres, nearest first)
    const now = performance.now();
    let plateT = Infinity;
    let plateIdx = -1;
    TARGETS.forEach((p, i) => {
      if (p.downUntil > now) return;
      tmpV.set(p.x, PLATE_Y, p.z).sub(rayOrigin);
      const t = tmpV.dot(rayDir);
      if (t < 0 || t > reach || t > worldT + 0.4) return;
      const d2 = tmpV.lengthSq() - t * t;
      if (d2 < PLATE_R * PLATE_R && t < plateT) {
        plateT = t;
        plateIdx = i;
      }
    });

    if (WEAPON.slot === 1) {
      WEAPON.cool = 0.45;
      WEAPON.swing = 1;
      sfxSwing();
    } else {
      WEAPON.cool = 0.33;
      WEAPON.recoil = 1;
      WEAPON.flashUntil = now + 55;
      sfxShot();
      // tracer from roughly the muzzle
      muzzle
        .copy(camera.position)
        .addScaledVector(rayDir, 1.6)
        .addScaledVector(tmpV.crossVectors(rayDir, camera.up).normalize(), 0.3);
      muzzle.y -= 0.22;
      const endT = Math.min(plateT, worldT, reach);
      hitPoint.copy(rayOrigin).addScaledVector(rayDir, Number.isFinite(endT) ? endT : reach);
      FX.tracer?.(muzzle, hitPoint);
    }

    if (plateIdx >= 0 && plateT <= worldT + 0.4) {
      TARGETS[plateIdx].downUntil = now + 2600;
      RANGE_SCORE.hits += 1;
      RANGE_SCORE.streak += 1;
      RANGE_SCORE.best = Math.max(RANGE_SCORE.best, RANGE_SCORE.streak);
      sfxPlate();
      FX.puff?.(tmpV.set(TARGETS[plateIdx].x, PLATE_Y, TARGETS[plateIdx].z));
    } else {
      // a miss at the range resets the streak
      const dx = rayOrigin.x - RANGE.x;
      const dz = rayOrigin.z - RANGE.z;
      if (dx * dx + dz * dz < 70 * 70) RANGE_SCORE.streak = 0;
      if (hit && Number.isFinite(worldT) && worldT <= reach) {
        hitPoint.copy(rayOrigin).addScaledVector(rayDir, worldT);
        FX.puff?.(hitPoint);
      }
    }
  });

  return null;
}

/* ---------------------------------------------------------- viewmodel */

/** camera-locked first-person weapon — runs after the Sim sets the camera */
export function ViewModel() {
  const rig = useRef<THREE.Group>(null!);
  const knife = useRef<THREE.Group>(null!);
  const pistol = useRef<THREE.Group>(null!);
  const flash = useRef<THREE.Mesh>(null!);

  useFrame(({ camera }) => {
    const g = rig.current;
    if (!g) return;
    g.position.copy(camera.position);
    g.quaternion.copy(camera.quaternion);
    const now = performance.now();

    if (knife.current) {
      knife.current.visible = WEAPON.slot === 1;
      const sw = WEAPON.swing;
      // arc: wind up fast, sweep left-down
      knife.current.rotation.set(-sw * 0.9, sw * 1.1, sw * 0.35);
    }
    if (pistol.current) {
      pistol.current.visible = WEAPON.slot === 2;
      const rc = WEAPON.recoil;
      pistol.current.position.set(0.52, -0.44 + rc * 0.05, -1.05 + rc * 0.16);
      pistol.current.rotation.set(rc * 0.22, 0, 0);
    }
    if (flash.current) flash.current.visible = now < WEAPON.flashUntil;
  }, 1);

  return (
    <group ref={rig}>
      {/* ---- slot 1: the X-Acto ---- */}
      <group ref={knife} position={[0.5, -0.42, -0.95]} visible={false}>
        {/* aluminum barrel */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.045, 0.05, 0.62, 6]} />
          <meshLambertMaterial color="#b9bdc2" />
        </mesh>
        {/* knurled collet */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.26]}>
          <cylinderGeometry args={[0.055, 0.038, 0.14, 6]} />
          <meshLambertMaterial color="#8a8d92" />
        </mesh>
        {/* blade */}
        <mesh position={[0, 0.012, -0.42]} rotation={[0.06, 0, 0]}>
          <boxGeometry args={[0.012, 0.09, 0.22]} />
          <meshLambertMaterial color="#e8eaec" />
        </mesh>
        {/* blade tip wedge */}
        <mesh position={[0, 0.03, -0.55]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.012, 0.05, 0.1]} />
          <meshLambertMaterial color="#e8eaec" />
        </mesh>
      </group>

      {/* ---- slot 2: the pistol ---- */}
      <group ref={pistol} position={[0.52, -0.44, -1.05]} visible={false}>
        {/* slide */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.11, 0.11, 0.66]} />
          <meshLambertMaterial color="#22262c" />
        </mesh>
        {/* frame */}
        <mesh position={[0, -0.045, 0.06]}>
          <boxGeometry args={[0.1, 0.08, 0.5]} />
          <meshLambertMaterial color="#31363e" />
        </mesh>
        {/* grip */}
        <mesh position={[0, -0.19, 0.24]} rotation={[0.32, 0, 0]}>
          <boxGeometry args={[0.095, 0.3, 0.14]} />
          <meshLambertMaterial color="#3d342a" />
        </mesh>
        {/* trigger guard */}
        <mesh position={[0, -0.12, 0.05]}>
          <boxGeometry args={[0.08, 0.02, 0.16]} />
          <meshLambertMaterial color="#22262c" />
        </mesh>
        {/* front sight */}
        <mesh position={[0, 0.12, -0.3]}>
          <boxGeometry args={[0.02, 0.03, 0.04]} />
          <meshLambertMaterial color="#171a1f" />
        </mesh>
        {/* muzzle flash */}
        <mesh ref={flash} position={[0, 0.05, -0.42]} visible={false}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial color="#ffd9a0" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------- range */

function rangeSignTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2c3038";
  g.fillRect(0, 0, 256, 64);
  g.strokeStyle = "#c8a24b";
  g.lineWidth = 4;
  g.strokeRect(4, 4, 248, 56);
  g.font = "900 30px Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#e8dcc4";
  g.fillText("RIFLE RANGE", 128, 33);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function PlateMesh({ p }: { p: Plate }) {
  const grp = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (!grp.current) return;
    const down = p.downUntil > performance.now();
    const target = down ? -1.45 : 0;
    grp.current.rotation.x += (target - grp.current.rotation.x) * Math.min(dt * 10, 1);
  });
  return (
    <group position={[p.x, 0, p.z]}>
      {/* post */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[0.16, 3.4, 0.16]} />
        <meshLambertMaterial color="#3d342a" />
      </mesh>
      {/* plate assembly hinges at post top */}
      <group ref={grp} position={[0, 3.4, 0]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[1.35, 1.5, 0.1]} />
          <meshLambertMaterial color="#9aa0a6" />
        </mesh>
        <mesh position={[0, 1.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.62, 0.62, 0.1, 14]} />
          <meshLambertMaterial color="#9aa0a6" />
        </mesh>
      </group>
    </group>
  );
}

/** the steel-plate range at THE BASE — free play, score in the HUD */
export function Range() {
  const pad = useMemo(() => retroConcrete(6, 5), []);
  const wood = useMemo(() => retroWood(4, 0.5), []);
  const sign = useMemo(rangeSignTexture, []);
  return (
    <group>
      {/* pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[RANGE.x, 0.06, RANGE.z]} receiveShadow>
        <planeGeometry args={[44, 40]} />
        <meshLambertMaterial map={pad} />
      </mesh>
      {/* back berm (north) + side berms */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[22, 3, 1.5]} position={[RANGE.x, 3, 704.5]} />
        <CuboidCollider args={[1.5, 2.5, 19]} position={[556, 2.5, 723]} />
        <CuboidCollider args={[1.5, 2.5, 19]} position={[604, 2.5, 723]} />
        <CuboidCollider args={[15, 1.35, 0.75]} position={[RANGE.x, 1.35, 740]} />
      </RigidBody>
      <mesh position={[RANGE.x, 3, 704.5]} castShadow>
        <boxGeometry args={[44, 6, 3]} />
        <meshLambertMaterial color="#5a5648" />
      </mesh>
      {[556, 604].map((bx) => (
        <mesh key={bx} position={[bx, 2.5, 723]} castShadow>
          <boxGeometry args={[3, 5, 38]} />
          <meshLambertMaterial color="#5a5648" />
        </mesh>
      ))}
      {/* firing bench */}
      <mesh position={[RANGE.x, 1.28, 740]} castShadow>
        <boxGeometry args={[30, 0.18, 1.5]} />
        <meshLambertMaterial map={wood} />
      </mesh>
      {[566, 580, 594].map((lx) => (
        <mesh key={lx} position={[lx, 0.6, 740]}>
          <boxGeometry args={[0.3, 1.2, 1.3]} />
          <meshLambertMaterial color="#3d342a" />
        </mesh>
      ))}
      {/* lane stripes */}
      {[566, 573, 580, 587, 594].map((lx) => (
        <mesh key={"l" + lx} rotation={[-Math.PI / 2, 0, 0]} position={[lx, 0.08, 733]}>
          <planeGeometry args={[0.3, 10]} />
          <meshBasicMaterial color="#c9b98a" />
        </mesh>
      ))}
      {/* sign on the back berm */}
      <mesh position={[RANGE.x, 7.2, 706.2]}>
        <planeGeometry args={[12, 3]} />
        <meshBasicMaterial map={sign} />
      </mesh>
      {/* plates */}
      {TARGETS.map((p, i) => (
        <PlateMesh key={i} p={p} />
      ))}
    </group>
  );
}
