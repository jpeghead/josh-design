# AGENTS.md — read this before you touch anything

> **Status, October 2026: the 3D work is on the back burner.** The live site
> is a cinematic, photo-led portfolio: near-black frame, one serif for the
> story, each case study on its own color field. Routes in `src/app/*`,
> primitives in `src/components/ui.tsx` + `motion.tsx` (CSS reveals gated on
> `html.js`), per-project imagery in `src/content/work-media.ts`, web-sized
> copies in `public/img` (regenerate with `node scripts/optimize-images.mjs`;
> the full-res export is `public/framer/canvas/images`, cataloged in
> `scripts/framer-catalog.json`). Nothing under
> `src/components/{game3d,archive3d,canvas,line,room}` is mounted; it is kept
> only so it can be revisited. Everything below about the game describes that
> shelved work — the "Portfolio layer" section (§3b) is the part that
> still matters day to day.

You're picking up **Whitehead City**: a personal portfolio site for Josh
Whitehead that is *also* a playable open-world game. This file is the
handoff. Read it fully — the codebase has hard-won conventions and a few
traps that will waste your time if you don't know them.

---

## 1. What this project actually is

Two things wearing one URL:

1. **A real portfolio.** The landing view is a desk with a monitor
   showing the actual josh.design site (routes under `/work`,
   `/products`, `/contact`, etc.). This content is real and load-bearing.
2. **A game.** Press ESC / "stand up" and the camera lifts out of the
   monitor into a first-person walk through Josh's **house**, out the
   front door into **Whitehead City**, where you drive, shoot at a rifle
   range, and play **10 story missions** tracing his life 1993 → now.

The desk → house → city → missions → credits loop is fully connected and
playable. It is **not** finished — see §8.

### The creative north star (do not drift from this)
- **Look & feel:** Half-Life 1 / GoldSrc-era aesthetic. Low-poly, low-res
  hand-painted-look textures, flat diffuse lighting. HL2 is the stretch.
- **Feature set & world quality:** **GTA (Vice City / San Andreas era) is
  the benchmark.** When you build a system — traffic, missions,
  wayfinding, interiors, pause menu — the working question is literally
  *"how did Rockstar do this in GTA, and how do I build my own version?"*
- **Movement feel:** Quake/GoldSrc — snappy accelerate/friction, air
  control, real jump.

### Licensing — this is a hard rule
Everything ships **original or CC0 only.** We recreate the *style* of
HL1/GTA, never their files. No ripped game assets, textures, models, or
sounds — ever. Current 3D models are CC0 from Poly Haven; all textures
and all sound are procedurally generated in code. Keep it that way.

---

## 2. Get it running

```bash
npm install
npm run dev        # Next.js 15 + Turbopack, http://localhost:3000 (this
                   # session used -p 3002; either is fine)
npm run build      # must stay green before every commit
npx tsc --noEmit   # type-check; also must stay green
```

Stack: **Next.js 15** (App Router) · **React Three Fiber** + **three
0.185** · **@react-three/rapier 2.2** (physics) · **@react-three/drei** ·
Tailwind. The game is desktop-only (keyboard + mouse; WebGL2).

### Deep links for QA (huge time-savers — use them constantly)
- `?p=X,Z,YAW` — spawn standing in the world at world coords X,Z facing
  YAW radians. e.g. `/?p=580,742,0` drops you at the rifle range.
- `?fps=1` — live overlay: fps, worst-frame ms, player height, grounded.
- `?m=N` — jump to mission N's start.
- `?room=1` — spawn standing in the office.

---

## 3. Map of the code

All the game lives in `src/components/game3d/`:

| File | Lines | What it owns |
|---|---|---|
| `game.tsx` | ~2990 | **The everything file.** Sim loop, camera, player + car physics, input, HUD/React overlay, city renderers (buildings, ground, traffic, peds, trees, sky), pause screen, crash recorder. Start here. |
| `house.tsx` | ~1050 | The walkable house: walls/doors/windows, furniture, relics, all interior geometry. |
| `weapons.tsx` | ~440 | Viewmodel (X-Acto + pistol), hitscan `Shooter`, pooled tracer/puff FX, the rifle `Range` with steel plates + score. |
| `retro.ts` | ~450 | **The texture pipeline.** Every surface goes through here: procedural canvas textures → posterize + Bayer dither + warm desaturate. Also `retrofitModel()` which forces imported GLTFs into flat Lambert + quantized diffuse. |
| `world.ts` | ~300 | Data only: districts, building scatter, landmarks, and the **10 mission definitions**. No rendering. |
| `models.tsx` | ~130 | Loads/clones CC0 GLTF furniture; preloads for the loading gate. |
| `ambience.ts` | ~175 | All sound. Synthesized WebAudio — traffic bed, footsteps, jump/land, gunshot, plate ping. No audio files. |
| `desktop.tsx` | ~100 | The monitor/desktop chrome around the portfolio. |

