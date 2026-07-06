"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAi } from "@/lib/ai-bus";
import { useWindowManager } from "@/lib/window-store";

type Suggestion =
  | { kind: "ai"; label: string; hint: string; group: string }
  | { kind: "nav"; label: string; hint: string; href: string; group: string }
  | { kind: "action"; label: string; hint: string; action: () => void; group: string };

const QUICK_AI = [
  { label: "recommend a project for a fintech client", group: "Ask Co-pilot" },
  { label: "compare spin and hush", group: "Ask Co-pilot" },
  { label: "read me the latest entry", group: "Ask Co-pilot" },
  { label: "what's running right now", group: "Ask Co-pilot" },
];

const WORKSPACES = [
  { label: "recruiter mode", hint: "About · Work · Contact arranged" },
  { label: "designer mode", hint: "Work + Journal" },
  { label: "founder mode", hint: "Boneyard | Spin · split" },
  { label: "critic mode", hint: "About + Journal" },
  { label: "clean slate", hint: "Close all windows" },
];

const SYSTEM = [
  { label: "make it lighter", hint: "Switch to Light theme" },
  { label: "make it darker", hint: "Switch to Dark theme" },
  { label: "hide the dock", hint: "Set dock to hidden" },
  { label: "show the dock", hint: "Set dock to bottom" },
  { label: "mute", hint: "Turn UI sounds off" },
  { label: "turn on sound", hint: "Enable UI sounds" },
  { label: "lock now", hint: "Lock the desktop · ⌃⌘Q" },
  { label: "mission control", hint: "Tile all open windows · F3" },
  { label: "notification center", hint: "Slide-in widget panel" },
  { label: "develop", hint: "Flash the safelight" },
  { label: "reboot", hint: "Replay the boot sequence" },
];

const NAV: { label: string; hint: string; path: string }[] = [
  { label: "open ~/", hint: "Desktop", path: "/" },
  { label: "open ~/work", hint: "Contact sheet", path: "/work" },
  { label: "open ~/journal", hint: "Field notes", path: "/journal" },
  { label: "open ~/about", hint: "The long exposure", path: "/about" },
  { label: "open ~/contact", hint: "Send a signal", path: "/contact" },
  { label: "system preferences", hint: "Configure Atelier", path: "/prefs" },
];

const PROJECTS = [
  { label: "open spin", hint: "Spin · Ford Mobility · 2019—2023" },
  { label: "open hush", hint: "Hush · 2017—2019" },
  { label: "open vgv", hint: "Very Good Ventures · 2023" },
  { label: "open saucey", hint: "Saucey · 2015—2017" },
  { label: "open nationbuilder", hint: "NationBuilder · 2014—2015" },
  { label: "open differential", hint: "Differential · 2013—2014" },
  { label: "open boneyard", hint: "Boneyard Collective · 2023—" },
];

