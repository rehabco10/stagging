import puppeteer from "puppeteer-core"
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--lang=ar"] })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await page.goto("http://localhost:5180/canvas", { waitUntil: "networkidle2" })
await page.waitForSelector('[data-id="root"]')
const [btn] = await page.$$('xpath/.//button[contains(., "باقة جديدة")]')
await btn.click(); await new Promise(r=>setTimeout(r,450))
await page.keyboard.press("Escape"); await new Promise(r=>setTimeout(r,300))

await page.evaluate(() => {
  window.__log = []
  const t0 = performance.now()
  const tag = (w, ev) => (e) => window.__log.push(`${Math.round(performance.now()-t0)}ms ${w}:${ev}${e.defaultPrevented?" (defaultPrevented)":""}`)
  // The long-press wrapper is the dir=ltr div around ReactFlow.
  const wrapper = document.querySelector(".react-flow")?.parentElement
  const rootEl = document.getElementById("root")
  for (const ev of ["pointerdown","pointermove","pointerup","pointercancel","click"]) {
    document.addEventListener(ev, tag("doc-capture", ev), { capture: true })
    wrapper?.addEventListener(ev, tag("wrapper-bubble", ev))
    rootEl?.addEventListener(ev, tag("root-bubble", ev))
  }
})

const node = await page.$('.react-flow__node[data-id^="pkg_"]')
const box = await node.boundingBox()
await page.touchscreen.touchStart(box.x + box.width/2, box.y + box.height/2)
await new Promise(r=>setTimeout(r,650))
await page.touchscreen.touchEnd()
await new Promise(r=>setTimeout(r,400))
console.log((await page.evaluate(() => window.__log)).join("\n"))
await browser.close()
