# josh.design — Redesign Context Pack

> A single brief for whoever (or whatever) rebuilds this site. Everything here
> is extracted from the actual repo + the Framer content export in
> `public/framer/`. If the prompt and this document disagree, the prompt wins —
> but tell the agent to read this first so it designs against reality, not the
> stale README.

---

## 0. How to use this

Point your redesign agent at this file. It answers: *who is this for, what's
the real current state, what content exists, what's decided vs. open.* The two
richest raw sources it can open directly:

- `public/framer/cms/<collection>/_content.json` — real content, full text
- `public/framer/manifest.json` — every asset → where it came from

---

## 1. Who this is for — Josh Whitehead

A designer with an unusual origin: **Marine Corps combat photographer (2008)
→ designer & front-end engineer → Head of Design → founder.** That biography is
the emotional core of the brand — the site is "the craftsman behind the studio,"
colder and more personal than his studio work (Boneyard).

**Career arc** (from `src/lib/data.ts` → `career`):
`2008` Combat Photographer · `2013` Designer & Front-End Engineer ·
`2014` Senior Designer · `2015` Senior Product Designer ·
`2017` Senior PD → Head of Design · `2019` Head of Design · `2023` Founder.

**Selected clients** (`clientRoll`): Apple, Ford, Netflix, Coca-Cola, Lime, Bird,
Webflow, Kleiner Perkins, Capitol/Atlantic Records, Viceland, iHeartRadio,
Tribeca, Saucey, Spin, Hush, Boneyard, VGV, NationBuilder, Differential.

**Stats**: 15+ yrs shipping · 10M+ users reached · 50+ products · 1k+ interfaces
· 6× founder/builder · 100+ design systems.

**Voice — this matters most.** Plainspoken, first-person, a little raw, allergic
to fluff. Sample (real, from the Blog): *"A few months ago, I hit a wall. After
12+ years of designing products… I realized I didn't feel connected to any of it
anymore. Design started to feel like following rules. Not solving problems."*

**Principles** (verbatim, use as tone anchors):
1. *Design for simplicity.* "The work is done when there is nothing left to remove."
2. *People before product.* "Empathy isn't a research method. It's a posture."
3. *Cultivate joy.* "Joy is a competitive advantage no one is allowed to measure."
4. *Embrace lifelong learning.* "The half-life of a tool is shorter than the half-life of a career. Stay restless."

---

## 2. ⚠️ Current state ≠ the README

The `README.md` describes an **ink-black / bone-white / safelight-red darkroom**
concept with Instrument Serif. **The code has moved on.** As it stands today the
repo is:

- A **"Darkroom OS"** — a desktop-operating-system metaphor. See
  `src/components/os/`: `desktop`, `dock`, `window`, `mission-control`,
  `lock-screen`, `app-switcher`, `notification-center`, `co-pilot` (an AI
  assistant), `stickies`, `system-hud`, `wallpaper`, `context-menu`. Content is
  rendered inside faux OS "windows" (`content/about-content`, `work-content`,
  `journal-content`, `project-content`, etc.).
- Palette has shifted to a **Rolex-boutique** direction: deep emerald, Daytona
  cream, applied gold (details in §7). The old ink/bone/safelight tokens are
  kept as *aliases* so components still compile.
- Fonts are now **Italiana** (display), **Inter Tight** (sans), **Geist Mono**
  (mono) — not the README's Instrument Serif/Geist.

**Decision the prompt must make explicit:** does the redesign *continue* the
Darkroom-OS direction, *revert* to the editorial darkroom concept, or start a
*third* direction? Whatever it is, say so plainly — the agent will otherwise
inherit a half-migrated codebase and guess.

---

## 3. Tech stack & hard constraints

- **Next.js 15.5** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** with `@theme` tokens in `src/app/globals.css`
- **Motion** (Framer Motion v12) for animation
- **Lenis** for smooth scroll
- Fonts via `next/font/google`
- Deploy target: **Vercel** (`vercel.json` present)
- Build is verified clean on this machine (`npm run build` → 22 static routes)
- Dev server currently runs on **:3001** (:3000 is taken by another local app)

---

## 4. Content inventory — real, exported, ready to wire

All under `public/framer/cms/<collection>/_content.json`. Each item carries its
real fields (titles, dates, links, enums) and, for text-heavy ones, **full
rich-text HTML** in a `Content` field. Images are downloaded and each field
points at its local path.

