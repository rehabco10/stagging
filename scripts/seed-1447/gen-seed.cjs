/**
 * Turns seed-1447.json (light-housing-system extracts) + the wizard's ocr CSVs
 * into src/store/seed-1447.ts: contracts, flight blocks, and the 39 packages
 * with legs, room mixes, and contract/flight bindings.
 */
const fs = require("fs")
const path = require("path")

const IN = path.join(__dirname, "seed-1447.json")
const OCR = path.resolve(__dirname, "../../ocr")
const OUT = path.resolve(__dirname, "../../src/store/seed-1447.ts")
const data = JSON.parse(fs.readFileSync(IN, "utf8"))

// The 1447 system's FINAL PocketBase data (pb-dump.py) — post-ingestion and
// post-linkFixer, so its dates outrank the raw xlsx: contract_packages is the
// dated contract↔package junction, and the package trip windows define the
// season envelope.
const PB_JSON = path.join(__dirname, "pb-1447.json")
const pb = fs.existsSync(PB_JSON) ? JSON.parse(fs.readFileSync(PB_JSON, "utf8")) : null
if (pb) {
  for (const cp of pb.contract_packages) {
    if (!cp.start || !cp.end) continue
    ;(data.pkgWindows[cp.nusuk_id] ??= {})[cp.contract_no] = { start: cp.start, end: cp.end }
  }
}

/* ── hotel name maps (both sides verified 1:1 against SEED_HOTELS) ── */
const EN_HOTEL = {
  "Al Aziziyah": "h_aziziyah", "Al Haram": "h_haram", "Al Taqawa": "h_taqwa",
  Deyar: "h_deyar", Durrat: "h_durrat", Hilton: "h_hilton",
  "Hyatt Regency": "h_hyatt", "Pullman Makkah": "h_pullman", Rehab: "h_maysan",
  "Swiss Makkah": "h_swiss", Voco: "h_voco",
}
const AR_HOTEL = {
  "إثراء العزيزية": "h_aziziyah", "ايلاف التقوى": "h_taqwa", "بولمان زمزم مكة": "h_pullman",
  "حياة ريجنسي": "h_hyatt", "دار الايمان الحرم": "h_haram", "درة الإيمان": "h_durrat",
  "ديار الايمان": "h_deyar", "سويس أوتيل مكة": "h_swiss", "فوكو": "h_voco",
  "ميسان رحاب المسك": "h_maysan", "هيلتون المدينة": "h_hilton",
}
const PROVIDER_HOTEL = [
  ["ميسان رحاب المسك", "h_maysan"], ["ديار الايمان", "h_deyar"], ["درة الإيمان", "h_durrat"],
  ["أثراء العزيزية", "h_aziziyah"], ["زمزم بولمان", "h_pullman"], ["دار الايمان الحرم", "h_haram"],
  ["المدينة هيلتون", "h_hilton"], ["جبل عمر حياة ريجنسي", "h_hyatt"], ["سويس اوتيل", "h_swiss"],
  ["إيلاف التقوى", "h_taqwa"], ["معاد العالمية", "h_voco"],
]
const CITY = {
  h_swiss: "makkah", h_pullman: "makkah", h_hyatt: "makkah", h_voco: "makkah",
  h_aziziyah: "shifting",
  h_haram: "madinah", h_hilton: "madinah", h_taqwa: "madinah",
  h_maysan: "madinah", h_durrat: "madinah", h_deyar: "madinah",
}
const providerHotel = (provider) => {
  const hit = PROVIDER_HOTEL.find(([frag]) => provider.includes(frag))
  if (!hit) throw new Error(`unmapped provider: ${provider}`)
  return hit[1]
}
const must = (map, name, where) => {
  if (!(name in map)) throw new Error(`unmapped hotel "${name}" in ${where}`)
  return map[name]
}

