"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { useWindowManager, type OpenWindow } from "@/lib/window-store";
import { Desktop } from "./showcase";
import { Wallpaper } from "./wallpaper";
import { Stickies } from "./stickies";
import { Window } from "./window";
import { WindowContent } from "./window-content";
import { Dock } from "./dock";
import { MissionControl } from "./mission-control";
import { NotificationCenter } from "./notification-center";
import { AppSwitcher } from "./app-switcher";
import { SystemHud } from "./system-hud";
import { Atmosphere } from "./atmosphere";
import { ContextMenu, type MenuItem } from "./context-menu";

type Anchor = { x: number; y: number; items: MenuItem[] } | null;

/**
 * The OS shell. Wallpaper → Desktop → layered Windows → Dock, with
 * Mission Control and Notification Center overlays. Context menus
 * mount here so they can position relative to the page.
 */
export function DarkroomOS() {
  const wm = useWindowManager();
  const visible = wm.windows.filter((w) => !w.minimized);
  const [menu, setMenu] = useState<Anchor>(null);

  const desktopMenu = (e: React.MouseEvent): MenuItem[] => [
    { kind: "label", label: "Desktop" },
    {
      kind: "item",
      label: "Open ~/work",
      shortcut: "⌘1",
      onClick: () => wm.open({ app: "work" }),
    },
    {
      kind: "item",
      label: "Open ~/journal",
      shortcut: "⌘2",
      onClick: () => wm.open({ app: "journal" }),
    },
    {
      kind: "item",
      label: "About this archive",
      onClick: () => wm.open({ app: "about" }),
    },
    { kind: "separator" },
    {
      kind: "item",
      label: "Mission Control",
      shortcut: "F3",
      onClick: () => wm.setMissionControl(true),
    },
    {
      kind: "item",
      label: "Notification Center",
      onClick: () => wm.setNotificationCenter(true),
    },
    { kind: "separator" },
    {
      kind: "item",
      label: "Close all windows",
      onClick: () => wm.closeAll(),
      disabled: wm.windows.length === 0,
    },
    {
      kind: "item",
      label: "Reboot archive…",
      onClick: () => {
        sessionStorage.removeItem("darkroom-booted");
        sessionStorage.removeItem("darkroom-notice");
        sessionStorage.removeItem("darkroom.windows.v2");
        location.reload();
      },
    },
  ];

  const windowMenu = (w: OpenWindow): MenuItem[] => {
    const items: MenuItem[] = [
      { kind: "label", label: w.slug },
      {
        kind: "item",
        label: w.maximized ? "Restore" : "Maximize",
        onClick: () => wm.maximize(w.id),
      },
      { kind: "item", label: "Minimize", onClick: () => wm.minimize(w.id) },
      { kind: "separator" },
      { kind: "label", label: "Snap" },
      { kind: "item", label: "Full screen", onClick: () => wm.snap(w.id, "full") },
      { kind: "item", label: "Left half", onClick: () => wm.snap(w.id, "left") },
      { kind: "item", label: "Right half", onClick: () => wm.snap(w.id, "right") },
      {
        kind: "item",
        label: "Unsnap",
        onClick: () => wm.snap(w.id, null),
        disabled: !w.snap,
      },
      { kind: "separator" },
    ];

    // Get Info for project / entry windows
    if ((w.app === "project" || w.app === "entry") && w.param) {
      items.push({
        kind: "item",
        label: "Get Info",
        shortcut: "⌘I",
        onClick: () => wm.open({ app: "info", param: w.param }),
      });
    }

    items.push(
      {
        kind: "item",
        label: "Copy path",
        onClick: () => navigator.clipboard?.writeText(`https://josh.design${w.path}`),
      },
      {
        kind: "item",
        label: "Open in new tab",
        onClick: () => window.open(w.path, "_blank"),
      },
      { kind: "separator" },
      {
        kind: "item",
        label: "Close",
        shortcut: "⌘W",
        onClick: () => wm.close(w.id),
      }
    );

    return items;
  };

  return (
    <div
      className="relative h-[calc(100dvh-2.25rem)] w-full overflow-hidden"
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY, items: desktopMenu(e) });
      }}
    >
      <Wallpaper />
      <Atmosphere />
      <Desktop />
      <Stickies />
      <SystemHud />
      <AnimatePresence>
        {visible.map((w) => (
          <Window
            key={w.id}
            w={w}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenu({ x: e.clientX, y: e.clientY, items: windowMenu(w) });
            }}
          >
            <WindowContent w={w} />
          </Window>
        ))}
      </AnimatePresence>
      <Dock />
      <MissionControl />
      <NotificationCenter />
      <AppSwitcher />

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
