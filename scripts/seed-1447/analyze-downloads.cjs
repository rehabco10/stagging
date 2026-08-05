/**
 * Reasoning pass over the validation findings using the FRESH season snapshots
 * (Downloads, 2026-08-05): near-complete bookings and real assigned stays.
 * Answers, per finding class: does it materialize in reality, or is it
 * plan-level only?
 */
const path = require("path")
const fs = require("fs")
const PROJECT = path.resolve(__dirname, "../../../../hajj-1447/light-housing-system")
const XLSX = require(require.resolve("xlsx", { paths: [PROJECT] }))

const DL = "C:/Users/x7md/Downloads"
const read = (file) => {
  const wb = XLSX.readFile(path.join(DL, file))
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null })
}
const excelDate = (v) => {
  if (typeof v === "number") {
    const d = new Date(Date.UTC(1899, 11, 30))
    d.setUTCDate(d.getUTCDate() + Math.round(v))
    return d.toISOString().slice(0, 10)
  }
  const s = String(v ?? "").slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s : null
}
const DAY = 86_400_000
const ms = (d) => Date.parse(`${d}T00:00:00Z`)
const clean = (v) => {
  const s = v == null ? "" : String(v).trim()
  return s === "NULL" || s === "null" ? "" : s
}

// raw (pre-rebase) contracts from the extract stage
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "seed-1447.json"), "utf8"))
const HOTEL_FRAG = [
  ["ميسان رحاب المسك", "h_maysan"], ["ديار الايمان", "h_deyar"], ["درة الإيمان", "h_durrat"],
  ["أثراء العزيزية", "h_aziziyah"], ["اثراء العزيزية", "h_aziziyah"], ["زمزم بولمان", "h_pullman"],
  ["دار الايمان الحرم", "h_haram"], ["المدينة هيلتون", "h_hilton"], ["جبل عمر حياة ريجنسي", "h_hyatt"],
  ["سويس اوتيل", "h_swiss"], ["إيلاف التقوى", "h_taqwa"], ["ايلاف التقوى", "h_taqwa"], ["معاد العالمية", "h_voco"],
]
const hotelOf = (name) => HOTEL_FRAG.find(([f]) => name.includes(f))?.[1] ?? null

/* ── real nightly occupancy per hotel, from assigned stays ── */
const journey = read("رحلة الحاج لشركة اثراء الخير لخدمات الحجاج.xlsx")
console.log(`journey rows: ${journey.length}`)

const occupancy = new Map() // hotelId -> night -> pilgrims
const unmappedHouses = new Map()
let jeddahStays = 0
const addStay = (hotelName, start, end) => {
  const h = hotelOf(hotelName)
  if (!h) {
    if (hotelName) unmappedHouses.set(hotelName, (unmappedHouses.get(hotelName) ?? 0) + 1)
    return
  }
  const s = excelDate(start)
  const e = excelDate(end)
  if (!s || !e) return
  const m = occupancy.get(h) ?? new Map()
  for (let night = ms(s); night < ms(e); night += DAY) m.set(night, (m.get(night) ?? 0) + 1)
  occupancy.set(h, m)
}
for (const r of journey) {
  if (clean(r.JeddahAr)) jeddahStays++
  const firstCity = clean(r.FirstHouse)
  const lastCity = clean(r.LastHouse)
  const houseName = (city) => {
    if (/makkah shifting/i.test(city)) return clean(r.MakkahShiftingAr)
    if (/makkah/i.test(city)) return clean(r.MakkahAr)
    if (/madina/i.test(city)) return clean(r.MadinahAr)
    return ""
  }
  addStay(houseName(firstCity), r.FirstHouseStartDate, r.FirstHouseEndDate)
  addStay(houseName(lastCity), r.LastHouseStartDate, r.LastHouseEndDate)
  // shifting middle stay, 1447-ETL style: the gap between first end and last start
  const shifting = clean(r.MakkahShiftingAr)
  if (shifting && !/shifting/i.test(firstCity) && !/shifting/i.test(lastCity)) {
    const gapS = excelDate(r.FirstHouseEndDate)
    const gapE = excelDate(r.LastHouseStartDate)
    if (gapS && gapE && ms(gapE) > ms(gapS)) addStay(shifting, r.FirstHouseEndDate, r.LastHouseStartDate)
  }
}

console.log("\n== REAL peak nightly occupancy vs contracted beds (raw dates) ==")
const contractsByHotel = new Map()
for (const c of raw.contracts) {
  const h = hotelOf(c.provider)
  const list = contractsByHotel.get(h) ?? []
  list.push(c)
  contractsByHotel.set(h, list)
}
const bedsOf = (c) => Object.entries(c.lines).reduce((t, [rt, beds]) => t + Math.floor(beds / rt) * rt, 0)
for (const [h, nights] of [...occupancy.entries()].sort()) {
  const cs = contractsByHotel.get(h) ?? []
  let worst = { short: -Infinity, night: null, occ: 0, beds: 0 }
  let peak = 0
  for (const [night, occ] of nights) {
    peak = Math.max(peak, occ)
    const beds = cs
      .filter((c) => night >= ms(c.starts_on) && night < ms(c.ends_on))
      .reduce((t, c) => t + bedsOf(c), 0)
    const short = occ - beds
    if (short > worst.short) worst = { short, night, occ, beds }
  }
  console.log(
    `  ${h}: peak occ ${peak}; worst night ${excelDateInv(worst.night)} occ ${worst.occ} vs beds ${worst.beds} → ${worst.short > 0 ? "REAL SHORT " + worst.short : "fits (margin " + -worst.short + ")"}`,
  )
}
function excelDateInv(t) {
  return t ? new Date(t).toISOString().slice(0, 10) : "-"
}
if (unmappedHouses.size)
  console.log("  unmapped house names:", [...unmappedHouses.entries()].slice(0, 6))
