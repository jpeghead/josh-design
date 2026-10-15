"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PaletteItem } from "@/lib/palette";

/**
 * ⌘K / Ctrl+K / "/" opens a palette over every page, build, product, case
 * study, and essay. Anything typed that matches nothing becomes a question
 * for Ask my portfolio. Keyboard first; the dialog is a native <dialog>.
 */
export function CommandPalette({ items }: { items: PaletteItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);

  const open = useCallback(() => {
    const d = ref.current;
    if (!d || d.open) return;
    setQ("");
    setI(0);
    d.showModal();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);
  const close = useCallback(() => ref.current?.close(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (ref.current?.open) close();
        else open();
      } else if (e.key === "/" && !typing && !ref.current?.open) {
        e.preventDefault();
        open();
      }
    };
    const onOpen = () => open();
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", onOpen);
    };
  }, [open, close]);

  useEffect(() => close(), [pathname, close]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items.filter((it) => it.group === "Pages" || it.group === "Builds").slice(0, 14);
    const words = needle.split(/\s+/);
    return items
      .map((it) => {
        const hay = `${it.title} ${it.hint ?? ""} ${it.group} ${it.keywords ?? ""}`.toLowerCase();
        const hit = words.every((w) => hay.includes(w));
        const score = hit ? (it.title.toLowerCase().startsWith(needle) ? 0 : it.title.toLowerCase().includes(needle) ? 1 : 2) : 9;
        return { it, score };
      })
      .filter((r) => r.score < 9)
      .sort((a, b) => a.score - b.score)
      .slice(0, 12)
      .map((r) => r.it);
  }, [q, items]);

  const askRow = q.trim().length > 2;
  const total = results.length + (askRow ? 1 : 0);
  useEffect(() => setI(0), [q]);

  const go = (idx: number) => {
    if (idx < results.length) {
      const it = results[idx];
      close();
      if (it.external) window.open(it.href, it.href.startsWith("mailto:") ? "_self" : "_blank", "noreferrer");
      else router.push(it.href);
    } else if (askRow) {
      close();
      router.push(`/lab/ask?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setI((v) => (v + 1) % Math.max(1, total));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setI((v) => (v - 1 + Math.max(1, total)) % Math.max(1, total));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(i);
    }
  };

  let lastGroup = "";
  return (
    <dialog
      ref={ref}
      aria-label="Search this site"
      onClick={(e) => e.target === ref.current && close()}
      className="palette m-0 w-full max-w-xl bg-transparent p-0 text-fg backdrop:bg-bg/70 backdrop:backdrop-blur-sm"
    >
      <div className="mx-4 mt-[12vh] overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl sm:mx-auto">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <span aria-hidden className="text-fg-3">⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Jump anywhere, or ask a question…"
            aria-label="Search or ask"
            autoComplete="off"
            spellCheck={false}
            className="h-14 min-w-0 flex-1 bg-transparent text-[17px] placeholder:text-fg-3 focus:outline-none"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[11px] text-fg-3 sm:block">esc</kbd>
        </div>
        <ul role="listbox" aria-label="Results" className="max-h-[60vh] overflow-y-auto py-2">
          {results.map((it, idx) => {
            const head = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <li key={it.href + it.title} role="option" aria-selected={idx === i}>
                {head && <p className="px-4 pb-1 pt-3 text-[11px] uppercase tracking-[0.14em] text-fg-3">{head}</p>}
                <button
                  type="button"
                  onMouseEnter={() => setI(idx)}
                  onClick={() => go(idx)}
                  className={`flex w-full items-baseline justify-between gap-4 px-4 py-2 text-left text-[15px] ${idx === i ? "bg-fill text-fg" : "text-fg-2"}`}
                >
                  <span className="truncate">
                    <span className="text-fg">{it.title}</span>
                    {it.hint && <span className="text-fg-3"> — {it.hint}</span>}
                  </span>
                  <span aria-hidden className="shrink-0 text-xs text-fg-3">{it.external ? "↗" : "›"}</span>
                </button>
              </li>
            );
          })}
          {askRow && (
            <li role="option" aria-selected={i === results.length}>
              <p className="px-4 pb-1 pt-3 text-[11px] uppercase tracking-[0.14em] text-fg-3">Ask</p>
              <button
                type="button"
                onMouseEnter={() => setI(results.length)}
                onClick={() => go(results.length)}
                className={`flex w-full items-baseline justify-between gap-4 px-4 py-2 text-left text-[15px] ${i === results.length ? "bg-fill text-fg" : "text-fg-2"}`}
              >
                <span className="truncate">
                  <span className="text-fg">Ask my portfolio:</span> <span className="text-fg-2">“{q.trim()}”</span>
                </span>
                <span aria-hidden className="shrink-0 text-xs text-fg-3">↵</span>
              </button>
            </li>
          )}
          {!results.length && !askRow && <li className="px-4 py-3 text-sm text-fg-3">Nothing matches.</li>}
        </ul>
        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-fg-3">
          <span>↑↓ move · ↵ open · esc close</span>
          <span>⌘K anywhere</span>
        </div>
      </div>
    </dialog>
  );
}
