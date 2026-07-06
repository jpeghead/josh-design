"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { projects, type Project } from "@/lib/data";
import { useWindowManager } from "@/lib/window-store";
import { useOpenInWindow } from "../link";

type ViewMode = "grid" | "list" | "cover" | "column";
type TabKey = "all" | "live" | "archived" | "nda" | "by-year";

/**
 * ~/work as a Finder window. Tabs across the top filter the contact sheet.
 * View mode switcher in the toolbar — Grid / List / Cover Flow / Column.
 * Sidebar with Favorites / Recents / Tags. Multi-select with ⌘-click,
 * keyboard nav with arrow keys, Spacebar Quick Look, status bar at the
 * bottom showing item counts and selection.
 */
export function WorkContent() {
  useOpenInWindow();
  const { open } = useWindowManager();
  const [tab, setTab] = useState<TabKey>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (tab === "live") list = list.filter((p) => p.status === "Live");
    if (tab === "archived") list = list.filter((p) => p.status === "Archived");
    if (tab === "nda") list = list.filter((p) => p.classified);
    if (tab === "by-year") {
      list = [...list].sort((a, b) => {
        const ay = parseInt(a.year.match(/\d{4}/)?.[0] ?? "0");
        const by = parseInt(b.year.match(/\d{4}/)?.[0] ?? "0");
        return by - ay;
      });
    }
    if (activeFilter) {
      list = list.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === activeFilter.toLowerCase())
      );
    }
    return list;
  }, [tab, activeFilter]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    projects.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, []);

  const recents = useMemo(
    () =>
      ["boneyard", "spin", "hush"]
        .map((slug) => projects.find((p) => p.slug === slug))
        .filter(Boolean) as Project[],
    []
  );

  // Keyboard nav: arrows + return + space
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      const len = filteredProjects.length;
      if (len === 0) return;
      const currentIdx = filteredProjects.findIndex((p) => selected.has(p.slug));
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = filteredProjects[Math.min(len - 1, Math.max(0, currentIdx + 1))];
        setSelected(new Set([next.slug]));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = filteredProjects[Math.max(0, currentIdx - 1)];
        setSelected(new Set([next.slug]));
      } else if (e.key === "Enter" && currentIdx >= 0) {
        e.preventDefault();
        const p = filteredProjects[currentIdx];
        open({ app: "project", param: p.slug });
      } else if (e.key === " " && currentIdx >= 0) {
        e.preventDefault();
        // Quick Look — open the project
        const p = filteredProjects[currentIdx];
        open({ app: "project", param: p.slug });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filteredProjects, selected, open]);

  const onItemClick = (slug: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      // Multi-select
      setSelected((s) => {
        const next = new Set(s);
        if (next.has(slug)) next.delete(slug);
        else next.add(slug);
        return next;
      });
    } else {
      setSelected(new Set([slug]));
    }
  };

  const onItemOpen = (slug: string, e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    open({
      app: "project",
      param: slug,
      origin: { x: r.x + r.width / 2, y: r.y + r.height / 2 },
    });
  };

  return (
    <div ref={containerRef} className="flex h-full flex-col" tabIndex={-1}>
      {/* Toolbar */}
      <Toolbar
        tab={tab}
        setTab={(t) => {
          setTab(t);
          setSelected(new Set());
        }}
        view={view}
        setView={setView}
        counts={{
          all: projects.length,
          live: projects.filter((p) => p.status === "Live").length,
          archived: projects.filter((p) => p.status === "Archived").length,
          nda: projects.filter((p) => p.classified).length,
        }}
      />

      {/* Main split: sidebar + body */}
      <div className="flex min-h-0 flex-1">
        <Sidebar
          tags={allTags}
          recents={recents}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onOpenProject={(slug, e) => onItemOpen(slug, e)}
        />

        <div className="min-w-0 flex-1 overflow-auto">
          {filteredProjects.length === 0 ? (
            <Empty />
          ) : (
            <ViewBody
              view={view}
              projects={filteredProjects}
              selected={selected}
              onItemClick={onItemClick}
              onItemOpen={onItemOpen}
            />
          )}
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        total={filteredProjects.length}
        liveCount={filteredProjects.filter((p) => p.status === "Live").length}
        selectedCount={selected.size}
        view={view}
        tab={tab}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */

function Toolbar({
  tab,
  setTab,
  view,
  setView,
  counts,
}: {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  counts: { all: number; live: number; archived: number; nda: number };
}) {
  const tabs: { id: TabKey; label: string; count?: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "live", label: "Live", count: counts.live },
    { id: "archived", label: "Archived", count: counts.archived },
    { id: "nda", label: "Under NDA", count: counts.nda },
    { id: "by-year", label: "By year" },
  ];

  return (
    <div className="flex items-center justify-between gap-3 border-b border-bone-line bg-ink-50/40 px-2 sm:px-3">
      <div className="flex items-center">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                active ? "text-bone" : "text-bone-muted hover:text-bone-dim"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`tabular-nums ${active ? "text-bone-dim" : "text-bone-muted/70"}`}>
                  {String(t.count).padStart(2, "0")}
                </span>
              )}
              {active && (
                <motion.span
                  layoutId="work-tab-underline"
                  className="absolute inset-x-2 -bottom-px h-px bg-safelight"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-px border border-bone-line">
        {(["grid", "list", "cover", "column"] as ViewMode[]).map((v) => {
          const active = view === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-label={`${v} view`}
              title={`${v[0].toUpperCase() + v.slice(1)} view`}
              className={`flex h-7 w-7 items-center justify-center transition-colors ${
                active ? "bg-safelight/15 text-bone" : "bg-ink text-bone-muted hover:text-bone-dim"
              }`}
            >
              <ViewIcon mode={v} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViewIcon({ mode }: { mode: ViewMode }) {
  if (mode === "grid") {
    return (
      <svg viewBox="0 0 12 12" className="h-3.5 w-3.5">
        <rect x="1.5" y="1.5" width="3.5" height="3.5" fill="currentColor" />
        <rect x="7" y="1.5" width="3.5" height="3.5" fill="currentColor" />
        <rect x="1.5" y="7" width="3.5" height="3.5" fill="currentColor" />
        <rect x="7" y="7" width="3.5" height="3.5" fill="currentColor" />
      </svg>
    );
  }
  if (mode === "list") {
    return (
      <svg viewBox="0 0 12 12" className="h-3.5 w-3.5">
        <line x1="1.5" y1="3" x2="10.5" y2="3" stroke="currentColor" strokeWidth="1.2" />
        <line x1="1.5" y1="6" x2="10.5" y2="6" stroke="currentColor" strokeWidth="1.2" />
        <line x1="1.5" y1="9" x2="10.5" y2="9" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (mode === "cover") {
    return (
      <svg viewBox="0 0 12 12" className="h-3.5 w-3.5">
        <rect x="1" y="2" width="3" height="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <rect x="4.5" y="1" width="3" height="10" fill="currentColor" />
        <rect x="8" y="2" width="3" height="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 12 12" className="h-3.5 w-3.5">
      <line x1="3" y1="1" x2="3" y2="11" stroke="currentColor" strokeWidth="1.2" />
      <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9" y1="1" x2="9" y2="11" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/* ── Sidebar ─────────────────────────────────────────────────── */

function Sidebar({
  tags,
  recents,
  activeFilter,
  setActiveFilter,
  onOpenProject,
}: {
  tags: string[];
  recents: Project[];
  activeFilter: string | null;
  setActiveFilter: (t: string | null) => void;
  onOpenProject: (slug: string, e: React.MouseEvent) => void;
}) {
  return (
    <aside className="hidden w-48 shrink-0 overflow-y-auto border-r border-bone-line bg-ink-50/30 px-3 py-3 md:block">
      <Group label="Favorites">
        {recents.slice(0, 3).map((p) => (
          <SidebarItem
            key={p.slug}
            label={p.title}
            onClick={(e) => onOpenProject(p.slug, e)}
          />
        ))}
      </Group>
      <Group label="Recents">
        {recents.map((p) => (
          <SidebarItem
            key={p.slug}
            label={p.title}
            badge={p.year.split(" ")[0]}
            onClick={(e) => onOpenProject(p.slug, e)}
          />
        ))}
      </Group>
      <Group label="Tags">
        {tags.map((t) => {
          const active = activeFilter === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setActiveFilter(active ? null : t)}
              className={`flex w-full items-center gap-2 truncate px-2 py-1 text-left font-mono text-[10px] uppercase tracking-widest transition-colors ${
                active
                  ? "bg-safelight/15 text-bone"
                  : "text-bone-dim hover:bg-ink-100 hover:text-bone"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? "bg-safelight" : "bg-bone-muted"
                }`}
              />
              {t}
            </button>
          );
        })}
      </Group>
    </aside>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="px-2 pb-1 font-mono text-[9px] uppercase tracking-widest text-bone-muted">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function SidebarItem({
  label,
  badge,
  onClick,
}: {
  label: string;
  badge?: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 truncate px-2 py-1 text-left transition-colors hover:bg-ink-100"
    >
      <span className="truncate font-mono text-[10px] uppercase tracking-widest text-bone-dim">
        {label}
      </span>
      {badge && (
        <span className="shrink-0 font-mono text-[9px] tabular-nums text-bone-muted">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── View body — switches between grid/list/cover/column ─────── */

function ViewBody({
  view,
  projects: list,
  selected,
  onItemClick,
  onItemOpen,
}: {
  view: ViewMode;
  projects: Project[];
  selected: Set<string>;
  onItemClick: (slug: string, e: React.MouseEvent) => void;
  onItemOpen: (slug: string, e: React.MouseEvent) => void;
}) {
  if (view === "list") {
    return (
      <table className="w-full font-mono text-[11px]">
        <thead className="sticky top-0 bg-ink-50/95 backdrop-blur">
          <tr className="border-b border-bone-line text-bone-muted">
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Year</Th>
            <Th className="text-right">Status</Th>
          </tr>
        </thead>
        <tbody>
          {list.map((p, i) => (
            <tr
              key={p.slug}
              onClick={(e) => onItemClick(p.slug, e)}
              onDoubleClick={(e) => onItemOpen(p.slug, e)}
              className={`group cursor-default border-b border-bone-line/40 transition-colors ${
                selected.has(p.slug) ? "bg-safelight/15 text-bone" : "text-bone-dim hover:bg-ink-100"
              }`}
            >
              <Td>
                <span className="flex items-center gap-2">
                  <span
                    className={
                      p.status === "Live"
                        ? "h-1.5 w-1.5 rounded-full bg-emulsion"
                        : p.status === "In flight"
                        ? "h-1.5 w-1.5 rounded-full bg-sodium"
                        : "h-1.5 w-1.5 rounded-full bg-bone-muted"
                    }
                  />
                  <span className="font-mono uppercase tracking-widest">
                    {String(i + 1).padStart(2, "0")} · {p.title}
                  </span>
                </span>
              </Td>
              <Td className="text-bone-muted">{p.role}</Td>
              <Td className="text-bone-muted">{p.year}</Td>
              <Td className="text-right uppercase tracking-widest text-bone-muted">{p.status}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (view === "cover") {
    return <CoverFlow projects={list} selected={selected} onItemClick={onItemClick} onItemOpen={onItemOpen} />;
  }

  if (view === "column") {
    return <ColumnView projects={list} selected={selected} onItemClick={onItemClick} onItemOpen={onItemOpen} />;
  }

  // Grid (default)
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((p, i) => (
        <GridCell
          key={p.slug}
          project={p}
          index={i}
          isSelected={selected.has(p.slug)}
          onClick={(e) => onItemClick(p.slug, e)}
          onDoubleClick={(e) => onItemOpen(p.slug, e)}
        />
      ))}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left uppercase tracking-widest ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}

function GridCell({
  project,
  index,
  isSelected,
  onClick,
  onDoubleClick,
}: {
  project: Project;
  index: number;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
}) {
  const palette = paletteFor(project.slug);
  const initials = project.title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`block text-left border transition-colors ${
        isSelected
          ? "border-safelight bg-safelight/10"
          : "border-bone-line bg-ink-50 hover:bg-ink-100"
      }`}
    >
      <div className="flex items-center justify-between border-b border-bone-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        <span>Frame · {String(index + 1).padStart(3, "0")}</span>
        <span className="flex items-center gap-2">
          <span
            className={
              project.status === "Live"
                ? "h-1.5 w-1.5 rounded-full bg-emulsion"
                : project.status === "In flight"
                ? "h-1.5 w-1.5 rounded-full bg-sodium"
                : "h-1.5 w-1.5 rounded-full bg-bone-muted"
            }
          />
          {project.status}
        </span>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: palette.bg }}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300">
          <defs>
            <pattern id={`gv-${project.slug}`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke={palette.fg} strokeOpacity="0.08" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#gv-${project.slug})`} />
          <g stroke={palette.accent} strokeWidth="0.5" opacity="0.7">
            <circle cx="200" cy="150" r="44" fill="none" />
            <line x1="200" y1="100" x2="200" y2="200" />
            <line x1="150" y1="150" x2="250" y2="150" />
          </g>
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center font-[var(--font-display)] italic"
          style={{
            color: palette.fg,
            fontSize: "clamp(4rem, 10vw, 8rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.05em",
            textShadow: `2px 2px 0 ${palette.accent}`,
          }}
        >
          {initials}
        </div>
      </div>
      <div className="border-t border-bone-line px-3 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-[var(--font-display)] text-xl text-bone">{project.title}</h3>
          <span className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            {project.year}
          </span>
        </div>
        <p className="mt-1 text-xs text-bone-dim">{project.role}</p>
      </div>
    </button>
  );
}

function CoverFlow({
  projects: list,
  selected,
  onItemClick,
  onItemOpen,
}: {
  projects: Project[];
  selected: Set<string>;
  onItemClick: (slug: string, e: React.MouseEvent) => void;
  onItemOpen: (slug: string, e: React.MouseEvent) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = list[activeIdx] ?? list[0];

  useEffect(() => {
    if (active) onItemClick(active.slug, { metaKey: false } as React.MouseEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);
  void selected;

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex h-3/5 items-center justify-center overflow-hidden bg-ink-50/40 py-6">
        {list.map((p, i) => {
          const offset = i - activeIdx;
          const abs = Math.abs(offset);
          if (abs > 3) return null;
          const palette = paletteFor(p.slug);
          const initials = p.title
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 3)
            .toUpperCase();
          return (
            <motion.button
              key={p.slug}
              type="button"
              onClick={() => setActiveIdx(i)}
              onDoubleClick={(e) => onItemOpen(p.slug, e)}
              animate={{
                x: offset * 140,
                rotateY: offset * -18,
                scale: 1 - abs * 0.12,
                zIndex: 10 - abs,
                opacity: 1 - abs * 0.25,
              }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute h-64 w-44 border border-bone-line"
              style={{ background: palette.bg, transformOrigin: "center center" }}
            >
              <div
                className="flex h-full w-full items-center justify-center font-[var(--font-display)] italic"
                style={{
                  color: palette.fg,
                  fontSize: "clamp(3.5rem, 8vw, 5rem)",
                  textShadow: `2px 2px 0 ${palette.accent}`,
                }}
              >
                {initials}
              </div>
            </motion.button>
          );
        })}
      </div>
      <div className="border-t border-bone-line bg-ink p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          {active.year} · {active.role}
        </p>
        <h3 className="mt-2 font-[var(--font-display)] text-3xl italic text-bone sm:text-4xl">
          {active.title}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone-dim">
          {active.summary}
        </p>
        <button
          type="button"
          onClick={(e) => onItemOpen(active.slug, e)}
          className="mt-3 inline-flex items-center gap-2 border border-bone-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-bone transition-colors hover:border-safelight"
        >
          Open frame ↗
        </button>
      </div>
    </div>
  );
}

function ColumnView({
  projects: list,
  selected,
  onItemClick,
  onItemOpen,
}: {
  projects: Project[];
  selected: Set<string>;
  onItemClick: (slug: string, e: React.MouseEvent) => void;
  onItemOpen: (slug: string, e: React.MouseEvent) => void;
}) {
  const activeSlug = Array.from(selected)[0] ?? list[0]?.slug;
  const active = list.find((p) => p.slug === activeSlug) ?? list[0];

  return (
    <div className="grid h-full grid-cols-12 gap-px bg-bone-line">
      <ul className="col-span-5 overflow-y-auto bg-ink">
        {list.map((p, i) => {
          const isSel = activeSlug === p.slug;
          return (
            <li key={p.slug}>
              <button
                type="button"
                onClick={(e) => onItemClick(p.slug, e)}
                onDoubleClick={(e) => onItemOpen(p.slug, e)}
                className={`flex w-full items-center justify-between gap-3 border-b border-bone-line/40 px-3 py-2 text-left transition-colors ${
                  isSel ? "bg-safelight/15 text-bone" : "text-bone-dim hover:bg-ink-100"
                }`}
              >
                <span className="flex items-center gap-2 truncate font-mono text-[11px] uppercase tracking-widest">
                  <span
                    className={
                      p.status === "Live"
                        ? "h-1.5 w-1.5 rounded-full bg-emulsion"
                        : p.status === "In flight"
                        ? "h-1.5 w-1.5 rounded-full bg-sodium"
                        : "h-1.5 w-1.5 rounded-full bg-bone-muted"
                    }
                  />
                  <span>
                    {String(i + 1).padStart(2, "0")} · {p.title}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[9px] tabular-nums text-bone-muted">
                  {p.year.split(" ")[0]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="col-span-7 overflow-y-auto bg-ink p-5">
        {active && (
          <>
            <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
              {active.role} · {active.year}
            </p>
            <h3 className="mt-2 font-[var(--font-display)] text-3xl italic text-bone sm:text-4xl">
              {active.title}
            </h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
              Client · {active.client}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-bone-dim">
              {active.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {active.tags.map((t) => (
                <span
                  key={t}
                  className="border border-bone-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-bone-dim"
                >
                  {t}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={(e) => onItemOpen(active.slug, e)}
              className="mt-5 inline-flex items-center gap-2 border border-bone-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-bone transition-colors hover:border-safelight"
            >
              Open frame ↗
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Status bar ──────────────────────────────────────────────── */

function StatusBar({
  total,
  liveCount,
  selectedCount,
  view,
  tab,
}: {
  total: number;
  liveCount: number;
  selectedCount: number;
  view: ViewMode;
  tab: TabKey;
}) {
  return (
    <div className="flex items-center justify-between border-t border-bone-line bg-ink-50/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
      <span>
        {String(total).padStart(2, "0")} items · {String(liveCount).padStart(2, "0")} live
        {selectedCount > 0 && (
          <span className="ml-2 text-bone">
            · {String(selectedCount).padStart(2, "0")} selected
          </span>
        )}
      </span>
      <span className="hidden sm:inline">
        Filter · {tab} · View · {view}
      </span>
      <span>↑↓ navigate · ↩ open · space quicklook</span>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <div>
        <p className="font-[var(--font-display)] text-3xl italic text-bone">No frames match.</p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          Try a different tab or clear the tag filter.
        </p>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */

function paletteFor(slug: string) {
  const palettes = [
    { bg: "#161311", fg: "#f4eee0", accent: "#e63946" },
    { bg: "#1a1d1a", fg: "#cfe0c3", accent: "#f4a52e" },
    { bg: "#0f0f10", fg: "#f4eee0", accent: "#9ab1d4" },
    { bg: "#1c1411", fg: "#f4eee0", accent: "#e63946" },
    { bg: "#10130f", fg: "#f4eee0", accent: "#f4a52e" },
  ];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h << 5) - h + slug.charCodeAt(i);
  return palettes[Math.abs(h) % palettes.length];
}

void AnimatePresence;
