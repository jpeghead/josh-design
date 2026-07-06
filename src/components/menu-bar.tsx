"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useWindowManager } from "@/lib/window-store";
import { AiIndicator } from "@/components/os/ai-indicator";

type MenuId = "josh" | "file" | "window";

/**
 * Real OS-style menu bar:
 *  - Click any menu to open it. Once open, *hovering* siblings switches
 *    to that menu — like macOS "menu mode."
 *  - Click outside, press Escape, or run an item to dismiss with a quick
 *    animated exit.
 *  - Live time, weather chip, system-tray buttons for Mission Control,
 *    Notification Center, and Spotlight.
 */
export function MenuBar() {
  const wm = useWindowManager();
  const [time, setTime] = useState(() => fmt(new Date()));
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTime(fmt(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  // Dismiss on outside click + Escape
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const reboot = () => {
    sessionStorage.removeItem("darkroom-booted");
    sessionStorage.removeItem("darkroom-notice");
    sessionStorage.removeItem("darkroom.windows.v2");
    sessionStorage.removeItem("darkroom.stickies.v1");
    location.reload();
  };

  const focusedWindow = wm.windows.find((w) => w.id === wm.focused);

  return (
    <header
      ref={wrapperRef}
      className="fixed inset-x-0 top-0 z-[70] flex h-9 items-center border-b border-bone-line/60 bg-ink/70 px-2 backdrop-blur-xl sm:px-3"
      style={{ WebkitBackdropFilter: "blur(20px) saturate(140%)" }}
    >
      {/* Josh — small Atelier boutique signature */}
      <Menu
        id="josh"
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        trigger={
          <span className="flex items-center gap-2.5 leading-none">
            <span className="inline-block h-1 w-1 rounded-full bg-safelight" />
            <span className="font-[var(--font-display)] text-base text-bone tracking-wide">Atelier</span>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.4em] text-bone-muted sm:inline">
              by Josh
            </span>
          </span>
        }
      >
        <MenuItem onClick={() => wm.open({ app: "about" })}>
          About this archive
        </MenuItem>
        <MenuItem onClick={() => wm.open({ app: "readme" })}>
          Opening note (readme.md)
        </MenuItem>
        <MenuItem onClick={() => wm.open({ app: "prefs" })} shortcut="⌘,">
          System Preferences…
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          onClick={() => window.dispatchEvent(new CustomEvent("darkroom:lock-now"))}
          shortcut="⌃⌘Q"
        >
          Lock now
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          onClick={() =>
            window.open("https://boneyardcollective.com", "_blank")
          }
        >
          Open Boneyard ↗
        </MenuItem>
        <MenuItem
          onClick={() =>
            (window.location.href = "mailto:joshwhitehead.design@gmail.com")
          }
        >
          Compose email ↗
        </MenuItem>
        <MenuSeparator />
        <MenuItem onClick={reboot}>Reboot archive…</MenuItem>
      </Menu>

      {/* File */}
      <Menu
        id="file"
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        trigger={
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone-muted">
            File
          </span>
        }
      >
        <MenuItem onClick={() => wm.open({ app: "work" })} shortcut="⌘1">
          Open ~/work
        </MenuItem>
        <MenuItem onClick={() => wm.open({ app: "journal" })} shortcut="⌘2">
          Open ~/journal
        </MenuItem>
        <MenuItem onClick={() => wm.open({ app: "about" })} shortcut="⌘3">
          Open ~/about
        </MenuItem>
        <MenuItem onClick={() => wm.open({ app: "contact" })} shortcut="⌘4">
          Open ~/contact
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          onClick={() => focusedWindow && wm.close(focusedWindow.id)}
          shortcut="⌘W"
          disabled={!focusedWindow}
        >
          Close window
        </MenuItem>
        <MenuItem
          onClick={wm.closeAll}
          disabled={wm.windows.length === 0}
        >
          Close all windows
        </MenuItem>
      </Menu>

      {/* Window */}
      <Menu
        id="window"
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        trigger={
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone-muted">
            Window
          </span>
        }
      >
        <MenuItem
          onClick={() => focusedWindow && wm.minimize(focusedWindow.id)}
          disabled={!focusedWindow}
        >
          Minimize
        </MenuItem>
        <MenuItem
          onClick={() => focusedWindow && wm.maximize(focusedWindow.id)}
          disabled={!focusedWindow}
        >
          Zoom
        </MenuItem>
        <MenuItem
          onClick={wm.cycle}
          shortcut="⌘`"
          disabled={wm.windows.filter((w) => !w.minimized).length < 2}
        >
          Cycle windows
        </MenuItem>
        {wm.windows.length > 0 && <MenuSeparator />}
        {wm.windows.map((w) => (
          <MenuItem
            key={w.id}
            onClick={() =>
              w.minimized ? wm.unminimize(w.id) : wm.focus(w.id)
            }
            check={w.id === wm.focused && !w.minimized}
          >
            {w.slug} {w.minimized && <span className="opacity-50">· min</span>}
          </MenuItem>
        ))}
      </Menu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        <span className="hidden items-center gap-1.5 lg:flex">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emulsion" />
          <span className="text-bone">Shipping</span>
        </span>
        <span aria-hidden className="hidden lg:inline text-bone-line">│</span>
        <span className="hidden md:inline">LA · 72°</span>
        <span aria-hidden className="hidden md:inline text-bone-line">│</span>
        <span className="tabular-nums">{time}</span>

        <button
          type="button"
          aria-label="Mission Control (F3)"
          title="Mission Control (F3)"
          onClick={wm.toggleMissionControl}
          className={`ml-1 inline-flex h-5 w-5 items-center justify-center border transition-colors ${
            wm.missionControl
              ? "border-safelight bg-safelight/15 text-bone"
              : "border-bone-line text-bone-muted hover:border-bone-muted hover:text-bone"
          }`}
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3">
            <rect x="1" y="1" width="4" height="4" fill="currentColor" />
            <rect x="7" y="1" width="4" height="4" fill="currentColor" />
            <rect x="1" y="7" width="4" height="4" fill="currentColor" />
            <rect x="7" y="7" width="4" height="4" fill="currentColor" />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Notification Center"
          title="Notification Center"
          onClick={wm.toggleNotificationCenter}
          className={`inline-flex h-5 w-5 items-center justify-center border transition-colors ${
            wm.notificationCenter
              ? "border-safelight bg-safelight/15 text-bone"
              : "border-bone-line text-bone-muted hover:border-bone-muted hover:text-bone"
          }`}
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3">
            <line
              x1="2"
              y1="3"
              x2="10"
              y2="3"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <line
              x1="2"
              y1="6"
              x2="10"
              y2="6"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <line
              x1="2"
              y1="9"
              x2="7"
              y2="9"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Spotlight"
          title="Spotlight (⌘K)"
          onClick={() => {
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true })
            );
          }}
          className="ml-1 inline-flex items-center gap-1.5 border border-bone-line px-2 py-[3px] text-bone transition-colors hover:border-safelight"
        >
          <span>⌘K</span>
        </button>

        {/* AI Co-pilot indicator */}
        <AiIndicator />
      </div>
    </header>
  );
}

