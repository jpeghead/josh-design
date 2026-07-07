"use client";

/**
 * CHAPTER 5 — THE PHONE. 2015–2023. Things people carry.
 * A giant device. Real work on its screen. The notifications tell the
 * career — and the family beat lands as a push notification, like it did.
 */

import type { ChapterProps } from "./engine";
import { seg } from "./engine";

const SCREENS = [
  { src: "/archive/web/lUfbKLTE61YByqT1TJBRTeMjA.jpg", cap: "Spin — the rider app", a: 0.1, b: 0.38 },
  { src: "/archive/web/drPyB0qigdiXyCjHkK3HdKQsuE.jpg", cap: "Ride Smart quiz — safety, made playable", a: 0.38, b: 0.62 },
  { src: "/archive/web/dPjaqyIJCrIhH7ybw1Id4MdMDzs.jpg", cap: "A brand that lived on streets", a: 0.62, b: 0.86 },
];

const NOTIFS = [
  { icon: "★", title: "App Store", body: "Saucey — App of the Day · Editor's Choice", at: 0.16 },
  { icon: "▲", title: "Hush", body: "3.5★ → 4.8★ across 50,000+ reviews", at: 0.3 },
  { icon: "", title: "Apple · WWDC 2020", body: "Spin App Clips featured with iOS 14", at: 0.46 },
  { icon: "♥", title: "Samantha", body: "Nolan was born · Los Angeles · 2021", at: 0.66, family: true },
  { icon: "⌂", title: "Life", body: "Moving home — Cincinnati, Ohio · 2023", at: 0.8, family: true },
];

export function C5Phone({ t }: ChapterProps) {
  const enter = seg(t, 0, 0.1);
  const outro = seg(t, 0.88, 0.98);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#101114]">
      {/* ambient glow from the screen */}
      <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(60% 55% at 50% 50%, #2a3040 0%, #101114 70%)" }} />

      {/* headline behind the device */}
      <h2
        className="pointer-events-none absolute left-1/2 top-[10%] z-0 w-full -translate-x-1/2 text-center font-display text-[9vw] italic leading-none text-white/10 sm:text-[7vw]"
        style={{ opacity: enter }}
      >
        things people carry
      </h2>

      {/* the device */}
      <div
        className="relative z-10 h-[74%] max-h-[720px] rounded-[2.6rem] border-[6px] border-[#2c2e33] bg-black p-2 shadow-2xl"
        style={{
          aspectRatio: "9 / 19",
          transform: `translateY(${(1 - enter) * 70}vh) rotate(${(1 - enter) * 6}deg)`,
        }}
      >
        <div className="absolute left-1/2 top-3 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-[#0a0a0c]">
          {SCREENS.map((s) => {
            const on = t >= s.a && t < s.b;
            const local = seg(t, s.a, s.b);
            return (
              <div key={s.src} className="absolute inset-0" style={{ opacity: on ? 1 : 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ transform: `translateY(${(1 - local) * 4}%) scale(1.02)` }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                  <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/85">
                    {s.cap}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* notifications stack */}
      <div className="absolute right-[4%] top-24 z-20 flex w-80 max-w-[44vw] flex-col gap-2 sm:right-[8%]">
        {NOTIFS.map((n) => {
          const k = seg(t, n.at, n.at + 0.06);
          const gone = seg(t, n.at + 0.3, n.at + 0.38);
          return (
            <div
              key={n.title + n.at}
              className="rounded-2xl border border-white/10 p-3 backdrop-blur-md"
              style={{
                background: n.family ? "rgba(200,162,75,0.16)" : "rgba(255,255,255,0.08)",
                opacity: k * (1 - gone * 0.85),
                transform: `translateX(${(1 - k) * 120}%)`,
              }}
            >
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: n.family ? "#e2c078" : "#ffffffb0" }}>
                  {n.icon} {n.title}
                </p>
                <span className="font-mono text-[9px] text-white/40">now</span>
              </div>
              <p className="mt-1 text-sm text-white/90">{n.body}</p>
            </div>
          );
        })}
      </div>

      {/* career line, left side */}
      <div className="absolute bottom-12 left-6 z-20 max-w-xs sm:left-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45" style={{ opacity: seg(t, 0.12, 0.2) }}>
          Saucey → Hush → Spin → VGV
        </p>
        <p className="mt-2 font-display text-2xl italic text-white/90" style={{ opacity: seg(t, 0.2, 0.3) }}>
          First designer in, Head of Design out — twice.
        </p>
      </div>

      {/* outro */}
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#101114]" style={{ opacity: outro }}>
        <p className="max-w-2xl px-6 text-center font-display text-4xl italic text-white sm:text-5xl">
          The biggest thrill: a stranger using something I made —
          <span className="text-gold"> with no idea it was mine.</span>
        </p>
      </div>
    </div>
  );
}
