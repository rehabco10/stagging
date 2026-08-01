import puppeteer from "puppeteer-core"
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const BASE = process.argv[2] ?? "http://localhost:4173"
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--lang=ar"] })
const page = await browser.newPage()
const errs = [], failed = []
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
page.on("pageerror", (e) => errs.push(e.message))
page.on("requestfailed", (r) => failed.push(`${r.failure()?.errorText} ${r.url()}`))
page.on("request", (r) => { if (!r.url().startsWith(BASE)) failed.push(`EXTERNAL: ${r.url()}`) })

// Cold direct loads — the case a naive static server 404s on.
for (const path of ["/", "/packages", "/canvas", "/validation", "/nope-fallback"]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle2" })
  const h1 = await page.evaluate(() => {
    const t = document.querySelector("h1")?.textContent?.trim()
    if (t) return t
    return document.querySelector(".react-flow") ? "canvas (no h1)" : null
  })
  console.log(`${path.padEnd(16)} -> ${h1 ?? "NO RENDER"}`)
}
console.log(`console errors: ${errs.length}`)
console.log(`failed/external requests: ${failed.length}`)
for (const f of failed.slice(0, 5)) console.log(`  ${f}`)
await browser.close()
