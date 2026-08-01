/** Do short pages merely fit (no overflow) rather than fail to scroll? */
import puppeteer from "puppeteer-core"

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const BASE = process.argv[2] ?? "http://localhost:5180"

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--lang=ar"] })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })

for (const path of ["/packages", "/settings"]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle2" })
  await new Promise((r) => setTimeout(r, 400))
  const g = await page.evaluate(() => {
    const el = [...document.querySelectorAll("div")].find((d) =>
      String(d.className).includes("overflow-y-auto"),
    )
    return el
      ? { client: el.clientHeight, scroll: el.scrollHeight, overflows: el.scrollHeight > el.clientHeight }
      : null
  })
  console.log(`${path.padEnd(12)} scroller client=${g?.client} content=${g?.scroll} overflows=${g?.overflows}`)
}
await browser.close()
