"use client";

/**
 * A life in particles. Four real photographs (the school photo, the Marine,
 * the shipped product, the city built with an agent) are sampled into one
 * GPU point cloud of ~65k particles. A vertex shader morphs every particle
 * between the stages with a per-point stagger, lifts it by luminance, and
 * pushes it away from the pointer. Fragment shader draws soft discs.
 *
 * No library effects: two shaders, four textures, one draw call.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export const STAGES = [
  { src: "/img/particles/kid.jpg", label: "1993 · a kid who drew all day" },
  { src: "/img/particles/marine.jpg", label: "2008 · a Marine with a camera" },
  { src: "/img/particles/spin.jpg", label: "2020 · the product in a million pockets" },
  { src: "/img/particles/city.jpg", label: "2026 · a city built with an agent" },
];

const GRID = 256; // 65,536 points
const HOLD = 4.2; // seconds per stage
const MORPH = 1.6; // seconds per transition

type Sampled = { pos: Float32Array; col: Float32Array };

/** Sample an image into a centered GRID×GRID cloud; z from luminance. */
function sample(img: HTMLImageElement, aspectFit: number): Sampled {
  const c = document.createElement("canvas");
  c.width = GRID;
  c.height = GRID;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  // cover-crop to square
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - s) / 2;
  const sy = (img.naturalHeight - s) / 2;
  g.drawImage(img, sx, sy, s, s, 0, 0, GRID, GRID);
  const d = g.getImageData(0, 0, GRID, GRID).data;
  const pos = new Float32Array(GRID * GRID * 3);
  const col = new Float32Array(GRID * GRID * 3);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const i = (y * GRID + x) * 4;
      const o = (y * GRID + x) * 3;
      const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255;
      const lum = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
      pos[o] = ((x / (GRID - 1)) - 0.5) * aspectFit;
      pos[o + 1] = (0.5 - y / (GRID - 1)) * aspectFit;
      pos[o + 2] = (lum - 0.5) * 0.35;
      col[o] = r;
      col[o + 1] = gg;
      col[o + 2] = b;
    }
  }
  return { pos, col };
}