/* ── date rebasing: same anchor rule for contracts, flights AND legs ── */
const DAY = 86_400_000
const ms = (d) => Date.parse(`${d}T00:00:00Z`)
const isoOf = (t) => new Date(t).toISOString().slice(0, 10)
const anchor = Math.min(...data.contracts.map((c) => ms(c.starts_on)))
const shiftDays = Math.round((ms("2027-05-12") - anchor) / DAY)
const rebase = (d) => isoOf(ms(d) + shiftDays * DAY)

/* ── contracts ── */
const contracts = data.contracts.map((c, i) => {
  const hotelId = providerHotel(c.provider)
  return {
    id: `hc_1447_${i}`,
    hotelId,
    contract_no: c.contract_no,
    city: CITY[hotelId],
    starts_on: rebase(c.starts_on),
    ends_on: rebase(c.ends_on),
    status: "signed",
    lines: Object.entries(c.lines)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([rt, beds], li) => ({
        id: `crl_1447_${i}_${li}`,
        room_type: rt,
        rooms: Math.floor(beds / Number(rt)),
        rate_sar: null,
      })),
  }
})
const contractIdByNo = new Map(contracts.map((c) => [c.contract_no, c.id]))

/* ── flight blocks: every group flight is a block; GDS aggregates ──
 * The raw «نوع عقد الطيران» says B2B/B2C; the model calls them group/gds.
 * Group (B2B) is block-purchase by definition, so all 121 go in whole. The
 * 496 GDS (B2C) flights are individual retail bookings — one synthetic block
 * per direction keeps their seats in the coverage math without 496 noise
 * rows. The true purchased counts («اسم العقد»'s `Seats N`) are NOT
 * recoverable: only 65 of 911 contract strings parse and the passport join to
 * the journey file is empty (see probe-flight-contracts.cjs) — flown pilgrims
 * stay the proxy.
 */
const blockIdByKey = new Map()
const flightBlocks = []
data.flights
  .filter((f) => f.contract_type === "b2b")
  .forEach((f, i) => {
    const id = `fb_1447_${i}`
    blockIdByKey.set(f.key, id)
    flightBlocks.push({
      id,
      direction: f.direction,
      airline_ar: f.airline_ar || f.airline_en || "",
      airline_en: f.airline_en || "",
      flight_no: f.flight_no,
      flies_on: rebase(f.flies_on),
      from_city: f.from_city,
      to_city: f.to_city,
      contract_type: "group",
      pnr: "",
      seats: f.seats,
      status: "confirmed",
    })
  })
// GDS seats aggregate per (direction, carrier) — not one anonymous lump:
// every seat keeps its real carrier attribution, and the carrier pages fold
// each aggregate into its airline's own card.
for (const direction of ["arrival", "return"]) {
  const list = data.flights.filter((f) => f.contract_type !== "b2b" && f.direction === direction)
  const byCarrier = new Map()
  for (const f of list) {
    const key = f.airline_ar || f.airline_en || "غير محدد"
    if (!byCarrier.has(key)) byCarrier.set(key, [])
    byCarrier.get(key).push(f)
  }
  let i = 0
  for (const [carrier, group] of byCarrier) {
    const id = `fb_1447_gds_${direction}_${i++}`
    for (const f of group) blockIdByKey.set(f.key, id)
    flightBlocks.push({
      id,
      direction,
      airline_ar: group.find((f) => f.airline_ar)?.airline_ar ?? carrier,
      airline_en: `${group.find((f) => f.airline_en)?.airline_en ?? carrier} (GDS)`,
      flight_no: "",
      flies_on: rebase(group.map((f) => f.flies_on).sort()[0]),
      from_city: "متعدد",
      to_city: "متعدد",
      contract_type: "gds",
      pnr: "",
      seats: group.reduce((t, f) => t + f.seats, 0),
      status: "confirmed",
    })
  }
}

