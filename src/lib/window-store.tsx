"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SnapZone =
  | "full"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | null;

export type OpenWindow = {
  id: string;
  app: AppKey;
  param?: string;
  path: string;
  slug: string;
  caption: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  snap: SnapZone;
  /** Last non-snapped geometry, used to restore when un-snapping */
  restore?: { x: number; y: number; width: number; height: number };
  /** Origin point — used to animate window expanding from icon when first opened */
  openOrigin?: { x: number; y: number };
};

export type AppKey =
  | "work"
  | "project"
  | "journal"
  | "entry"
  | "about"
  | "contact"
  | "readme"
  | "info"
  | "prefs";

export type WindowManager = {
  windows: OpenWindow[];
  focused: string | null;
  missionControl: boolean;
  notificationCenter: boolean;
  open: (req: OpenRequest) => string;
  close: (id: string) => void;
  focus: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, width: number, height: number) => void;
  snap: (id: string, zone: SnapZone) => void;
  minimize: (id: string) => void;
  unminimize: (id: string) => void;
  maximize: (id: string) => void;
  closeAll: () => void;
  cycle: () => void;
  setMissionControl: (open: boolean) => void;
  toggleMissionControl: () => void;
  setNotificationCenter: (open: boolean) => void;
  toggleNotificationCenter: () => void;
};

type OpenRequest = {
  app: AppKey;
  param?: string;
  path?: string;
  slug?: string;
  caption?: string;
  width?: number;
  height?: number;
  /** Origin point in viewport coords — used to animate window expanding from a desktop icon */
  origin?: { x: number; y: number };
};

const Ctx = createContext<WindowManager | null>(null);
const STORAGE_KEY = "darkroom.windows.v2";

/* -------- defaults per app -------- */
function defaultsFor(req: OpenRequest) {
  switch (req.app) {
    case "work":
      return { path: "/work", slug: "~/work", caption: "Contact sheet · 07 frames", width: 1180, height: 760 };
    case "project":
      return { path: `/work/${req.param}`, slug: `~/work/${req.param}`, caption: "Case study", width: 1180, height: 760 };
    case "journal":
      return { path: "/journal", slug: "~/journal", caption: "Field notes · 04 issues", width: 980, height: 720 };
    case "entry":
      return { path: `/journal/${req.param}`, slug: `~/journal/${req.param}`, caption: "Entry", width: 820, height: 720 };
    case "about":
      return { path: "/about", slug: "~/about", caption: "About this archive", width: 760, height: 580 };
    case "contact":
      return { path: "/contact", slug: "~/contact", caption: "Compose · message", width: 880, height: 680 };
    case "readme":
      return { path: "/#readme", slug: "~/readme.md", caption: "Opening note", width: 720, height: 540 };
    case "info":
      return {
        path: `/info/${req.param ?? ""}`,
        slug: `Get Info · ${req.param ?? ""}`,
        caption: "File inspector",
        width: 380,
        height: 540,
      };
    case "prefs":
      return {
        path: "/prefs",
        slug: "System Preferences",
        caption: "Configure Atelier · Calibre 18.5",
        width: 720,
        height: 540,
      };
  }
}

function appAndParamFromPath(path: string): { app: AppKey; param?: string } | null {
  if (!path || path === "/" || path === "") return null;
  if (path === "/work") return { app: "work" };
  if (path.startsWith("/work/")) return { app: "project", param: path.slice("/work/".length) };
  if (path === "/journal") return { app: "journal" };
  if (path.startsWith("/journal/")) return { app: "entry", param: path.slice("/journal/".length) };
  if (path === "/about") return { app: "about" };
  if (path === "/contact") return { app: "contact" };
  if (path.startsWith("/#readme")) return { app: "readme" };
  return null;
}

/* -------- snap geometry -------- */
const MENU_BAR = 36;
const DOCK_PAD = 88; // dock + breathing room

export function geomForSnap(zone: SnapZone, vw: number, vh: number) {
  const top = MENU_BAR;
  const usableH = vh - MENU_BAR - DOCK_PAD;
  const halfW = Math.floor(vw / 2);
  const halfH = Math.floor(usableH / 2);
  switch (zone) {
    case "full":
      return { x: 0, y: top, width: vw, height: usableH };
    case "left":
      return { x: 0, y: top, width: halfW, height: usableH };
    case "right":
      return { x: halfW, y: top, width: vw - halfW, height: usableH };
    case "top-left":
      return { x: 0, y: top, width: halfW, height: halfH };
    case "top-right":
      return { x: halfW, y: top, width: vw - halfW, height: halfH };
    case "bottom-left":
      return { x: 0, y: top + halfH, width: halfW, height: usableH - halfH };
    case "bottom-right":
      return { x: halfW, y: top + halfH, width: vw - halfW, height: usableH - halfH };
    default:
      return null;
  }
}

