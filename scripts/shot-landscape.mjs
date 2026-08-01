/**
 * Landscape capture.
 *
 * The viewport is set *before* navigating: switching `isMobile` mid-session
 * makes Chrome re-create the page, which wipes the in-memory draft and left
 * the earlier landscape shots showing an empty canvas.
 *
 * Usage: node scripts/shot-landscape.mjs [baseUrl]
 */
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import puppeteer from "puppeteer-core"

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const BASE = process.argv[2] ?? "http://localhost:5180"
const OUT = join(process.cwd(), "screenshots")

// A phone held sideways — the case a bottom drawer would bury.
const LANDSCAPE = { width: 896, height: 414, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const problems = []

/**
 * Add via the canvas toolbar, not the node's (+).
 *
 * The (+) is `pointer-events-none` until its card is hovered, and a touch
 * emulation profile never fires hover — so clicking it silently did nothing
 * and the run ended with zero packages. The toolbar button is always live.
 */
async function addPackage(page) {
  await page.waitForSelector('[data-id="root"]')
  const [btn] = await page.$$('xpath/.//button[contains(., "باقة جديدة")]')
  if (!btn) throw new Error("toolbar add-package button not found")
  await btn.click()
  await wait(500)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--hide-scrollbars", "--lang=ar"],
  })
  const page = await browser.newPage()
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()))
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`))

  // Viewport first, then navigate — order matters, see the header comment.
  await page.setViewport(LANDSCAPE)

  const shot = async (name) => {
    await wait(400)
    await page.screenshot({ path: join(OUT, `${name}.png`) })
    console.log(`  ${name}.png`)
  }

  await page.goto(`${BASE}/canvas`, { waitUntil: "networkidle2" })
  await shot("L1-canvas-empty")

  for (let i = 0; i < 3; i++) await addPackage(page)
  await shot("L2-canvas-packages")

  // Select a package → the wizard opens. In landscape it must be a side sheet,
  // not a bottom drawer.
  const nodes = await page.$$('.react-flow__node[data-id^="pkg_"]')
  if (!nodes.length) throw new Error("no package nodes")
  await nodes[0].click()
  await wait(600)
  await shot("L3-wizard-sheet")

  await page.keyboard.press("Escape")
  await wait(400)

  await page.goto(`${BASE}/hotels`, { waitUntil: "networkidle2" })
  await shot("L4-hotels")

  await page.goto(`${BASE}/validation`, { waitUntil: "networkidle2" })
  await shot("L5-validation")

  await browser.close()

  await writeFile(join(OUT, "landscape-problems.json"), JSON.stringify(problems, null, 2))
  console.log(problems.length ? `\n⚠ ${problems.length} console error(s):` : "\nno console errors")
  for (const p of [...new Set(problems)].slice(0, 5)) console.log(`  ${p.slice(0, 160)}`)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