/* ── ocr CSVs ── */
const csv = (file) => {
  const [head, ...lines] = fs.readFileSync(path.join(OCR, file), "utf8").trim().split(/\r?\n/)
  const cols = head.split(",")
  return lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v.trim()])))
}
const pkgRows = csv("packages.csv")
const itinRows = csv("nusuk-submission-model.csv")

const CAT_AR = [
  ["رفاه", "luxury"],
  ["تمي", "premium"],
  ["ممي", "premium"],
  ["أساس", "standard"],
  ["اقتصاد", "standard"],
]
const tierOfAr = (s) => {
  const hit = CAT_AR.find(([frag]) => s.includes(frag))
  if (!hit) throw new Error(`unmapped category_ar: ${s}`)
  return hit[1]
}

// Rows → leg templates
const rows = itinRows.map((r) => {
  const legs = []
  if (r.res1_hotel) legs.push({ role: "first", hotelId: must(AR_HOTEL, r.res1_hotel, `row ${r.row}`), starts_on: r.res1_start, ends_on: r.res1_end })
  if (r.res2_hotel) legs.push({ role: "second", hotelId: must(AR_HOTEL, r.res2_hotel, `row ${r.row}`), starts_on: r.res2_start, ends_on: r.res2_end })
  if (r.trans_hotel) legs.push({ role: "transitional", hotelId: must(AR_HOTEL, r.trans_hotel, `row ${r.row}`), starts_on: r.trans_start, ends_on: r.trans_end })
  return {
    row: Number(r.row),
    tier: tierOfAr(r.category_ar),
    shifting: Boolean(r.trans_hotel),
    remaining: Number(r.pilgrims),
    hotelSet: [...new Set(legs.map((l) => l.hotelId))].sort().join("+"),
    legs,
  }
})

/* ── assign packages to rows: hotel set + capacity, then leftovers ── */
const setOfPkg = (p) => {
  let names = [p.hotel_1, p.hotel_2, p.hotel_3].filter(Boolean)
  // Package 32's Voco stay is REAL — the supply file links it to the Voco
  // contract (202610000004611) alongside 07–13 — but the 31 itinerary rows
  // have no Durrat+Voco chain to express it. It takes the Durrat+Aziziyah
  // chain (every group total reconciles that way) and keeps its Voco contract
  // binding, whose `link_idle` warning is the honest trace of the mismatch.
  if (p.package_no === "32") names = names.filter((h) => h !== "Voco")
  return [...new Set(names.map((h) => must(EN_HOTEL, h, `pkg ${p.package_no}`)))].sort().join("+")
}
const tierOfPkg = (p) => p.category.split(" ")[0].toLowerCase()
const isShifting = (p) => p.category.includes("Shifting")

const assignment = new Map() // package_no -> row
const withHotels = pkgRows.filter((p) => p.hotel_1)
const withoutHotels = pkgRows.filter((p) => !p.hotel_1)

// The supply file carries each package's own dates inside every contract
// (PacakgeStartDate/PackageEndDate). When several candidate rows share a
// hotel set — Durrat has three identical 352-bed rows with different date
// chains — those raw windows say which chain is whose. All dates here are
// raw (pre-rebase) on both sides.
const contractHotelByNo = new Map(data.contracts.map((c) => [c.contract_no, providerHotel(c.provider)]))
const overlapDays = (aS, aE, bS, bE) =>
  Math.max(0, (Math.min(ms(aE), ms(bE)) - Math.max(ms(aS), ms(bS))) / DAY)
function overlapScore(p, row) {
  // Covered nights minus uncovered nights. Plain overlap ties when the trip
  // window spans the whole chain — every candidate's long leg scores full —
  // but only the true chain has zero nights outside the window.
  const wins = data.pkgWindows[p.nusuk_id] ?? {}
  let score = 0
  for (const leg of row.legs) {
    const nights = (ms(leg.ends_on) - ms(leg.starts_on)) / DAY
    let best = null
    for (const [no, w] of Object.entries(wins)) {
      if (contractHotelByNo.get(no) !== leg.hotelId) continue
      const overlap = overlapDays(leg.starts_on, leg.ends_on, w.start, w.end)
      const s = overlap - (nights - overlap)
      if (best === null || s > best) best = s
    }
    score += best ?? 0
  }
  return score
}
const bestByOverlap = (p, pool) =>
  [...pool].sort((a, b) => overlapScore(p, b) - overlapScore(p, a))[0]

