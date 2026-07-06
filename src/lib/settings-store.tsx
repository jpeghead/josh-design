"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "dark" | "light" | "auto";
export type DockPosition = "bottom" | "left" | "right" | "hidden";
export type Motion = "full" | "reduced" | "off";

export type Settings = {
  theme: Theme;
  wallpaper: number; // 1–5
  dock: {
    position: DockPosition;
    magnification: boolean;
    size: number; // 32–72
  };
  motion: Motion;
  sound: boolean;
  hud: boolean;
  /** Last-login timestamp for the boot sequence */
  lastLogin?: string;
};

const DEFAULTS: Settings = {
  theme: "dark",
  wallpaper: 1,
  dock: { position: "bottom", magnification: false, size: 36 },
  motion: "full",
  sound: false,
  hud: false,
};

const STORAGE_KEY = "darkroom.settings.v1";

type Ctx = {
  settings: Settings;
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setDock: <K extends keyof Settings["dock"]>(
    key: K,
    value: Settings["dock"][K]
  ) => void;
  reset: () => void;
};

const SettingsCtx = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Partial<Settings>;
        setSettings((s) => ({
          ...s,
          ...data,
          dock: { ...s.dock, ...(data.dock ?? {}) },
        }));
      }
    } catch {}
    // Stamp the last-login time before continuing
    try {
      const previous = localStorage.getItem(STORAGE_KEY + ".session");
      if (previous) {
        setSettings((s) => ({ ...s, lastLogin: previous }));
      }
      localStorage.setItem(STORAGE_KEY + ".session", new Date().toISOString());
    } catch {}
  }, []);

  // Persist on change (skip first render where it'd overwrite defaults)
  useEffect(() => {
    try {
      const { lastLogin: _omit, ...rest } = settings;
      void _omit;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch {}
  }, [settings]);

  const set = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((s) => ({ ...s, [key]: value }));
    },
    []
  );

  const setDock = useCallback(
    <K extends keyof Settings["dock"]>(key: K, value: Settings["dock"][K]) => {
      setSettings((s) => ({ ...s, dock: { ...s.dock, [key]: value } }));
    },
    []
  );

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem("darkroom-booted");
      sessionStorage.removeItem("darkroom-notice");
      sessionStorage.removeItem("darkroom.windows.v2");
      sessionStorage.removeItem("darkroom.stickies.v1");
    } catch {}
  }, []);

  const value = useMemo<Ctx>(
    () => ({ settings, set, setDock, reset }),
    [settings, set, setDock, reset]
  );

  // Apply theme class to <html> as a side effect for any future CSS hooks
  useEffect(() => {
    if (typeof document === "undefined") return;
    const theme =
      settings.theme === "auto"
        ? window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark"
        : settings.theme;
    document.documentElement.dataset.theme = theme;
  }, [settings.theme]);

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export function useSettings(): Ctx {
  const c = useContext(SettingsCtx);
  if (!c) throw new Error("useSettings must be inside <SettingsProvider>");
  return c;
}
