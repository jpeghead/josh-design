"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useSettings, type DockPosition, type Motion, type Theme } from "@/lib/settings-store";
import { playSound } from "@/lib/ui-sound";

type Pane =
  | "appearance"
  | "wallpaper"
  | "dock"
  | "motion"
  | "sound"
  | "hud"
  | "privacy";

const PANES: { id: Pane; label: string; hint: string }[] = [
  { id: "appearance", label: "Appearance", hint: "Theme · accent" },
  { id: "wallpaper", label: "Wallpaper", hint: "Desktop background" },
  { id: "dock", label: "Dock", hint: "Position · size · magnify" },
  { id: "motion", label: "Motion", hint: "Animations · scan line" },
  { id: "sound", label: "Sound", hint: "UI tones · output" },
  { id: "hud", label: "System HUD", hint: "Telemetry widget" },
  { id: "privacy", label: "Privacy", hint: "Reset · clear archive" },
];

export function PrefsContent() {
  const [pane, setPane] = useState<Pane>("appearance");
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="hidden w-52 shrink-0 overflow-y-auto border-r border-bone-line bg-ink-50/40 py-3 sm:block">
        <ul>
          {PANES.map((p) => {
            const active = pane === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    playSound("click");
                    setPane(p.id);
                  }}
                  className={`flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left transition-colors ${
                    active ? "bg-safelight/15 text-bone" : "text-bone-dim hover:bg-ink-100 hover:text-bone"
                  }`}
                >
                  <span className="font-mono text-[11px] uppercase tracking-widest">
                    {p.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      {/* Mobile pane select */}
      <div className="block w-full overflow-x-auto border-b border-bone-line bg-ink-50/40 sm:hidden">
        <div className="flex">
          {PANES.map((p) => {
            const active = pane === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPane(p.id)}
                className={`shrink-0 px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
                  active ? "text-bone" : "text-bone-muted"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel */}
      <div className="min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-7">
        {pane === "appearance" && <AppearancePane />}
        {pane === "wallpaper" && <WallpaperPane />}
        {pane === "dock" && <DockPane />}
        {pane === "motion" && <MotionPane />}
        {pane === "sound" && <SoundPane />}
        {pane === "hud" && <HudPane />}
        {pane === "privacy" && <PrivacyPane />}
      </div>
    </div>
  );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 border-b border-bone-line pb-4">
      <p className="overline">// {title.toLowerCase()}</p>
      <h2 className="mt-1 font-[var(--font-display)] text-3xl italic leading-tight text-bone">
        {title}
      </h2>
      <p className="mt-1 max-w-md text-sm text-bone-dim">{subtitle}</p>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 items-start gap-3 border-b border-bone-line/40 py-3 last:border-b-0">
      <div className="col-span-12 sm:col-span-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-bone">
          {label}
        </p>
        {hint && (
          <p className="mt-0.5 text-xs text-bone-muted">{hint}</p>
        )}
      </div>
      <div className="col-span-12 sm:col-span-7">{children}</div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex border border-bone-line">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              playSound("click");
              onChange(o.id);
            }}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              active
                ? "bg-safelight/15 text-bone"
                : "text-bone-muted hover:text-bone"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        playSound("click");
        onChange(!on);
      }}
      className={`relative inline-flex h-5 w-9 border transition-colors ${
        on ? "border-safelight bg-safelight/30" : "border-bone-line bg-ink-50"
      }`}
    >
      <motion.span
        layout
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute top-0.5 h-3.5 w-3.5 ${
          on ? "right-0.5 bg-safelight" : "left-0.5 bg-bone-muted"
        }`}
      />
    </button>
  );
}

/* ── Panes ───────────────────────────────────────────────────── */

function AppearancePane() {
  const { settings, set } = useSettings();
  return (
    <>
      <PanelHeader
        title="Appearance"
        subtitle="Theme controls the OS palette. Dark uses ink + bone + safelight; Light flips to cream + black."
      />
      <Row label="Theme" hint="System chooses between Light and Dark based on your OS preference.">
        <SegmentedControl<Theme>
          options={[
            { id: "dark", label: "Dark" },
            { id: "light", label: "Light" },
            { id: "auto", label: "Auto" },
          ]}
          value={settings.theme}
          onChange={(t) => set("theme", t)}
        />
      </Row>
      <Row
        label="Accent"
        hint="Safelight red. The single accent across the OS — clicks, snaps, focused chrome."
      >
        <div className="flex items-center gap-2">
          <span className="block h-5 w-5 border border-bone-line bg-safelight" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-bone-dim">
            #E63946 · safelight
          </span>
        </div>
      </Row>
    </>
  );
}

function WallpaperPane() {
  const { settings, set } = useSettings();
  const options = [1, 2, 3, 4, 5];
  return (
    <>
      <PanelHeader
        title="Wallpaper"
        subtitle="Five generative darkroom prints, each a different exposure."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {options.map((n) => {
          const active = settings.wallpaper === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => {
                playSound("click");
                set("wallpaper", n);
              }}
              className={`group flex aspect-[4/3] flex-col justify-end border bg-ink-50 p-2 text-left transition-colors ${
                active ? "border-safelight" : "border-bone-line hover:border-bone-muted"
              }`}
            >
              <WallpaperPreview seed={n} />
              <span className="z-10 mt-2 flex items-baseline justify-between gap-2 font-mono text-[9px] uppercase tracking-widest text-bone-muted">
                <span>Print · 0{n}</span>
                {active && <span className="text-safelight">● Active</span>}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function WallpaperPreview({ seed }: { seed: number }) {
  const palettes = [
    { bg: "#0a0908", accent: "#e63946" },
    { bg: "#161311", accent: "#f4a52e" },
    { bg: "#0f0f10", accent: "#9ab1d4" },
    { bg: "#10130f", accent: "#cfe0c3" },
    { bg: "#1c1411", accent: "#e63946" },
  ];
  const p = palettes[(seed - 1) % palettes.length];
  return (
    <svg viewBox="0 0 80 60" className="-mb-7 h-auto w-full">
      <rect width="80" height="60" fill={p.bg} />
      <circle
        cx={seed === 5 ? 18 : 60}
        cy={seed === 4 ? 14 : 46}
        r="14"
        fill="none"
        stroke={p.accent}
        strokeWidth="0.6"
        opacity="0.7"
      />
      <circle cx="40" cy="30" r="22" fill="none" stroke={p.accent} strokeWidth="0.4" opacity="0.3" />
      <g stroke={p.accent} strokeOpacity="0.5" strokeWidth="0.3" fill="none">
        <line x1="40" y1="6" x2="40" y2="54" />
        <line x1="10" y1="30" x2="70" y2="30" />
      </g>
    </svg>
  );
}

function DockPane() {
  const { settings, setDock } = useSettings();
  return (
    <>
      <PanelHeader
        title="Dock"
        subtitle="Position, size, and magnification behavior for the bottom dock."
      />
      <Row label="Position" hint="Where the dock anchors. Hidden lets you summon it with ⌃⌘D.">
        <SegmentedControl<DockPosition>
          options={[
            { id: "bottom", label: "Bottom" },
            { id: "left", label: "Left" },
            { id: "right", label: "Right" },
            { id: "hidden", label: "Hidden" },
          ]}
          value={settings.dock.position}
          onChange={(v) => setDock("position", v)}
        />
      </Row>
      <Row label="Magnification" hint="Icons grow as the cursor approaches.">
        <Toggle
          on={settings.dock.magnification}
          onChange={(v) => setDock("magnification", v)}
        />
      </Row>
      <Row label="Icon size">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={32}
            max={72}
            value={settings.dock.size}
            onChange={(e) => setDock("size", parseInt(e.target.value))}
            className="w-48 accent-safelight"
          />
          <span className="font-mono text-[10px] tabular-nums text-bone-dim">
            {settings.dock.size}px
          </span>
        </div>
      </Row>
    </>
  );
}

function MotionPane() {
  const { settings, set } = useSettings();
  return (
    <>
      <PanelHeader
        title="Motion"
        subtitle="Window animations, scan-line drift, sticky animations, and idle-lock behavior."
      />
      <Row label="Motion level" hint="Off disables idle-lock and all animations.">
        <SegmentedControl<Motion>
          options={[
            { id: "full", label: "Full" },
            { id: "reduced", label: "Reduced" },
            { id: "off", label: "Off" },
          ]}
          value={settings.motion}
          onChange={(v) => set("motion", v)}
        />
      </Row>
    </>
  );
}

function SoundPane() {
  const { settings, set } = useSettings();
  return (
    <>
      <PanelHeader
        title="Sound"
        subtitle="Mono UI tones synthesized in-browser. Off by default."
      />
      <Row label="UI sounds" hint="Window open, close, minimize, notification, click.">
        <Toggle on={settings.sound} onChange={(v) => set("sound", v)} />
      </Row>
      <Row label="Preview" hint="Tap any sound to play it.">
        <div className="flex flex-wrap gap-2">
          {(["open", "close", "minimize", "notification", "click", "snap"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                import("@/lib/ui-sound").then((m) => {
                  m.setSoundEnabled(true);
                  m.playSound(s);
                  m.setSoundEnabled(settings.sound);
                });
              }}
              className="border border-bone-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-bone-dim transition-colors hover:border-safelight hover:text-bone"
            >
              ▶ {s}
            </button>
          ))}
        </div>
      </Row>
    </>
  );
}

function HudPane() {
  const { settings, set } = useSettings();
  return (
    <>
      <PanelHeader
        title="System HUD"
        subtitle="Live telemetry widget in the top-right. Time, FPS, focused process, cursor coords."
      />
      <Row label="Show HUD">
        <Toggle on={settings.hud} onChange={(v) => set("hud", v)} />
      </Row>
    </>
  );
}

function PrivacyPane() {
  const { reset } = useSettings();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PanelHeader
        title="Privacy"
        subtitle="Everything Atelier remembers — windows, stickies, settings, last login — lives in your browser. Nothing is synced or sent anywhere."
      />
      <Row label="Saved state" hint="Window positions, sticky positions, settings.">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-dim">
          Stored in localStorage · ~{estimateBytes()}KB
        </p>
      </Row>
      <Row label="Reset archive" hint="Wipes settings, windows, stickies. The boot sequence will play again.">
        {confirm ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                location.reload();
              }}
              className="border border-safelight bg-safelight/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-bone transition-colors hover:bg-safelight hover:text-ink"
            >
              Confirm reset
            </button>
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-bone-muted hover:text-bone"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="border border-bone-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-bone-dim transition-colors hover:border-safelight hover:text-bone"
          >
            Reset to defaults…
          </button>
        )}
      </Row>
    </>
  );
}

function estimateBytes() {
  if (typeof window === "undefined") return 0;
  let bytes = 0;
  for (const k of Object.keys(localStorage)) {
    bytes += k.length + (localStorage.getItem(k)?.length ?? 0);
  }
  for (const k of Object.keys(sessionStorage)) {
    bytes += k.length + (sessionStorage.getItem(k)?.length ?? 0);
  }
  return Math.max(1, Math.round(bytes / 1024));
}