`STYLE.md` at repo root is the **asset style bible** — triangle budgets,
texture rules, the palette ramps, the light budget, locked movement
constants. Treat it as spec. When you add an asset, follow it and append
your asset to its portfolio list.

---

## 3b. The PORTFOLIO layer — where the real site content lives

The game is only half the repo. The other half is the actual josh.design
portfolio: normal Next.js pages + typed content modules. **This is where
you edit copy, projects, writing, products — the real résumé content.**
It's entirely separate from `game3d/`.

### Content / data (edit these to change what the site *says*)
`src/content/` — one typed module per section, hand-authored:
- `archive.ts` — **the spine of the site**: the career timeline, era by
  era (light → dark). Start here to understand the content model.
- `about.ts` — approved about/bio copy. First-person, factual, do not
  embellish (there's a note in the file: the story is about refusing to
  quit; no former employer portrayed badly).
- `products.ts` — things Josh is building at Boneyard.
- `books.ts` — the books, presented on-site.
- `writing.ts` — the essays/books hand-triaged for the site.
- `uses.generated.ts`, `writing.generated.ts` — **AUTO-GENERATED** from
  Framer CMS/blog exports by `scripts/gen-*.mjs`. **Do not hand-edit
  these**; change the source data or the generator and re-run.

`src/lib/data.ts` — the master career data, **locked to a real timeline
with factual ground rules in its header comment.** Read those rules
before changing anything here. Dates/facts are real — do not invent or
"improve" them.

### Routes (Next.js App Router)
`src/app/` — one folder per route:
- `page.tsx` (home) · `about/` · `products/` · `uses/` · `contact/`
- `work/page.tsx` + `work/[slug]/page.tsx` (project index + detail)
- `writing/page.tsx` + `writing/[slug]/page.tsx` (essays)
- `layout.tsx`, `not-found.tsx`, `sitemap.ts`, `robots.ts`, `icon.tsx`
- Pages read from `src/content/*` and `src/lib/data.ts` — content is data,
  not hardcoded in JSX. To add/change a project or essay, edit the content
  module; the route renders it.

### Portfolio UI components (non-game)
`src/components/` top level (everything **except** `game3d/`):
`portfolio-home.tsx`, `site-header.tsx`, `site-footer.tsx`,
`contact-form.tsx`, `command-palette.tsx`, `artifact-tile.tsx`,
`uses-index.tsx`, plus `canvas/`, `line/`, `room/` subfolders.

### Real image assets
`public/framer/` and `public/archive/` hold the real portfolio imagery
(screenshots, photos, book covers) referenced by the content modules and
also framed on the walls inside the game's house.

### Rule of thumb
- Changing **what the portfolio says or shows** → `src/content/*`,
  `src/lib/data.ts`, `src/app/*`, `src/components/*` (not `game3d/`).
- Changing **the game world** → `src/components/game3d/*`.
- The game's monitor renders the real site, so the two do touch — but you
  almost never need to edit both for one task. Know which layer you're in.

---

## 4. The two mental models that make the code make sense

### (a) Game state is module-level mutable, NOT React state
Per-frame game state (`G` = player/car pos + mode, `LOOK` = yaw/pitch,
`PHYS`, `WEAPON`, `PAUSE`, `CAPTION`, etc.) lives in **plain mutable
objects at module scope**, mutated inside `useFrame`. React is only used
for the **HUD overlay**, and that HUD is synced **at 10 Hz, not every
frame** (see §6 — this is a crash fix, do not revert it). If you need the
render loop to know something, put it on one of these module objects, not
in `useState`.

`weapons.tsx` deliberately imports **nothing** from `game.tsx` to avoid a
cycle — it communicates through its own exported module objects (`WEAPON`,
`FIRE`, `RANGE_SCORE`). Keep that boundary.

### (b) One world-coordinate system: 3 units = 1 meter
- Player is 6'1", eye height ≈ 5.2 units. FOV 74.
- The house sits around world **(704, 341)**; downtown is north (−Z),
  the base is south. The city is a 1600×1600 grid, roads every 160 units.
- **Doorways get the "theater cut": 1.05 m wide × 2.2 m tall** — bigger
  than real, because true dimensions read cramped in first person. This
  is intentional; don't "correct" it to real door sizes.
- The house is built from **one source of truth**: the `OPENINGS` object
  in `house.tsx`. Walls, door panels, trim, and colliders are all derived
  from it, so a door can never end up inside a solid wall. If you move a
  wall or opening, edit `OPENINGS` and let the derivations flow — and
  update the matching `FURNITURE` collider AABB by hand.

---

## 5. How to work here (the loop that keeps it green)

