# josh.design

[![CI](https://github.com/jpeghead/josh-design/actions/workflows/ci.yml/badge.svg)](https://github.com/jpeghead/josh-design/actions/workflows/ci.yml)

The personal site of Josh Whitehead: a designer who builds AI products, with
agents in the loop. Live at josh.design (soon); runs locally with the commands
below.

Everything on the site is real and runs from this repo, including the parts
that look like they shouldn't fit in a portfolio:

| Route | What it is |
|---|---|
| `/` | A 65,536-particle GLSL hero sampled from four photographs of the life, then the builds, then the work. |
| `/lab` | **Builds.** Every entry runs in the browser. |
| `/lab/local` | A language model on your GPU through WebGPU (WebLLM, Llama 3.2 1B / Qwen 2.5 0.5B), grounded on the site's own text. No server. |
| `/lab/ask` | A hosted Claude, grounded on the same content files, streaming from a Next.js route handler. Needs `ANTHROPIC_API_KEY`. |
| `/lab/agents` | Five working agent-interface prototypes: progress, scoped permissions, failure with recovery, graded confidence, asking before guessing. |
| `/lab/portrait` | Portrait — drop in a ChatGPT or Claude export and get a portrait of how you think. Parsing and analysis run in the browser; nothing is uploaded. |
| `/lab/city` | Whitehead City — a GTA-style open world of the life, built in sixteen days with Claude Code. Desktop only. |
| `/lab/studio` `/lab/line` `/lab/room` | Earlier experiments: a scroll-conducted 3D room, a scroll-scrubbed drawing, a side-scrolling playable life. |
| `/process` | How the builds get made, with the real artifacts: the agent handoff doc, the subagent's image catalog, the commit record. |
| `/work` `/products` `/writing` `/about` | The product-design foundation, the Boneyard products, the essays, the story. |

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # must stay green
npx tsc --noEmit     # must stay green
```

Claude access is federated: the deployment's Vercel OIDC token is exchanged for a short-lived Anthropic token (`src/lib/anthropic.ts`), so no API key exists anywhere. Locally, `vercel env pull` writes a development token to `.env.local`; `ANTHROPIC_API_KEY` is only a fallback.

## How it's built

Next.js 15 (App Router), React 19, TypeScript, Tailwind 4, `motion`,
Three.js + React Three Fiber (+ Rapier for the city), WebLLM, the Anthropic
SDK. One serif (Instrument Serif) for the story, Geist for everything else.
Reveal animations are CSS, gated on an `html.js` class set before first paint,
so the server-rendered page is complete without JavaScript.

Imagery is Josh's own, from the previous site's Framer export
(`public/framer/canvas/images`, cataloged by a subagent in
`scripts/framer-catalog.json`). `scripts/optimize-images.mjs` makes the
web-sized copies in `public/img`.

Facts about the career live in `src/lib/data.ts` with the ground rules in its
header: no vanity stats, clients never presented as employers, nothing
fabricated. Presentation (which image, which color field) lives in
`src/content/work-media.ts`.

## Working with agents on this repo

Read `AGENTS.md` first. It is the handoff: conventions, traps, the licensing
rule (original or CC0 only), and how to verify in a browser before committing.

## Admin (local only)

`/admin` is a private cockpit for the job hunt and exists only where
`ADMIN_SECRET` is set in `.env.local`; deployments return 404. It scans
145 company boards (Greenhouse, Ashby, Lever) plus Hacker News for
AI-builder and design roles, generates ATS-safe résumés from the site's
own content in two personas, and drives a visible browser to fill
applications, stopping for review before anything is submitted. Its data
stays in the git-ignored `data/admin/`. See `docs/admin.md`.
