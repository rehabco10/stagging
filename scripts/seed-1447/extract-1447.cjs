/**
 * Extracts demo-seed inventory from the real 1447 data:
 *  - housing contracts (grouped by ContractId, room-type lines deduped)
 *  - flight blocks (distinct arrival/return flights with pilgrim counts)
 * Run from the light-housing-system directory so require("xlsx") resolves.
 */
const fs = require("fs")
const path = require("path")

// The sibling 1447 repo carries the raw data and the xlsx dependency.
const PROJECT = path.resolve(__dirname, "../../../../hajj-1447/light-housing-system")
const XLSX = require(require.resolve("xlsx", { paths: [PROJECT] }))
const BASE = path.join(PROJECT, "new-data-sample")
const OUT = process.argv[2] ?? path.join(__dirname, "seed-1447.json")

const excelDate = (v) => {
  if (typeof v === "number") {
    const d = new Date(Date.UTC(1899, 11, 30) + 0)
    d.setUTCDate(d.getUTCDate() + Math.round(v))
    return d.toISOString().slice(0, 10)
  }
  const s = String(v).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s : null
}

/* ── supply ── */
const wb = XLSX.readFile(path.join(BASE, "housing_contract_1447h_v2.xlsx"))
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null })

const contracts = new Map()
const contractPackages = new Map() // contract_no -> Set(PackageId)
const pkgWindows = new Map() // PackageId -> contract_no -> {start, end}
for (const r of rows) {
  const id = String(r.ContractId ?? "").trim()
  if (!id) continue
  const pkgId = String(r.PackageId ?? "").trim()
  if (pkgId) {
    if (!contractPackages.has(id)) contractPackages.set(id, new Set())
    contractPackages.get(id).add(pkgId)
    const start = excelDate(r.PacakgeStartDate)
    const end = excelDate(r.PackageEndDate)
    if (start && end) {
      if (!pkgWindows.has(pkgId)) pkgWindows.set(pkgId, {})
      pkgWindows.get(pkgId)[id] = { start, end }
    }
  }
  let c = contracts.get(id)
  if (!c) {
    c = {
      contract_no: id,
      provider: String(r.HousingProvider ?? "").trim(),
      starts_on: excelDate(r.ContractStartDate),
      ends_on: excelDate(r.ContractEndDate),
      excel_capacity: r.ContractCapacity,
      lineKeys: new Set(),
      lines: {},
    }
    contracts.set(id, c)
  }
  const roomType = String(r.RoomType ?? "").trim()
  const beds = Number(r.Capacity) || 0
  if (!["2", "3", "4"].includes(roomType) || beds <= 0) continue
  // Sum every row — exactly what the 1447 worker did when it recomputed
  // contract_capacity. Shared rooms may double-count, but deduping identical
  // rows under-counted genuinely distinct equal blocks and flagged the real
  // season as overbooked, which it wasn't.
  c.lines[roomType] = (c.lines[roomType] ?? 0) + beds
}

/* ── flights ── */
const jwb = XLSX.readFile(path.join(BASE, "pilgrims_journey_1447h_v2.xlsx"))
const jrows = XLSX.utils.sheet_to_json(jwb.Sheets[jwb.SheetNames[0]], { defval: null })

const flights = new Map()
const pkgFlights = new Map() // PackageId -> Map(flightKey -> pilgrims)
const clean = (v) => {
  const s = v == null ? "" : String(v).trim()
  return s === "NULL" ? "" : s
}
for (const r of jrows) {
  const pkgId = clean(r.PackageId)
  for (const [dir, p] of [
    ["arrival", "Arrival"],
    ["return", "Return"],
  ]) {
    const no = clean(r[`${p}FlightNumber`])
    const date = excelDate(r[dir === "arrival" ? "ArrivalArriveDate" : "ReturnDepartureDate"])
    if (!no || !date) continue
    const key = `${dir}|${no}|${date}`
    let f = flights.get(key)
    if (!f) {
      f = {
        key,
        direction: dir,
        flight_no: no,
        flies_on: date,
        airline_ar: clean(r[`${p}AirlineNameAr`]),
        airline_en: clean(r[`${p}AirlineNameEn`]),
        from_city: clean(r[`${p}DepartureCity`]),
        to_city: clean(r[`${p}ArriveCity`]),
        contract_type: clean(r[`${p}FlightType`]).toLowerCase(),
        seats: 0,
      }
      flights.set(key, f)
    }
    f.seats++
    if (pkgId) {
      if (!pkgFlights.has(pkgId)) pkgFlights.set(pkgId, new Map())
      const m = pkgFlights.get(pkgId)
      m.set(key, (m.get(key) ?? 0) + 1)
    }
  }
}

/* ── demand: room types per booking / per package ── */
const dwb = XLSX.readFile(path.join(BASE, "housing_unitTypeforHousing_1447h_v2.xlsx"))
const drows = XLSX.utils.sheet_to_json(dwb.Sheets[dwb.SheetNames[0]], { defval: null })

// Per booking: room-type set per hotel-type, to see if the mix varies by city.
const bookings = new Map()
for (const r of drows) {
  const id = String(r.BookingId ?? "").trim()
  if (!id) continue
  let b = bookings.get(id)
  if (!b) {
    b = { byCity: {} }
    bookings.set(id, b)
  }
  const city = String(r.HotelType ?? "").trim()
  const rt = String(r.RoomType ?? "").trim()
  ;(b.byCity[city] ??= new Set()).add(rt)
}
let sameAcrossCities = 0
let differsAcrossCities = 0
let multiTypeWithinCity = 0
for (const b of bookings.values()) {
  const sets = Object.values(b.byCity).map((s) => [...s].sort().join(","))
  if (sets.some((s) => s.includes(","))) multiTypeWithinCity++
  const main = sets.filter(Boolean)
  if (new Set(main).size > 1) differsAcrossCities++
  else sameAcrossCities++
}

// Per package: applicants by room type, per hotel-type (rows repeat per city,
// so summing across cities would double-count people).
const pkgMix = new Map()
for (const r of drows) {
  const pkg = String(r.PackageId ?? "").trim()
  const city = String(r.HotelType ?? "").trim()
  const rt = String(r.RoomType ?? "").trim()
  const ppl = Number(r.NumberOfApplicants) || 0
  if (!pkg || !rt) continue
  const m = pkgMix.get(pkg) ?? {}
  ;((m[city] ??= {})[rt] ??= 0), (m[city][rt] += ppl)
  pkgMix.set(pkg, m)
}

const out = {
  providers: [...new Set([...contracts.values()].map((c) => c.provider))],
  contracts: [...contracts.values()].map((c) => ({ ...c, lineKeys: undefined })),
  flights: [...flights.values()].sort((a, b) => b.seats - a.seats),
  contractPackages: Object.fromEntries(
    [...contractPackages.entries()].map(([k, v]) => [k, [...v]]),
  ),
  pkgWindows: Object.fromEntries(pkgWindows),
  pkgFlights: Object.fromEntries(
    [...pkgFlights.entries()].map(([k, v]) => [k, Object.fromEntries(v)]),
  ),
  pkgMix: Object.fromEntries(pkgMix),
  roomTypeAnalysis: {
    bookings: bookings.size,
    sameAcrossCities,
    differsAcrossCities,
    multiTypeWithinCity,
  },
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2))
console.log(
  `contracts=${out.contracts.length} providers=${out.providers.length} flights=${out.flights.length}`,
)