/* -------- Provider -------- */
export function WindowProvider({ children }: { children: React.ReactNode }) {
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [focused, setFocused] = useState<string | null>(null);
  const [missionControl, setMissionControl] = useState(false);
  const [notificationCenter, setNotificationCenter] = useState(false);
  const topZRef = useRef(10);
  const hydrated = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { windows: OpenWindow[]; focused: string | null };
        if (data?.windows) {
          setWindows(data.windows);
          setFocused(data.focused);
          topZRef.current = Math.max(10, ...data.windows.map((w) => w.zIndex));
        }
      }
    } catch {}
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ windows, focused }));
    } catch {}
  }, [windows, focused]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const front = windows.find((w) => w.id === focused && !w.minimized);
    const next = front?.path ?? "/";
    if (window.location.pathname !== next.split("#")[0]) {
      window.history.replaceState(null, "", next);
    }
  }, [focused, windows]);

  const focus = useCallback((id: string) => {
    setWindows((ws) => {
      const target = ws.find((w) => w.id === id);
      if (!target) return ws;
      topZRef.current += 1;
      return ws.map((w) =>
        w.id === id ? { ...w, zIndex: topZRef.current, minimized: false } : w
      );
    });
    setFocused(id);
  }, []);

  const open = useCallback(
    (req: OpenRequest) => {
      const d = defaultsFor(req);
      const path = req.path ?? d.path;
      const slug = req.slug ?? d.slug;
      const caption = req.caption ?? d.caption;
      const width = req.width ?? d.width;
      const height = req.height ?? d.height;

      const existing = windows.find((w) => w.path === path);
      if (existing) {
        focus(existing.id);
        return existing.id;
      }

      const count = windows.length;
      const x =
        typeof window !== "undefined"
          ? Math.max(24, (window.innerWidth - width) / 2 + (count % 6) * 32 - 96)
          : 60;
      const y =
        typeof window !== "undefined"
          ? Math.max(56, 80 + (count % 6) * 28)
          : 80;

      topZRef.current += 1;
      const id = crypto.randomUUID();
      const next: OpenWindow = {
        id,
        app: req.app,
        param: req.param,
        path,
        slug,
        caption,
        x,
        y,
        width,
        height,
        zIndex: topZRef.current,
        minimized: false,
        maximized: false,
        snap: null,
        openOrigin: req.origin,
      };
      setWindows((ws) => [...ws, next]);
      setFocused(id);
      return id;
    },
    [windows, focus]
  );

  const close = useCallback(
    (id: string) => {
      setWindows((ws) => ws.filter((w) => w.id !== id));
      setFocused((f) => {
        if (f !== id) return f;
        const remaining = windows.filter((w) => w.id !== id && !w.minimized);
        if (remaining.length === 0) return null;
        const next = remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
        return next.id;
      });
    },
    [windows]
  );

  const move = useCallback((id: string, x: number, y: number) => {
    setWindows((ws) =>
      ws.map((w) => {
        if (w.id !== id) return w;
        // Moving un-snaps
        const next = { ...w, x, y, snap: null as SnapZone };
        return next;
      })
    );
  }, []);

  const resize = useCallback((id: string, width: number, height: number) => {
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, width, height, snap: null as SnapZone } : w))
    );
  }, []);

  const snap = useCallback((id: string, zone: SnapZone) => {
    setWindows((ws) =>
      ws.map((w) => {
        if (w.id !== id) return w;
        if (zone === null) {
          // Un-snap to last restore point
          if (w.restore) {
            return {
              ...w,
              x: w.restore.x,
              y: w.restore.y,
              width: w.restore.width,
              height: w.restore.height,
              snap: null,
              restore: undefined,
            };
          }
          return { ...w, snap: null };
        }
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const g = geomForSnap(zone, vw, vh)!;
        const restore = w.restore ?? { x: w.x, y: w.y, width: w.width, height: w.height };
        return { ...w, ...g, snap: zone, restore };
      })
    );
  }, []);

  const minimize = useCallback(
    (id: string) => {
      setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
      setFocused((f) => {
        if (f !== id) return f;
        const remaining = windows.filter((w) => w.id !== id && !w.minimized);
        if (remaining.length === 0) return null;
        const next = remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
        return next.id;
      });
    },
    [windows]
  );

  const unminimize = useCallback((id: string) => focus(id), [focus]);

  const maximize = useCallback((id: string) => {
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
    );
  }, []);

  const closeAll = useCallback(() => {
    setWindows([]);
    setFocused(null);
  }, []);

  const cycle = useCallback(() => {
    setWindows((ws) => {
      const visible = ws.filter((w) => !w.minimized);
      if (visible.length < 2) return ws;
      const sorted = [...visible].sort((a, b) => a.zIndex - b.zIndex);
      const next = sorted[0];
      topZRef.current += 1;
      const updatedZ = topZRef.current;
      setFocused(next.id);
      return ws.map((w) => (w.id === next.id ? { ...w, zIndex: updatedZ } : w));
    });
  }, []);

  const toggleMissionControl = useCallback(() => setMissionControl((v) => !v), []);
  const toggleNotificationCenter = useCallback(() => setNotificationCenter((v) => !v), []);

  // Auto-open window based on URL on mount
  useEffect(() => {
    if (!hydrated.current) return;
    if (typeof window === "undefined") return;
    const desired = window.location.pathname + window.location.hash;
    const match = appAndParamFromPath(desired);
    if (!match) return;
    const existing = windows.find((w) => w.app === match.app && w.param === match.param);
    if (existing) {
      focus(existing.id);
    } else {
      open({ app: match.app, param: match.param });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated.current]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // F3 → Mission Control
      if (e.key === "F3") {
        e.preventDefault();
        toggleMissionControl();
        return;
      }
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "w" && focused) {
        e.preventDefault();
        close(focused);
      } else if (e.key === "`") {
        e.preventDefault();
        cycle();
      } else if (e.key === "i" && focused) {
        // Get Info on focused window's subject
        e.preventDefault();
        const target = windows.find((w) => w.id === focused);
        if (target && (target.app === "project" || target.app === "entry") && target.param) {
          // Use a microtask so React state has settled
          setTimeout(() => open({ app: "info", param: target.param }), 0);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused, windows, close, cycle, toggleMissionControl, open]);

  // Listen for cross-component requests (Spotlight, etc.)
  useEffect(() => {
    const openNotif = () => setNotificationCenter(true);
    const openPrefs = () => open({ app: "prefs" });
    window.addEventListener("darkroom:notification-center", openNotif as EventListener);
    window.addEventListener("darkroom:open-prefs", openPrefs as EventListener);
    return () => {
      window.removeEventListener("darkroom:notification-center", openNotif as EventListener);
      window.removeEventListener("darkroom:open-prefs", openPrefs as EventListener);
    };
  }, [open]);

  // Hot corners — top-right opens Mission Control, bottom-right opens Notification Center
  useEffect(() => {
    let lastTopRight = 0;
    let lastBottomRight = 0;
    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const inTopRight = e.clientX > w - 8 && e.clientY < 8;
      const inBottomRight = e.clientX > w - 8 && e.clientY > h - 8;
      const now = Date.now();
      if (inTopRight && now - lastTopRight > 1500) {
        lastTopRight = now;
        setMissionControl((v) => v || true);
      } else if (inBottomRight && now - lastBottomRight > 1500) {
        lastBottomRight = now;
        setNotificationCenter((v) => v || true);
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const value = useMemo<WindowManager>(
    () => ({
      windows,
      focused,
      missionControl,
      notificationCenter,
      open,
      close,
      focus,
      move,
      resize,
      snap,
      minimize,
      unminimize,
      maximize,
      closeAll,
      cycle,
      setMissionControl,
      toggleMissionControl,
      setNotificationCenter,
      toggleNotificationCenter,
    }),
    [
      windows,
      focused,
      missionControl,
      notificationCenter,
      open,
      close,
      focus,
      move,
      resize,
      snap,
      minimize,
      unminimize,
      maximize,
      closeAll,
      cycle,
      toggleMissionControl,
      toggleNotificationCenter,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWindowManager(): WindowManager {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWindowManager must be used inside <WindowProvider>");
  return ctx;
}
