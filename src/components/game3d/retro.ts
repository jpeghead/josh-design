/**
 * The retro pipeline — every surface in Whitehead City goes through here.
 *
 * 1998-era look, original assets: low-res canvases authored in code,
 * posterized to a handful of levels per channel with a 4x4 ordered dither,
 * pulled warm. Diffuse only — the absence of PBR is the art direction.
 * See STYLE.md for the rules.
 */

import * as THREE from "three";

/* --------------------------------------------------------- quantizer */

// 4x4 Bayer matrix, normalized to -0.5..0.5
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (v) => v / 16 - 0.5
);

const LEVELS = 5;
const STEP = 255 / (LEVELS - 1);
const DITHER = 7; // dither amplitude in 0..255 space

/** posterize + dither + warm desaturate, in place */
export function quantizeCanvas(c: HTMLCanvasElement | OffscreenCanvas) {
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const w = c.width;
  for (let i = 0; i < d.length; i += 4) {
    const px = (i / 4) % w;
    const py = Math.floor(i / 4 / w);
    const dith = BAYER[(py % 4) * 4 + (px % 4)] * DITHER;
    // warm desaturate first
    const r = d[i],
      gg = d[i + 1],
      b = d[i + 2];
    const lum = 0.299 * r + 0.587 * gg + 0.114 * b;
    const mix = 0.75; // keep 75% of the original hue
    let nr = r * mix + lum * (1 - mix) * 1.02;
    let ng = gg * mix + lum * (1 - mix) * 1.0;
    let nb = b * mix + lum * (1 - mix) * 0.94;
    // posterize with dither
    nr = Math.round((nr + dith) / STEP) * STEP;
    ng = Math.round((ng + dith) / STEP) * STEP;
    nb = Math.round((nb + dith) / STEP) * STEP;
    d[i] = Math.max(0, Math.min(255, nr));
    d[i + 1] = Math.max(0, Math.min(255, ng));
    d[i + 2] = Math.max(0, Math.min(255, nb));
  }
  g.putImageData(img, 0, 0);
}

function toTexture(c: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = 4;
  return t;
}

function make(size: number, paint: (g: CanvasRenderingContext2D, s: number) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  paint(g, size);
  quantizeCanvas(c);
  return c;
}

/** deterministic pseudo-random for repeatable textures */
function prng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------ the surfaces */

const cache = new Map<string, THREE.CanvasTexture>();

function cached(key: string, rx: number, ry: number, builder: () => HTMLCanvasElement): THREE.CanvasTexture {
  const k = `${key}:${rx}:${ry}`;
  let t = cache.get(k);
  if (!t) {
    t = toTexture(builder(), rx, ry);
    cache.set(k, t);
  }
  return t;
}

/** interior plaster — soft vertical tonal streaks */
export function retroPlaster(rx = 1, ry = 1) {
  return cached("plaster", rx, ry, () =>
    make(128, (g, s) => {
      g.fillStyle = "#bdb5a6";
      g.fillRect(0, 0, s, s);
      const r = prng(7);
      for (let i = 0; i < 24; i++) {
        const x = r() * s;
        const wdt = 8 + r() * 24;
        const v = 180 + r() * 14;
        g.fillStyle = `rgba(${v},${v - 5},${v - 14},0.18)`;
        g.fillRect(x, 0, wdt, s);
      }
      for (let i = 0; i < 160; i++) {
        const v = 168 + r() * 26;
        g.fillStyle = `rgba(${v},${v - 5},${v - 14},0.12)`;
        g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2);
      }
    })
  );
}

/** plank floor — boards with grain + occasional nail-dark knots */
export function retroFloor(rx = 1, ry = 1) {
  return cached("floor", rx, ry, () =>
    make(256, (g, s) => {
      const r = prng(19);
      const rows = 8;
      const rowH = s / rows;
      for (let row = 0; row < rows; row++) {
        const base = 104 + r() * 14;
        g.fillStyle = `rgb(${base},${base * 0.78},${base * 0.6})`;
        g.fillRect(0, row * rowH, s, rowH);
        // grain
        for (let k = 0; k < 26; k++) {
          const v = base * (0.85 + r() * 0.24);
          g.fillStyle = `rgba(${v},${v * 0.76},${v * 0.58},0.4)`;
          g.fillRect(r() * s, row * rowH + r() * rowH, 10 + r() * 60, 1);
        }
        // board seams with offset joints
        g.fillStyle = "rgba(30,20,12,0.7)";
        g.fillRect(0, row * rowH, s, 2);
        const joint = ((row * 89) % 8) / 8;
        g.fillRect(joint * s, row * rowH, 2, rowH);
        // knot
        if (r() < 0.5) {
          g.fillStyle = "rgba(52,34,20,0.8)";
          g.beginPath();
          g.ellipse(r() * s, row * rowH + rowH / 2, 3, 2, 0, 0, 7);
          g.fill();
        }
      }
    })
  );
}

