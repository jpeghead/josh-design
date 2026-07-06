"use client";

import { useState } from "react";

export function SundayService() {
  const [done, setDone] = useState(false);

  return (
    <div className="border border-bone-line p-5">
      <p className="overline">/ Sunday Service</p>
      <p className="mt-2 font-[var(--font-display)] text-2xl text-bone">
        A weekly dispatch.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-bone-dim">
        One email, every Sunday morning. Tools, links, and a single photograph
        from the week.
      </p>
      {done ? (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-emulsion">
          ✓ Confirmed. See you Sunday.
        </p>
      ) : (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
        >
          <input
            type="email"
            required
            placeholder="you@inbox.com"
            className="flex-1 border border-bone-line bg-ink px-3 py-2 font-mono text-xs text-bone placeholder:text-bone-muted focus:border-safelight focus:outline-none"
          />
          <button
            type="submit"
            className="border border-bone-line bg-ink-100 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-bone transition-colors hover:border-safelight"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
