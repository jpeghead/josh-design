"use client";

import { projects, journal } from "@/lib/data";
import { useWindowManager } from "@/lib/window-store";

/**
 * Get Info — modeled on the macOS "Get Info" inspector. Shows file
 * metadata for a desktop item, project, or journal entry. Compact,
 * vertical scroll, hairline borders, no body chrome.
 */
export function InfoContent({ param }: { param: string }) {
  const { open } = useWindowManager();
  // Find the subject
  const project = projects.find((p) => p.slug === param);
  const entry = journal.find((j) => j.slug === param);

  if (project) return <ProjectInfo project={project} onOpen={() => open({ app: "project", param: project.slug })} />;
  if (entry) return <EntryInfo entry={entry} onOpen={() => open({ app: "entry", param: entry.slug })} />;

  // Fall back to generic system-item info
  return <GenericInfo name={param} />;
}

function ProjectInfo({
  project,
  onOpen,
}: {
  project: (typeof projects)[number];
  onOpen: () => void;
}) {
  const palette = paletteFor(project.slug);
  const initials = project.title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col">
      {/* Preview */}
      <div className="flex items-center gap-4 border-b border-bone-line p-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center border border-bone-line"
          style={{ background: palette.bg, color: palette.fg }}
        >
          <span
            className="font-[var(--font-display)] italic"
            style={{
              fontSize: "2rem",
              letterSpacing: "-0.04em",
              textShadow: `1.5px 1.5px 0 ${palette.accent}`,
            }}
          >
            {initials}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-[var(--font-display)] text-2xl italic leading-tight text-bone">
            {project.title}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            {project.role}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 overflow-y-auto">
        <Section label="General">
          <Row label="Kind" value="Case study · .frame" />
          <Row label="Year" value={project.year} />
          <Row label="Client" value={project.client} />
          <Row label="Status" value={project.status} />
          {project.classified && <Row label="Classification" value="Under NDA" />}
        </Section>

        <Section label="Metadata">
          <Row label="Created" value={project.year.split(" ")[0]} />
          <Row
            label="Modified"
            value={
              project.status === "Live" || project.status === "In flight"
                ? "Today"
                : "Archived"
            }
          />
          <Row
            label="Disk usage"
            value={`${Math.round(2 + Math.random() * 8)} MB`}
          />
          <Row label="Slug" value={`~/work/${project.slug}`} mono />
        </Section>

        {project.metrics && project.metrics.length > 0 && (
          <Section label="Receipts">
            {project.metrics.map((m) => (
              <Row key={m.label} label={m.label} value={m.value} />
            ))}
          </Section>
        )}

        {project.tools && (
          <Section label="Toolchain">
            <div className="flex flex-wrap gap-1.5 px-3 py-3">
              {project.tools.map((t) => (
                <span
                  key={t}
                  className="border border-bone-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-bone-dim"
                >
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}

        {project.collaborators && (
          <Section label="Collaborators">
            {project.collaborators.map((c) => (
              <Row key={c} label="" value={c} mono={false} />
            ))}
          </Section>
        )}

        <Section label="Tags">
          <div className="flex flex-wrap gap-1.5 px-3 py-3">
            {project.tags.map((t) => (
              <span
                key={t}
                className="border border-bone-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-bone-dim"
              >
                #{t.toLowerCase().replace(/\s+/g, "-")}
              </span>
            ))}
          </div>
        </Section>
      </div>

      {/* Footer action */}
      <div className="border-t border-bone-line p-3">
        <button
          type="button"
          onClick={onOpen}
          className="w-full border border-bone-line px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-bone transition-colors hover:border-safelight hover:bg-safelight/10"
        >
          Open frame ↗
        </button>
      </div>
    </div>
  );
}

function EntryInfo({
  entry,
  onOpen,
}: {
  entry: (typeof journal)[number];
  onOpen: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-bone-line p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          {entry.category} · journal
        </p>
        <p className="mt-1 font-[var(--font-display)] text-2xl italic leading-tight text-bone">
          {entry.title}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Section label="General">
          <Row label="Kind" value="Journal entry · .md" />
          <Row label="Date" value={entry.date} />
          <Row label="Read time" value={entry.readTime} />
          <Row label="Category" value={entry.category} />
        </Section>
        <Section label="Excerpt">
          <p className="px-3 py-3 text-sm leading-relaxed text-bone-dim">
            {entry.excerpt}
          </p>
        </Section>
        <Section label="Metadata">
          <Row label="Slug" value={`~/journal/${entry.slug}`} mono />
          <Row label="Author" value="Josh Whitehead" />
        </Section>
      </div>
      <div className="border-t border-bone-line p-3">
        <button
          type="button"
          onClick={onOpen}
          className="w-full border border-bone-line px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-bone transition-colors hover:border-safelight hover:bg-safelight/10"
        >
          Read entry ↗
        </button>
      </div>
    </div>
  );
}

function GenericInfo({ name }: { name: string }) {
  return (
    <div className="p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        Get Info
      </p>
      <p className="mt-1 font-[var(--font-display)] text-xl text-bone">{name}</p>
      <p className="mt-3 text-sm text-bone-dim">
        No metadata is available for this item.
      </p>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-bone-line last:border-b-0">
      <p className="border-b border-bone-line/40 bg-ink-50/30 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-bone-muted">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-bone-line/30 px-3 py-1.5 last:border-b-0">
      {label && (
        <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          {label}
        </span>
      )}
      <span
        className={`min-w-0 flex-1 truncate ${
          mono ? "font-mono text-[11px] text-bone-dim" : "text-sm text-bone"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

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
