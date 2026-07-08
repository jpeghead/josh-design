# THE ROOM — Render Brief

One static camera. One room. May 22, 1987 → today. Twelve stills, all from
the *identical* camera position, in the INSIDE (Playdead) idiom: a fully 3D
scene, cinematic lighting, shot flat-on like a 2D side view.

The site scrubs between these stills as the visitor scrolls. The camera never
moves — the room changes. Drop finished renders into `public/room/` using the
filenames below and the site picks them up automatically.

---

## The master style lock (put this in EVERY prompt)

> static wide shot of a bedroom interior, perfectly side-on single-point
> perspective, camera at chest height, entire room in frame, in the style of
> the video game INSIDE by Playdead — near-monochrome slate blue-gray palette,
> one warm practical light source, strong volumetric light shaft from a
> window, deep soft shadows, atmospheric haze, dust motes in the light,
> cinematic depth of field, Unreal Engine 5 render, photorealistic materials,
> desaturated, moody, no people visible OR single dark silhouetted figure,
> film grain --ar 16:9 --style raw

**Consistency technique (Midjourney):**
1. Generate the EMPTY master room first (prompt 00 below). Rerun until the
   architecture feels right. This is your set.
2. For every era: feed the master room image as an image prompt + `--sref`
   the master render, then describe only what changed. Keep `--seed` fixed
   once you like a direction.
3. The window stays on the LEFT wall, the door on the RIGHT, the desk wall
   facing camera. Never let a generation move them — regenerate if it does.
4. Upscale everything at the same resolution (2048+ wide).

**Depth maps (for the 2.5D parallax):** run each final still through
Depth-Anything or Marigold (free on Hugging Face — you have an account) and
save the grayscale depth PNG alongside: `<era>-depth.png`. Optional but it's
what makes the still feel like a live 3D scene.

---

## The twelve stills

Filename → what's in the room (everything else stays identical).

**00-master.jpg — the empty set**
Bare room: left window with light shaft, wood floor, back wall, right door.
No furniture. This is the reference for everything.

**01-1987.jpg — May 22, 1987**
A crib in the right corner, a mobile above it, rocking chair, soft morning
shaft. A single small lamp. (The crib's corner matters — it comes back.)

**02-1993.jpg — the kid**
Crib gone; low child's desk under the window, crayons scattered, drawings
taped crooked on the wall (a rocket, a sun, a house), toy box, small figure
kneeling at the desk in silhouette.

**03-2001.jpg — middle school**
Bigger desk, first beige family PC with CRT glow, bunk bed, glow-in-the-dark
stars on the wall barely visible, video game posters.

**04-2004.jpg — high school / Samantha**
CRT replaced with a chunky tower + monitor, band posters, skateboard against
the wall, TWO jackets on the chair, a photo-booth strip taped to the monitor.

**05-2006.jpg — career school / fine art**
Drafting table + easel with a charcoal figure study, poster tubes, X-Acto
knives, large-format prints pinned up, art-school clutter, warmer lamp.

**06-2008.jpg — the Corps**
The room goes spartan: rack with hospital corners, footlocker, camis hanging,
folded flag on the shelf, a Nikon on the desk, boots squared under the rack.
Colder, harder shaft. A framed wedding photo on the desk — June 2008.

**07-2009.jpg — Gunner (Nov 1, 2009)**
SAME spartan room — but the crib is back, same right corner as 1987. Baby
mobile. The camis still hang. A rocking chair returns.

**08-2014.jpg — Los Angeles**
Sunburned light, palm shadow through the window, iMac on a modern desk, app
wireframes pinned in a grid, skateboard replaced by a surfboard? no — bike.
The crib corner has a toddler bed now.

**09-2019.jpg — the remote years**
Standing desk, dual monitors glowing, framed WWDC badge on the wall, a Spin
scooter parked against the wall, kid toys on the floor, better plant.

**10-2021.jpg — Nolan**
SAME room — and the crib is back a THIRD time, same corner. Toys doubled.
One monitor shows a paused design file; the chair is turned toward the crib.

**11-2023.jpg — the move**
The room in boxes. Lighter rectangles on the wall where every frame hung.
The crib corner: empty, dust outline on the floor. Door open, light beyond.

**12-2024.jpg — the garage, home**
The room reads as a garage studio now: workbench desk, big monitor with warm
glow, pegboard with tools AND kids' crayon drawings pinned (a rocket — the
same rocket), manuscript stacks, porch light through the window. A figure at
the bench, same posture as 02-1993.

---

## Also welcome (optional, later)
- A 13th "night" variant of 12 for the finale beat.
- 24fps micro-loops (2–3s) of any era for ambient life — dust, screen
  flicker, curtain sway. The site can play these instead of stills.