| Collection | Items | Notable fields | What it is |
|---|---|---|---|
| **blog** | 8 | Title, Date, Image, Description, Badge, **Content** (HTML), read-time | Long-form essays (design + AI + personal) |
| **tools** | 27 | Title, Icon, Description, Link, Tag, Featured | Software Josh uses (Figma, Framer, Notion, OpenAI…) |
| **gear** | 33 | Title, Image, Date, Link, Tag, Description | Physical kit (Tesla M3P, DJI drones, Vision Pro, audio…) |
| **links** | 19 | Title, Link, Content, Image, Tag | Curated outbound bookmarks (Boneyard, Godly, Mobbin…) |
| **figma-plugins** | 12 | Title, Image, Link, Content | Recommended Figma plugins |
| **downloads** | 1 | Title, price fields, 3 images, Link | A paid resource — "Xenomorph Typeface" |
| **changelog** | 5 | Title, Date, Name, Emoji, Description | Site version notes v0.1–v0.5 (no images) |

**Blog titles** (the voice lives here): "Do I still care about this?",
"AI-Driven Design Techniques", "The Ethics of AI in Design", "How to Leverage AI
for Predictive Design", "The Future of Workspaces: Flat Screens → Immersive XR",
"How Can Designers Prepare for the Future?", "Designing for Accessibility",
"The Rise of No-Code Tools".

**Also in the codebase already** (`src/lib/data.ts`, separate from Framer CMS):
`projects` — 7 case studies (Spin, Hush, VGV, Saucey, NationBuilder,
Differential, Boneyard Collective) each with challenge/approach/outcome/metrics;
`career`; `journal`; `stats`; `clientRoll`; `principles`. **Note the overlap:**
work/journal exist *both* as hard-coded `data.ts` and as Framer collections —
the prompt should decide which is the source of truth (recommend: Framer export
for blog/journal + curated lists; `data.ts` for the 7 marquee case studies).

---

## 5. Media inventory

Under `public/framer/` (196 MB, committed):

- `cms/<collection>/*` — 102 CMS images (png/jpg/svg/webp), named
  `<item-slug>__<field>.<ext>`
- `canvas/images/` — 136 unique on-page background images (incl. large hero
  GIFs/JPGs)
- `canvas/svg/` — 3 inline SVGs
- `canvas/video/` — 2 background videos (hero loops)
- `manifest.json` — maps each asset to its CMS item/field or canvas node IDs

Refresh anytime: `node --env-file=.env.local scripts/framer-pull.mjs`
(read-only; never publishes/deploys).

---

## 6. Information architecture (current routes)

`/` · `/work` · `/work/[slug]` · `/about` · `/journal` · `/journal/[slug]` ·
`/contact` — plus generated `robots.txt` / `sitemap.xml` / `icon`.

Signature interactions already built (keep or cut deliberately): spotlight
cursor with live (x,y) readout, command palette (⌘K), boot sequence, `develop`
easter egg, and the whole OS window system.

---

## 7. Design tokens (as they stand in `globals.css`)

**Palette — "Rolex boutique"**
- Emerald: `--color-ink #0a3024`, `ink-50 #103a2c`, `ink-100 #155040`,
  `emerald-bright #1a5240`
- Cream: `--color-bone #f5ede0`, `bone-dim #cdbfa8`, `bone-muted #8e8270`,
  `bone-line #1d4636`, `cream-warm #ebdfc9`
- Gold accent: `--color-safelight #c8a76a` (primary), `sodium/gold-bright #e8c87a`,
  `rose-gold #b97a5c`
- Support: `emulsion/sage #a8c4a2`, `velvet #0d0d0e`, `crown-red #c43a3a`

**Type**: display = Italiana · sans = Inter Tight · mono = Geist Mono

**Motion**: signature easing `--ease-emulsion cubic-bezier(0.22,1,0.36,1)`;
keyframe library — `flicker`, `scan`, `blink`, `marquee`, `shimmer` (darkroom /
CRT flavor).

---

## 8. What the prompt should decide (open questions)

These are the forks the agent can't infer — nail them down in the prompt:

1. **Concept direction** — continue Darkroom-OS, revert to editorial darkroom,
   or new? (§2)
2. **Palette** — keep Rolex emerald/gold, or return to ink/bone/safelight?
3. **Source of truth** — Framer export vs. `data.ts` for overlapping sections
   (§4).
4. **Which collections get surfaced, and where** — e.g. does `blog` power
   `/journal`? do `tools`/`gear`/`links`/`figma-plugins` become an "Uses/Archive"
   section, individual pages, or a filterable index?
5. **Fidelity to the old Framer layout** — faithful port vs. reinterpretation.
6. **Keep/cut the signature interactions** (spotlight, ⌘K, OS windows, easter egg).
7. **Motion budget** — how heavy; performance vs. spectacle.

---

## 9. Suggested things to *tell* the agent

- "Read `REDESIGN-CONTEXT.md` and `public/framer/manifest.json` before writing code."
- Give it the voice anchors (§1) — Josh's copy is first-person and unfluffy;
  generated microcopy should match, not sound like a marketing site.
- Point it at the real content JSON so it uses **actual titles/text**, never lorem.
- State the one concept direction clearly, then let it propose within that.
- Remind it: build stays on Next 15 / React 19 / Tailwind v4 / Motion; keep
  `npm run build` green.
