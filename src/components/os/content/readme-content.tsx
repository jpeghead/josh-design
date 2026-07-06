"use client";

import { useOpenInWindow } from "../link";

export function ReadmeContent() {
  useOpenInWindow();
  return (
    <div className="px-5 py-8 sm:px-8 sm:py-12">
      <p className="overline">// readme.md · 2026-05-13</p>
      <h1 className="mt-3 font-[var(--font-display)] text-3xl italic leading-tight text-bone sm:text-4xl">
        A note from Josh.
      </h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-bone-dim">
        <p>
          You&rsquo;re looking at my desktop. Open whatever you like — drag the
          windows around, stack them, close them, reopen them. The traffic
          lights work the way you&rsquo;d expect: red closes, yellow
          minimizes, green zooms.
        </p>
        <p>
          The work lives in{" "}
          <a href="/work" className="text-bone underline decoration-bone-muted underline-offset-4 hover:decoration-safelight">
            ~/work
          </a>
          . The writing lives in{" "}
          <a href="/journal" className="text-bone underline decoration-bone-muted underline-offset-4 hover:decoration-safelight">
            ~/journal
          </a>
          . My story is in{" "}
          <a href="/about" className="text-bone underline decoration-bone-muted underline-offset-4 hover:decoration-safelight">
            ~/about
          </a>
          . If you want to start a project together,{" "}
          <a href="/contact" className="text-bone underline decoration-bone-muted underline-offset-4 hover:decoration-safelight">
            ~/contact
          </a>{" "}
          is the inbox.
        </p>
        <p>
          Spotlight is{" "}
          <kbd className="border border-bone-line bg-ink-50 px-1.5 py-0.5 font-mono text-[10px] text-bone">⌘K</kbd>.
          Close any window with{" "}
          <kbd className="border border-bone-line bg-ink-50 px-1.5 py-0.5 font-mono text-[10px] text-bone">⌘W</kbd>.
          Cycle windows with{" "}
          <kbd className="border border-bone-line bg-ink-50 px-1.5 py-0.5 font-mono text-[10px] text-bone">⌘`</kbd>.
          Type{" "}
          <kbd className="border border-bone-line bg-ink-50 px-1.5 py-0.5 font-mono text-[10px] text-bone">develop</kbd>{" "}
          anywhere for a surprise.
        </p>
        <p className="pt-2 font-[var(--font-display)] text-2xl italic text-bone">
          — Josh
        </p>
      </div>
    </div>
  );
}
