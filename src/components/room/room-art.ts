/**
 * THE ROOM — interim art pass, drawn in-engine.
 *
 * One fixed room shell (wall, floor, window left, door right), twelve
 * dressings. Props carry pseudo-3D shading + contact shadows; each era has
 * its own light grade; props settle in sequentially as the visitor scrolls
 * deeper into an era. A finished render (public/room/*.jpg) replaces an
 * era's canvas art automatically — this pass exists so the story is on
 * screen TODAY.
 *
 * Design space: 1600 × 900, scaled to cover the viewport.
 */

export type Ctx = CanvasRenderingContext2D;

export const DW = 1600;
export const DH = 900;
const FLOOR = 660;

/* ------------------------------------------------------------- helpers */

const SIL = "#0a0d10"; // silhouette/furniture core
const SIL_L = "#141a20"; // lit face
const SIL_D = "#05070a"; // shadow face

function rr(g: Ctx, x: number, y: number, w: number, h: number, c: string) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}

/** pseudo-3D box: front face + lighter top + darker right side */
function box3d(g: Ctx, x: number, y: number, w: number, h: number, d = 10, front = SIL, lit = SIL_L) {
  rr(g, x + d, y - d, w, d, lit); // top, offset back-right
  g.fillStyle = SIL_D;
  g.beginPath();
  g.moveTo(x + w, y);
  g.lineTo(x + w + d, y - d);
  g.lineTo(x + w + d, y + h - d);
  g.lineTo(x + w, y + h);
  g.closePath();
  g.fill();
  rr(g, x, y, w, h, front);
}

function contact(g: Ctx, cx: number, w: number, a = 0.5) {
  const grad = g.createRadialGradient(cx, FLOOR + 8, 2, cx, FLOOR + 8, w);
  grad.addColorStop(0, `rgba(0,0,0,${a})`);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(cx, FLOOR + 8, w, w * 0.16, 0, 0, Math.PI * 2);
  g.fill();
}

/* ----------------------------------------------------------- the shell */

export function drawShell(g: Ctx, time: number, grade: [string, string], shaft: number) {
  // back wall
  const wall = g.createLinearGradient(0, 60, 0, FLOOR);
  wall.addColorStop(0, "#0a0e12");
  wall.addColorStop(0.5, grade[0]);
  wall.addColorStop(1, "#0d1216");
  g.fillStyle = wall;
  g.fillRect(0, 0, DW, FLOOR);
  // baseboard
  rr(g, 0, FLOOR - 14, DW, 14, "#080b0e");
  // floor with slight perspective sheen
  const fl = g.createLinearGradient(0, FLOOR, 0, DH);
  fl.addColorStop(0, grade[1]);
  fl.addColorStop(1, "#07090c");
  g.fillStyle = fl;
  g.fillRect(0, FLOOR, DW, DH - FLOOR);
  // floorboards, receding
  g.strokeStyle = "rgba(0,0,0,0.35)";
  g.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const y = FLOOR + 18 + i * ((DH - FLOOR) / 8.2);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(DW, y);
    g.stroke();
  }

  // window (left) — fixed forever
  rr(g, 176, 176, 268, 320, "#05070a"); // frame recess
  const sky = g.createLinearGradient(0, 184, 0, 488);
  sky.addColorStop(0, `rgba(172,196,204,${0.34 * shaft + 0.08})`);
  sky.addColorStop(1, `rgba(150,176,186,${0.16 * shaft + 0.04})`);
  g.fillStyle = sky;
  g.fillRect(188, 188, 244, 296);
  rr(g, 304, 188, 8, 296, "#05070a");
  rr(g, 188, 330, 244, 8, "#05070a");
  // volumetric shaft
  const sh = g.createLinearGradient(220, 200, 700, FLOOR + 120);
  sh.addColorStop(0, `rgba(172,196,204,${0.16 * shaft})`);
  sh.addColorStop(1, "rgba(172,196,204,0)");
  g.fillStyle = sh;
  g.beginPath();
  g.moveTo(190, 190);
  g.lineTo(432, 190);
  g.lineTo(860, FLOOR + 140);
  g.lineTo(300, FLOOR + 140);
  g.closePath();
  g.fill();

  // door (right) — fixed forever
  rr(g, 1330, FLOOR - 388, 118, 388, "#0b0f13");
  g.strokeStyle = "#05070a";
  g.lineWidth = 6;
  g.strokeRect(1330, FLOOR - 388, 118, 388);
  g.fillStyle = "#151b21";
  g.beginPath();
  g.arc(1352, FLOOR - 196, 5, 0, Math.PI * 2);
  g.fill();

  // dust motes in the shaft
  g.fillStyle = "rgba(190,205,210,0.28)";
  for (let i = 0; i < 26; i++) {
    const mx = 240 + ((i * 97) % 520);
    const my = 220 + ((i * 61) % 380) + Math.sin(time * 0.4 + i) * 10;
    g.beginPath();
    g.arc(mx + Math.sin(time * 0.25 + i * 2) * 7, my, 1 + (i % 2), 0, Math.PI * 2);
    g.fill();
  }
}

