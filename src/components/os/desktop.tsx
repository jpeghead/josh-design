"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import { useWindowManager, type AppKey } from "@/lib/window-store";
import { useAi } from "@/lib/ai-bus";

/**
 * The desktop is an expansive luxury-retail cover. One enormous gold
 * wordmark on emerald, framed by tracked-out captions above and a refined
 * prompt + navigation below. Everything else lives inside the apps.
 */
export function Desktop() {
  return (
    <div className="absolute inset-0 z-0 overflow-y-auto">
      <Cover />
    </div>
  );
}

function Cover() {
  const { open } = useWindowManager();
  const { submit, setPanelOpen } = useAi();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const askAi = (text?: string) => {
    const v = (text ?? draft).trim();
    if (!v) return;
    setPanelOpen(true);
    setTimeout(() => submit(v), 60);
    setDraft("");
  };

  const openApp = (app: AppKey, e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    open({ app, origin: { x: r.x + r.width / 2, y: r.y + r.height / 2 } });
  };

  return (
    <section className="relative flex min-h-[calc(100vh-2.25rem)] flex-col">
      {/* ─── Top register ─────────────────────────────────────── */}
      <header className="relative px-10 pt-10 sm:px-20 sm:pt-12">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.55em] text-bone-dim">
            <span className="text-bone">Atelier</span>
            <span className="mx-3 opacity-40">·</span>
            Genève
            <span className="mx-3 opacity-40">·</span>
            Established 2008
          </p>
          <p className="hidden font-mono text-[10px] uppercase tracking-[0.55em] text-bone-muted md:block">
            № 0007 of ∞
          </p>
        </div>
      </header>

      {/* ─── The wordmark — expansive, gold leaf, lit from above ── */}
      <div className="relative flex flex-1 items-center justify-center px-2">
        {/* Spotlight halo behind the wordmark */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-[60vh] max-h-[800px] w-[90%] max-w-[1400px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,235,180,0.10), transparent 65%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col items-center"
        >
          {/* Gold-leaf wordmark with a shimmering highlight overlay */}
          <h1
            className="font-[var(--font-display)] leading-[0.86] tracking-tight gold-leaf relative"
            style={{ fontSize: "clamp(7rem, 28vw, 32rem)" }}
          >
            Atelier
            {/* Shimmer pass — same word, absolutely positioned, slow drift */}
            <span
              aria-hidden
              className="gold-shimmer pointer-events-none absolute inset-0"
            >
              Atelier
            </span>
          </h1>

          {/* Hairline gold underline */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(216,194,140,0.4) 30%, rgba(216,194,140,0.4) 70%, transparent 100%)",
            }}
            className="mt-6 w-full origin-center"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.7 }}
            className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.55em] text-bone-dim"
          >
            Josh Whitehead · Working archive
            <span className="mx-3 opacity-40">·</span>
            Los Angeles
            <span className="mx-3 opacity-40">·</span>
            Currently shipping Boneyard Collective
          </motion.p>
        </motion.div>
      </div>

      {/* ─── Bottom register — prompt + nav ──────────────────── */}
      <footer className="relative px-10 pb-12 sm:px-20 sm:pb-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <motion.form
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 1.0 }}
            onSubmit={(e) => {
              e.preventDefault();
              askAi();
            }}
            className="flex w-full items-center gap-3 border-b border-bone-line/70 pb-3"
          >
            <span className="font-[var(--font-display)] text-2xl italic leading-none text-safelight">›</span>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What would you like to see?"
              className="flex-1 bg-transparent text-base text-bone placeholder:text-bone-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone-muted transition-colors hover:text-bone disabled:opacity-30"
            >
              Ask
            </button>
          </motion.form>

          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.15 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3"
          >
            {[
              { label: "Selected work", app: "work" as AppKey },
              { label: "Field notes", app: "journal" as AppKey },
              { label: "About", app: "about" as AppKey },
              { label: "Contact", app: "contact" as AppKey },
            ].map((item) => (
              <button
                key={item.app}
                type="button"
                onClick={(e) => openApp(item.app, e)}
                className="group relative font-[var(--font-display)] text-[1.75rem] leading-none tracking-wide text-bone transition-colors hover:text-safelight"
              >
                <span>{item.label}</span>
                <span className="absolute inset-x-0 -bottom-1 h-px origin-center scale-x-0 bg-safelight transition-transform group-hover:scale-x-100" />
              </button>
            ))}
          </motion.nav>
        </div>
      </footer>
    </section>
  );
}