const vert = /* glsl */ `
  uniform float uMix;        // 0..3 continuous stage index
  uniform float uTime;
  uniform vec3 uPointer;     // world-space pointer, z = strength
  uniform float uPixelRatio;
  attribute vec3 p0; attribute vec3 p1; attribute vec3 p2; attribute vec3 p3;
  attribute vec3 c0; attribute vec3 c1; attribute vec3 c2; attribute vec3 c3;
  attribute float seed;
  varying vec3 vColor;
  varying float vFade;

  vec3 pick(float i, vec3 a, vec3 b, vec3 c, vec3 d) {
    return i < 0.5 ? a : i < 1.5 ? b : i < 2.5 ? c : d;
  }
  float ease(float t) { return t * t * (3.0 - 2.0 * t); }

  void main() {
    float stage = floor(uMix);
    float f = fract(uMix);
    // per-point stagger: some particles leave early, some late
    float t = ease(clamp((f - seed * 0.45) / 0.55, 0.0, 1.0));
    vec3 a = pick(stage, p0, p1, p2, p3);
    vec3 b = pick(min(stage + 1.0, 3.0), p0, p1, p2, p3);
    vec3 ca = pick(stage, c0, c1, c2, c3);
    vec3 cb = pick(min(stage + 1.0, 3.0), c0, c1, c2, c3);
    // mid-flight scatter: arc outward then settle
    float arc = sin(t * 3.14159) * (0.25 + seed * 0.35);
    vec3 dir = normalize(vec3(a.xy - b.xy, 0.0) + vec3(seed - 0.5, fract(seed * 7.0) - 0.5, 1.0));
    vec3 pos = mix(a, b, t) + dir * arc * 0.6;
    // ambient drift
    pos.x += sin(uTime * 0.6 + seed * 31.0) * 0.004;
    pos.y += cos(uTime * 0.5 + seed * 17.0) * 0.004;
    // pointer repulsion
    vec2 d = pos.xy - uPointer.xy;  // uPointer already in cloud space
    float dist = length(d);
    float push = smoothstep(0.45, 0.0, dist) * uPointer.z;
    pos.xy += normalize(d + 0.0001) * push * 0.25;
    pos.z += push * 0.2;

    vec3 col = mix(ca, cb, t);
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    // lift the midtones a little; let the darkest pixels fall away so the
    // figure reads against the dark frame instead of sitting on a black sheet
    vColor = pow(col, vec3(0.85)) * 1.18;
    vFade = (1.0 - arc * 0.6) * smoothstep(0.035, 0.16, lum);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = (2.6 + seed * 1.6) * uPixelRatio;
    gl_PointSize = size * (2.4 / -mv.z);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    float a = smoothstep(0.5, 0.18, r) * vFade;
    if (a < 0.02) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

function Cloud({ samples, onStage, reduce, dims }: { samples: Sampled[]; onStage: (i: number) => void; reduce: boolean; dims: [number, number] }) {
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const { size, viewport, camera, setSize } = useThree();
  // belt and braces: some embedded browsers never fire R3F's resize observer
  useEffect(() => {
    if (dims[0] > 0 && dims[1] > 0 && (Math.abs(size.width - dims[0]) > 1 || Math.abs(size.height - dims[1]) > 1)) setSize(dims[0], dims[1]);
  }, [dims, size.width, size.height, setSize]);
  const pointer = useRef(new THREE.Vector3(10, 10, 0));
  const target = useRef(new THREE.Vector3(10, 10, 0));
  const t0 = useRef(performance.now());
  const lastStage = useRef(-1);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = GRID * GRID;
    g.setAttribute("position", new THREE.BufferAttribute(samples[0].pos, 3));
    samples.forEach((s, i) => {
      g.setAttribute(`p${i}`, new THREE.BufferAttribute(s.pos, 3));
      g.setAttribute(`c${i}`, new THREE.BufferAttribute(s.col, 3));
    });
    const seed = new Float32Array(n);
    let s = 1337;
    for (let i = 0; i < n; i++) seed[i] = (s = (s * 16807) % 2147483647) / 2147483647;
    g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3);
    return g;
  }, [samples]);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-particles]");
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      const ox = window.innerWidth > 900 ? 0.62 : 0;
      const oy = window.innerWidth > 900 ? 0.05 : 0.25;
      target.current.set((x * viewport.width) / 2 - ox, (y * viewport.height) / 2 - oy, 1);
    };
    const onLeave = () => target.current.set(10, 10, 0);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [viewport.width, viewport.height]);

  useFrame(() => {
    const m = mat.current;
    if (!m) return;
    const t = (performance.now() - t0.current) / 1000;
    const period = HOLD + MORPH;
    let mix: number;
    if (reduce) mix = 3;
    else {
      const cycle = t % (period * 4);
      const stage = Math.floor(cycle / period);
      const local = cycle - stage * period;
      const f = local < HOLD ? 0 : (local - HOLD) / MORPH;
      mix = stage + f;
      if (stage === 3 && f > 0) mix = 3 + f; // wraps to 0 via modulo below
      if (mix >= 4) mix -= 4;
    }
    // stage 3 → 0 wrap: morph from p3 back to p0 by treating uMix in [3,4) as p3→p0
    m.uniforms.uMix.value = mix;
    m.uniforms.uTime.value = t;
    pointer.current.lerp(target.current, 0.12);
    m.uniforms.uPointer.value.copy(pointer.current);
    m.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    const idx = Math.floor(mix + 0.5) % 4;
    if (idx !== lastStage.current) {
      lastStage.current = idx;
      onStage(idx);
    }
    camera.position.x += ((pointer.current.z ? pointer.current.x * 0.06 : 0) - camera.position.x) * 0.04;
    camera.position.y += ((pointer.current.z ? pointer.current.y * 0.06 : 0) - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });

  const uniforms = useMemo(
    () => ({ uMix: { value: 0 }, uTime: { value: 0 }, uPointer: { value: new THREE.Vector3(10, 10, 0) }, uPixelRatio: { value: 1 } }),
    []
  );
  const offsetX = size.width > 900 ? 0.62 : 0;
  return (
    <points geometry={geo} frustumCulled={false} position={[offsetX, size.width > 900 ? 0.05 : 0.25, 0]}>
      <shaderMaterial
        ref={mat}
        vertexShader={vert.replace("vec3 b = pick(min(stage + 1.0, 3.0), p0, p1, p2, p3);", "vec3 b = pick(mod(stage + 1.0, 4.0), p0, p1, p2, p3);").replace("vec3 cb = pick(min(stage + 1.0, 3.0), c0, c1, c2, c3);", "vec3 cb = pick(mod(stage + 1.0, 4.0), c0, c1, c2, c3);")}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

export function LifeParticles({ onStage, className = "" }: { onStage?: (i: number) => void; className?: string }) {
  const [samples, setSamples] = useState<Sampled[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [dims, setDims] = useState<[number, number]>([0, 0]);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = () => setDims([el.clientWidth, el.clientHeight]);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    let alive = true;
    Promise.all(
      STAGES.map(
        (s) =>
          new Promise<HTMLImageElement>((res, rej) => {
            const im = new Image();
            im.crossOrigin = "anonymous";
            im.onload = () => res(im);
            im.onerror = rej;
            im.src = s.src;
          })
      )
    )
      .then((imgs) => alive && setSamples(imgs.map((im) => sample(im, 2.0))))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return null;
  return (
    <div ref={host} data-particles className={`absolute inset-0 transition-opacity duration-1000 ${samples ? "opacity-100" : "opacity-0"} ${className}`} aria-hidden="true">
      {samples && (
        <Canvas
          dpr={[1, 2]}
          resize={{ scroll: false, debounce: 0 }}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: 40, near: 0.1, far: 20, position: [0, 0, 3.4] }}
        >
          <Cloud samples={samples} onStage={onStage ?? (() => {})} reduce={reduce} dims={dims} />
        </Canvas>
      )}
    </div>
  );
}