// Group both sides by hotel set alone — the Nusuk category says plain
// "Standard" even when the chain shifts through Aziziyah, so the category's
// Shifting suffix cannot gate the match. When a group pairs 1:1 with only
// tiny size differences (the source disagrees with itself by ±2 on 07/08),
// pair by rank. Otherwise rows are shared (row 1's 450 = packages 01+33) and
// greedy subtraction applies.
const groups = new Map()
for (const p of withHotels) {
  const key = setOfPkg(p)
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(p)
}
for (const [key, pkgs] of groups) {
  const groupRows = rows.filter((r) => r.hotelSet === key)
  if (!groupRows.length) throw new Error(`no rows for group ${key}`)
  const sortedPkgs = [...pkgs].sort((a, b) => Number(b.capacity) - Number(a.capacity))
  const sortedRows = [...groupRows].sort((a, b) => b.remaining - a.remaining)
  const rankable =
    sortedPkgs.length === sortedRows.length &&
    sortedPkgs.every((p, i) => Math.abs(Number(p.capacity) - sortedRows[i].remaining) <= 5)
  if (rankable) {
    const pool = new Set(sortedRows)
    for (const p of sortedPkgs) {
      const cap = Number(p.capacity)
      const near = [...pool].filter((r) => Math.abs(r.remaining - cap) <= 5)
      const row = bestByOverlap(p, near)
      if (!row) throw new Error(`rank-pair failed for pkg ${p.package_no}`)
      pool.delete(row)
      assignment.set(p.package_no, row)
      row.remaining = 0
    }
    continue
  }
  for (const p of sortedPkgs) {
    const cap = Number(p.capacity)
    const candidates = groupRows.filter((r) => r.remaining >= cap)
    const exact = candidates.filter((r) => r.remaining === cap)
    const row = bestByOverlap(p, exact.length ? exact : candidates)
    if (!row) throw new Error(`no row for pkg ${p.package_no} (${key}, cap ${cap})`)
    row.remaining -= cap
    assignment.set(p.package_no, row)
  }
}
for (const p of [...withoutHotels].sort((a, b) => Number(b.capacity) - Number(a.capacity))) {
  const cap = Number(p.capacity)
  // A "… Shifting" category demands a shifting row; plain categories accept
  // either (standard chains shift without saying so — see above).
  const candidates = rows.filter(
    (r) => r.tier === tierOfPkg(p) && (!isShifting(p) || r.shifting) && r.remaining >= cap,
  )
  const exact = candidates.filter((r) => r.remaining === cap)
  const row = bestByOverlap(p, exact.length ? exact : candidates)
  if (!row) throw new Error(`no leftover row for pkg ${p.package_no} (cap ${cap})`)
  row.remaining -= cap
  assignment.set(p.package_no, row)
}
const unconsumed = rows.filter((r) => r.remaining !== 0)
if (unconsumed.length) {
  throw new Error(`rows not fully consumed: ${unconsumed.map((r) => `${r.row}:${r.remaining}`).join(", ")}`)
}

