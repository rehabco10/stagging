/**
 * Headless Chrome screenshot harness.
 *
 * Drives the running dev server through the real pages and interactions and
 * writes PNGs to `screenshots/`. Also collects console errors and page errors
 * per shot, so a broken render fails loudly instead of producing a pretty
 * picture of nothing.
 *
 * Usage: node scripts/shots.mjs [baseUrl]
 */
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import puppeteer from "puppeteer-core"

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const BASE = process.argv[2] ?? "http://localhost:5180"
const OUT = join(process.cwd(), "screenshots")

const VIEWPORTS = {
  desktop: { width: 1600, height: 1000, deviceScaleFactor: 1 },
  laptop: { width: 1280, height: 800, deviceScaleFactor: 1 },
  // A phone in landscape — the case where a bottom drawer buries the canvas.
  landscape: { width: 896, height: 414, deviceScaleFactor: 2, isMobile: true },
  portrait: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
}

const problems = []

async function shoot(page, name, { viewport = "desktop", before } = {}) {
  await page.setViewport(VIEWPORTS[viewport])
  const errors = []
  const onConsole = (m) => m.type() === "error" && errors.push(m.text())
  const onPageError = (e) => errors.push(`pageerror: ${e.message}`)
  page.on("console", onConsole)
  page.on("pageerror", onPageError)

  if (before) await before(page)
  await new Promise((r) => setTimeout(r, 450)) // let transitions land

  const file = join(OUT, `${name}.png`)
  await page.screenshot({ path: file })

  page.off("console", onConsole)
  page.off("pageerror", onPageError)
  if (errors.length) problems.push({ name, errors: [...new Set(errors)] })
  console.log(`  ${name}.png${errors.length ? `  ⚠ ${errors.length} console error(s)` : ""}`)
}

const goto = (url) => async (page) => {
  await page.goto(url, { waitUntil: "networkidle2" })
}

/** Click the (+) inside the quota root card. */
async function addPackage(page) {
  await page.waitForSelector('[data-id="root"]')
  await page.hover('[data-id="root"]')
  await new Promise((r) => setTimeout(r, 200))
  const btn = await page.$('[data-id="root"] button')
  if (!btn) throw new Error("add-package button not found on the root node")
  await btn.click()
  await new Promise((r) => setTimeout(r, 600))
}

async function main() {
  // Overwrite in place rather than wiping the directory — this script used to
  // `rm -rf` it, which silently deleted the landscape set captured by
  // `shot-landscape.mjs`.
  await mkdir(OUT, { recursive: true })

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--force-device-scale-factor=1", "--hide-scrollbars", "--lang=ar"],
  })
  const page = await browser.newPage()

  console.log(`\nshooting ${BASE}`)

  // ── pages ──────────────────────────────────────────────────────
  await shoot(page, "00-dashboard-empty", { before: goto(BASE) })
  await shoot(page, "01-canvas-empty", { before: goto(`${BASE}/canvas`) })
  await shoot(page, "02-requirements", { before: goto(`${BASE}/requirements`) })
  await shoot(page, "03-hotels", { before: goto(`${BASE}/hotels`) })
  await shoot(page, "04-validation", { before: goto(`${BASE}/validation`) })
  await shoot(page, "05-settings", { before: goto(`${BASE}/settings`) })

  // ── actions on the canvas ──────────────────────────────────────
  await shoot(page, "06-canvas-one-package", {
    before: async (p) => {
      await goto(`${BASE}/canvas`)(p)
      await addPackage(p)
    },
  })

  await shoot(page, "07-canvas-four-packages", {
    before: async (p) => {
      for (let i = 0; i < 3; i++) await addPackage(p)
    },
  })

  // The wizard sheet, opened by selecting a package node.
  await shoot(page, "08-wizard-sheet", {
    before: async (p) => {
      const nodes = await p.$$('.react-flow__node[data-id^="pkg_"]')
      if (!nodes.length) throw new Error("no package nodes to select")
      await nodes[0].click()
      await new Promise((r) => setTimeout(r, 500))
    },
  })

  // ── dashboard + grid editor, with the same live data ───────────
  // Navigate via the rail links: the store is in-memory only, so a goto()
  // would reload the page and wipe the four packages just built.
  const railNav = (label) => async (p) => {
    await p.keyboard.press("Escape")
    await new Promise((r) => setTimeout(r, 300))
    await p.click(`nav [aria-label="${label}"]`)
    await new Promise((r) => setTimeout(r, 450))
  }
  await shoot(page, "13-dashboard-live", { before: railNav("لوحة المعلومات") })
  await shoot(page, "14-packages-grid", { before: railNav("جدول الباقات") })
  await shoot(page, "15-packages-detail", {
    before: async (p) => {
      // Select the second row — the first may already be selected.
      const rows = await p.$$("tbody tr")
      if (rows[1]) await rows[1].click()
      await new Promise((r) => setTimeout(r, 400))
    },
  })
  // Back to the canvas client-side for the responsive shots below.
  await railNav("تكوين الباقات — المخطط")(page)

  // Same state, the two responsive breakpoints that were broken.
  await shoot(page, "09-wizard-landscape", { viewport: "landscape" })
  await shoot(page, "10-wizard-portrait", { viewport: "portrait" })

  await shoot(page, "11-canvas-landscape", {
    viewport: "landscape",
    before: async (p) => {
      await p.keyboard.press("Escape")
      await new Promise((r) => setTimeout(r, 400))
    },
  })

  await shoot(page, "12-hotels-portrait", {
    viewport: "portrait",
    before: goto(`${BASE}/hotels`),
  })

  await browser.close()

  await writeFile(join(OUT, "problems.json"), JSON.stringify(problems, null, 2))
  if (problems.length) {
    console.log(`\n⚠ ${problems.length} shot(s) logged console errors:`)
    for (const p of problems) {
      console.log(`  ${p.name}`)
      for (const e of p.errors.slice(0, 3)) console.log(`    ${e.slice(0, 160)}`)
    }
  } else {
    console.log("\nno console errors")
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
