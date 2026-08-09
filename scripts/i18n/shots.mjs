/**
 * The i18n screenshot matrix (docs/i18n-plan.md §4).
 *
 *   node scripts/i18n/shots.mjs                     # ar + en, desktop + phone
 *   node scripts/i18n/shots.mjs --baseline ../hpw-baseline/dist
 *
 * Serves `dist` itself (SPA fallback included) rather than leaning on a
 * background dev server — those get reaped in this environment, and a run
 * that owns its server can never shoot a stale build.
 *
 * With `--baseline`, the Arabic pages are also shot against a second build
 * and compared byte-for-byte: that is the "no visual change" gate each
 * infrastructure phase has to pass before any string moves.
 */
import { createServer } from "node:http"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..", "..")
const SHOTS = path.join(ROOT, "scripts", "i18n", "shots")
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
// Windows ESM needs a file:// URL for an absolute path.
const puppeteer = (
  await import(
    pathToFileURL(path.resolve(ROOT, "node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js")).href
  )
).default

const args = process.argv.slice(2)
const baselineDir = args.includes("--baseline") ? args[args.indexOf("--baseline") + 1] : null

const PAGES = [
  { name: "dashboard", path: "/" },
  { name: "canvas", path: "/canvas", settle: 1800 },
  { name: "journey", path: "/canvas?journey=pkg_1447_01", settle: 1800 },
  { name: "packages", path: "/packages" },
  { name: "package-detail", path: "/packages/pkg_1447_01" },
  { name: "hotels", path: "/hotels" },
  { name: "hotel-detail", path: "/hotels/h_aziziyah", settle: 1400 },
  { name: "flights", path: "/flights/%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9" },
  { name: "validation", path: "/validation" },
  { name: "settings", path: "/settings" },
]
const SIZES = [
  { name: "desktop", width: 1500, height: 950, mobile: false },
  { name: "phone", width: 390, height: 844, mobile: true },
]
const LOCALES = [
  { code: "ar", prefix: "", dir: "rtl" },
  { code: "en", prefix: "/en", dir: "ltr" },
]

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ico": "image/x-icon",
}

/** Static file server with SPA fallback — enough to host a Vite `dist`. */
function serve(dir, port) {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0])
    let file = path.join(dir, url)
    if (!existsSync(file) || url.endsWith("/")) file = path.join(dir, "index.html")
    try {
      const body = await readFile(file)
      res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" })
      res.end(body)
    } catch {
      res.writeHead(404).end("not found")
    }
  })
  return new Promise((resolve) => server.listen(port, () => resolve(server)))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function shoot(page, url, settle) {
  await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 })
  await sleep(settle ?? 900)
  return page.screenshot()
}

/** What the page says about itself — the automated half of the gate. */
const inspect = (page) =>
  page.evaluate(() => {
    const root = document.documentElement
    const text = document.body.innerText
    return {
      docW: root.scrollWidth,
      viewportW: window.innerWidth,
      dir: root.dir,
      lang: root.lang,
      arabicRuns: (text.match(/[\u0600-\u06FF]+/g) ?? []).length,
      empty: text.trim().length < 40,
    }
  })

await mkdir(SHOTS, { recursive: true })
const current = await serve(path.join(ROOT, "dist"), 4180)
const baseline = baselineDir ? await serve(path.resolve(ROOT, baselineDir), 4181) : null

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" })
const findings = []
let identical = 0
let differing = 0

for (const size of SIZES) {
  const page = await browser.newPage()
  await page.setViewport({ width: size.width, height: size.height, deviceScaleFactor: 1, isMobile: size.mobile, hasTouch: size.mobile })
  for (const locale of LOCALES) {
    for (const p of PAGES) {
      const url = `http://localhost:4180${locale.prefix}${p.path}`
      const shot = await shoot(page, url, p.settle)
      const info = await inspect(page)
      const label = `${locale.code}-${p.name}-${size.name}`
      await writeFile(path.join(SHOTS, `${label}.png`), shot)

      if (info.empty) findings.push(`${label}: page rendered empty`)
      if (info.docW > info.viewportW + 2) findings.push(`${label}: horizontal overflow (${info.docW} > ${info.viewportW})`)
      if (info.dir !== locale.dir) findings.push(`${label}: html dir=${info.dir}, expected ${locale.dir}`)
      if (info.lang !== locale.code) findings.push(`${label}: html lang=${info.lang}, expected ${locale.code}`)

      // Baseline comparison — Arabic only: the baseline build has no /en.
      if (baseline && locale.code === "ar") {
        const before = await shoot(page, `http://localhost:4181${p.path}`, p.settle)
        if (Buffer.compare(before, shot) === 0) identical++
        else {
          differing++
          await writeFile(path.join(SHOTS, `${label}.baseline.png`), before)
          findings.push(`${label}: differs from baseline (see ${label}.baseline.png)`)
        }
      }
    }
  }
  await page.close()
}

await browser.close()
current.close()
baseline?.close()

console.log(`shots: ${PAGES.length * SIZES.length * LOCALES.length} written to scripts/i18n/shots/`)
if (baseline) console.log(`baseline: ${identical} identical, ${differing} differing`)
if (findings.length) {
  console.log(`\nFINDINGS (${findings.length}):`)
  for (const f of findings) console.log("  -", f)
  process.exitCode = 1
} else {
  console.log("\nno findings — dir/lang correct, no overflow, nothing empty")
}
