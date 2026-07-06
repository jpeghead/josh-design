"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useWindowManager } from "@/lib/window-store";
import { journal, projects } from "@/lib/data";

type StickyKind = "manifesto" | "shipping" | "issue" | "note";

type StickyState = {
  id: StickyKind;
  x: number;
  y: number;
  visible: boolean;
};

const DEFAULTS: StickyState[] = [
  { id: "manifesto", x: 0, y: 0, visible: false },
  { id: "shipping", x: 0, y: 0, visible: false },
  { id: "issue", x: 0, y: 0, visible: false },
  { id: "note", x: 0, y: 0, visible: false },
];

const STORAGE_KEY = "darkroom.stickies.v1";

/**
 * Stickies — restrained, type-driven compact cards. No watch parts;
 * elegance comes from refined typography, generous padding, and one
 * accent line per card.
 */
export function Stickies() {
  const [stickies, setStickies] = useState<StickyState[]>(DEFAULTS);
  const hydrated = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let initial = DEFAULTS;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as StickyState[];
        if (Array.isArray(data)) {
          initial = DEFAULTS.map((d) => data.find((s) => s.id === d.id) ?? d);
        }
      }
    } catch {}
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    initial = initial.map((s) => {
      if (s.x !== 0 || s.y !== 0) return s;
      switch (s.id) {
        case "manifesto":
          return { ...s, x: vw - 280, y: vh - 320 };
        case "shipping":
          return { ...s, x: vw - 280, y: vh - 520 };
        case "issue":
          return { ...s, x: 24, y: vh - 270 };
        case "note":
          return { ...s, x: 24, y: vh - 460 };
      }
    });
    setStickies(initial);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stickies));
    } catch {}
  }, [stickies]);

  const update = (id: StickyKind, patch: Partial<StickyState>) => {
    setStickies((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      {stickies
        .filter((s) => s.visible)
        .map((s) => (
          <Sticky
            key={s.id}
            state={s}
            onMove={(x, y) => update(s.id, { x, y })}
            onDismiss={() => update(s.id, { visible: false })}
          />
        ))}
    </div>
  );
}

function Sticky({
  state,
  onMove,
  onDismiss,
}: {
  state: StickyState;
  onMove: (x: number, y: number) => void;
  onDismiss: () => void;
}) {
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    dragRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - state.x,
      offsetY: e.clientY - state.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const x = Math.max(8, Math.min(window.innerWidth - 260, e.clientX - d.offsetX));
    const y = Math.max(48, Math.min(window.innerHeight - 120, e.clientY - d.offsetY));
    onMove(x, y);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      dragRef.current = null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "absolute", left: state.x, top: state.y, width: 240 }}
      className="pointer-events-auto"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative border border-bone-line bg-ink/85 backdrop-blur-md select-none cursor-grab active:cursor-grabbing"
      >
        <Header onDismiss={onDismiss} />
        <Body id={state.id} />
      </div>
    </motion.div>
  );
}

function Header({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex h-6 items-center justify-end border-b border-bone-line/40 px-2">
      <button
        type="button"
        onClick={onDismiss}
        data-no-drag
        className="font-mono text-[10px] uppercase tracking-widest text-bone-muted hover:text-bone"
        aria-label="Dismiss"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

function Body({ id }: { id: StickyKind }) {
  if (id === "manifesto") return <ManifestoBody />;
  if (id === "shipping") return <ShippingBody />;
  if (id === "issue") return <IssueBody />;
  return <NoteBody />;
}

/* ──────────────────────────────────────────────────────────── */

function ManifestoBody() {
  return (
    <div className="px-5 py-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone-muted">
        Operating principles
      </p>
      <p className="mt-3 font-[var(--font-display)] text-xl leading-tight text-bone">
        Dreams don&rsquo;t expire.
      </p>
      <ol className="mt-4 space-y-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim">
        <li>01 · Simplicity</li>
        <li>02 · People first</li>
        <li>03 · Cultivate joy</li>
        <li>04 · Stay restless</li>
      </ol>
    </div>
  );
}

function ShippingBody() {
  const { open } = useWindowManager();
  const project = projects.find((p) => p.slug === "boneyard");
  const [progress, setProgress] = useState(73);
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + (Math.random() * 4 - 1.5);
        return Math.max(60, Math.min(98, next));
      });
    }, 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="px-5 py-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone-muted">
        Currently shipping
      </p>
      <p className="mt-3 font-[var(--font-display)] text-xl leading-tight text-bone">
        {project?.title ?? "Boneyard"}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-bone-muted">
        {project?.role ?? "Founder"}
      </p>
      <div className="mt-5">
        <div className="h-px w-full bg-bone-line">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.4, ease: "linear" }}
            className="h-full bg-safelight"
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.32em] text-bone-muted">
          <span>Progress</span>
          <span className="tabular-nums">{Math.round(progress)}%</span>
        </div>
      </div>
      <button
        type="button"
        data-no-drag
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          open({ app: "project", param: "boneyard", origin: { x: r.x, y: r.y } });
        }}
        className="mt-4 font-mono text-[10px] uppercase tracking-[0.32em] text-bone-muted transition-colors hover:text-bone"
      >
        Open frame →
      </button>
    </div>
  );
}

function IssueBody() {
  const { open } = useWindowManager();
  const entry = journal[0];
  return (
    <div className="px-5 py-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone-muted">
        {entry.category} · {entry.date}
      </p>
      <p className="mt-3 font-[var(--font-display)] text-xl leading-tight text-bone">
        {entry.title}
      </p>
      <p className="mt-3 line-clamp-3 text-[12px] leading-[1.55] text-bone-dim">
        {entry.excerpt}
      </p>
      <button
        type="button"
        data-no-drag
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          open({ app: "entry", param: entry.slug, origin: { x: r.x, y: r.y } });
        }}
        className="mt-4 font-mono text-[10px] uppercase tracking-[0.32em] text-bone-muted transition-colors hover:text-bone"
      >
        {entry.readTime} read →
      </button>
    </div>
  );
}

function NoteBody() {
  const { open } = useWindowManager();
  return (
    <div className="px-5 py-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone-muted">
        Leave a note
      </p>
      <p className="mt-3 font-[var(--font-display)] text-xl leading-tight text-bone">
        Send a signal.
      </p>
      <p className="mt-3 text-[12px] leading-[1.55] text-bone-dim">
        Every message is read. Replies within 48 hours.
      </p>
      <button
        type="button"
        data-no-drag
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          open({ app: "contact", origin: { x: r.x, y: r.y } });
        }}
        className="mt-4 font-mono text-[10px] uppercase tracking-[0.32em] text-bone transition-colors hover:text-safelight"
      >
        Compose →
      </button>
    </div>
  );
}
