/**
 * Recheck the generated seed against the RAW 1447 xlsx files:
 *  - housing_contract_1447h_v2.xlsx  (supply: contracts, windows, room rows, per-package links+dates)
 *  - housing_unitTypeforHousing_1447h_v2.xlsx (demand: bookings per package/city/room type)
 * Reports discrepancies; exits nonzero on hard mismatches.
 */
const fs = require("fs")
const path = require("path")
const PROJECT = path.resolve(__dirname, "../../../../hajj-1447/light-housing-system")
const XLSX = require(require.resolve("xlsx", { paths: [PROJECT] }))
const BASE = path.join(PROJECT, "new-data-sample")

const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed-final.json"), "utf8"))

const excelDate = (v) => {
  if (typeof v === "number") {
    const d = new Date(Date.UTC(1899, 11, 30))
    d.setUTCDate(d.getUTCDate() + Math.round(v))
    return d.toISOString().slice(0, 10)
  }
  const s = String(v).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s : null
}
const DAY = 86_400_000
const SHIFT = 373
const rebase = (d) => new Date(Date.parse(`${d}T00:00:00Z`) + SHIFT * DAY).toISOString().slice(0, 10)

let problems = 0
const bad = (msg) => {
  problems++
  console.log("MISMATCH:", msg)
}
const note = (msg) => console.log("note:", msg)

/* ── supply raw ── */
const wb = XLSX.readFile(path.join(BASE, "housing_contract_1447h_v2.xlsx"))
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null })

const raw = new Map() // contract_no -> aggregate
for (const r of rows) {
  const no = String(r.ContractId ?? "").trim()
  if (!no) continue
  let c = raw.get(no)
  if (!c) {
    c = {
      provider: String(r.HousingProvider ?? "").trim(),
      starts_on: excelDate(r.ContractStartDate),
      ends_on: excelDate(r.ContractEndDate),
      excelCap: Number(r.ContractCapacity) || 0,
      lines: {},
      pkgs: new Map(), // nusuk_id -> {start, end, cap}
    }
    raw.set(no, c)
  }
  const rt = String(r.RoomType ?? "").trim()
  if (["2", "3", "4"].includes(rt)) c.lines[rt] = (c.lines[rt] ?? 0) + (Number(r.Capacity) || 0)
  const pid = String(r.PackageId ?? "").trim()
  if (pid && !c.pkgs.has(pid)) {
    c.pkgs.set(pid, {
      start: excelDate(r.PacakgeStartDate),
      end: excelDate(r.PackageEndDate),
      cap: Number(r.PackageCapacity) || 0,
    })
  }
}

/* 1. contract inventory vs seed */
console.log(`\n== 1. contracts: raw=${raw.size} seed=${seed.contracts.length} ==`)
if (raw.size !== seed.contracts.length) bad(`contract count raw ${raw.size} != seed ${seed.contracts.length}`)
for (const sc of seed.contracts) {
  const rc = raw.get(sc.contract_no)
  if (!rc) {
    bad(`seed contract ${sc.contract_no} not in raw`)
    continue
  }
  if (rebase(rc.starts_on) !== sc.starts_on || rebase(rc.ends_on) !== sc.ends_on) {
    bad(`${sc.contract_no} window: raw+373d=${rebase(rc.starts_on)}..${rebase(rc.ends_on)} seed=${sc.starts_on}..${sc.ends_on}`)
  }
  for (const rt of ["2", "3", "4"]) {
    const rawBeds = rc.lines[rt] ?? 0
    const line = sc.lines.find((l) => l.room_type === rt)
    const seedBeds = line ? line.rooms * Number(rt) : 0
    // floor(beds/rt)*rt loses at most rt-1 beds
    if (Math.abs(rawBeds - seedBeds) >= Number(rt)) {
      bad(`${sc.contract_no} rt=${rt}: raw beds ${rawBeds} vs seed ${seedBeds}`)
    }
  }
}