/* ── room mix: scale booked proportions to the capacity ── */
function mixFor(nusukId, capacity, tier) {
  const src = data.pkgMix[nusukId]
  const booked = src?.Makkah ?? src?.Madinah ?? null
  // No demand rows (never booked): quads for standard, per the data; leave
  // premium/luxury unplanned rather than invent a split.
  if (!booked) return tier === "standard" ? { 2: 0, 3: 0, 4: capacity } : { 2: 0, 3: 0, 4: 0 }
  const total = Object.values(booked).reduce((t, v) => t + v, 0)
  if (!total) return { 2: 0, 3: 0, 4: 0 }
  const mix = { 2: 0, 3: 0, 4: 0 }
  const shares = ["2", "3", "4"].map((rt) => {
    const exact = ((booked[rt] ?? 0) / total) * capacity
    return { rt, floor: Math.floor(exact), rem: exact - Math.floor(exact) }
  })
  let used = 0
  for (const s of shares) {
    mix[s.rt] = s.floor
    used += s.floor
  }
  // Largest remainder gets the rounding leftovers, so Σ mix === capacity.
  for (const s of shares.sort((a, b) => b.rem - a.rem)) {
    if (used >= capacity) break
    mix[s.rt]++
    used++
  }
  return mix
}

/* ── bindings from the housing-system joins ── */
const contractsOf = (nusukId) => {
  const ids = []
  for (const [no, pkgIds] of Object.entries(data.contractPackages)) {
    if (pkgIds.includes(nusukId) && contractIdByNo.has(no)) ids.push(contractIdByNo.get(no))
  }
  return ids
}
/**
 * Allocations carry the REAL pilgrim counts per (package, block) — the model
 * now has a `seats` quantity on each link, so the actual 1447 distribution
 * (a 500-pilgrim package spread over many ~150-seat flights) seeds verbatim:
 * per block, Σ allocations = pilgrims flown = the block's seats. No trimming.
 */
const flightsOf = (nusukId) => {
  const usage = data.pkgFlights[nusukId] ?? {}
  // Several raw flights can map to one block (the B2C aggregates) — dedupe by
  // block id and sum the pilgrims.
  const byId = new Map()
  for (const [key, pilgrims] of Object.entries(usage)) {
    const id = blockIdByKey.get(key)
    if (!id) continue
    byId.set(id, (byId.get(id) ?? 0) + pilgrims)
  }
  return [...byId.entries()].map(([blockId, seats]) => ({ blockId, seats }))
}

/* ── packages ── */
const packages = [...pkgRows]
  .sort((a, b) => a.package_no.localeCompare(b.package_no))
  .map((p) => {
    const row = assignment.get(p.package_no)
    const capacity = Number(p.capacity)
    return {
      id: `pkg_1447_${p.package_no}`,
      package_no: p.package_no,
      name_en: p.name_en,
      tier: tierOfPkg(p),
      variant_suffix: p.category.endsWith(" SA") ? "SA" : "",
      capacity,
      initial_price_sar: Number(p.initial_price_sar),
      legs: row.legs.map((l, li) => ({
        id: `leg_1447_${p.package_no}_${li}`,
        role: l.role,
        hotelId: l.hotelId,
        starts_on: rebase(l.starts_on),
        ends_on: rebase(l.ends_on),
      })),
      contractIds: contractsOf(p.nusuk_id),
      flightAllocations: flightsOf(p.nusuk_id),
      room_mix: mixFor(p.nusuk_id, capacity, tierOfPkg(p)),
      // Lifecycle, truthfully: everything was approved on Nusuk (the ocr
      // screenshots), and content readiness follows desc_page — packages
      // 33–39 have no description page, which is precisely the 1447 failure
      // the content gate exists to catch. Their gate errors are historical
      // fact, not seed noise.
      publish_status: "approved",
      sale_status: "unavailable",
      content_ready_ar: Boolean(p.desc_page),
      content_ready_en: Boolean(p.desc_page),
      hero_approved: Boolean(p.desc_page),
    }
  })

/* ── season setup config, derived from the mapped dates ──
 * The season window is not an opinion: it is the envelope of the authoritative
 * dates — the FINAL PocketBase package windows plus the contract windows —
 * rebased. Date defaults across the app (new legs, new contracts, new seat
 * blocks) flow from this instead of hardcoded constants.
 */
