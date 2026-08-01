/**
 * Mobile-portrait canvas capture + interaction probe.
 *
 * Documents what a phone user actually gets on `/`: which overlays exist
 * (zoom controls, minimap, toolbar), and what a long-press followed by the
 * finger lifting does — the double-fire path a mouse never exercises.
 */
import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import puppeteer from "puppeteer-core"

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const BASE = process.argv[2] ?? "http://localhost:5180"
const OUT = join(process.cwd(), "screenshots")

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const problems = []

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--hide-scrollbars", "--lang=ar"],
})
const page = await browser.newPage()
page.on("console", (m) => m.type() === "error" && problems.push(m.text()))
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`))

// iPhone-ish portrait, touch enabled.
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await page.goto(`${BASE}/canvas`, { waitUntil: "networkidle2" })
await mkdir(OUT, { recursive: true })

const shot = async (name) => {
  await wait(450)
  await page.screenshot({ path: join(OUT, `${name}.png`) })
  console.log(`  ${name}.png`)
}

// Build a small tree via the toolbar (hover-free path).
await page.waitForSelector('[data-id="root"]')
for (let i = 0; i < 2; i++) {
  const [btn] = await page.$$('xpath/.//button[contains(., "باقة جديدة")]')
  await btn.click()
  await wait(450)
}
// Close the wizard drawer if node-add opened it.
await page.keyboard.press("Escape")
await wait(300)
await shot("M1-canvas-portrait")

// What overlays does the DOM actually have?
const overlays = await page.evaluate(() => ({
  controls: !!document.querySelector(".react-flow__controls"),
  minimap: !!document.querySelector(".react-flow__minimap"),
  toolbarButtons: [...document.querySelectorAll(".react-flow__panel button")].map((b) =>
    (b.getAttribute("aria-label") || b.textContent || "").trim(),
  ),
  drawersOpen: document.querySelectorAll("[data-slot='drawer-popup']").length,
}))
console.log("overlays:", JSON.stringify(overlays, null, 2))

// Long-press a package node, then LIFT the finger. Expected now: nothing
// opens while held; the menu drawer opens on release; the tap's synthesized
// click is swallowed so the wizard does NOT also open; no action runs.
// Pick a package node whose CENTRE is actually inside the viewport — the
// first-in-DOM node can be clipped at the edge after fitView, and a touch at
// its off-screen centre silently hits nothing (which had this probe reporting
// phantom failures: the code was fine, the finger was missing the node).
const nodes = await page.$$('.react-flow__node[data-id^="pkg_"]')
let cx, cy
for (const n of nodes) {
  const b = await n.boundingBox()
  if (!b) continue
  const x = b.x + b.width / 2
  const y = b.y + b.height / 2
  if (x > 20 && x < 370 && y > 100 && y < 780) {
    cx = x
    cy = y
    break
  }
}
if (cx === undefined) throw new Error("no package node fully inside the viewport")
const legsBefore = await page.evaluate(() => document.querySelectorAll("[data-id^='leg_']").length)

await page.touchscreen.touchStart(cx, cy)
await wait(650) // > HOLD_MS
const whileHeld = await page.evaluate(() => ({
  drawersOpen: document.querySelectorAll("[data-slot='drawer-popup']").length,
}))
await page.touchscreen.touchEnd()
await wait(600)
const after = await page.evaluate(() => ({
  drawersOpen: document.querySelectorAll("[data-slot='drawer-popup']").length,
  menuTitle: [...document.querySelectorAll("[data-slot='drawer-popup']")]
    .map((d) => d.textContent?.slice(0, 40))
    .join(" | "),
  wizardOpen: [...document.querySelectorAll("[data-slot='drawer-popup']")].some((d) =>
    d.textContent?.includes("معالج تكوين الباقات"),
  ),
  legs: document.querySelectorAll("[data-id^='leg_']").length,
}))
console.log("while held:", JSON.stringify(whileHeld))
console.log("after lift:", JSON.stringify(after, null, 2))
console.log(`legs before/after: ${legsBefore}/${after.legs}  (must be equal — no accidental action)`)
await shot("M2-longpress-result")

// Dismiss the menu with Escape (a tap can land on the drawer itself), then
// verify a PLAIN tap opens the wizard sheet — the click swallow must not be
// sticky. Node position is re-resolved: dismissal may have re-laid things out.
await page.keyboard.press("Escape")
await wait(500)
let tx, ty
for (const n of await page.$$('.react-flow__node[data-id^="pkg_"]')) {
  const b = await n.boundingBox()
  if (!b) continue
  const x = b.x + b.width / 2
  const y = b.y + b.height / 2
  if (x > 20 && x < 370 && y > 100 && y < 780) {
    tx = x
    ty = y
    break
  }
}
await page.touchscreen.tap(tx, ty)
await wait(700)
const afterTap = await page.evaluate(() => ({
  wizardOpen: [...document.querySelectorAll("[data-slot='drawer-popup']")].some((d) =>
    d.textContent?.includes("معالج تكوين الباقات"),
  ),
}))
console.log("plain tap after dismissing menu:", JSON.stringify(afterTap))
await shot("M3-wizard-after-tap")

await browser.close()
console.log(problems.length ? `\n⚠ ${problems.length} console error(s)` : "\nno console errors")
for (const p of [...new Set(problems)].slice(0, 5)) console.log(`  ${p.slice(0, 160)}`)