/** cabinet / furniture wood — tighter grain, mid brown */
export function retroWood(rx = 1, ry = 1) {
  return cached("wood", rx, ry, () =>
    make(128, (g, s) => {
      const r = prng(31);
      g.fillStyle = "#6a4f38";
      g.fillRect(0, 0, s, s);
      for (let k = 0; k < 60; k++) {
        const v = 86 + r() * 50;
        g.fillStyle = `rgba(${v},${v * 0.72},${v * 0.5},0.45)`;
        g.fillRect(0, r() * s, s, 1 + r() * 2);
      }
    })
  );
}

/** door wood — vertical grain, darker */
export function retroDoor(rx = 1, ry = 1) {
  return cached("door", rx, ry, () =>
    make(128, (g, s) => {
      const r = prng(43);
      g.fillStyle = "#52381f";
      g.fillRect(0, 0, s, s);
      for (let k = 0; k < 60; k++) {
        const v = 62 + r() * 44;
        g.fillStyle = `rgba(${v},${v * 0.7},${v * 0.45},0.5)`;
        g.fillRect(r() * s, 0, 1 + r() * 2, s);
      }
    })
  );
}

/** countertop — pale speckle */
export function retroCounter(rx = 1, ry = 1) {
  return cached("counter", rx, ry, () =>
    make(128, (g, s) => {
      const r = prng(57);
      g.fillStyle = "#d3ccbc";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 700; i++) {
        const v = 140 + r() * 90;
        g.fillStyle = `rgba(${v},${v - 6},${v - 18},0.5)`;
        g.fillRect(r() * s, r() * s, 1, 1);
      }
    })
  );
}

/** concrete — porch, sidewalks */
export function retroConcrete(rx = 1, ry = 1) {
  return cached("concrete", rx, ry, () =>
    make(128, (g, s) => {
      const r = prng(71);
      g.fillStyle = "#8f8a80";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 500; i++) {
        const v = 110 + r() * 60;
        g.fillStyle = `rgba(${v},${v - 4},${v - 12},0.4)`;
        g.fillRect(r() * s, r() * s, 1 + r() * 2, 1);
      }
      // hairline cracks
      g.strokeStyle = "rgba(70,66,58,0.5)";
      g.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        let x = r() * s,
          y = r() * s;
        g.moveTo(x, y);
        for (let k = 0; k < 5; k++) {
          x += (r() - 0.5) * 30;
          y += r() * 18;
          g.lineTo(x, y);
        }
        g.stroke();
      }
    })
  );
}

