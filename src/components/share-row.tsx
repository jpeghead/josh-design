"use client";

import { useState } from "react";

/**
 * Copy the link, or hand it to the device's share sheet where one exists.
 * No third-party share buttons, no tracking; the URL is the page's own.
 */
export function ShareRow({ title, path }: { title: string; path: string }) {
  const [done, setDone] = useState<"copied" | "shared" | null>(null);
  const url = `https://josh.design${path}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setDone("copied");
      setTimeout(() => setDone(null), 1800);
    } catch {
      /* clipboard blocked: nothing to do, the address bar still works */
    }
  };
  const share = async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title, url });
      setDone("shared");
      setTimeout(() => setDone(null), 1800);
    } catch {
      /* cancelled */
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-3">
      <button type="button" onClick={copy} className="underline decoration-fg-3 underline-offset-4 transition-colors hover:text-fg">
        {done === "copied" ? "Link copied" : "Copy link"}
      </button>
      <button type="button" onClick={share} className="underline decoration-fg-3 underline-offset-4 transition-colors hover:text-fg">
        {done === "shared" ? "Shared" : "Share"}
      </button>
      <a href={`https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`} target="_blank" rel="noreferrer" className="underline decoration-fg-3 underline-offset-4 transition-colors hover:text-fg">
        Hacker News ↗
      </a>
    </div>
  );
}
