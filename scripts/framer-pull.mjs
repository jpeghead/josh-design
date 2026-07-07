// Full pull of the Framer project via the read-only Server API.
//   - CMS: every collection's items (structured content) + image/file assets
//   - Canvas: background images + inline SVGs from the design tree
//   - Writes a manifest.json mapping every asset to where it came from
// NEVER calls publish()/deploy(). Read-only.
// Run: node --env-file=.env.local scripts/framer-pull.mjs

import { connect } from "framer-api"
import { mkdir, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"

const token = process.env.FRAMER_API_KEY
const projectUrl = process.env.FRAMER_PROJECT_URL
if (!token || !projectUrl) { console.error("Missing env"); process.exit(1) }

const ROOT = path.resolve("public/framer")
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a)

const withTimeout = (p, ms, label) =>
  Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error(`TIMEOUT ${label}`)), ms))])

const slugify = (s) =>
  String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "untitled"

const extFromUrl = (u) => {
  const m = new URL(u).pathname.match(/\.([a-z0-9]{2,5})$/i)
  return m ? "." + m[1].toLowerCase() : ""
}

// bounded-concurrency map
async function pool(items, size, fn) {
  const out = []; let i = 0
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx) }
  })
  await Promise.all(workers)
  return out
}

const seenBytes = new Map() // url -> localPath (dedupe downloads)
async function download(url, destAbs) {
  if (seenBytes.has(url)) return { url, path: seenBytes.get(url), deduped: true }
  await mkdir(path.dirname(destAbs), { recursive: true })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(destAbs, buf)
  const rel = path.relative(process.cwd(), destAbs)
  seenBytes.set(url, rel)
  return { url, path: rel, bytes: buf.length }
}

// ---- connect ----
log("connecting…")
const framer = await withTimeout(connect(projectUrl, token), 90000, "connect")
const project = await framer.getProjectInfo()
log("connected:", project.name)

const manifest = { project, pulledAt: new Date().toISOString(), collections: {}, canvas: {}, gaps: [] }
let downloaded = 0, failed = 0

// ---- CMS ----
const collections = await framer.getCollections()
for (const c of collections) {
  const fields = (await c.getFields().catch(() => [])) || []
  const fieldById = Object.fromEntries(fields.map((f) => [f.id, f]))
  const items = await c.getItems()
  const cslug = slugify(c.name)
  const outItems = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const data = item.fieldData ?? {}
    // find a title for naming
    const titleFieldId = fields.find((f) => /title|name/i.test(f.name || ""))?.id
    const titleRaw = titleFieldId ? (data[titleFieldId]?.value ?? data[titleFieldId]) : null
    const slug = slugify(typeof titleRaw === "string" ? titleRaw : item.id || `item-${i}`)
    const record = { id: item.id ?? null, slug, fields: {} }

    for (const [fid, entry] of Object.entries(data)) {
      const field = fieldById[fid]
      const name = field?.name || fid
      const value = entry?.value ?? entry
      const type = field?.type || entry?.type
      if (value && typeof value === "object" && typeof value.url === "string") {
        // image/file asset
        const fieldSlug = slugify(name)
        const dest = path.join(ROOT, "cms", cslug, `${slug}__${fieldSlug}${extFromUrl(value.url)}`)
        try {
          const r = await download(value.url, dest)
          if (!r.deduped) downloaded++
          record.fields[name] = { type: type || "image", url: value.url, local: r.path }
        } catch (e) { failed++; manifest.gaps.push(`CMS ${c.name}/${slug}/${name}: ${e.message}`); record.fields[name] = { type, url: value.url, error: e.message } }
      } else {
        record.fields[name] = { type, value }
      }
    }
    outItems.push(record)
  }

  await mkdir(path.join(ROOT, "cms", cslug), { recursive: true })
  await writeFile(path.join(ROOT, "cms", cslug, "_content.json"), JSON.stringify({ collection: c.name, fields: fields.map((f) => ({ id: f.id, name: f.name, type: f.type })), items: outItems }, null, 2))
  manifest.collections[c.name] = { slug: cslug, itemCount: items.length, imageCount: outItems.reduce((n, it) => n + Object.values(it.fields).filter((f) => f.local).length, 0) }
  log(`CMS ✓ ${c.name}: ${items.length} items, ${manifest.collections[c.name].imageCount} images`)
}

// ---- Canvas: background images ----
try {
  const bgNodes = await framer.getNodesWithAttributeSet("backgroundImage")
  const urls = new Map() // url -> node ids
  for (const n of bgNodes) {
    const img = n.backgroundImage
    if (img?.url) { if (!urls.has(img.url)) urls.set(img.url, []); urls.get(img.url).push(n.id) }
  }
  const list = [...urls.keys()]
  const results = await pool(list, 6, async (url) => {
    const dest = path.join(ROOT, "canvas", "images", path.basename(new URL(url).pathname))
    try { const r = await download(url, dest); if (!r.deduped) downloaded++; return { url, local: r.path, nodes: urls.get(url) } }
    catch (e) { failed++; manifest.gaps.push(`canvas img ${url}: ${e.message}`); return { url, error: e.message } }
  })
  manifest.canvas.backgroundImages = results
  log(`Canvas ✓ background images: ${list.length} unique (from ${bgNodes.length} nodes)`)
} catch (e) { manifest.gaps.push(`canvas backgroundImage walk failed: ${e.message}`); log("canvas bg failed:", e.message) }

// ---- Canvas: inline SVGs ----
try {
  const svgNodes = await framer.getNodesWithType("SVGNode")
  const byHash = new Map()
  for (const n of svgNodes) {
    const svg = n.svg || (await n.getSVG?.().catch(() => null))
    if (!svg) continue
    const h = createHash("sha1").update(svg).digest("hex").slice(0, 10)
    if (byHash.has(h)) continue
    byHash.set(h, true)
    const dest = path.join(ROOT, "canvas", "svg", `${h}.svg`)
    await mkdir(path.dirname(dest), { recursive: true })
    await writeFile(dest, svg); downloaded++
  }
  manifest.canvas.svgCount = byHash.size
  log(`Canvas ✓ SVGs: ${byHash.size} unique (from ${svgNodes.length} nodes)`)
} catch (e) { manifest.gaps.push(`SVG walk failed: ${e.message}`); log("svg failed:", e.message) }

// videos aren't exposed as canvas nodes — record the known gap
manifest.gaps.push("Background VIDEOS are not exposed by the node API; pull separately from the live site if needed.")

await writeFile(path.join(ROOT, "manifest.json"), JSON.stringify(manifest, null, 2))
log(`DONE — ${downloaded} files downloaded, ${failed} failed. Manifest: public/framer/manifest.json`)
process.exit(0)
