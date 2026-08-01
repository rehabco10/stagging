/**
 * Touch-scroll probe. Swipes up on each page in mobile-portrait emulation and
 * reports whether anything actually scrolled — "can't scroll" bugs hide in
 * CSS (touch-action, overflow chains) that only real touch sequences exercise.
 */
import puppeteer from "puppeteer-core"

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const BASE = process.argv[2] ?? "http://localhost:5180"

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--lang=ar"],
})
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/** A real swipe: down → several moves → up, fast enough to look like a fling. */
async function swipeUp(x = 195, from = 600, to = 200, steps = 8) {
  await page.touchscreen.touchStart(x, from)
  const dy = (to - from) / steps
  for (let i = 1; i <= steps; i++) {
    await page.touchscreen.touchMove(x, from + dy * i)
    await wait(16)
  }
  await page.touchscreen.touchEnd()
  await wait(450) // let momentum/settle finish
}

async function scrollState() {
  return page.evaluate(() => {
    // Find every scrollable-looking container and report its position.
    const els = [...document.querySelectorAll("*")].filter((el) => {
      const cs = getComputedStyle(el)
      return (
        (cs.overflowY === "auto" || cs.overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight + 4
      )
    })
    return {
      docScroll: Math.round(document.scrollingElement?.scrollTop ?? 0),
      containers: els.slice(0, 4).map((el) => ({
        cls: el.className.toString().slice(0, 48),
        scrollTop: Math.round(el.scrollTop),
        max: el.scrollHeight - el.clientHeight,
        touchAction: getComputedStyle(el).touchAction,
      })),
    }
  })
}

for (const path of ["/", "/packages", "/hotels", "/settings"]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle2" })
  await wait(400)
  const before = await scrollState()
  await swipeUp()
  await swipeUp()
  const after = await scrollState()
  const moved =
    after.docScroll !== before.docScroll ||
    after.containers.some((c, i) => c.scrollTop !== (before.containers[i]?.scrollTop ?? 0))
  console.log(`${path.padEnd(12)} scrolled=${moved}`)
  for (const c of after.containers) {
    console.log(`   [${c.scrollTop}/${c.max}] touch-action=${c.touchAction}  .${c.cls}`)
  }
  if (after.containers.length === 0) console.log("   (no scrollable container found!)")
}

await browser.close()
