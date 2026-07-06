"use client";

import { journal } from "@/lib/data";
import { useOpenInWindow } from "../link";

const entries: Record<string, string[]> = {
  "developing-the-archive": [
    "Fifteen years in and I've built every kind of portfolio. Grid sites. Single-pagers. Framer experiments. Markdown stacks. Each one was an honest attempt to answer the same question: what does this person actually do?",
    "The answer kept getting longer. Designer, sure, but also: photographer, founder, builder, occasional Marine. After a while the portfolio stopped being a brag wall and started being an archive — a record of frames I'd been allowed to keep.",
    "This rebuild leans into that. The site is a working archive, rendered as the working desktop. It's organized like a contact sheet, dated like a film strip, and read like a logbook. The aesthetic borrows from the darkroom because the metaphor is honest: most of what I do is exposing one set of decisions to another and waiting to see what develops.",
    "What I wanted to avoid: the redesign that quietly becomes a brand exercise. The truth is, the people who hire me don't care what my website looks like — they care whether I can ship. The site is a thank-you to the people who didn't bother to look.",
  ],
  "ai-driven-design-techniques": [
    "Most of the AI-design conversation is happening at the wrong altitude. It's either utopia (no designers needed) or doom (designers replaced). The reality is mid-altitude and boring: AI compresses the parts of the craft that were never the point.",
    "I keep a working set of techniques I've used to bring AI into the process without losing the work. They're not novel; they're disciplined.",
    "Use AI to widen the funnel of options, not to narrow them. The model is good at the first hundred ideas — the ones a tired designer wouldn't reach for. It's bad at the last one. So keep AI in the early phase and step back when you start making decisions.",
    "Build your own prompts like you build your own components. Versioned, named, owned. Don't paste a one-off into the same chat window twice — turn it into a function.",
    "Treat every output as evidence, not as truth. The model isn't telling you what to do; it's telling you what's near.",
  ],
  "leverage-ai-predictive-design": [
    "Predictive design is what happens when you stop designing for the average user and start designing for the next move.",
    "The pattern: take the last five things the user did, hand them to a small model, and ask it to predict the next reasonable action. Surface the prediction in the UI as a soft suggestion. Measure the take-rate. Iterate.",
    "What surprised me: predictive UI works best when it's quiet. A confident prediction with a hard CTA feels manipulative. A soft chip with a calm verb is invitational.",
    "We're not going to ship the first AI-native interfaces with shouty UI. We're going to ship them with elegant restraint.",
  ],
  "field-notes-from-the-corps": [
    "I spent five years behind a Nikon for the Marine Corps. Most of the lessons stuck. A few of them: composition is mostly about exclusion. Deadlines don't care about your feelings. A photograph is also a document, and the document is what survives.",
    "Designers who haven't worked in a discipline with stakes don't understand the third one. The work isn't done when it's beautiful — it's done when it can be entered into the record.",
    "I think about that almost every time I review a Figma file.",
  ],
};

export function EntryContent({ slug }: { slug: string }) {
  useOpenInWindow();
  const entry = journal.find((j) => j.slug === slug);
  if (!entry) {
    return (
      <div className="px-6 py-16 text-center font-mono text-sm text-bone-muted">
        Entry not found — {slug}
      </div>
    );
  }
  const body = entries[entry.slug] ?? [entry.excerpt];

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <a
        href="/journal"
        className="overline inline-flex items-center gap-2 hover:text-bone"
      >
        ← Back to journal
      </a>

      <header className="mt-8 border-b border-bone-line pb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          {entry.category} · {entry.date} · {entry.readTime} read
        </p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl leading-[1.0] tracking-tight text-bone sm:text-5xl">
          {entry.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-bone-dim">{entry.excerpt}</p>
      </header>

      <div className="py-10 text-base leading-[1.8] text-bone-dim">
        {body.map((p, i) => (
          <p key={i} className={i > 0 ? "mt-6" : undefined}>
            {p}
          </p>
        ))}
      </div>

      <footer className="border-t border-bone-line py-10">
        <p className="overline">// Endmark</p>
        <p className="mt-2 font-[var(--font-display)] text-2xl italic text-bone">
          — Josh, Los Angeles
        </p>
      </footer>
    </article>
  );
}