/* 2. contract→package links vs seed bindings */
console.log(`\n== 2. contract→package links ==`)
const seedPkgByNo = new Map(seed.packages.map((p) => [p.package_no, p]))
const nusukToNo = new Map()
// packages.csv is the nusuk_id authority
const pkgCsv = fs
  .readFileSync(path.resolve(__dirname, "../../ocr/packages.csv"), "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((l) => l.split(","))
for (const f of pkgCsv) nusukToNo.set(f[1], f[0])
const seedContractByNo = new Map(seed.contracts.map((c) => [c.contract_no, c]))

let linkChecked = 0
let linkMissing = 0
for (const [no, rc] of raw) {
  const sc = seedContractByNo.get(no)
  for (const [nusukId] of rc.pkgs) {
    const pkgNo = nusukToNo.get(nusukId)
    if (!pkgNo) {
      note(`raw links contract ${no} to unknown nusuk package ${nusukId}`)
      continue
    }
    linkChecked++
    const sp = seedPkgByNo.get(pkgNo)
    if (!sp.contractIds.includes(sc.id)) {
      linkMissing++
      bad(`pkg ${pkgNo} (nusuk ${nusukId}) should bind contract ${no}`)
    }
  }
}
// reverse: seeded bindings not present in raw
for (const sp of seed.packages) {
  const nusukId = pkgCsv.find((f) => f[0] === sp.package_no)?.[1]
  for (const cid of sp.contractIds) {
    const sc = seed.contracts.find((c) => c.id === cid)
    const rc = raw.get(sc.contract_no)
    if (!rc.pkgs.has(nusukId)) bad(`pkg ${sp.package_no} bound to ${sc.contract_no} without a raw link`)
  }
}
console.log(`links checked=${linkChecked} missing-in-seed=${linkMissing}`)

/* 3. per-package capacity: supply's PackageCapacity vs ocr capacity */
console.log(`\n== 3. package capacities (supply vs ocr) ==`)
const capByNusuk = new Map()
for (const rc of raw.values())
  for (const [pid, info] of rc.pkgs) {
    if (!capByNusuk.has(pid)) capByNusuk.set(pid, info.cap)
    else if (capByNusuk.get(pid) !== info.cap)
      note(`nusuk ${pid} has differing PackageCapacity across contracts: ${capByNusuk.get(pid)} vs ${info.cap}`)
  }
for (const f of pkgCsv) {
  const [no, nusukId, , , cap] = f
  const rawCap = capByNusuk.get(nusukId)
  if (rawCap == null) {
    note(`pkg ${no} (nusuk ${nusukId}) absent from supply file`)
    continue
  }
  if (Number(cap) !== rawCap) note(`pkg ${no}: ocr capacity ${cap} vs supply PackageCapacity ${rawCap}`)
}

/* 4. package stay windows vs supply's per-package dates */
console.log(`\n== 4. stay windows: seeded legs vs raw per-package contract dates ==`)
let windowChecked = 0
let windowOff = 0
for (const [no, rc] of raw) {
  const sc = seedContractByNo.get(no)
  for (const [nusukId, info] of rc.pkgs) {
    const pkgNo = nusukToNo.get(nusukId)
    const sp = pkgNo && seedPkgByNo.get(pkgNo)
    if (!sp || !info.start || !info.end) continue
    const legs = sp.legs.filter((l) => l.hotelId === sc.hotelId)
    if (!legs.length) continue
    windowChecked++
    const stayStart = legs.map((l) => l.starts_on).sort()[0]
    const stayEnd = legs.map((l) => l.ends_on).sort().slice(-1)[0]
    const winStart = rebase(info.start)
    const winEnd = rebase(info.end)
    if (stayStart < winStart || stayEnd > winEnd) {
      windowOff++
      if (windowOff <= 12)
        console.log(
          `  off: pkg ${pkgNo} @ ${sc.hotelId} stay ${stayStart}..${stayEnd} vs raw pkg-window ${winStart}..${winEnd} (contract ${no})`,
        )
    }
  }
}
console.log(`stay-vs-package-window checked=${windowChecked} outside=${windowOff}`)

/* 4b. chain spans vs the FINAL PocketBase package windows (pb-dump.py) */
const PB_JSON = path.join(__dirname, "pb-1447.json")
if (fs.existsSync(PB_JSON)) {
  const pb = JSON.parse(fs.readFileSync(PB_JSON, "utf8"))
  console.log(`\n== 4b. chain spans vs PB package windows ==`)
  let off = 0
  for (const sp of seed.packages) {
    const nusukId = pkgCsv.find((f) => f[0] === sp.package_no)?.[1]
    const w = pb.packages.find((x) => x.nusuk_id === nusukId)
    if (!w || !w.start || !w.end || !sp.legs.length) continue
    const s = sp.legs.map((l) => l.starts_on).sort()[0]
    const e = sp.legs.map((l) => l.ends_on).sort().slice(-1)[0]
    const ws = rebase(w.start)
    const we = rebase(w.end)
    if (s < ws || e > we) {
      off++
      if (off <= 8) console.log(`  off: pkg ${sp.package_no} chain ${s}..${e} vs PB ${ws}..${we}`)
    }
  }
  console.log(`chains outside the PB window: ${off}`)
}

/* 5. Voco / معاد العالمية verification via links */
console.log(`\n== 5. معاد العالمية → Voco check ==`)
for (const [no, rc] of raw) {
  if (!rc.provider.includes("معاد")) continue
  const linked = [...rc.pkgs.keys()].map((id) => nusukToNo.get(id) ?? id)
  console.log(`  contract ${no} (${rc.provider}) links packages: ${linked.join(", ")}`)
}

/* 6. demand: booked mix vs seeded room_mix proportions */
console.log(`\n== 6. room mixes vs booking file ==`)
// Same source the generator used: the v4 end-of-season snapshot if archived.
const v4Demand = path.join(BASE, "v4-2026-08-05", "شركة اثراء الخير لخدمات الحجاج(تسكين).xlsx")
const dwb = XLSX.readFile(
  fs.existsSync(v4Demand) ? v4Demand : path.join(BASE, "housing_unitTypeforHousing_1447h_v2.xlsx"),
)
const drows = XLSX.utils.sheet_to_json(dwb.Sheets[dwb.SheetNames[0]], { defval: null })
const booked = new Map() // nusuk -> {city: {rt: ppl}}
for (const r of drows) {
  const pid = String(r.PackageId ?? "").trim()
  const city = String(r.HotelType ?? "").trim()
  const rt = String(r.RoomType ?? "").trim()
  const ppl = Number(r.NumberOfApplicants) || 0
  if (!pid || !rt) continue
  const m = booked.get(pid) ?? {}
  ;((m[city] ??= {})[rt] ??= 0), (m[city][rt] += ppl)
  booked.set(pid, m)
}
let mixChecked = 0
let mixOff = 0
for (const f of pkgCsv) {
  const [no, nusukId, , , cap] = f
  const sp = seedPkgByNo.get(no)
  const src = booked.get(nusukId)
  const b = src?.Makkah ?? src?.Madinah
  if (!b) continue
  mixChecked++
  const total = Object.values(b).reduce((t, v) => t + v, 0)
  for (const rt of ["2", "3", "4"]) {
    const expect = Math.round(((b[rt] ?? 0) / total) * Number(cap))
    const got = sp.room_mix[rt]
    if (Math.abs(expect - got) > 1) {
      mixOff++
      console.log(`  pkg ${no} rt=${rt}: booked-share ~${expect} vs seed ${got}`)
    }
  }
  // booked people should not exceed capacity
  if (total > Number(cap)) note(`pkg ${no}: booked ${total} exceeds capacity ${cap}`)
}
console.log(`mixes checked=${mixChecked} off-by>1=${mixOff}`)

/* 7. booked totals per city sanity */
console.log(`\n== 7. booked totals ==`)
let bookedTotal = 0
for (const [, m] of booked) {
  const makkah = Object.values(m.Makkah ?? {}).reduce((t, v) => t + v, 0)
  bookedTotal += makkah
}
console.log(`Σ booked (Makkah rows) = ${bookedTotal} of 7000 quota`)

console.log(`\n== RESULT: ${problems} hard mismatches ==`)
process.exit(problems ? 1 : 0)
