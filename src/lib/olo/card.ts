import type { Stats } from "./analyze";

/**
 * Draws the portrait as a 1080×1350 PNG in the browser and hands it back as a
 * blob URL. Uses the page's own fonts (the next/font families on the root
 * element) once they are loaded. Nothing is uploaded; the canvas is local.
 */
export async function renderPortraitCard(stats: Stats, lines: string[], source: string): Promise<string> {
  const W = 1080;
  const H = 1350;
  const cs = getComputedStyle(document.documentElement);
  const serif = cs.getPropertyValue("--font-instrument").trim() || "Georgia, serif";
  const sans = cs.getPropertyValue("--font-geist").trim() || "Helvetica, Arial, sans-serif";
  await Promise.all([document.fonts.load(`64px ${serif}`), document.fonts.load(`28px ${sans}`)]).catch(() => {});

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0a0a0a";
  g.fillRect(0, 0, W, H);

  const pad = 80;
  let y = pad + 24;
  g.fillStyle = "#8a8a86";
  g.font = `26px ${sans}`;
  g.fillText(`Portrait · ${source} · computed in the browser`, pad, y);
  y += 70;

  // headline, wrapped
  g.fillStyle = "#f5f5f3";
  g.font = `58px ${serif}`;
  const words = (lines[0] ?? "").split(" ");
  let line = "";
  const maxW = W - pad * 2;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, pad, y);
      y += 64;
      line = w;
    } else line = test;
  }
  if (line) {
    g.fillText(line, pad, y);
    y += 64;
  }
  y += 16;

  // supporting lines, smaller, wrapped
  g.fillStyle = "#a3a3a0";
  g.font = `28px ${sans}`;
  for (const l of lines.slice(1, 3)) {
    const ws = l.split(" ");
    let cur = "";
    for (const w of ws) {
      const test = cur ? `${cur} ${w}` : w;
      if (g.measureText(test).width > maxW && cur) {
        g.fillText(cur, pad, y);
        y += 38;
        cur = w;
      } else cur = test;
    }
    if (cur) {
      g.fillText(cur, pad, y);
      y += 38;
    }
    y += 14;
  }
  y += 30;

  // four numbers
  const tiles: [string, string][] = [
    [stats.conversations.toLocaleString(), "conversations"],
    [stats.userMessages.toLocaleString(), "messages from you"],
    [stats.userWords.toLocaleString(), "of your words"],
    [stats.activeDays.toLocaleString(), "active days"],
  ];
  g.strokeStyle = "#262626";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(pad, y);
  g.lineTo(W - pad, y);
  g.stroke();
  y += 56;
  const colW = (W - pad * 2) / 4;
  tiles.forEach(([n, l], i) => {
    const x = pad + i * colW;
    g.fillStyle = "#f5f5f3";
    g.font = `600 48px ${sans}`;
    g.fillText(n, x, y);
    g.fillStyle = "#8a8a86";
    g.font = `22px ${sans}`;
    g.fillText(l, x, y + 34);
  });
  y += 120;

  // hour-of-day bars, sized to the room that is left above the footer
  const footerY = H - pad;
  g.fillStyle = "#8a8a86";
  g.font = `22px ${sans}`;
  g.fillText("When you write, by hour of day", pad, y);
  y += 30;
  const barsTop = y;
  const barsH = Math.max(120, Math.min(220, footerY - 110 - barsTop));
  const max = Math.max(1, ...stats.byHour);
  const gap = 8;
  const bw = (W - pad * 2 - gap * 23) / 24;
  stats.byHour.forEach((v, i) => {
    const h = Math.max(4, (v / max) * barsH);
    const x = pad + i * (bw + gap);
    g.fillStyle = v === max ? "#f5f5f3" : "#3a3a38";
    g.fillRect(x, barsTop + barsH - h, bw, h);
  });
  y = barsTop + barsH + 34;
  g.fillStyle = "#8a8a86";
  g.font = `20px ${sans}`;
  ["12a", "6a", "12p", "6p", "11p"].forEach((lab, i) => {
    const idx = [0, 6, 12, 18, 23][i];
    g.fillText(lab, pad + idx * (bw + gap), y);
  });

  // footer
  g.fillStyle = "#8a8a86";
  g.font = `24px ${sans}`;
  g.fillText("josh.design/lab/portrait · your export never leaves your browser", pad, footerY);

  const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("no blob"))), "image/png"));
  return URL.createObjectURL(blob);
}
