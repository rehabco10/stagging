/**
 * Geometry probe. Measures the real gap between the nav rail and the page
 * content, and lists the node ids React Flow actually rendered — eyeballing a
 * screenshot cannot tell you whether a gap is padding, a scrollbar gutter, or
 * a stray margin.
 */
import puppeteer from "puppeteer-core"

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const BASE = process.argv[2] ?? "http://localhost:5180"
const VIEW = { width: 1600, height: 1000 }

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--hide-scrollbars", "--lang=ar"],
})
const page = await browser.newPage()
await page.setViewport(VIEW)
await page.goto(`${BASE}/hotels`, { waitUntil: "networkidle2" })

const geo = await page.evaluate(() => {
  const box = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      x: Math.round(r.x),
      right: Math.round(r.right),
      w: Math.round(r.width),
      pad: `${cs.paddingInlineStart} / ${cs.paddingInlineEnd}`,
      margin: `${cs.marginInlineStart} / ${cs.marginInlineEnd}`,
    }
  }
  const nav = document.querySelector("nav[aria-label='الأقسام']")
  const scroller = document.querySelector("main, [class*='overflow-y-auto']")
  const column = document.querySelector("section")?.parentElement
  const card = document.querySelector("section")
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    docDir: document.documentElement.dir,
    nav: box(nav),
    scroller: box(scroller),
    column: box(column),
    card: box(card),
    htmlScrollbarGutter: getComputedStyle(document.documentElement).scrollbarGutter,
    scrollerOverflow: scroller ? getComputedStyle(scroller).overflowY : null,
  }
})

console.log(JSON.stringify(geo, null, 2))
if (geo.nav && geo.card) {
  console.log(`\nGAP between card right edge and nav left edge: ${geo.nav.x - geo.card.right}px`)
}

// Node ids actually in the DOM, for the landscape script's selector.
await page.goto(BASE, { waitUntil: "networkidle2" })
await page.waitForSelector('[data-id="root"]')
await page.hover('[data-id="root"]')
await new Promise((r) => setTimeout(r, 250))
const btn = await page.$('[data-id="root"] button')
if (btn) {
  await btn.click()
  await new Promise((r) => setTimeout(r, 700))
}
const ids = await page.evaluate(() =>
  [...document.querySelectorAll(".react-flow__node")].map((n) => ({
    id: n.getAttribute("data-id"),
    cls: n.className,
  })),
)
console.log("\nreact-flow nodes:", JSON.stringify(ids, null, 2))

await browser.close()