export function CommandPalette() {
  const router = useRouter();
  const { submit, setPanelOpen } = useAi();
  const { open: openWindow } = useWindowManager();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "/" && !open && !isTyping(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  // Build the suggestion list
  const items: Suggestion[] = useMemo(() => {
    const out: Suggestion[] = [];

    out.push(
      ...QUICK_AI.map<Suggestion>((q) => ({
        kind: "ai",
        label: q.label,
        hint: "Co-pilot · ↩ to run",
        group: q.group,
      }))
    );

    out.push(
      ...WORKSPACES.map<Suggestion>((w) => ({
        kind: "ai",
        label: w.label,
        hint: w.hint,
        group: "Workspaces",
      }))
    );

    out.push(
      ...PROJECTS.map<Suggestion>((p) => ({
        kind: "ai",
        label: p.label,
        hint: p.hint,
        group: "Open frame",
      }))
    );

    out.push(
      ...NAV.map<Suggestion>((n) => {
        if (n.path === "/prefs") {
          return {
            kind: "action",
            label: n.label,
            hint: n.hint,
            group: "Navigate",
            action: () => openWindow({ app: "prefs" }),
          };
        }
        return { kind: "nav", label: n.label, hint: n.hint, href: n.path, group: "Navigate" };
      })
    );

    out.push(
      ...SYSTEM.map<Suggestion>((s) => ({
        kind: "ai",
        label: s.label,
        hint: s.hint,
        group: "System",
      }))
    );

    out.push({
      kind: "action",
      label: "open co-pilot",
      hint: "Right-side AI panel · ⌘.",
      group: "Co-pilot",
      action: () => setPanelOpen(true),
    });

    return out;
  }, [openWindow, setPanelOpen]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    // If the input doesn't match anything well, surface "Ask Co-pilot" with the literal input as the action
    const matches = needle
      ? items.filter(
          (i) =>
            i.label.toLowerCase().includes(needle) ||
            i.hint.toLowerCase().includes(needle) ||
            i.group.toLowerCase().includes(needle)
        )
      : items;

    // Always pin an "Ask Co-pilot: <typed>" option at the very top when there's input
    if (needle && needle.length > 1) {
      const askThis: Suggestion = {
        kind: "ai",
        label: `ask co-pilot: ${needle}`,
        hint: "Send to Atelier · ↩",
        group: "Co-pilot",
      };
      return [askThis, ...matches];
    }
    return matches;
  }, [q, items]);

  const grouped = useMemo(() => {
    const g: Record<string, Suggestion[]> = {};
    for (const i of filtered) {
      g[i.group] = g[i.group] ?? [];
      g[i.group].push(i);
    }
    return g;
  }, [filtered]);

  const run = (i: Suggestion) => {
    setOpen(false);
    if (i.kind === "ai") {
      // For the "ask co-pilot: <text>" item, the label looks like "ask co-pilot: foo"
      const text = i.label.startsWith("ask co-pilot:") ? i.label.replace(/^ask co-pilot:\s*/, "") : i.label;
      // Open the panel so the user can see the reply stream
      setPanelOpen(true);
      // Defer slightly so the panel mounts cleanly
      setTimeout(() => submit(text), 60);
      return;
    }
    if (i.kind === "action") return i.action();
    if (i.kind === "nav") return router.push(i.href);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            aria-label="Close spotlight"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: -8, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl border border-bone-line bg-ink/95 shadow-2xl backdrop-blur-2xl"
            style={{ WebkitBackdropFilter: "blur(28px) saturate(140%)" }}
          >
            <div className="flex items-center gap-3 border-b border-bone-line px-4 py-3">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-safelight" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                  Spotlight · AI
                </span>
              </span>
              <span className="font-mono text-base text-safelight">›</span>
              <input
                ref={inputRef}
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask Atelier · or type a command"
                className="flex-1 bg-transparent font-mono text-sm text-bone placeholder:text-bone-muted focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filtered[0]) run(filtered[0]);
                }}
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                ESC
              </span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-1 py-2">
              {Object.keys(grouped).length === 0 && (
                <div className="px-4 py-8 text-center font-mono text-xs uppercase tracking-widest text-bone-muted">
                  Press ↩ to ask Co-pilot.
                </div>
              )}
              {Object.entries(grouped).map(([group, list]) => (
                <div key={group} className="mb-1">
                  <div className="px-4 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                    {group}
                  </div>
                  <ul>
                    {list.map((i, idx) => (
                      <li key={`${i.group}-${i.label}-${idx}`}>
                        <button
                          onClick={() => run(i)}
                          className="group flex w-full items-center justify-between gap-4 px-4 py-2 text-left transition-colors hover:bg-ink-100"
                        >
                          <span className="truncate font-mono text-[12px] text-bone">
                            {i.label}
                          </span>
                          <span className="truncate font-mono text-[10px] uppercase tracking-widest text-bone-muted group-hover:text-safelight">
                            {i.hint}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-bone-line px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
              <span>↩ run</span>
              <span>↑↓ navigate</span>
              <span>⌘. for Co-pilot</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}