const rawDates = [
  ...data.contracts.flatMap((c) => [c.starts_on, c.ends_on]),
  ...(pb ? [pb.envelope.starts_on, pb.envelope.ends_on] : []),
]
const seasonConfig = {
  year_hijri: 1448,
  year_gregorian: 2027,
  quota_total: 7000,
  starts_on: rebase(rawDates.reduce((a, b) => (a < b ? a : b))),
  ends_on: rebase(rawDates.reduce((a, b) => (a > b ? a : b))),
}

/* ── consistency report ── */
const capTotal = packages.reduce((t, p) => t + p.capacity, 0)
const mixOk = packages.every((p) => {
  const s = p.room_mix["2"] + p.room_mix["3"] + p.room_mix["4"]
  return s === 0 || s === p.capacity
})
const boundContracts = packages.filter((p) => p.contractIds.length).length
const boundFlights = packages.filter((p) => p.flightAllocations.length).length
console.log(
  `packages=${packages.length} capacity=${capTotal} mixOk=${mixOk} withContracts=${boundContracts} withFlights=${boundFlights} blocks=${flightBlocks.length} shift=${shiftDays}d`,
)
if (capTotal !== 7000 || !mixOk) throw new Error("consistency check failed")

/* ── emit ── */
const body = `import type { DraftContract, DraftFlightBlock, DraftPackage, DraftSeason } from "./season"

/**
 * Demo season ingested from the real 1447 data — two sources joined on the
 * Nusuk package id:
 * - \`../../hajj-1447/light-housing-system/new-data-sample/\`: the 30 housing
 *   contracts (+ their per-package links), the journey file's flights (blocks
 *   = flights that carried ≥30 pilgrims; seats = pilgrims flown, as a proxy),
 *   and the booked room-type mix per package.
 * - \`../ocr/\`: the 39 packages and their 31 hotel/date chains
 *   (\`packages.csv\` + \`nusuk-submission-model.csv\`), re-paired by hotel-set
 *   and capacity partition (row 1's 450 = packages 01+33, etc.), with ties
 *   between same-set rows resolved by the supply file's per-package windows.
 *
 * Adjustments for the 1448 demo (generator: \`scripts/seed-1447/\`, which needs
 * the sibling \`../../hajj-1447/light-housing-system\` repo):
 * - Every date rebased ${shiftDays} days, so the earliest contract lands on
 *   2027-05-12 and stays keep their real alignment with contract windows.
 * - Room mixes are the booked proportions scaled to each package's capacity;
 *   never-booked standard packages default to all-quad, premium/luxury ones
 *   stay unplanned.
 * - Contract beds sum every supply row per room type — the 1447 worker's own
 *   recompute rule; shared rooms may double-count.
 *   «معاد العالمية» → Voco is CONFIRMED by the supply links (its contract
 *   202610000004611 carries exactly the Voco packages 07–13 and 32);
 *   Aziziyah = shifting.
 */

/**
 * Season setup, carried from 1447: the 7,000 quota WAS 1447's allotment (the
 * 1448 figure arrives with the ministry letter and is edited in الإعدادات),
 * and the window is the envelope of every mapped 1447 contract and stay,
 * rebased ${shiftDays} days onto the 1448 calendar. Config, not fact — the
 * wizard's date defaults flow from it either way.
 */
export const SEED_SEASON: DraftSeason = ${JSON.stringify(seasonConfig, null, 2)}

export const SEED_CONTRACTS: DraftContract[] = ${JSON.stringify(contracts, null, 2)}

export const SEED_FLIGHT_BLOCKS: DraftFlightBlock[] = ${JSON.stringify(flightBlocks, null, 2)}

export const SEED_PACKAGES: DraftPackage[] = ${JSON.stringify(packages, null, 2)}
`
fs.writeFileSync(OUT, body)
fs.writeFileSync(
  path.join(__dirname, "seed-final.json"),
  JSON.stringify({ contracts, flightBlocks, packages }, null, 2),
)
console.log(`wrote ${OUT}`)
