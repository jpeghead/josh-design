# WHITEHEAD CITY — Asset Style Bible

The target is **1998 GoldSrc-era fidelity**: low-poly geometry, low-res
hand-painted-look textures, flat diffuse lighting. Original assets only —
we recreate the *style*, never the files.

Every asset follows these rules. When a new asset is needed, these rules
are the spec; when an old asset breaks them, it gets rebuilt.

## Geometry

- **Triangle budgets**: prop ≤ 500 tris · furniture ≤ 1,200 · vehicle ≤ 2,500
  · room shell = boxes and wedges only.
- Chunky silhouettes beat fine detail. Bevels only where the silhouette
  needs them. No smooth-shaded organic curves except plants.
- Everything axis-aligned unless it's deliberately askew (a leaning poster
  tube reads *lived-in*; three of them at random angles read *broken*).

## Textures

- **Resolution**: 128×128 default, 256×256 for hero surfaces (floors,
  facades), 64×64 for small props.
- **Authored in code** (canvas), then run through the retro pipeline:
  posterize to ~5 levels per channel + 4×4 ordered dither + warm desaturate.
- Diffuse only. **No normal, roughness, metalness, or env maps.** The 1998
  look *is* the absence of PBR.
- Filtering: linear mag + mipmaps (GL-era HL1, not software-mode nearest).
- Imported CC0 images (art, photos) keep full res — they are *content*,
  not surfaces. Their frames follow the rules.

## Palette

Warm, desaturated, sunset-keyed. Base ramps:

- plaster `#c9bfae → #8f867a` · wood `#8a6a4a → #4a3626`
- concrete `#9a958c → #6a655c` · metal `#9aa0a6 → #63686e`
- olive drab `#6a7a52 → #3d4a34` · brick rust `#9a5a42 → #5a3428`
- accent gold `#c8a24b` (one per scene, load-bearing)

Posterization snaps everything toward these ramps automatically.

## Materials & lighting

- `MeshLambertMaterial` everywhere (flat diffuse response, no reflections).
  Emissive allowed for glow: windows, screens, lamp shades, bulbs.
- Light budget: ≤ 6 point lights indoors, one hemisphere + one shadow sun
  outdoors. Fake everything else with emissive surfaces and baked-look
  gradients.
- Shadows: single 1024 map following the player. Props under 0.5 m don't
  cast.

## Sound

- Synthesized or CC0 only. Retro foley: short, chunky, filtered-noise
  transients. UI is terse mono blips.

## Movement (locked)

- 3 units = 1 m. Run 8.1 m/s · gravity 20 m/s² · jump ~1.1 m · FOV 74.
- Doorways get the theater cut: 1.05 × 2.2 m.

## The asset portfolio

Every asset built under these rules gets listed here, so the next one can
assume the last one's look:

- retro texture set: plaster, plank floor, cabinet wood, door wood,
  counter speckle, concrete, rug weave (see `game3d/retro.ts`)
- retrofitted CC0 models: sofa, armchair, dining set, stove, lamps,
  plants (GLTF diffuse maps forced through the quantizer)