function lampGlow(g: Ctx, x: number, y: number, r: number, a: number) {
  const grad = g.createRadialGradient(x, y, 4, x, y, r);
  grad.addColorStop(0, `rgba(206,162,94,${a})`);
  grad.addColorStop(1, "rgba(206,162,94,0)");
  g.fillStyle = grad;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

function screenGlow(g: Ctx, x: number, y: number, r: number, a: number, warm = false) {
  const c = warm ? "206,162,94" : "150,186,205";
  const grad = g.createRadialGradient(x, y, 3, x, y, r);
  grad.addColorStop(0, `rgba(${c},${a})`);
  grad.addColorStop(1, `rgba(${c},0)`);
  g.fillStyle = grad;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

/* -------------------------------------------------------------- props */

function crib(g: Ctx, x: number) {
  contact(g, x + 70, 100);
  box3d(g, x, FLOOR - 96, 140, 10, 8);
  for (let i = 0; i <= 8; i++) rr(g, x + 4 + i * 16.5, FLOOR - 86, 5, 74, SIL);
  box3d(g, x - 4, FLOOR - 14, 150, 14, 8);
  rr(g, x + 10, FLOOR - 106, 120, 12, "#11171c"); // bedding line
}

function mobile(g: Ctx, x: number, time: number) {
  g.strokeStyle = SIL;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x, FLOOR - 340);
  g.lineTo(x, FLOOR - 300);
  g.stroke();
  g.beginPath();
  g.moveTo(x - 44, FLOOR - 296);
  g.lineTo(x + 44, FLOOR - 296);
  g.stroke();
  for (let i = 0; i < 3; i++) {
    const mx = x - 40 + i * 40;
    const sway = Math.sin(time * 0.7 + i * 1.6) * 3;
    g.beginPath();
    g.moveTo(mx, FLOOR - 294);
    g.lineTo(mx + sway, FLOOR - 272);
    g.stroke();
    g.fillStyle = SIL;
    g.beginPath();
    g.arc(mx + sway, FLOOR - 264, 7, 0, Math.PI * 2);
    g.fill();
  }
}

function rocker(g: Ctx, x: number) {
  contact(g, x + 40, 70);
  g.strokeStyle = SIL;
  g.lineWidth = 7;
  g.beginPath();
  g.arc(x + 40, FLOOR - 26, 52, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
  box3d(g, x + 8, FLOOR - 70, 64, 12, 8);
  box3d(g, x + 8, FLOOR - 150, 14, 84, 6);
}

function kidDesk(g: Ctx, x: number) {
  contact(g, x + 90, 110);
  box3d(g, x, FLOOR - 78, 180, 12, 12);
  rr(g, x + 10, FLOOR - 66, 10, 66, SIL);
  rr(g, x + 158, FLOOR - 66, 10, 66, SIL);
  // paper + crayons
  rr(g, x + 60, FLOOR - 84, 52, 6, "#1c242b");
  for (let i = 0; i < 4; i++) rr(g, x + 124 + i * 12, FLOOR - 82, 8, 4, "#151b20");
}

function tapedDrawings(g: Ctx, x: number, y: number, n: number) {
  const spots: [number, number, number, number][] = [
    [0, 0, 64, 50],
    [84, 22, 50, 42],
    [-8, 66, 46, 54],
    [70, 84, 58, 44],
  ];
  for (let i = 0; i < Math.min(n, spots.length); i++) {
    const [dx, dy, w, h] = spots[i];
    rr(g, x + dx, y + dy, w, h, "#1a2128");
    g.strokeStyle = "#242d35";
    g.lineWidth = 2;
    g.strokeRect(x + dx, y + dy, w, h);
    // the rocket lives on the first sheet, always
    if (i === 0) {
      g.strokeStyle = "#39454e";
      g.beginPath();
      g.moveTo(x + dx + 20, y + dy + 38);
      g.lineTo(x + dx + 32, y + dy + 12);
      g.lineTo(x + dx + 44, y + dy + 38);
      g.stroke();
    }
  }
}

function bigDesk(g: Ctx, x: number, w: number) {
  contact(g, x + w / 2, w * 0.62);
  box3d(g, x, FLOOR - 92, w, 14, 14);
  rr(g, x + 12, FLOOR - 78, 12, 78, SIL);
  rr(g, x + w - 24, FLOOR - 78, 12, 78, SIL);
  box3d(g, x + w - 78, FLOOR - 78, 54, 58, 8, SIL_L);
}

function chair(g: Ctx, x: number, modern = false) {
  contact(g, x + 24, 42, 0.4);
  if (modern) {
    rr(g, x + 18, FLOOR - 12, 12, 12, SIL);
    g.strokeStyle = SIL;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(x + 24, FLOOR - 12);
    g.lineTo(x + 24, FLOOR - 56);
    g.stroke();
    box3d(g, x, FLOOR - 66, 48, 10, 8);
    box3d(g, x + 34, FLOOR - 122, 12, 58, 6);
  } else {
    box3d(g, x, FLOOR - 56, 46, 8, 8);
    rr(g, x + 4, FLOOR - 48, 7, 48, SIL);
    rr(g, x + 36, FLOOR - 48, 7, 48, SIL);
    box3d(g, x + 34, FLOOR - 112, 10, 56, 5);
  }
}

function crtSetup(g: Ctx, x: number, on: number) {
  box3d(g, x, FLOOR - 148, 66, 56, 12, "#0d1216");
  if (on > 0) {
    rr(g, x + 8, FLOOR - 140, 50, 40, `rgba(150,186,205,${0.75 * on})`);
    screenGlow(g, x + 33, FLOOR - 120, 120, 0.3 * on);
  }
  box3d(g, x + 14, FLOOR - 92, 38, 8, 6); // keyboard
}

function imac(g: Ctx, x: number, on: number, warm = false) {
  box3d(g, x, FLOOR - 158, 88, 58, 8, "#10161c");
  if (on > 0) {
    rr(g, x + 6, FLOOR - 152, 76, 46, warm ? `rgba(206,162,94,${0.8 * on})` : `rgba(150,186,205,${0.8 * on})`);
    screenGlow(g, x + 44, FLOOR - 128, 150, 0.32 * on, warm);
  }
  rr(g, x + 38, FLOOR - 100, 12, 10, SIL);
  box3d(g, x + 24, FLOOR - 90, 40, 5, 4);
}

function easelProp(g: Ctx, x: number) {
  contact(g, x + 48, 66);
  g.strokeStyle = SIL;
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(x, FLOOR);
  g.lineTo(x + 48, FLOOR - 190);
  g.lineTo(x + 96, FLOOR);
  g.moveTo(x + 48, FLOOR - 190);
  g.lineTo(x + 48, FLOOR - 40);
  g.stroke();
  box3d(g, x - 2, FLOOR - 150, 104, 80, 6, "#161d23");
  // charcoal figure study
  g.strokeStyle = "#2b353d";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(x + 50, FLOOR - 128, 9, 0, Math.PI * 2);
  g.moveTo(x + 50, FLOOR - 118);
  g.quadraticCurveTo(x + 42, FLOOR - 100, x + 52, FLOOR - 84);
  g.stroke();
}

function rack(g: Ctx, x: number) {
  contact(g, x + 110, 130);
  box3d(g, x, FLOOR - 58, 220, 14, 12);
  rr(g, x + 6, FLOOR - 44, 9, 44, SIL);
  rr(g, x + 205, FLOOR - 44, 9, 44, SIL);
  rr(g, x + 10, FLOOR - 70, 200, 12, "#131a20"); // blanket, tight
  rr(g, x + 16, FLOOR - 78, 44, 10, "#181f26"); // pillow
}

function footlockerP(g: Ctx, x: number) {
  contact(g, x + 44, 58);
  box3d(g, x, FLOOR - 40, 88, 40, 10, "#0c1116");
  rr(g, x + 36, FLOOR - 34, 16, 7, "#1a222a");
}

function camisRod(g: Ctx, x: number) {
  rr(g, x, FLOOR - 300, 132, 5, SIL);
  for (let i = 0; i < 3; i++) {
    const hx = x + 22 + i * 42;
    g.strokeStyle = SIL;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(hx, FLOOR - 295);
    g.lineTo(hx, FLOOR - 282);
    g.stroke();
    g.fillStyle = i === 1 ? "#131a15" : "#10161a";
    g.beginPath();
    g.moveTo(hx - 16, FLOOR - 282);
    g.lineTo(hx + 16, FLOOR - 282);
    g.lineTo(hx + 12, FLOOR - 168);
    g.lineTo(hx - 12, FLOOR - 168);
    g.closePath();
    g.fill();
  }
}

function flagFolded(g: Ctx, x: number, y: number) {
  g.fillStyle = "#131a22";
  g.beginPath();
  g.moveTo(x, y + 26);
  g.lineTo(x + 62, y + 26);
  g.lineTo(x + 31, y);
  g.closePath();
  g.fill();
  g.strokeStyle = "#1d2733";
  g.lineWidth = 2;
  g.stroke();
}

function nikon(g: Ctx, x: number, y: number) {
  box3d(g, x, y - 22, 46, 22, 6, "#0c1014");
  g.fillStyle = "#141a20";
  g.beginPath();
  g.arc(x + 23, y - 11, 9, 0, Math.PI * 2);
  g.fill();
  rr(g, x + 8, y - 27, 14, 6, "#0c1014");
}

function wireframeGrid(g: Ctx, x: number, y: number) {
  for (let i = 0; i < 6; i++) {
    const gx = x + (i % 3) * 62;
    const gy = y + Math.floor(i / 3) * 78;
    rr(g, gx, gy, 50, 64, "#161d24");
    rr(g, gx + 6, gy + 8, 38, 6, "#222b33");
    rr(g, gx + 6, gy + 20, 28, 4, "#1d252d");
    rr(g, gx + 6, gy + 48, 22, 8, "#242e37");
  }
}

function dualMonitors(g: Ctx, x: number, on: number) {
  for (let i = 0; i < 2; i++) {
    const mx = x + i * 104;
    box3d(g, mx, FLOOR - 168, 92, 56, 6, "#10161c");
    if (on > 0) {
      rr(g, mx + 5, FLOOR - 163, 82, 46, `rgba(150,186,205,${(0.55 + i * 0.2) * on})`);
    }
    rr(g, mx + 40, FLOOR - 112, 12, 8, SIL);
  }
  if (on > 0) screenGlow(g, x + 100, FLOOR - 130, 190, 0.3 * on);
}

function wwdcBadge(g: Ctx, x: number, y: number) {
  rr(g, x - 4, y - 4, 52, 66, "#0a0e12");
  rr(g, x, y, 44, 58, "#141b22");
  rr(g, x + 8, y + 10, 28, 22, "rgba(150,186,205,0.4)");
  rr(g, x + 8, y + 40, 28, 4, "#232c34");
}

function scooterProp(g: Ctx, x: number) {
  contact(g, x + 36, 60, 0.45);
  g.strokeStyle = "#0e1318";
  g.lineWidth = 6;
  g.beginPath();
  g.arc(x, FLOOR - 11, 11, 0, Math.PI * 2);
  g.arc(x + 70, FLOOR - 11, 11, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(x + 70, FLOOR - 11);
  g.lineTo(x + 70, FLOOR - 120);
  g.moveTo(x + 52, FLOOR - 128);
  g.lineTo(x + 88, FLOOR - 128);
  g.moveTo(x, FLOOR - 11);
  g.lineTo(x + 34, FLOOR - 16);
  g.lineTo(x + 64, FLOOR - 13);
  g.stroke();
}

function toys(g: Ctx, x: number) {
  rr(g, x, FLOOR - 12, 20, 12, "#12181e");
  g.fillStyle = "#161d24";
  g.beginPath();
  g.arc(x + 40, FLOOR - 9, 9, 0, Math.PI * 2);
  g.fill();
  rr(g, x + 62, FLOOR - 18, 14, 18, "#10161c");
}

function boxStack(g: Ctx, x: number, n: number) {
  for (let i = 0; i < n; i++) {
    const bx = x + Math.floor(i / 2) * 84 + (i % 2) * 8;
    const by = FLOOR - 52 - (i % 2) * 48;
    contact(g, bx + 38, 56, i % 2 ? 0 : 0.5);
    box3d(g, bx, by, 76, 48, 12, "#11171d");
    g.strokeStyle = "#080b0e";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(bx, by + 10);
    g.lineTo(bx + 76, by + 10);
    g.stroke();
  }
}

function ghostFrames(g: Ctx) {
  // lighter paint where the frames hung, all these years
  const spots: [number, number, number, number][] = [
    [560, 220, 76, 96],
    [672, 250, 56, 72],
    [960, 230, 88, 66],
    [1090, 260, 54, 68],
  ];
  for (const [x, y, w, h] of spots) rr(g, x, y, w, h, "#1c242b");
}

function workbench(g: Ctx, x: number) {
  contact(g, x + 170, 200);
  box3d(g, x, FLOOR - 96, 340, 16, 16, "#0e1419");
  rr(g, x + 14, FLOOR - 80, 14, 80, SIL);
  rr(g, x + 312, FLOOR - 80, 14, 80, SIL);
  box3d(g, x + 20, FLOOR - 52, 300, 8, 8, "#0c1116");
}

function pegboardP(g: Ctx, x: number, y: number) {
  rr(g, x, y, 360, 190, "#121921");
  g.fillStyle = "#0b1015";
  for (let i = 14; i < 350; i += 22)
    for (let j = 14; j < 180; j += 22) {
      g.beginPath();
      g.arc(x + i, y + j, 2, 0, Math.PI * 2);
      g.fill();
    }
  // tools + the kids' rockets, side by side
  rr(g, x + 250, y + 30, 8, 54, SIL);
  rr(g, x + 280, y + 26, 8, 60, SIL);
  tapedDrawings(g, x + 24, y + 26, 2);
}

function manuscripts(g: Ctx, x: number) {
  for (let i = 0; i < 4; i++) box3d(g, x + (i % 2) * 5, FLOOR - 104 - i * 11, 76, 11, 6, "#11181e");
}

function palmShadow(g: Ctx, time: number) {
  g.save();
  g.globalAlpha = 0.5;
  g.fillStyle = "#080b0d";
  const sway = Math.sin(time * 0.5) * 6;
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.ellipse(320 + sway, 300, 90, 12, (i / 5) * Math.PI - 0.35, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/* ------------------------------------------------------------- figures */

function headC(g: Ctx, cx: number, cy: number, r: number) {
  g.fillStyle = SIL;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
}

function figKid(g: Ctx, x: number) {
  contact(g, x, 34, 0.45);
  g.fillStyle = SIL;
  g.beginPath();
  g.moveTo(x - 18, FLOOR);
  g.quadraticCurveTo(x - 24, FLOOR - 42, x - 8, FLOOR - 58);
  g.quadraticCurveTo(x + 8, FLOOR - 66, x + 22, FLOOR - 54);
  g.lineTo(x + 42, FLOOR - 44); // arm to the desk
  g.lineTo(x + 40, FLOOR - 36);
  g.lineTo(x + 18, FLOOR - 30);
  g.quadraticCurveTo(x + 12, FLOOR - 12, x + 8, FLOOR);
  g.closePath();
  g.fill();
  headC(g, x + 4, FLOOR - 78, 13);
}

function figSeated(g: Ctx, x: number, h = 1) {
  contact(g, x, 36, 0.4);
  g.fillStyle = SIL;
  g.beginPath();
  g.moveTo(x - 8, FLOOR);
  g.lineTo(x - 10, FLOOR - 46 * h);
  g.quadraticCurveTo(x - 22, FLOOR - 54 * h, x - 18, FLOOR - 102 * h);
  g.quadraticCurveTo(x - 12, FLOOR - 124 * h, x + 6, FLOOR - 122 * h);
  g.quadraticCurveTo(x + 24, FLOOR - 114 * h, x + 38, FLOOR - 96 * h);
  g.lineTo(x + 54, FLOOR - 88 * h);
  g.lineTo(x + 52, FLOOR - 80 * h);
  g.lineTo(x + 28, FLOOR - 84 * h);
  g.lineTo(x + 12, FLOOR - 52 * h);
  g.lineTo(x + 8, FLOOR);
  g.closePath();
  g.fill();
  headC(g, x + 2, FLOOR - 136 * h, 13);
}

function figMarineP(g: Ctx, x: number) {
  contact(g, x, 34, 0.45);
  g.fillStyle = SIL;
  g.beginPath();
  g.moveTo(x - 15, FLOOR);
  g.lineTo(x - 13, FLOOR - 76);
  g.lineTo(x - 20, FLOOR - 126);
  g.lineTo(x - 18, FLOOR - 168);
  g.quadraticCurveTo(x, FLOOR - 182, x + 18, FLOOR - 168);
  g.lineTo(x + 20, FLOOR - 124);
  g.lineTo(x + 13, FLOOR - 74);
  g.lineTo(x + 15, FLOOR);
  g.lineTo(x + 5, FLOOR);
  g.lineTo(x + 1, FLOOR - 60);
  g.lineTo(x - 3, FLOOR - 60);
  g.lineTo(x - 5, FLOOR);
  g.closePath();
  g.fill();
  headC(g, x, FLOOR - 194, 12);
}

function figWomanP(g: Ctx, x: number) {
  contact(g, x, 30, 0.4);
  g.fillStyle = SIL;
  g.beginPath();
  g.moveTo(x - 9, FLOOR);
  g.lineTo(x - 7, FLOOR - 68);
  g.quadraticCurveTo(x - 16, FLOOR - 110, x - 11, FLOOR - 152);
  g.quadraticCurveTo(x, FLOOR - 166, x + 11, FLOOR - 150);
  g.quadraticCurveTo(x + 16, FLOOR - 108, x + 9, FLOOR - 66);
  g.lineTo(x + 13, FLOOR);
  g.lineTo(x + 3, FLOOR);
  g.lineTo(x + 1, FLOOR - 54);
  g.lineTo(x - 3, FLOOR - 54);
  g.lineTo(x - 5, FLOOR);
  g.closePath();
  g.fill();
  headC(g, x, FLOOR - 178, 12);
  headC(g, x - 10, FLOOR - 186, 5); // bun
}

function figWomanBaby(g: Ctx, x: number) {
  figWomanP(g, x);
  g.fillStyle = SIL;
  g.beginPath();
  g.ellipse(x + 14, FLOOR - 138, 13, 9, -0.4, 0, Math.PI * 2);
  g.fill();
  headC(g, x + 24, FLOOR - 144, 6);
}

function figToddlerP(g: Ctx, x: number) {
  contact(g, x, 22, 0.4);
  g.fillStyle = SIL;
  g.beginPath();
  g.moveTo(x - 13, FLOOR);
  g.quadraticCurveTo(x - 12, FLOOR - 28, x, FLOOR - 33);
  g.quadraticCurveTo(x + 14, FLOOR - 28, x + 22, FLOOR - 12);
  g.lineTo(x + 24, FLOOR);
  g.closePath();
  g.fill();
  headC(g, x - 2, FLOOR - 45, 10);
}

/* ---------------------------------------------------------- era scenes */
/**
 * Each era = ordered dressing steps. Step i settles in when
 * settle > i/(steps). Draw order = z order.
 */

type Step = (g: Ctx, time: number) => void;

const SCENES: Record<string, { grade: [string, string]; shaft: number; lamp?: [number, number]; steps: Step[] }> = {
  birth: {
    grade: ["#131a1e", "#10161a"],
    shaft: 1,
    lamp: [1180, FLOOR - 130],
    steps: [
      (g) => crib(g, 1080),
      (g, t) => mobile(g, 1150, t),
      (g) => rocker(g, 820),
      (g) => rr(g, 560, FLOOR - 8, 260, 8, "#11171c"), // rug line
    ],
  },
  kid: {
    grade: ["#141a1e", "#10161a"],
    shaft: 0.9,
    lamp: [760, FLOOR - 140],
    steps: [
      (g) => kidDesk(g, 560),
      (g) => tapedDrawings(g, 600, 250, 4),
      (g) => {
        contact(g, 1120, 80);
        box3d(g, 1050, FLOOR - 64, 140, 64, 12, "#0d1318");
      }, // toy box
      (g) => {
        for (let i = 0; i < 5; i++) rr(g, 880 + i * 26, FLOOR - 6, 16, 5, "#141a20");
      },
    ],
  },
  middleschool: {
    grade: ["#12181d", "#0f1519"],
    shaft: 0.65,
    steps: [
      (g) => bigDesk(g, 560, 260),
      (g) => crtSetup(g, 620, 1),
      (g) => chair(g, 560),
      (g) => {
        rr(g, 980, 210, 84, 110, "#161d24");
        rr(g, 1090, 240, 64, 86, "#161d24");
      },
      (g) => {
        contact(g, 1200, 120);
        box3d(g, 1120, FLOOR - 60, 170, 60, 12, "#0d1318");
      },
    ],
  },
  highschool: {
    grade: ["#12181d", "#0f1519"],
    shaft: 0.6,
    steps: [
      (g) => bigDesk(g, 560, 280),
      (g) => crtSetup(g, 640, 1),
      (g) => chair(g, 560),
      (g) => {
        rr(g, 950, 200, 90, 120, "#161d24");
        rr(g, 1064, 236, 70, 96, "#161d24");
        rr(g, 900, 250, 40, 60, "#161d24");
      },
      // two jackets on the chair — she's here now
      (g) => {
        g.fillStyle = "#10161c";
        g.beginPath();
        g.moveTo(590, FLOOR - 118);
        g.quadraticCurveTo(608, FLOOR - 128, 622, FLOOR - 114);
        g.lineTo(618, FLOOR - 60);
        g.lineTo(596, FLOOR - 60);
        g.closePath();
        g.fill();
        g.fillStyle = "#141a22";
        g.beginPath();
        g.moveTo(600, FLOOR - 124);
        g.quadraticCurveTo(616, FLOOR - 134, 630, FLOOR - 120);
        g.lineTo(626, FLOOR - 70);
        g.lineTo(606, FLOOR - 70);
        g.closePath();
        g.fill();
      },
      (g) => {
        rr(g, 470, FLOOR - 98, 13, 98, SIL);
        contact(g, 478, 30, 0.4);
      }, // skateboard
      // photo-booth strip taped to the monitor
      (g) => {
        rr(g, 700, FLOOR - 146, 12, 40, "#1d252d");
      },
    ],
  },
  artschool: {
    grade: ["#151b1e", "#11171b"],
    shaft: 0.8,
    lamp: [1060, FLOOR - 150],
    steps: [
      (g) => easelProp(g, 600),
      (g) => bigDesk(g, 800, 240),
      (g) => {
        g.strokeStyle = SIL;
        g.lineWidth = 9;
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.moveTo(480 + i * 18, FLOOR);
          g.lineTo(512 + i * 18, FLOOR - 156);
          g.stroke();
        }
      }, // poster tubes
      (g) => {
        rr(g, 920, 236, 64, 84, "#161d24");
        rr(g, 1006, 260, 74, 54, "#161d24");
      },
    ],
  },
  corps: {
    grade: ["#10161b", "#0d1317"],
    shaft: 1,
    steps: [
      (g) => rack(g, 480),
      (g) => footlockerP(g, 740),
      (g) => camisRod(g, 880),
      (g) => flagFolded(g, 600, 226),
      (g) => bigDesk(g, 1060, 220),
      (g) => nikon(g, 1120, FLOOR - 92),
      // the wedding photo, small on the desk — June 2008
      (g) => {
        rr(g, 1220, FLOOR - 118, 22, 26, "#1a222a");
      },
      (g) => {
        rr(g, 500, FLOOR - 12, 30, 12, SIL);
        rr(g, 540, FLOOR - 12, 30, 12, SIL);
      }, // boots, squared
    ],
  },
  gunner: {
    grade: ["#10161b", "#0d1317"],
    shaft: 0.8,
    lamp: [700, FLOOR - 130],
    steps: [
      (g) => rack(g, 480),
      (g) => camisRod(g, 880),
      (g) => bigDesk(g, 1060, 220),
      (g) => nikon(g, 1120, FLOOR - 92),
      // the crib comes back — same corner it started in
      (g) => crib(g, 1080),
      (g, t) => mobile(g, 1150, t),
      (g) => rocker(g, 700),
      (g) => figWomanBaby(g, 900),
    ],
  },
  la: {
    grade: ["#181d1c", "#12171a"],
    shaft: 1,
    steps: [
      (g, t) => palmShadow(g, t),
      (g) => bigDesk(g, 560, 300),
      (g) => imac(g, 650, 1),
      (g) => chair(g, 560, true),
      (g) => wireframeGrid(g, 900, 230),
      // toddler bed in the crib corner now
      (g) => {
        contact(g, 1180, 90);
        box3d(g, 1100, FLOOR - 46, 170, 12, 10);
        rr(g, 1106, FLOOR - 34, 158, 34, "#11171d");
        box3d(g, 1096, FLOOR - 72, 12, 60, 5);
      },
      (g) => figToddlerP(g, 980),
    ],
  },
  remote: {
    grade: ["#12181d", "#0f1519"],
    shaft: 0.7,
    lamp: [1240, FLOOR - 150],
    steps: [
      (g) => bigDesk(g, 540, 320),
      (g) => dualMonitors(g, 590, 1),
      (g) => chair(g, 520, true),
      (g) => wwdcBadge(g, 960, 232),
      (g) => scooterProp(g, 1060),
      (g) => toys(g, 900),
      (g) => figToddlerP(g, 860),
    ],
  },
  nolan: {
    grade: ["#12181d", "#0f1519"],
    shaft: 0.6,
    lamp: [700, FLOOR - 130],
    steps: [
      (g) => bigDesk(g, 540, 320),
      (g) => dualMonitors(g, 590, 0.5),
      (g) => chair(g, 700, true), // the chair, turned toward the crib
      // the crib — third time, same corner
      (g) => crib(g, 1080),
      (g, t) => mobile(g, 1150, t),
      (g) => figWomanBaby(g, 990),
      (g) => toys(g, 900),
      (g) => toys(g, 990),
      (g) => figToddlerP(g, 940),
    ],
  },
  move: {
    grade: ["#11161a", "#0e1317"],
    shaft: 0.5,
    steps: [
      (g) => ghostFrames(g),
      (g) => boxStack(g, 520, 5),
      (g) => boxStack(g, 860, 3),
      (g) => boxStack(g, 1050, 2),
      // the crib corner: empty, a dust outline where it stood
      (g) => {
        g.strokeStyle = "rgba(190,205,210,0.10)";
        g.lineWidth = 3;
        g.strokeRect(1080, FLOOR - 8, 150, 6);
      },
      (g) => figWomanP(g, 760),
      (g) => figToddlerP(g, 860),
    ],
  },
  home: {
    grade: ["#171a17", "#10151a"],
    shaft: 0.45,
    lamp: [1000, FLOOR - 160],
    steps: [
      (g) => pegboardP(g, 540, 210),
      (g) => workbench(g, 520),
      (g) => imac(g, 640, 1, true),
      (g) => manuscripts(g, 900),
      (g) => {
        // porch light through the window — warm now, for the first time
        const grad = g.createLinearGradient(220, 200, 620, FLOOR);
        grad.addColorStop(0, "rgba(206,162,94,0.13)");
        grad.addColorStop(1, "rgba(206,162,94,0)");
        g.fillStyle = grad;
        g.beginPath();
        g.moveTo(190, 190);
        g.lineTo(432, 190);
        g.lineTo(800, FLOOR + 120);
        g.lineTo(300, FLOOR + 120);
        g.closePath();
        g.fill();
      },
      (g) => figWomanP(g, 1380),
      (g) => figToddlerP(g, 1430),
    ],
  },
};

/* ------------------------------------------------------------ the draw */

/**
 * settle 0..1 — how deep into the era the visitor has scrolled; dressing
 * steps appear one by one with a soft drop.
 */
export function drawRoom(g: Ctx, eraId: string, time: number, settle: number) {
  const scene = SCENES[eraId] ?? SCENES.birth;
  drawShell(g, time, scene.grade, scene.shaft);

  const n = scene.steps.length;
  for (let i = 0; i < n; i++) {
    const at = i / n;
    const k = Math.min(Math.max((settle - at) / 0.14, 0), 1);
    if (k <= 0) continue;
    g.save();
    g.globalAlpha = k;
    if (k < 1) g.translate(0, (1 - k) * -10); // settle down into place
    scene.steps[i](g, time);
    g.restore();
  }

  if (scene.lamp) lampGlow(g, scene.lamp[0], scene.lamp[1], 190, 0.4);
}

/* ------------------------------------------------------------ the player */

export const FLOOR_Y = FLOOR;

export type Archetype = "kid" | "teen" | "marine" | "adult";

const ARCH: Record<Archetype, { h: number; head: number; shoulder: number }> = {
  kid: { h: 74, head: 11, shoulder: 14 },
  teen: { h: 118, head: 12, shoulder: 17 },
  marine: { h: 132, head: 12, shoulder: 22 },
  adult: { h: 128, head: 13, shoulder: 19 },
};

/**
 * The playable silhouette. walk = phase (advance while moving), facing ±1.
 * Pure black against the light — posture over face, INSIDE-style.
 */
export function drawPlayer(
  g: Ctx,
  x: number,
  arch: Archetype,
  facing: number,
  walk: number,
  moving: boolean
) {
  const a = ARCH[arch];
  const bob = moving ? Math.abs(Math.sin(walk * 2)) * 3 : 0;
  const hipY = FLOOR - a.h * 0.48 - bob;
  const shY = FLOOR - a.h * 0.88 - bob;

  contact(g, x, a.shoulder * 2.2, 0.5);
  g.save();
  g.translate(x, 0);
  g.scale(facing, 1);

  // legs
  const swing = moving ? Math.sin(walk) * a.h * 0.16 : 0;
  g.strokeStyle = SIL;
  g.lineWidth = Math.max(6, a.shoulder * 0.5);
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(0, hipY);
  g.lineTo(swing, FLOOR - 2);
  g.moveTo(0, hipY);
  g.lineTo(-swing * 0.9, FLOOR - 2);
  g.stroke();

  // torso — slight taper, slight lean when moving
  const lean = moving ? 3 : 0;
  g.fillStyle = SIL;
  g.beginPath();
  g.moveTo(-a.shoulder * 0.62, hipY);
  g.quadraticCurveTo(-a.shoulder * 0.8, (hipY + shY) / 2, -a.shoulder * 0.72 + lean, shY);
  g.lineTo(a.shoulder * 0.72 + lean, shY);
  g.quadraticCurveTo(a.shoulder * 0.8, (hipY + shY) / 2, a.shoulder * 0.62, hipY);
  g.closePath();
  g.fill();

  // arms — subtle counterswing
  const armSwing = moving ? Math.sin(walk + Math.PI) * a.h * 0.1 : 2;
  g.lineWidth = Math.max(5, a.shoulder * 0.34);
  g.beginPath();
  g.moveTo(-a.shoulder * 0.5 + lean, shY + 6);
  g.lineTo(-a.shoulder * 0.42 + armSwing, hipY + 4);
  g.moveTo(a.shoulder * 0.5 + lean, shY + 6);
  g.lineTo(a.shoulder * 0.42 - armSwing, hipY + 4);
  g.stroke();

  // head
  g.beginPath();
  g.arc(lean, shY - a.head - 3 , a.head, 0, Math.PI * 2);
  g.fill();
  if (arch === "teen" || arch === "adult") {
    // a little hair sweep
    g.beginPath();
    g.arc(lean - a.head * 0.3, shY - a.head * 1.45, a.head * 0.62, Math.PI, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** pulsing interaction marker above a world point */
export function drawMarker(g: Ctx, x: number, y: number, time: number, near: boolean) {
  const pulse = 0.5 + Math.sin(time * 3) * 0.25;
  const a = near ? 0.95 : 0.45 * pulse + 0.2;
  g.fillStyle = `rgba(200,162,75,${a})`;
  g.beginPath();
  g.moveTo(x, y + 7);
  g.lineTo(x - 6, y - 4);
  g.lineTo(x + 6, y - 4);
  g.closePath();
  g.fill();
  if (near) {
    const grad = g.createRadialGradient(x, y, 2, x, y, 46);
    grad.addColorStop(0, "rgba(200,162,75,0.25)");
    grad.addColorStop(1, "rgba(200,162,75,0)");
    g.fillStyle = grad;
    g.fillRect(x - 46, y - 46, 92, 92);
  }
}

/** in-canvas interaction prompt: key cap + label */
export function drawPrompt(g: Ctx, x: number, y: number, label: string) {
  g.font = "600 15px ui-monospace, monospace";
  const w = g.measureText(label).width;
  const total = w + 46;
  const bx = x - total / 2;
  g.fillStyle = "rgba(4,6,8,0.82)";
  g.fillRect(bx, y - 34, total, 26);
  g.strokeStyle = "rgba(200,162,75,0.9)";
  g.lineWidth = 1.5;
  g.strokeRect(bx + 6, y - 30, 18, 18);
  g.fillStyle = "#e2c078";
  g.fillText("E", bx + 11, y - 16);
  g.fillStyle = "#cfd8db";
  g.fillText(label, bx + 34, y - 15);
}
