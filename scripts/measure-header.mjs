/** Landscape header geometry: where the title and its action actually sit. */
import puppeteer from "puppeteer-core"

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const BASE = process.argv[2] ?? "http://localhost:5180"

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--hide-scrollbars", "--lang=ar"],
})
const page = await browser.newPage()

/** Both landscapes: a short phone and a tall laptop. */
const CASES = [
  { name: "phone-landscape", width: 896, height: 414, isMobile: true },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "laptop", width: 1600, height: 1000 },
]

for (const c of CASES) {
  await page.setViewport({ width: c.width, height: c.height, deviceScaleFactor: 1, isMobile: !!c.isMobile })
  await page.goto(`${BASE}/canvas`, { waitUntil: "networkidle2" })
  const g = await measure(page)
  const gap = g.h1 && g.button ? g.h1.x - g.button.right : null
  console.log(
    `${c.name.padEnd(18)} ${c.width}x${c.height}  tall=${String(g.matchesTall).padEnd(5)} ` +
      `header=${String(g.header.h).padStart(3)}px (${Math.round((g.header.h / c.height) * 100)}%)  ` +
      `gap title→button=${gap}px`,
  )
}

await browser.close()

async function measure(page) {
  return page.evaluate(() => {
  const b = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: Math.round(r.x), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }
  }
  const header = document.querySelector("header")
  const h1 = header?.querySelector("h1")
  const row = h1?.parentElement?.parentElement
  const btn = header?.querySelector("button")
  const cs = row ? getComputedStyle(row) : null
  return {
    viewport: { w: innerWidth, h: innerHeight },
    matchesTall: matchMedia("(min-height: 560px)").matches,
    header: b(header),
    row: b(row),
    rowJustify: cs?.justifyContent,
    rowMaxWidth: cs?.maxWidth,
    titleWrap: b(h1?.parentElement),
    h1: b(h1),
    h1Size: h1 ? getComputedStyle(h1).fontSize : null,
    button: b(btn),
    }
  })
}
