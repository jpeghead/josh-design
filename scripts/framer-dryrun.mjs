// Read-only dry run of the Framer Server API.
// Lists collections, fields, item counts, and counts downloadable assets.
// Does NOT download anything and NEVER calls publish()/deploy().
// Run: node --env-file=.env.local scripts/framer-dryrun.mjs

import { connect, isImageAsset, isFileAsset } from "framer-api"

const token = process.env.FRAMER_API_KEY
const projectUrl = process.env.FRAMER_PROJECT_URL
if (!token || !projectUrl) {
  console.error("Missing FRAMER_API_KEY or FRAMER_PROJECT_URL in .env.local")
  process.exit(1)
}

const withTimeout = (p, ms, label) =>
  Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT after ${ms}ms: ${label}`)), ms)),
  ])

console.log(`[${new Date().toISOString()}] connecting to ${projectUrl} ...`)
const framer = await withTimeout(connect(projectUrl, token), 60000, "connect()")
console.log(`[${new Date().toISOString()}] connected ✓`)

// --- Project info ---
try {
  const info = await framer.getProjectInfo()
  console.log("PROJECT:", JSON.stringify(info, null, 2))
} catch (e) {
  console.log("getProjectInfo failed:", e?.message ?? e)
}

// --- Collections (CMS) ---
const assetUrls = new Set()
let totalItems = 0
const collections = await framer.getCollections()
console.log(`\n=== ${collections.length} COLLECTIONS ===`)

for (const c of collections) {
  let fields = []
  try { fields = await c.getFields() } catch {}
  const items = await c.getItems()
  totalItems += items.length

  // find image/file field values across items
  let assetCount = 0
  for (const item of items) {
    const data = item.fieldData ?? {}
    for (const key of Object.keys(data)) {
      const v = data[key]?.value ?? data[key]
      if (v && typeof v === "object" && typeof v.url === "string") {
        assetUrls.add(v.url); assetCount++
      } else if (isImageAsset?.(v) || isFileAsset?.(v)) {
        if (v.url) { assetUrls.add(v.url); assetCount++ }
      }
    }
  }

  const fieldSummary = fields.map(f => `${f.name ?? f.id}:${f.type}`).join(", ")
  console.log(`\n• ${c.name}  (${items.length} items, ${assetCount} asset refs)`)
  if (fieldSummary) console.log(`    fields: ${fieldSummary}`)
  // sample the first item's keys so we can see the raw shape
  if (items[0]) console.log(`    item[0] keys: ${Object.keys(items[0].fieldData ?? items[0]).join(", ")}`)
}

// --- Canvas probe (on-canvas media) ---
let canvasImages = 0
try {
  const withBg = await framer.getNodesWithType?.("FrameNode")
  console.log(`\n=== CANVAS PROBE ===`)
  console.log(`FrameNodes found: ${Array.isArray(withBg) ? withBg.length : "n/a"}`)
} catch (e) {
  console.log("\nCanvas probe not available this way:", e?.message ?? e)
}

console.log(`\n=== TOTALS ===`)
console.log(`Collections: ${collections.length}`)
console.log(`CMS items:   ${totalItems}`)
console.log(`Unique CMS asset URLs: ${assetUrls.size}`)
console.log("\nSample asset URLs:")
;[...assetUrls].slice(0, 8).forEach(u => console.log("  " + u))
