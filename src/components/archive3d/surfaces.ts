/**
 * Procedural PBR surfaces — authored in canvas, then hung on standard
 * materials as real map / normal / roughness sets.
 *
 * The technique: stack value-noise octaves for broad variation, paint the
 * causal detail (grain, joints, pores, wear) into BOTH the color canvas and
 * a height canvas, then derive a tangent-space normal map from the height
 * with a blur + Sobel pass. Roughness is its own map so highlights break up
 * where the material actually changes. Color space is explicit everywhere:
 * color maps are sRGB, data maps are linear.
 *
 * Units for texture repeat are world meters.
 */

import * as THREE from "three";

/* ------------------------------------------------------------ basics */

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
/** frame-rate independent exponential damping */
export const damp = (cur: number, to: number, rate: number, dt: number) =>
  lerp(cur, to, 1 - Math.exp(-rate * dt));

const TAU = Math.PI * 2;

export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cvs(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
const rgb = (r: number, g: number, b: number) => `rgb(${r | 0},${g | 0},${b | 0})`;

/** stacked, up-scaled value noise — fast, and reads as fbm once it's
 *  multiplied under a base color */
export function fbmCanvas(W: number, H: number, seed: number, octaves = 5, baseCells = 3, contrast = 1) {
  const out = cvs(W, H);
  const o = out.getContext("2d")!;
  o.fillStyle = "#808080";
  o.fillRect(0, 0, W, H);
  let cells = baseCells;
  let alpha = 1;
  for (let i = 0; i < octaves; i++) {
    const n = cvs(cells, cells);
    const nx = n.getContext("2d")!;
    const im = nx.createImageData(cells, cells);
    const d = im.data;
    const r = mulberry32(seed + i * 977);
    for (let k = 0; k < cells * cells; k++) {
      const v = 128 + (r() - 0.5) * 255 * contrast;
      d[k * 4] = d[k * 4 + 1] = d[k * 4 + 2] = clamp(v, 0, 255);
      d[k * 4 + 3] = 255;
    }
    nx.putImageData(im, 0, 0);
    o.globalAlpha = alpha;
    o.globalCompositeOperation = i === 0 ? "source-over" : "overlay";
    o.imageSmoothingEnabled = true;
    o.imageSmoothingQuality = "high";
    o.drawImage(n, 0, 0, W, H);
    cells *= 2;
    alpha *= 0.62;
  }
  o.globalAlpha = 1;
  o.globalCompositeOperation = "source-over";
  return out;
}

/** height → tangent-space normal map (blur first, then Sobel) */
export function normalFromHeight(hc: HTMLCanvasElement, strength = 2.4) {
  const W = hc.width;
  const H = hc.height;
  const b = cvs(W, H);
  const bx = b.getContext("2d")!;
  bx.filter = "blur(1.1px)";
  bx.drawImage(hc, 0, 0);
  bx.filter = "none";
  const src = bx.getImageData(0, 0, W, H).data;
  const out = cvs(W, H);
  const ox = out.getContext("2d")!;
  const im = ox.createImageData(W, H);
  const d = im.data;
  const at = (x: number, y: number) => src[(((y + H) % H) * W + ((x + W) % W)) * 4] / 255;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const gx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const gy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const nx = -gx;
      const ny = gy;
      const nz = 1;
      const il = 1 / Math.hypot(nx, ny, nz);
      const i = (y * W + x) * 4;
      d[i] = (nx * il * 0.5 + 0.5) * 255;
      d[i + 1] = (ny * il * 0.5 + 0.5) * 255;
      d[i + 2] = (nz * il * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  ox.putImageData(im, 0, 0);
  return out;
}

export type SurfaceSet = { map: HTMLCanvasElement; normal: HTMLCanvasElement; rough?: HTMLCanvasElement };

/* ------------------------------------------------------------ wood */

/**
 * Sawn wood. Every board came off a different part of the log: a pith
 * usually outside the board, rings as conic sections of it, latewood as a
 * dark band with pale earlywood inside, pores elongated along the grain,
 * the odd knot, and checking that always runs with the grain.
 */
export function texWood(
  seed: number,
  opt: { base?: [number, number, number]; boards?: number; rough?: string; relief?: number } = {}
): SurfaceSet {
  const W = 512;
  const H = 512;
  const c = cvs(W, H);
  const x = c.getContext("2d")!;
  const h = cvs(W, H);
  const hx = h.getContext("2d")!;
  const r = cvs(W, H);
  const rx = r.getContext("2d")!;
  const rnd = mulberry32(seed);
  const base = opt.base ?? [96, 66, 44];
  x.fillStyle = rgb(base[0], base[1], base[2]);
  x.fillRect(0, 0, W, H);
  hx.fillStyle = "#808080";
  hx.fillRect(0, 0, W, H);
  rx.fillStyle = opt.rough ?? "#b9b9b9";
  rx.fillRect(0, 0, W, H);

  const nb = opt.boards ?? 0;
  const cuts = [0];
  if (nb > 0) {
    const ws: number[] = [];
    let sum = 0;
    for (let i = 0; i < nb; i++) {
      const v = 0.7 + rnd() * 0.6;
      ws.push(v);
      sum += v;
    }
    let acc = 0;
    ws.forEach((v) => {
      acc += (v / sum) * W;
      cuts.push(acc);
    });
  } else cuts.push(W);

  const stroke = (pts: number[][], ctx: CanvasRenderingContext2D, style: string, w: number) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = style;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  for (let b = 0; b < cuts.length - 1; b++) {
    const x0 = cuts[b];
    const x1 = cuts[b + 1];
    const bw = x1 - x0;
    const tone = 0.82 + rnd() * 0.4;
    const pith = x0 + bw * (rnd() * 2.8 - 0.9);
    const d0 = bw * (0.12 + rnd() * 1.7);
    const amp = bw * (0.1 + rnd() * 0.4);
    const per = 1 + ((rnd() * 2) | 0);
    const ph = rnd() * TAU;
    const dAt = (y: number) => d0 + Math.sin((y / H) * TAU * per + ph) * amp;
    const gap = 2.6 + rnd() * 5.0;

    [x, hx, rx].forEach((d) => {
      d.save();
      d.beginPath();
      d.rect(x0, 0, bw, H);
      d.clip();
    });
    x.fillStyle = rgb(base[0] * tone, base[1] * tone, base[2] * tone);
    x.fillRect(x0, 0, bw, H);

    for (let k = 1; k * gap < bw * 3.4 + d0 + amp; k++) {
      const rr = k * gap * (0.88 + rnd() * 0.24);
      const dark = 0.34 + rnd() * 0.34;
      const wide = 0.8 + rnd() * 1.9;
      for (const side of [-1, 1]) {
        let pts: number[][] = [];
        const flush = () => {
          stroke(pts, x, `rgba(0,0,0,${dark.toFixed(2)})`, wide);
          stroke(pts, hx, `rgba(0,0,0,${(dark * 0.8).toFixed(2)})`, wide);
          stroke(
            pts.map((q) => [q[0] + side * (wide + 0.6), q[1]]),
            x,
            `rgba(190,150,110,${(dark * 0.3).toFixed(2)})`,
            wide * 0.7
          );
          pts = [];
        };
        for (let y = -3; y <= H + 3; y += 3) {
          const d = dAt(y);
          const q = rr * rr - d * d;
          if (q <= 0) {
            flush();
            continue;
          }
          pts.push([pith + side * Math.sqrt(q), y]);
        }
        flush();
      }
    }
    for (let i = 0; i < 220; i++) {
      const px = x0 + rnd() * bw;
      const py = rnd() * H;
      const ln = 1.5 + rnd() * 6;
      x.fillStyle = `rgba(0,0,0,${0.08 + rnd() * 0.18})`;
      x.fillRect(px, py, 0.7 + rnd() * 0.7, ln);
      hx.fillStyle = "rgba(0,0,0,.2)";
      hx.fillRect(px, py, 0.8, ln);
    }
    if (rnd() > 0.55) {
      const kx = x0 + bw * (0.2 + rnd() * 0.6);
      const ky = rnd() * H;
      const kr = 2.5 + rnd() * 5;
      for (let i = 5; i >= 1; i--) {
        const t = i / 5;
        x.strokeStyle = `rgba(0,0,0,${(0.5 - t * 0.25).toFixed(2)})`;
        x.lineWidth = 1.1;
        x.beginPath();
        x.ellipse(kx, ky, kr * t * 1.5, kr * t * 2.4, 0, 0, TAU);
        x.stroke();
        hx.strokeStyle = "rgba(0,0,0,.3)";
        hx.lineWidth = 1.1;
        hx.beginPath();
        hx.ellipse(kx, ky, kr * t * 1.5, kr * t * 2.4, 0, 0, TAU);
        hx.stroke();
      }
    }
    for (let i = 0; i < 4; i++) {
      const sx = x0 + rnd() * bw;
      const sy = rnd() * H;
      const ln = 20 + rnd() * 120;
      const pts: number[][] = [];
      for (let y = sy; y < sy + ln; y += 6) pts.push([sx + Math.sin(y * 0.07) * 1.4, y]);
      stroke(pts, x, "rgba(0,0,0,.5)", 0.7 + rnd() * 1.0);
      stroke(pts, hx, "rgba(0,0,0,.5)", 0.7 + rnd() * 1.0);
    }
    [x, hx, rx].forEach((d) => d.restore());

    if (nb > 0) {
      x.fillStyle = "rgba(0,0,0,.8)";
      x.fillRect(x1 - 1.1, 0, 2.2, H);
      x.fillStyle = "rgba(158,130,106,.14)";
      x.fillRect(x1 + 1.1, 0, 1.1, H);
      hx.fillStyle = "rgba(0,0,0,.85)";
      hx.fillRect(x1 - 1.3, 0, 2.6, H);
      hx.fillStyle = "rgba(255,255,255,.35)";
      hx.fillRect(x1 + 1.3, 0, 1.6, H);
      rx.fillStyle = "rgba(255,255,255,.5)";
      rx.fillRect(x1 - 1.6, 0, 3.2, H);
    }
  }
  // satin finish reads as broad tonal breakup, not uniform noise
  x.globalCompositeOperation = "overlay";
  x.globalAlpha = 0.28;
  x.drawImage(fbmCanvas(W, H, seed + 7, 5, 3, 0.9), 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = "source-over";
  return { map: c, normal: normalFromHeight(h, opt.relief ?? 1.8), rough: r };
}

/* ------------------------------------------------------------ fabric */

/** a flat-weave rug: warp/weft tooth at two scales, with a woven border */
export function texRug(seed: number, field: [number, number, number], border: [number, number, number]): SurfaceSet {
  const W = 512;
  const H = 512;
  const c = cvs(W, H);
  const x = c.getContext("2d")!;
  const h = cvs(W, H);
  const hx = h.getContext("2d")!;
  const rnd = mulberry32(seed);
  x.fillStyle = rgb(...field);
  x.fillRect(0, 0, W, H);
  hx.fillStyle = "#808080";
  hx.fillRect(0, 0, W, H);
  const B = 46;
  x.fillStyle = rgb(...border);
  x.fillRect(0, 0, W, B);
  x.fillRect(0, H - B, W, B);
  x.fillRect(0, 0, B, H);
  x.fillRect(W - B, 0, B, H);
  x.fillStyle = rgb(...field);
  x.fillRect(B + 10, B + 10, W - 2 * (B + 10), H - 2 * (B + 10));
  // weave tooth
  for (let y = 0; y < H; y += 3) {
    x.fillStyle = `rgba(0,0,0,${0.06 + rnd() * 0.08})`;
    x.fillRect(0, y, W, 1);
    hx.fillStyle = "rgba(0,0,0,.25)";
    hx.fillRect(0, y, W, 1);
  }
  for (let xx = 0; xx < W; xx += 3) {
    x.fillStyle = `rgba(255,255,255,${0.03 + rnd() * 0.05})`;
    x.fillRect(xx, 0, 1, H);
    hx.fillStyle = "rgba(255,255,255,.2)";
    hx.fillRect(xx, 0, 1, H);
  }
  x.globalCompositeOperation = "overlay";
  x.globalAlpha = 0.35;
  x.drawImage(fbmCanvas(W, H, seed + 3, 5, 4, 1), 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = "source-over";
  return { map: c, normal: normalFromHeight(h, 1.4) };
}

/* ------------------------------------------------------------ flag */

/** the folded flag's blue field — a few stars, the rest is fold shadow */
export function texFlagField(): HTMLCanvasElement {
  const W = 256;
  const H = 256;
  const c = cvs(W, H);
  const x = c.getContext("2d")!;
  x.fillStyle = "#1a2a52";
  x.fillRect(0, 0, W, H);
  const rnd = mulberry32(5);
  x.fillStyle = "#eef0ff";
  for (let i = 0; i < 26; i++) {
    const sx = 24 + rnd() * (W - 48);
    const sy = 24 + rnd() * (H - 48);
    x.beginPath();
    for (let k = 0; k < 10; k++) {
      const rr = k % 2 ? 2.2 : 5;
      const a = (k / 10) * TAU - Math.PI / 2;
      const px = sx + Math.cos(a) * rr;
      const py = sy + Math.sin(a) * rr;
      if (k === 0) x.moveTo(px, py);
      else x.lineTo(px, py);
    }
    x.closePath();
    x.fill();
  }
  // triangular fold creases
  x.strokeStyle = "rgba(0,0,0,.28)";
  x.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    x.beginPath();
    x.moveTo(0, (H / 4) * i);
    x.lineTo(W, (H / 4) * i - 40);
    x.stroke();
  }
  return c;
}

/* ------------------------------------------------------------ screen */

/** the monitor shows the site's own opening — the portfolio, seen in place */
export function texScreen(fontDisplay: string, fontMono: string): HTMLCanvasElement {
  const W = 1024;
  const H = 576;
  const c = cvs(W, H);
  const g = c.getContext("2d")!;
  g.fillStyle = "#f4eee2";
  g.fillRect(0, 0, W, H);
  // chrome
  g.fillStyle = "#1a1917";
  g.fillRect(0, 0, W, 44);
  g.fillStyle = "#2a2927";
  g.fillRect(260, 12, 504, 20);
  g.fillStyle = "#9aa39a";
  g.font = `500 11px ${fontMono}`;
  g.fillText("josh.design", 490, 26);
  // eyebrow
  g.fillStyle = "#8a8172";
  g.font = `500 12px ${fontMono}`;
  g.fillText("THE ARCHIVE — A WORKING RECORD OF A LIFE'S MAKING", 86, 140);
  // name
  g.fillStyle = "#26221b";
  g.font = `400 120px ${fontDisplay}`;
  g.fillText("Josh", 80, 268);
  g.font = `italic 400 120px ${fontDisplay}`;
  g.fillText("Whitehead", 80, 392);
  g.fillStyle = "#8a8172";
  g.font = `400 20px system-ui, sans-serif`;
  g.fillText("Designer and builder. I make the interface, the system,", 84, 450);
  g.fillText("and the thing that ships.", 84, 478);
  g.fillStyle = "#26221b";
  g.font = `500 12px ${fontMono}`;
  g.fillText("BEGIN THE WALK ↓", 84, 536);
  g.fillStyle = "#c8a24b";
  g.fillRect(84, 542, 118, 2);
  return c;
}

/* ------------------------------------------------------------ to three */

export type TexOpts = { repeat?: [number, number]; srgb?: boolean; aniso?: number; wrap?: THREE.Wrapping };

export function tex(canvasEl: HTMLCanvasElement, o: TexOpts = {}): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvasEl);
  t.wrapS = t.wrapT = o.wrap ?? THREE.RepeatWrapping;
  if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
  t.anisotropy = o.aniso ?? 8;
  t.colorSpace = o.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/**
 * A {map, normal, rough} set on a standard material at one tiling.
 * roughness stays at 1 when a rough map exists: the map carries the
 * variation, and anything less drags the whole surface toward a polish
 * it should not have. color tints an already-authored albedo.
 */
export function surface(
  t: SurfaceSet,
  rep: [number, number],
  o: { color?: THREE.ColorRepresentation; normal?: number; roughness?: number; metalness?: number; aniso?: number } = {}
): THREE.MeshStandardMaterial {
  const aniso = o.aniso ?? 8;
  const n = o.normal ?? 0.8;
  const m = new THREE.MeshStandardMaterial({
    map: tex(t.map, { repeat: rep, aniso }),
    normalMap: tex(t.normal, { repeat: rep, srgb: false, aniso }),
    normalScale: new THREE.Vector2(n, n),
    color: o.color ?? 0xffffff,
    roughness: o.roughness ?? (t.rough ? 1 : 0.9),
    metalness: o.metalness ?? 0.0,
  });
  if (t.rough) m.roughnessMap = tex(t.rough, { repeat: rep, srgb: false });
  return m;
}
