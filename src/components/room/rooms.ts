/**
 * THE ROOM — world data + prop/figure library.
 *
 * One continuous side-scrolling house in the INSIDE (Playdead) idiom: near
 * darkness, volumetric window light, black silhouette figures, one warm
 * practical lamp per room. Each room is a season of the life; the desk
 * recurs in every one, and the figure at it ages.
 *
 * All drawing is canvas-2D path work at blocking fidelity. Figures are
 * generic placeholders until reference photos land in /public/reference —
 * likeness comes from posture, build, and hair shape (faces stay dark).
 */

export type Ctx = CanvasRenderingContext2D;

/* ------------------------------------------------------------- palette */

export const P = {
  void: "#07090b",
  wallBack: "#11161a",
  wallLit: "#1a2228",
  floor: "#0c1013",
  silhouette: "#020304",
  rim: "#2c3a42",
  shaft: "168, 190, 196", // rgb of window light
  lamp: "201, 160, 97", // warm practical
  screen: "154, 186, 205", // monitor glow
  accent: "#C8A24B",
};

export const FLOOR_Y = 720;
export const ROOM_H = 900;

/* -------------------------------------------------------------- props */

function rect(g: Ctx, x: number, y: number, w: number, h: number, c: string) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}

/** soft volumetric shaft from a window or door */
export function lightShaft(
  g: Ctx,
  x: number,
  y: number,
  w: number,
  spread: number,
  alpha: number,
  rgb = P.shaft
) {
  const grad = g.createLinearGradient(x, y, x + spread * 0.35, FLOOR_Y + 60);
  grad.addColorStop(0, `rgba(${rgb},${alpha})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w, y);
  g.lineTo(x + w + spread, FLOOR_Y + 60);
  g.lineTo(x - spread * 0.3, FLOOR_Y + 60);
  g.closePath();
  g.fill();
}

export function window_(g: Ctx, x: number, y: number, w: number, h: number, lit = 0.5) {
  rect(g, x - 6, y - 6, w + 12, h + 12, "#0a0e11");
  const grad = g.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, `rgba(${P.shaft},${0.55 * lit})`);
  grad.addColorStop(1, `rgba(${P.shaft},${0.25 * lit})`);
  g.fillStyle = grad;
  g.fillRect(x, y, w, h);
  rect(g, x + w / 2 - 2, y, 4, h, "#0a0e11");
  rect(g, x, y + h / 2 - 2, w, 4, "#0a0e11");
  lightShaft(g, x, y + 4, w, 140, 0.16 * lit);
}

export function lamp(g: Ctx, x: number, y: number, on = 1) {
  g.strokeStyle = P.silhouette;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - 46);
  g.lineTo(x + 18, y - 58);
  g.stroke();
  g.fillStyle = P.silhouette;
  g.beginPath();
  g.moveTo(x + 4, y - 66);
  g.lineTo(x + 34, y - 66);
  g.lineTo(x + 27, y - 46);
  g.lineTo(x + 11, y - 46);
  g.closePath();
  g.fill();
  if (on > 0) {
    const grad = g.createRadialGradient(x + 19, y - 50, 4, x + 19, y - 50, 130);
    grad.addColorStop(0, `rgba(${P.lamp},${0.5 * on})`);
    grad.addColorStop(1, `rgba(${P.lamp},0)`);
    g.fillStyle = grad;
    g.fillRect(x - 120, y - 180, 280, 220);
  }
}

export function desk(g: Ctx, x: number, w: number, era: "small" | "mid" | "modern" | "bench") {
  const y = era === "small" ? FLOOR_Y - 64 : FLOOR_Y - 78;
  rect(g, x, y, w, 8, P.silhouette);
  if (era === "bench") {
    rect(g, x + 6, y + 8, 10, FLOOR_Y - y - 8, P.silhouette);
    rect(g, x + w - 16, y + 8, 10, FLOOR_Y - y - 8, P.silhouette);
    rect(g, x + 10, y + 34, w - 20, 6, P.silhouette);
  } else {
    rect(g, x + 8, y + 8, 8, FLOOR_Y - y - 8, P.silhouette);
    rect(g, x + w - 16, y + 8, 8, FLOOR_Y - y - 8, P.silhouette);
    if (era !== "small") rect(g, x + w - 60, y + 8, 44, 42, P.silhouette); // drawers
  }
}

export function chairSimple(g: Ctx, x: number) {
  rect(g, x, FLOOR_Y - 46, 40, 6, P.silhouette);
  rect(g, x + 4, FLOOR_Y - 40, 6, 40, P.silhouette);
  rect(g, x + 32, FLOOR_Y - 40, 6, 40, P.silhouette);
  rect(g, x + 30, FLOOR_Y - 92, 8, 50, P.silhouette);
}

export function crt(g: Ctx, x: number, y: number, on = 1) {
  rect(g, x, y - 44, 56, 44, P.silhouette);
  if (on) {
    g.fillStyle = `rgba(${P.screen},0.75)`;
    g.fillRect(x + 6, y - 38, 44, 32);
    screenGlow(g, x + 28, y - 22, 90, on * 0.4);
  }
  rect(g, x + 18, y, 20, 8, P.silhouette);
}

export function flatMonitor(g: Ctx, x: number, y: number, w: number, on = 1, warm = false) {
  rect(g, x, y - Math.round(w * 0.62), w, Math.round(w * 0.62), P.silhouette);
  if (on) {
    g.fillStyle = warm ? `rgba(${P.lamp},0.8)` : `rgba(${P.screen},0.8)`;
    g.fillRect(x + 4, y - Math.round(w * 0.62) + 4, w - 8, Math.round(w * 0.62) - 12);
    screenGlow(g, x + w / 2, y - w * 0.3, w * 1.6, 0.35, warm);
  }
  rect(g, x + w / 2 - 4, y, 8, 10, P.silhouette);
  rect(g, x + w / 2 - 18, y + 10, 36, 4, P.silhouette);
}

export function screenGlow(g: Ctx, cx: number, cy: number, r: number, a: number, warm = false) {
  const grad = g.createRadialGradient(cx, cy, 2, cx, cy, r);
  grad.addColorStop(0, `rgba(${warm ? P.lamp : P.screen},${a})`);
  grad.addColorStop(1, `rgba(${warm ? P.lamp : P.screen},0)`);
  g.fillStyle = grad;
  g.fillRect(cx - r, cy - r, r * 2, r * 2);
}

export function poster(g: Ctx, x: number, y: number, w: number, h: number, ghost = false) {
  if (ghost) {
    rect(g, x, y, w, h, P.wallLit); // lighter paint where a frame used to hang
    return;
  }
  rect(g, x - 3, y - 3, w + 6, h + 6, "#0a0e11");
  rect(g, x, y, w, h, "#161d22");
}

export function taped(g: Ctx, x: number, y: number, w: number, h: number) {
  rect(g, x, y, w, h, "#1d2429");
  g.strokeStyle = "#28323a";
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
}

export function easel(g: Ctx, x: number) {
  g.strokeStyle = P.silhouette;
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(x, FLOOR_Y);
  g.lineTo(x + 44, FLOOR_Y - 170);
  g.lineTo(x + 88, FLOOR_Y);
  g.moveTo(x + 44, FLOOR_Y - 170);
  g.lineTo(x + 44, FLOOR_Y - 30);
  g.stroke();
  rect(g, x - 4, FLOOR_Y - 128, 100, 74, "#151b20");
  g.strokeStyle = "#0a0e11";
  g.strokeRect(x - 4, FLOOR_Y - 128, 100, 74);
}

export function bedRack(g: Ctx, x: number, w: number) {
  rect(g, x, FLOOR_Y - 52, w, 12, P.silhouette);
  rect(g, x, FLOOR_Y - 40, w, 16, "#10151a");
  rect(g, x + 4, FLOOR_Y - 24, 8, 24, P.silhouette);
  rect(g, x + w - 12, FLOOR_Y - 24, 8, 24, P.silhouette);
  rect(g, x + 8, FLOOR_Y - 64, 34, 12, "#151b20"); // pillow
}

export function footlocker(g: Ctx, x: number) {
  rect(g, x, FLOOR_Y - 34, 74, 34, P.silhouette);
  rect(g, x + 30, FLOOR_Y - 30, 14, 6, "#20282e");
}

export function camis(g: Ctx, x: number) {
  // hanging uniforms on a rod
  rect(g, x, FLOOR_Y - 250, 120, 4, P.silhouette);
  for (let i = 0; i < 3; i++) {
    const hx = x + 16 + i * 36;
    g.strokeStyle = P.silhouette;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(hx, FLOOR_Y - 246);
    g.lineTo(hx, FLOOR_Y - 236);
    g.stroke();
    g.fillStyle = "#10151a";
    g.beginPath();
    g.moveTo(hx - 14, FLOOR_Y - 236);
    g.lineTo(hx + 14, FLOOR_Y - 236);
    g.lineTo(hx + 10, FLOOR_Y - 130);
    g.lineTo(hx - 10, FLOOR_Y - 130);
    g.closePath();
    g.fill();
  }
}

export function flag(g: Ctx, x: number, y: number) {
  rect(g, x, y, 110, 66, "#141a1f");
  for (let i = 0; i < 4; i++) rect(g, x, y + 10 + i * 16, 110, 4, "#0e1317");
  rect(g, x, y, 40, 32, "#10161c");
}

export function boxes(g: Ctx, x: number, n: number) {
  for (let i = 0; i < n; i++) {
    const bx = x + (i % 2) * 10 + Math.floor(i / 2) * 66;
    const by = FLOOR_Y - 44 - (i % 2) * 40;
    rect(g, bx, by, 60, 42, "#12181d");
    g.strokeStyle = "#0a0e11";
    g.lineWidth = 2;
    g.strokeRect(bx, by, 60, 42);
    g.beginPath();
    g.moveTo(bx, by + 8);
    g.lineTo(bx + 60, by + 8);
    g.stroke();
  }
}

export function scooter(g: Ctx, x: number) {
  g.strokeStyle = P.silhouette;
  g.lineWidth = 5;
  g.beginPath();
  g.arc(x, FLOOR_Y - 10, 10, 0, Math.PI * 2);
  g.arc(x + 64, FLOOR_Y - 10, 10, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(x + 64, FLOOR_Y - 10);
  g.lineTo(x + 64, FLOOR_Y - 110);
  g.lineTo(x + 48, FLOOR_Y - 118);
  g.moveTo(x + 64, FLOOR_Y - 110);
  g.lineTo(x + 80, FLOOR_Y - 118);
  g.moveTo(x, FLOOR_Y - 10);
  g.lineTo(x + 30, FLOOR_Y - 14);
  g.lineTo(x + 58, FLOOR_Y - 12);
  g.stroke();
}

export function pegboard(g: Ctx, x: number, y: number, w: number, h: number) {
  rect(g, x, y, w, h, "#121820");
  g.fillStyle = "#0b1015";
  for (let i = 12; i < w - 8; i += 20)
    for (let j = 12; j < h - 8; j += 20) {
      g.beginPath();
      g.arc(x + i, y + j, 2, 0, Math.PI * 2);
      g.fill();
    }
}

export function crib(g: Ctx, x: number) {
  g.strokeStyle = P.silhouette;
  g.lineWidth = 4;
  rect(g, x, FLOOR_Y - 70, 88, 6, P.silhouette);
  for (let i = 0; i <= 6; i++) {
    g.beginPath();
    g.moveTo(x + 4 + i * 13, FLOOR_Y - 64);
    g.lineTo(x + 4 + i * 13, FLOOR_Y - 8);
    g.stroke();
  }
  rect(g, x - 2, FLOOR_Y - 10, 92, 6, P.silhouette);
}

export function doorway(g: Ctx, x: number, litRoom = false) {
  rect(g, x, FLOOR_Y - 300, 96, 300, litRoom ? "#131a20" : P.void);
  rect(g, x - 8, FLOOR_Y - 306, 8, 306, "#0a0e11");
  rect(g, x + 96, FLOOR_Y - 306, 8, 306, "#0a0e11");
  rect(g, x - 8, FLOOR_Y - 306, 112, 8, "#0a0e11");
}

/* ------------------------------------------------------------- figures */
/**
 * Silhouette figures — INSIDE-style: pure black, slightly long-limbed,
 * readable posture, no faces. PLACEHOLDER proportions until reference
 * photos arrive; each is a closed polygon path at (x = feet-center).
 */

function poly(g: Ctx, pts: [number, number][], rim = false) {
  g.fillStyle = P.silhouette;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (const [px, py] of pts.slice(1)) g.lineTo(px, py);
  g.closePath();
  g.fill();
  if (rim) {
    g.strokeStyle = P.rim;
    g.lineWidth = 1.2;
    g.stroke();
  }
}

function head(g: Ctx, cx: number, cy: number, r: number, hair: "buzz" | "kid" | "swoop" | "bun" = "kid") {
  g.fillStyle = P.silhouette;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  if (hair === "swoop") {
    g.beginPath();
    g.arc(cx - r * 0.25, cy - r * 0.55, r * 0.75, Math.PI, Math.PI * 2);
    g.fill();
  }
  if (hair === "bun") {
    g.beginPath();
    g.arc(cx - r * 0.9, cy - r * 0.55, r * 0.42, 0, Math.PI * 2);
    g.fill();
  }
}

/** child kneeling/leaning over a low desk, drawing */
export function figKidDrawing(g: Ctx, x: number) {
  const dy = FLOOR_Y;
  poly(g, [
    [x - 20, dy],
    [x - 26, dy - 34],
    [x - 14, dy - 58],
    [x + 6, dy - 66],
    [x + 26, dy - 60],
    [x + 40, dy - 46], // reaching arm toward desk
    [x + 52, dy - 52],
    [x + 46, dy - 40],
    [x + 22, dy - 30],
    [x + 10, dy],
  ]);
  head(g, x + 6, FLOOR_Y - 82, 14, "kid");
}

/** teen at a chair/desk, hunched at a screen */
export function figTeenSitting(g: Ctx, x: number) {
  const dy = FLOOR_Y;
  poly(g, [
    [x - 8, dy],
    [x - 10, dy - 44],
    [x - 22, dy - 48],
    [x - 20, dy - 96],
    [x - 4, dy - 116],
    [x + 16, dy - 112],
    [x + 34, dy - 96], // arms toward keyboard
    [x + 52, dy - 84],
    [x + 50, dy - 76],
    [x + 26, dy - 80],
    [x + 10, dy - 60],
    [x + 12, dy - 44],
    [x + 6, dy],
  ]);
  head(g, x + 8, FLOOR_Y - 130, 15, "swoop");
}

/** marine standing — square shoulders, hands clasped behind */
export function figMarine(g: Ctx, x: number) {
  const dy = FLOOR_Y;
  poly(g, [
    [x - 16, dy],
    [x - 14, dy - 78],
    [x - 22, dy - 130],
    [x - 20, dy - 172],
    [x - 8, dy - 184],
    [x + 10, dy - 184],
    [x + 22, dy - 170],
    [x + 24, dy - 128],
    [x + 16, dy - 76],
    [x + 18, dy],
    [x + 6, dy],
    [x + 2, dy - 64],
    [x - 4, dy - 64],
    [x - 6, dy],
  ]);
  head(g, x + 1, FLOOR_Y - 198, 13, "buzz");
}

/** adult at modern desk — upright, one hand on mouse */
export function figAdultSitting(g: Ctx, x: number, tall = 1) {
  const dy = FLOOR_Y;
  const s = tall;
  poly(g, [
    [x - 8, dy],
    [x - 10, dy - 46 * s],
    [x - 20, dy - 52 * s],
    [x - 18, dy - 108 * s],
    [x - 2, dy - 128 * s],
    [x + 18, dy - 122 * s],
    [x + 40, dy - 100 * s],
    [x + 56, dy - 92 * s],
    [x + 54, dy - 84 * s],
    [x + 30, dy - 88 * s],
    [x + 14, dy - 66 * s],
    [x + 14, dy - 46 * s],
    [x + 6, dy],
  ]);
  head(g, x + 4, FLOOR_Y - 142 * s, 14, "swoop");
}

/** woman standing — relaxed, weight on one hip */
export function figWoman(g: Ctx, x: number, hair: "bun" | "swoop" = "bun") {
  const dy = FLOOR_Y;
  poly(g, [
    [x - 10, dy],
    [x - 8, dy - 70],
    [x - 16, dy - 120],
    [x - 12, dy - 160],
    [x - 2, dy - 172],
    [x + 12, dy - 168],
    [x + 18, dy - 154],
    [x + 16, dy - 118],
    [x + 10, dy - 70],
    [x + 14, dy],
    [x + 4, dy],
    [x + 2, dy - 56],
    [x - 2, dy - 56],
    [x - 4, dy],
  ]);
  head(g, x + 1, FLOOR_Y - 186, 12.5, hair);
}

/** woman holding an infant */
export function figWomanWithBaby(g: Ctx, x: number) {
  figWoman(g, x, "bun");
  // the small bundle, held high on the chest
  g.fillStyle = P.silhouette;
  g.beginPath();
  g.ellipse(x + 16, FLOOR_Y - 148, 13, 9, -0.4, 0, Math.PI * 2);
  g.fill();
  head(g, x + 26, FLOOR_Y - 154, 6, "kid");
}

/** toddler playing on the floor */
export function figToddler(g: Ctx, x: number) {
  const dy = FLOOR_Y;
  poly(g, [
    [x - 14, dy],
    [x - 12, dy - 26],
    [x - 2, dy - 34],
    [x + 10, dy - 30],
    [x + 20, dy - 18],
    [x + 26, dy - 4],
    [x + 18, dy],
  ]);
  head(g, x - 2, FLOOR_Y - 46, 11, "kid");
}

/** figure carrying a box */
export function figCarryingBox(g: Ctx, x: number, h = 1) {
  const dy = FLOOR_Y;
  poly(g, [
    [x - 12, dy],
    [x - 10, dy - 70 * h],
    [x - 16, dy - 120 * h],
    [x - 12, dy - 158 * h],
    [x + 2, dy - 168 * h],
    [x + 14, dy - 160 * h],
    [x + 18, dy - 120 * h],
    [x + 12, dy - 70 * h],
    [x + 16, dy],
    [x + 4, dy],
    [x + 2, dy - 56 * h],
    [x - 2, dy - 56 * h],
    [x - 4, dy],
  ]);
  head(g, x + 1, FLOOR_Y - 182 * h, 12 * h + 1, h > 0.9 ? "swoop" : "kid");
  // the box, held out front
  rect(g, x + 8, FLOOR_Y - 148 * h, 42 * h, 34 * h, "#12181d");
  (g.strokeStyle = "#0a0e11"), (g.lineWidth = 2);
  g.strokeRect(x + 8, FLOOR_Y - 148 * h, 42 * h, 34 * h);
}