function Menu({
  id,
  openMenu,
  setOpenMenu,
  trigger,
  children,
}: {
  id: MenuId;
  openMenu: MenuId | null;
  setOpenMenu: (m: MenuId | null) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const open = openMenu === id;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenMenu(open ? null : id)}
        onMouseEnter={() => {
          // macOS menu mode: hover switches once any menu is open
          if (openMenu && openMenu !== id) setOpenMenu(id);
        }}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-2 px-2 py-1 transition-colors ${
          open ? "bg-ink-100" : "hover:bg-ink-100"
        }`}
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-full z-50 mt-px min-w-56 origin-top-left border border-bone-line bg-ink/95 py-1 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            style={{ WebkitBackdropFilter: "blur(20px) saturate(140%)" }}
            onMouseLeave={(e) => {
              // If the cursor leaves both trigger and dropdown, close
              const next = e.relatedTarget as Node | null;
              if (next && wrapperContains(next)) return;
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Lightweight helper used above
function wrapperContains(_node: Node) {
  // Always returns false; kept for future hover-leave timing control.
  return false;
}

function MenuItem({
  onClick,
  shortcut,
  disabled,
  check,
  children,
}: {
  onClick?: () => void;
  shortcut?: string;
  disabled?: boolean;
  check?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-widest transition-colors ${
        disabled
          ? "cursor-not-allowed text-bone-muted/40"
          : "text-bone-dim hover:bg-safelight hover:text-ink"
      }`}
    >
      <span className="flex items-center gap-2 truncate">
        {check && <span className="text-safelight">●</span>}
        <span>{children}</span>
      </span>
      {shortcut && (
        <span className="shrink-0 text-bone-muted">{shortcut}</span>
      )}
    </button>
  );
}

function MenuSeparator() {
  return <div className="my-1 h-px bg-bone-line" />;
}

function fmt(d: Date) {
  return d
    .toLocaleTimeString("en-US", {
      hour12: false,
      timeZone: "America/Los_Angeles",
    })
    .replace(/(\d{2}):(\d{2}):(\d{2})/, "$1:$2 PT");
}

/**
 * The Atelier crown — small applied-gold mark used as the Josh menu glyph.
 * Five-point silhouette referencing the watch-crown vocabulary without
 * mimicking any specific brand mark.
 */
function CrownGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
      <defs>
        <linearGradient id="crown-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0e0b6" />
          <stop offset="50%" stopColor="#c8a76a" />
          <stop offset="100%" stopColor="#9c7d49" />
        </linearGradient>
      </defs>
      <path
        d="M2 11 L3 5 L5.5 7 L8 3 L10.5 7 L13 5 L14 11 Z"
        fill="url(#crown-grad)"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <rect x="2" y="11" width="12" height="1.4" fill="#9c7d49" />
    </svg>
  );
}
