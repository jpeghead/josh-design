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

const gltfPath = (slug: string) => `/models/${slug}/${slug}_1k.gltf`;

/** a Poly Haven model instance — deep-cloned so it can repeat freely */
export function Model({
  slug,
  position,
  rotation = [0, 0, 0],
  scale = 3,
}: {
  slug: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  const { scene } = useGLTF(gltfPath(slug));
  return (
    <Clone
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
    />
  );
}

/** hanging lamp model + the light it casts (model top touches the ceiling) */
export function HangingLamp({
  x,
  z,
  ceiling = 10.5,
  scale = 2.6,
  intensity = 20,
}: {
  x: number;
  z: number;
  ceiling?: number;
  scale?: number;
  intensity?: number;
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
      <pointLight position={[0, 0.2 * scale, 0]} color="#ffd9a6" intensity={intensity} distance={22} decay={1.9} />
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

useGLTF.preload(gltfPath("sofa_02"));
useGLTF.preload(gltfPath("wooden_table_02"));
useGLTF.preload(gltfPath("dining_chair_02"));
