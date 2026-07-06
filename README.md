# josh.design — Working Archive

A bespoke personal portfolio for Josh Whitehead. The concept: **a working
archive, developed over 18 years.** A monospace, ink-black, command-driven
editorial portfolio that borrows from the darkroom — a quiet nod to Josh's
time as a Marine Corps combat photographer before he became a designer.

## Concept

| | |
|---|---|
| **Aesthetic** | Ink-black + bone-white + a single safelight-red accent. Display type set in *Instrument Serif Italic*. Mono details in *Geist Mono*. |
| **Why it's not Boneyard** | Boneyard owns warm cream + vermillion + skeleton anatomy. This site is the craftsman behind the studio — colder, quieter, more personal. |
| **Signature moves** | Spotlight cursor with live (x,y) coordinate readout. Command palette (⌘K). Contact-sheet work grid with sprocket holes and REF stamps. Bespoke generative case-study posters. Type-driven hero with an animated year counter. Easter egg — type `develop` anywhere. |

## Pages

- `/` — Hero, contact sheet of featured work, operating principles, receipts, reach.
- `/work` — Full archive grid.
- `/work/[slug]` — Long-form case study with metrics, collaborators, prev/next.
- `/about` — Bio, career film strip, principles, receipts.
- `/journal` — Field notes index + Sunday Service signup.
- `/journal/[slug]` — Long-form entries.
- `/contact` — Send a signal.

## Stack

- **Next.js 15.5** (App Router · Turbopack)
- **React 19**
- **Tailwind CSS v4** with custom theme tokens
- **Motion** (Framer Motion v12) for the year counter & palette transitions
- **Geist + Geist Mono + Instrument Serif** via `next/font`
- **Vercel** for deploy

## Dev

```bash
npm install
npm run dev      # → http://localhost:3000
npm run build    # production build (verified clean)
```

## Deploy

The repo is Vercel-native — push to a GitHub repo, import in Vercel, done.
There are no env vars, no databases, no marketplace integrations required.

```bash
npx vercel        # preview deploy
npx vercel --prod # production
```

## Content

All copy and project data live in `src/lib/data.ts` — projects, career frames,
journal entries, stats, client roll, and operating principles. Update there.

## Easter eggs

- Press `⌘K` (or `/`) anywhere to open the command palette.
- Type `develop` anywhere — even mid-page — for a darkroom flash.

— Built in May 2026.
