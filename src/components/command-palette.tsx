"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Command = { label: string; hint: string; href: string; keywords?: string };

const COMMANDS: Command[] = [
  { label: "Home — The Archive", hint: "Start", href: "/", keywords: "start walk journey" },
  { label: "Work", hint: "Case studies", href: "/work", keywords: "spin hush vgv projects" },
  { label: "Products", hint: "Things I'm building", href: "/products", keywords: "olo weaver signalscan storymode xenomorph" },
  { label: "Writing", hint: "Books & essays", href: "/writing", keywords: "books essays mastery harmony" },
  { label: "Uses", hint: "Tools & gear", href: "/uses", keywords: "tools gear links figma plugins" },
  { label: "About", hint: "The story", href: "/about", keywords: "bio marine designer" },
  { label: "Contact", hint: "Send a signal", href: "/contact", keywords: "email reach hire" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) =>
      `${c.label} ${c.hint} ${c.keywords ?? ""}`.toLowerCase().includes(q)
    );
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router]
  );

  // Global open/close: ⌘K / Ctrl+K, custom event from the header, Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onToggle = () => setOpen((o) => !o);
    window.addEventListener("keydown", onKey);
    window.addEventListener("toggle-command-palette", onToggle);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("toggle-command-palette", onToggle);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 p-4 pt-[15vh] backdrop-blur-sm"
      onClick={close}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg overflow-hidden border border-black/15 bg-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              go(results[active].href);
            }
          }}
          placeholder="Jump anywhere…"
          aria-label="Search commands"
          className="w-full border-b border-black/10 bg-transparent px-5 py-4 font-sans text-base text-graphite placeholder:text-graphite-muted focus:outline-none"
        />
        <ul className="max-h-72 overflow-y-auto py-1" role="listbox" aria-label="Commands">
          {results.length === 0 && (
            <li className="px-5 py-4 font-mono text-xs text-graphite-muted">
              Nothing here.
            </li>
          )}
          {results.map((c, i) => (
            <li key={c.href} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(c.href)}
                className={`flex w-full items-baseline justify-between gap-4 px-5 py-2.5 text-left transition-colors ${
                  i === active ? "bg-black/[0.06]" : ""
                }`}
              >
                <span className="text-sm text-graphite">{c.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-graphite-muted">
                  {c.hint}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