1. Make the change.
2. `npx tsc --noEmit` — zero errors.
3. **Verify in the browser before committing.** Start the dev server,
   navigate with a `?p=` deep link to the exact spot, screenshot, confirm
   it looks right *and* check the console for errors. This project is
   almost entirely visual/interactive — a green type-check proves nothing
   about whether a room looks broken.
4. `npm run build` — green.
5. Commit with a real message describing *what and why*. Co-author trailer
   used in this repo:
   `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` (swap for your
   own attribution).

Commits here are large and thematic (see `git log` — "Weapon pass",
"World density pass", etc.), each self-contained and build-green. Match
that cadence.

---

## 6. Traps that will bite you (learned the hard way)

- **World-space `InstancedMesh` MUST set `frustumCulled={false}`.**
  Buildings, skyline, trees, parked cars are instanced meshes positioned
  in world space; their bounding sphere sits at the origin, so the moment
  the camera faces away from (0,0,0) three.js culls the *entire* mesh and
  whole city blocks vanish. This bug ate a session. Every instanced world
  mesh already has `frustumCulled={false}` — keep it.
- **Do NOT push HUD state every frame.** The HUD sync is throttled to
  10 Hz on purpose. Pushing React state 60×/s re-renders the entire app
  tree (portfolio DOM included) and was the root cause of the stutter and
  a likely idle-crash. The per-frame path only runs during the desk
  transition.
- **AudioContext starts suspended** (browser autoplay policy). `ambience.ts`
  resumes it on user gesture and self-heals before each SFX. If you add a
  sound, route it through the same guard or it'll be silent.
- **Pointer lock is not guaranteed.** Some browsers/webviews deny it
  silently. There's a drag-look fallback (`LOOK.fallback`) — hold-drag to
  look, F to fire. Don't assume `document.pointerLockElement`.
- **Imported GLTFs must pass through `retrofitModel()`** or they'll show
  up as glossy PBR objects that clash with the flat-shaded world.
- **Materials are `MeshLambertMaterial` almost everywhere.** Emissive is
  allowed for glow (windows, screens, lamps, muzzle flash). No PBR maps —
  that's the whole HL1 look. Outdoor light is one hemisphere + one shadow
  sun + a small ambient fill; interiors get ≤ 6 point lights.
- **Assets are committed as plain files** (`public/models` ~19 MB,
  `public/textures` ~7 MB), not Git LFS. Fine for now; just know the clone
  is heavy.
- There is a **crash recorder**: any uncaught error or WebGL context-loss
  writes to `localStorage["wc-crash"]` and shows a red in-game banner.
  When chasing a crash, read that first.

---

## 7. Git / branch state

- **Active branch: `portfolio2026`** (renamed from `import/framer-assets`).
  All the game work lives here. `main` is far behind and is still the
  repo's default branch — don't build on `main`.
- Everything through the "Quality sweep" commit is pushed to
  `origin/portfolio2026`.

---

## 8. Current state & the open punch list

Playable end to end, but the owner's standing feedback (repeated across
playtests) is **"quality is still not at the HL1/GTA bar."** Do not
declare things done; assume every surface can be pushed further.

Known-open, roughly prioritized:

1. **Crashes.** Intermittent crashes still reported (the 60 Hz re-render
   was one root cause and is fixed; there may be more — GPU memory,
   context loss). The crash banner + `localStorage["wc-crash"]` are your
   instrumentation. This is the top priority — an unstable game can't be
   evaluated.
2. **Graphics density & fidelity — the permanent thread.** The city still
   reads too simple: repetitive facades, low detail, empty gaps between
   blocks, primitive trees/cars. Every "quality sweep" pushes it; it's
   never "done." Next candidates: ground-floor storefronts downtown,
   suburb houses with pitched roofs, more building silhouette variety,
   real car model variety.
3. **The interior is underdeveloped.** The owner explicitly invited going
   bigger — "we could do a warehouse, two stories, a house within a
   house." Worth a real design proposal (floor plan first), not a patch.
4. **World structure.** No elevation change, no highway system, uniform
   grid. The owner wants topological variety.
5. **NPC collision.** You phase through pedestrians and traffic.
6. **Movement feel.** Some feedback that walking is too twitchy/fast
   ("Counter-Strike-y") — tune if asked.
7. **Car feel** has had little human tuning since the physics rewrite.
8. **Not shipped.** No production deploy; no plan yet for hosting ~26 MB
   of assets or for what a mobile visitor (unsupported) sees.

### Working style the owner expects
- Big, decisive sweeps over timid patches — "push everything in every
  direction."
- Always verify visually and report with screenshots/specifics.
- Be honest about what's still broken; don't oversell "done."
- When you hit a wall on fidelity, the move is to ask how a shipped game
  (HL, GTA) solved that exact problem and build an original version.

---

Welcome aboard. Start by reading `game.tsx`'s top-of-file constants and
the `Sim` component, then `STYLE.md`, then take one lap through the world
with `?fps=1` on before changing anything.
