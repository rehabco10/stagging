/** Probe: can «اسم العقد» (PNR ➡️ Seats N) join to journey flights via passport? */
const path = require("path")
const PROJECT = path.resolve(__dirname, "../../../../hajj-1447/light-housing-system")
const XLSX = require(require.resolve("xlsx", { paths: [PROJECT] }))
const BASE = path.join(PROJECT, "new-data-sample")

const bwb = XLSX.readFile(path.join(BASE, "booking-details_1447h_v2.xlsx"))
const brows = XLSX.utils.sheet_to_json(bwb.Sheets[bwb.SheetNames[0]], { defval: null })
console.log("booking-details rows:", brows.length, "cols:", Object.keys(brows[0] ?? {}).slice(0, 8))

const contracts = new Map()
let withContract = 0
const passportToContract = new Map()
for (const r of brows) {
  const name = String(r["اسم العقد"] ?? "").trim()
  const passport = String(r["رقم جواز السفر"] ?? "").trim()
  if (!name || name === "NULL") continue
  withContract++
  contracts.set(name, (contracts.get(name) ?? 0) + 1)
  if (passport) passportToContract.set(passport, name)
}
console.log(`rows with contract name: ${withContract}, distinct contracts: ${contracts.size}`)

const parse = (s) => {
  const pnr = /➡️\s*([A-Z0-9]{5,8})\s*➡️/.exec(s)?.[1] ?? null
  const seats = /Seats\s*(\d+)/i.exec(s)?.[1] ?? null
  return { pnr, seats: seats ? Number(seats) : null }
}
let parseable = 0
for (const [name] of contracts) {
  const { pnr, seats } = parse(name)
  if (pnr && seats) parseable++
}
console.log(`parseable (pnr+seats): ${parseable}/${contracts.size}`)
for (const [name, count] of [...contracts.entries()].slice(0, 6)) {
  console.log(` sample [${count} pilgrims]:`, name.slice(0, 90), "→", JSON.stringify(parse(name)))
}

// join rate with journey passports
const jwb = XLSX.readFile(path.join(BASE, "pilgrims_journey_1447h_v2.xlsx"))
const jrows = XLSX.utils.sheet_to_json(jwb.Sheets[jwb.SheetNames[0]], { defval: null })
let joined = 0
let total = 0
for (const r of jrows) {
  const p = String(r.Passport ?? "").trim()
  if (!p) continue
  total++
  if (passportToContract.has(p)) joined++
}
console.log(`journey rows: ${jrows.length}, with passport: ${total}, joined to a contract: ${joined}`)
