/**
 * Landscape captures of every routed page EXCEPT the canvas, at phone- and
 * tablet-landscape sizes — the shapes where a single narrow column leaves the
 * majority of the viewport blank.
 */
import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import puppeteer from "puppeteer-core"

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const BASE = process.argv[2] ?? "http://localhost:5180"
const OUT = join(process.cwd(), "screenshots")

const PAGES = [
  ["dashboard", "/"],
  ["packages", "/packages"],
  ["requirements", "/requirements"],
  ["hotels", "/hotels"],
  ["validation", "/validation"],
  ["settings", "/settings"],
]

const SIZES = [
  ["phoneland", { width: 896, height: 414, deviceScaleFactor: 2, isMobile: true }],
  ["laptop", { width: 1600, height: 1000, deviceScaleFactor: 1 }],
]

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
await mkdir(OUT, { recursive: true })

for (const [sizeName, vp] of SIZES) {
  await page.setViewport(vp)
  for (const [name, path] of PAGES) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle2" })
    await wait(450)
    // How much of the width does the content column actually use?
    const use = await page.evaluate(() => {
      const col = document.querySelector("main, [class*='overflow-y-auto']")?.firstElementChild
      const r = col?.getBoundingClientRect()
      return r ? Math.round((r.width / innerWidth) * 100) : null
    })
    await page.screenshot({ path: join(OUT, `P-${sizeName}-${name}.png`) })
    console.log(`  P-${sizeName}-${name}.png  column=${use}% of viewport`)
  }
}

await browser.close()
console.log(problems.length ? `\n⚠ ${problems.length} console error(s)` : "\nno console errors")
