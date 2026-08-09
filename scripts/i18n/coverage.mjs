/**
 * How much Arabic is still visible in the English UI (docs/i18n-plan.md §4).
 *
 *   node scripts/i18n/coverage.mjs
 *
 * The static inventory counts strings in the source; this counts what a user
 * actually sees. It walks every page under `/en`, collects the Arabic runs in
 * the rendered text, and separates them from the Arabic that is *data* — hotel
 * and carrier names, contract cities — which stay Arabic in both languages and
 * must not be mistaken for missed translations.
 */
import { createServer } from "node:http"
import { readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..", "..")
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const puppeteer = (
  await import(pathToFileURL(path.resolve(ROOT, "node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js")).href)
).default

const PAGES = [
  ["dashboard", "/"],
  ["canvas", "/canvas", 1800],
  ["journey", "/canvas?journey=pkg_1447_01", 1800],
  ["packages", "/packages"],
  ["package-detail", "/packages/pkg_1447_01"],
  ["hotels", "/hotels"],
  ["hotel-detail", "/hotels/h_aziziyah", 1400],
  ["flights", "/flights/%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9"],
  ["validation", "/validation"],
  ["settings", "/settings"],
]

/** Entity names live in the seed and are Arabic in both locales. */
const DATA_NAMES = new Set()
const seed = await readFile(path.join(ROOT, "src/store/seed-1447.ts"), "utf8")
for (const m of seed.matchAll(/"(?:name_ar|airline_ar)":\s*"([^"]+)"/g)) DATA_NAMES.add(m[1].trim())

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" }
const server = await new Promise((resolve) => {
  const s = createServer(async (req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0])
    let file = path.join(ROOT, "dist", url)
    if (!existsSync(file) || url.endsWith("/")) file = path.join(ROOT, "dist", "index.html")
    res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" })
    res.end(await readFile(file))
  })
  s.listen(4185, () => resolve(s))
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" })
const page = await browser.newPage()
await page.setViewport({ width: 1500, height: 950 })

const perPage = []
const strings = new Map() // arabic run -> { count, pages:Set }

for (const [name, route, settle] of PAGES) {
  await page.goto(`http://localhost:4185/en${route}`, { waitUntil: "networkidle0", timeout: 30000 })
  await sleep(settle ?? 900)
  // Visible text only: skip <script>/<style> and anything hidden.
  const runs = await page.evaluate(() => {
    const out = []
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const parent = n.parentElement
      if (!parent || ["SCRIPT", "STYLE"].includes(parent.tagName)) continue
      for (const m of (n.textContent ?? "").matchAll(/[\u0600-\u06FF][\u0600-\u06FF\s،؛:.()«»%\d/-]*/g)) {
        const s = m[0].trim()
        if (s) out.push(s)
      }
    }
    return out
  })
  let ui = 0
  let data = 0
  for (const run of runs) {
    if ([...DATA_NAMES].some((n) => run.includes(n) || n.includes(run))) {
      data++
      continue
    }
    ui++
    const e = strings.get(run) ?? { count: 0, pages: new Set() }
    e.count++
    e.pages.add(name)
    strings.set(run, e)
  }
  perPage.push({ page: name, untranslated: ui, dataNames: data })
}

await browser.close()
server.close()

const ranked = [...strings.entries()]
  .map(([text, e]) => ({ text, count: e.count, pages: [...e.pages] }))
  .sort((a, b) => b.count - a.count)

await writeFile(
  path.join(HERE, "coverage.json"),
  JSON.stringify({ perPage, distinct: ranked.length, strings: ranked }, null, 2),
  "utf8",
)

console.log("visible Arabic in the English UI, per page:")
for (const p of perPage) console.log(`  ${p.page.padEnd(16)} ${String(p.untranslated).padStart(4)} untranslated  (${p.dataNames} data names)`)
console.log(`\ntotal ${perPage.reduce((t, p) => t + p.untranslated, 0)} occurrences of ${ranked.length} distinct strings`)
console.log("\nmost frequent:")
for (const s of ranked.slice(0, 12)) console.log(`  ${String(s.count).padStart(3)}x  ${s.text.slice(0, 52).padEnd(54)} ${s.pages.join(",")}`)
console.log("\nfull list in scripts/i18n/coverage.json")