console.log(`  stays with a JEDDAH house: ${jeddahStays}`)

/* ── bookings: fill rate and real room-type demand ── */
const demand = read("شركة اثراء الخير لخدمات الحجاج(تسكين).xlsx")
console.log(`\nتسكين rows: ${demand.length}`)
const byPkg = new Map() // nusuk -> city -> rt -> applicants
for (const r of demand) {
  const pkg = clean(r.PackageId)
  const city = clean(r.HotelType)
  const rt = clean(r.RoomType)
  const ppl = Number(r.NumberOfApplicants) || 0
  if (!pkg || !rt) continue
  const m = byPkg.get(pkg) ?? {}
  ;((m[city] ??= {})[rt] ??= 0), (m[city][rt] += ppl)
  byPkg.set(pkg, m)
}
// per-package booked totals (Makkah as canonical city)
const pkgCsv = fs
  .readFileSync(path.resolve(__dirname, "../../ocr/packages.csv"), "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((l) => l.split(","))
let bookedTotal = 0
let over = []
for (const f of pkgCsv) {
  const [no, nusuk, , , cap] = f
  const m = byPkg.get(nusuk)
  const city = m?.Makkah ?? m?.Madinah ?? {}
  const total = Object.values(city).reduce((t, v) => t + v, 0)
  bookedTotal += total
  if (total > Number(cap)) over.push(`${no}: ${total}/${cap}`)
}
console.log(`Σ booked (Makkah rows) = ${bookedTotal} / 7000 quota`)
console.log(`packages booked OVER capacity: ${over.length}${over.length ? " → " + over.join(", ") : ""}`)

/* real room-type shortfalls: booked type demand at each package's hotels vs type beds */
console.log("\n== REAL room-type demand vs contract type beds (nightly, by city) ==")
const final = JSON.parse(fs.readFileSync(path.join(__dirname, "seed-final.json"), "utf8"))
const SHIFT = 373
const unbase = (d) => new Date(ms(d) - SHIFT * DAY).toISOString().slice(0, 10)
// nightly booked type demand per hotel: package legs (raw dates) × booked city mix
const typeNight = new Map() // `${hotelId}|${rt}` -> night -> ppl
for (const p of final.packages) {
  const nusuk = pkgCsv.find((f) => f[0] === p.package_no)?.[1]
  const m = byPkg.get(nusuk)
  if (!m) continue
  for (const leg of p.legs) {
    // which city is this leg? by hotel
    const madinah = ["h_haram", "h_hilton", "h_taqwa", "h_maysan", "h_durrat", "h_deyar"]
    const isShift = leg.hotelId === "h_aziziyah" && leg.role === "transitional"
    const cityKey = madinah.includes(leg.hotelId)
      ? "Madinah"
      : isShift
        ? "Makkah-Shifting"
        : "Makkah"
    const mix = m[cityKey] ?? {}
    for (const [rt, ppl] of Object.entries(mix)) {
      const s = ms(unbase(leg.starts_on))
      const e = ms(unbase(leg.ends_on))
      const key = `${leg.hotelId}|${rt}`
      const nm = typeNight.get(key) ?? new Map()
      for (let night = s; night < e; night += DAY) nm.set(night, (nm.get(night) ?? 0) + ppl)
      typeNight.set(key, nm)
    }
  }
}
const shortByKey = []
for (const [key, nights] of typeNight) {
  const [h, rt] = key.split("|")
  if (h === "h_aziziyah") continue // shifting building exempt, as in the validator
  const cs = contractsByHotel.get(h) ?? []
  let worst = 0
  let worstNight = null
  for (const [night, ppl] of nights) {
    const beds = cs
      .filter((c) => night >= ms(c.starts_on) && night < ms(c.ends_on))
      .reduce((t, c) => t + Math.floor((c.lines[rt] ?? 0) / rt) * rt, 0)
    if (ppl - beds > worst) {
      worst = ppl - beds
      worstNight = night
    }
  }
  if (worst > 0) shortByKey.push(`${h} rt=${rt}: short ${worst} (${excelDateInv(worstNight)})`)
}
console.log(shortByKey.length ? shortByKey.join("\n") : "  none — real bookings fit every room type")

/* ── flights: fresh seat counts ── */
console.log("\n== flights (fresh journey) ==")
const flights = new Map()
for (const r of journey) {
  for (const [dir, p] of [["arrival", "Arrival"], ["return", "Return"]]) {
    const no = clean(r[`${p}FlightNumber`])
    const date = excelDate(r[dir === "arrival" ? "ArrivalArriveDate" : "ReturnDepartureDate"])
    if (!no || !date) continue
    const key = `${dir}|${no}|${date}|${clean(r[`${p}FlightType`])}`
    flights.set(key, (flights.get(key) ?? 0) + 1)
  }
}
const dirTotal = { arrival: 0, return: 0 }
for (const [key, n] of flights) dirTotal[key.split("|")[0]] += n
console.log(`distinct flights: ${flights.size}; arrival pilgrims ${dirTotal.arrival}, return ${dirTotal.return} (quota 7000)`)