/** rug — flat field, darker double border, weave noise */
export function retroRug(rx = 1, ry = 1, a = "#7a5a4a", b = "#5a4034") {
  return cached(`rug:${a}:${b}`, rx, ry, () =>
    make(128, (g, s) => {
      const r = prng(83);
      g.fillStyle = a;
      g.fillRect(0, 0, s, s);
      g.strokeStyle = b;
      g.lineWidth = 6;
      g.strokeRect(5, 5, s - 10, s - 10);
      g.lineWidth = 2;
      g.strokeRect(14, 14, s - 28, s - 28);
      for (let i = 0; i < 420; i++) {
        g.fillStyle = `rgba(40,28,20,${0.05 + r() * 0.09})`;
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
    })
  );
}

/** building facade — wall bands, window grid with sills, lit variation.
 *  Instance color tints the wall; windows stay dark/lit. */
export function retroFacade(rx = 1, ry = 1) {
  return cached("facade", rx, ry, () =>
    make(256, (g, s) => {
      const r = prng(97);
      // wall base — light so instance tint owns the hue
      g.fillStyle = "#b8b2a6";
      g.fillRect(0, 0, s, s);
      // panel seams
      g.fillStyle = "rgba(60,54,46,0.35)";
      for (let y = 0; y < s; y += 32) g.fillRect(0, y, s, 2);
      // window grid: 6 columns x 8 floors
      const cw = s / 6;
      const ch = s / 8;
      for (let fy = 0; fy < 8; fy++) {
        for (let fx = 0; fx < 6; fx++) {
          const wx = fx * cw + cw * 0.22;
          const wy = fy * ch + ch * 0.2;
          const ww = cw * 0.56;
          const wh = ch * 0.52;
          const lit = r() < 0.34;
          g.fillStyle = lit ? (r() < 0.3 ? "#ffd9a0" : "#a8c0da") : "#232830";
          g.fillRect(wx, wy, ww, wh);
          // sill
          g.fillStyle = "rgba(40,36,30,0.6)";
          g.fillRect(wx - 2, wy + wh, ww + 4, 3);
        }
      }
      // grime streaks
      for (let i = 0; i < 30; i++) {
        g.fillStyle = `rgba(50,46,40,${0.04 + r() * 0.08})`;
        g.fillRect(r() * s, 0, 2 + r() * 5, s);
      }
    })
  );
}

/** road asphalt — dashed centerline, wheel-path wear, gutter edges */
export function retroAsphalt(rx = 1, ry = 1) {
  return cached("asphalt", rx, ry, () =>
    make(256, (g, s) => {
      const r = prng(113);
      g.fillStyle = "#2e3136";
      g.fillRect(0, 0, s, s);
      // speckle
      for (let i = 0; i < 900; i++) {
        const v = 38 + r() * 34;
        g.fillStyle = `rgba(${v},${v + 2},${v + 6},0.5)`;
        g.fillRect(r() * s, r() * s, 1 + r() * 2, 1);
      }
      // wheel-path wear (two lighter bands per side)
      g.fillStyle = "rgba(90,92,96,0.14)";
      for (const bx of [0.16, 0.36, 0.62, 0.82]) g.fillRect(bx * s - 8, 0, 16, s);
      // dashed centerline
      g.fillStyle = "#c9b98a";
      for (let y = 0; y < s; y += 64) g.fillRect(s / 2 - 3, y + 10, 6, 34);
      // gutters
      g.fillStyle = "rgba(20,22,26,0.8)";
      g.fillRect(0, 0, 5, s);
      g.fillRect(s - 5, 0, 5, s);
    })
  );
}

/** sidewalk — scored concrete squares */
export function retroSidewalk(rx = 1, ry = 1) {
  return cached("sidewalk", rx, ry, () =>
    make(128, (g, s) => {
      const r = prng(127);
      g.fillStyle = "#8a857b";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 420; i++) {
        const v = 105 + r() * 55;
        g.fillStyle = `rgba(${v},${v - 4},${v - 12},0.4)`;
        g.fillRect(r() * s, r() * s, 1 + r() * 2, 1);
      }
      // score lines
      g.fillStyle = "rgba(55,52,46,0.7)";
      g.fillRect(0, 0, s, 3);
      g.fillRect(0, s / 2, s, 2);
    })
  );
}

/* --------------------------------------- retrofit imported GLTF models */

const doneScenes = new WeakSet<THREE.Object3D>();

/** quantize a loaded image into a small retro map */
function quantizeImage(img: TexImageSource, size = 128): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.drawImage(img as CanvasImageSource, 0, 0, size, size);
  quantizeCanvas(c);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.flipY = false; // GLTF UV convention
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/**
 * Force an imported model into the style: Lambert, quantized diffuse,
 * no PBR maps. Mutates the source scene once — clones inherit it.
 */
export function retrofitModel(scene: THREE.Object3D) {
  if (doneScenes.has(scene)) return scene;
  doneScenes.add(scene);
  const convert = (m: THREE.Material): THREE.Material => {
    const src = m as THREE.MeshStandardMaterial;
    const map = src.map?.image ? quantizeImage(src.map.image as TexImageSource) : null;
    return new THREE.MeshLambertMaterial({
      map: map ?? undefined,
      color: map ? new THREE.Color("#ffffff") : (src.color ?? new THREE.Color("#8a8078")),
      transparent: src.transparent,
      opacity: src.opacity,
      alphaTest: src.alphaTest || (src.transparent ? 0.4 : 0),
      side: src.side,
    });
  };
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(convert)
      : convert(mesh.material);
  });
  return scene;
}
