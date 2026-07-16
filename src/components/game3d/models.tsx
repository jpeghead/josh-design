"use client";

/**
 * CC0 asset layer — Poly Haven models (public/models) and PBR texture sets
 * (public/textures), downloaded into the repo so the game is self-contained.
 *
 * World scale: ~3 units per meter (player eye = 5.0 ≈ 1.65 m).
 */

import { useMemo } from "react";
import * as THREE from "three";
import { Clone, useGLTF, useTexture } from "@react-three/drei";
import { retrofitModel } from "./retro";

const gltfPath = (slug: string) => `/models/${slug}/${slug}_1k.gltf`;

/** a Poly Haven model instance — deep-cloned so it can repeat freely */
export function Model({
  slug,
  position,
  rotation = [0, 0, 0],
  scale = 3,
  shadow = true,
}: {
  slug: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  /** heavy meshes (plants) skip shadow casting — big win per frame */
  shadow?: boolean;
}) {
  const { scene } = useGLTF(gltfPath(slug));
  const retro = useMemo(() => retrofitModel(scene), [scene]);
  return (
    <Clone
      object={retro}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={shadow}
      receiveShadow
    />
  );
}

/** hanging lamp model + the light it casts (model top touches the ceiling) */
export function HangingLamp({
  x,
  z,
  ceiling = 8.7,
  scale = 1.3,
  intensity = 20,
  lit = true,
}: {
  x: number;
  z: number;
  ceiling?: number;
  scale?: number;
  intensity?: number;
  /** unlit fixtures still glow at the bulb but cast no real light */
  lit?: boolean;
}) {
  // modern_ceiling_lamp_01 geometry spans y 0.22..1.17 in meters
  const y = ceiling - 1.17 * scale;
  return (
    <group position={[x, y, z]}>
      <Model slug="modern_ceiling_lamp_01" position={[0, 0, 0]} scale={scale} />
      <mesh position={[0, 0.34 * scale, 0]}>
        <sphereGeometry args={[0.09 * scale, 8, 8]} />
        <meshBasicMaterial color="#ffe0ae" toneMapped={false} />
      </mesh>
      {lit && (
        <pointLight position={[0, 0.2 * scale, 0]} color="#ffd9a6" intensity={intensity} distance={18} decay={1.9} />
      )}
    </group>
  );
}

/**
 * A configured PBR texture set. Textures are cloned per call so each surface
 * can carry its own repeat without fighting the loader cache.
 */
export function usePBR(slug: string, repeatX: number, repeatY: number) {
  const tex = useTexture({
    map: `/textures/${slug}/${slug}_diff_1k.jpg`,
    normalMap: `/textures/${slug}/${slug}_nor_gl_1k.jpg`,
    roughnessMap: `/textures/${slug}/${slug}_rough_1k.jpg`,
    aoMap: `/textures/${slug}/${slug}_ao_1k.jpg`,
  });
  return useMemo(() => {
    const out: Record<string, THREE.Texture> = {};
    for (const [key, t] of Object.entries(tex)) {
      const c = (t as THREE.Texture).clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(repeatX, repeatY);
      c.anisotropy = 8;
      c.channel = 0; // reuse the base uv set (planes/boxes have only one)
      if (key === "map") c.colorSpace = THREE.SRGBColorSpace;
      c.needsUpdate = true;
      out[key] = c;
    }
    return out as {
      map: THREE.Texture;
      normalMap: THREE.Texture;
      roughnessMap: THREE.Texture;
      aoMap: THREE.Texture;
    };
  }, [tex, repeatX, repeatY]);
}

// preload EVERYTHING the house uses — the loading gate waits on these,
// so nothing pops in after the world is visible
for (const slug of [
  "sofa_02",
  "ArmChair_01",
  "Ottoman_01",
  "CoffeeTable_01",
  "side_table_01",
  "wooden_table_02",
  "dining_chair_02",
  "potted_plant_01",
  "potted_plant_02",
  "modern_ceiling_lamp_01",
  "desk_lamp_arm_01",
  "electric_stove",
]) {
  useGLTF.preload(gltfPath(slug));
}
