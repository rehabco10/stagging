/**
 * Inventory validation tests — the supply-vs-demand nightly sweep and the
 * contract structure rules (docs/inventory-concept.md §3).
 *
 * Run: pnpm test  (compiles src/lib/validation.ts via tsconfig.test.json)
 */
import test from "node:test"
import assert from "node:assert/strict"

import { validateSeason, validateContract, nightsBetween, categoryOf } from "../.tmp-test/lib/validation.js"

const SEASON = { id: "s", year_hijri: 1448, year_gregorian: 2027, quota_total: 7000, status: "draft" }

const HOTELS = [
  { id: "h1", name_ar: "بولمان زمزم مكة", city: "makkah" },
  { id: "h2", name_ar: "دار الإيمان الحرم", city: "madinah" },
]

function leg(hotel, starts_on, ends_on, role = "first") {
  return {
    id: `leg_${hotel}_${starts_on}`,
    itinerary: "it",
    sequence: 1,
    role,
    city: "makkah",
    hotel,
    starts_on,
    ends_on,
    nights: nightsBetween(starts_on, ends_on),
  }
}

/** One package + its single-itinerary demand at the given legs. */
function demand(capacity, legs, over = {}) {
  const pkg = {
    id: "p1",
    season: "s",
    package_no: "01",
    name_en: "P 01",
    tier: "standard",
    is_shifting: false,
    itinerary: "it1",
    transport: "bus",
    capacity,
    initial_price_sar: 100,
    publish_status: "draft",
    sale_status: "unavailable",
    ...over,
  }
  const itin = {
    id: "it1",
    season: "s",
    code: "it1",
    is_shifting: false,
    total_nights: legs.reduce((t, l) => t + l.nights, 0),
    starts_on: legs[0]?.starts_on,
    ends_on: legs[legs.length - 1]?.ends_on,
    legs,
  }
  return { packages: [pkg], itineraries: new Map([["it1", itin]]) }
}

function contract(hotel, starts_on, ends_on, beds, over = {}) {
  return {
    id: `c_${hotel}_${starts_on}`,
    season: "s",
    hotel,
    contract_no: `no_${starts_on}`,
    city: "makkah",
    starts_on,
    ends_on,
    beds_total: beds,
    status: "signed",
    lines: [{ id: "ln", contract: "c", room_type: "4", rooms: beds / 4, beds }],
    ...over,
  }
}

function run(over = {}) {
  return validateSeason({
    season: SEASON,
    packages: [],
    itineraries: new Map(),
    requirements: [],
    readiness: new Map(),
    hotels: HOTELS,
    contracts: [],
    ...over,
  })
}

const codes = (issues) => issues.map((i) => i.code)
const only = (issues, code) => issues.filter((i) => i.code === code)

test("a bound package with a fitting mix inside a signed contract raises no inventory issue", () => {
  const c = contract("h1", "2027-05-12", "2027-05-16", 100)
  const issues = run({
    ...demand(100, [leg("h1", "2027-05-12", "2027-05-16")], {
      housing_contracts: [c.id],
      room_mix: { 2: 0, 3: 0, 4: 100 },
    }),
    contracts: [c],
  })
  assert.ok(!codes(issues).some((x) => x.startsWith("inventory.")), codes(issues).join())
})

test("demand over the contracted beds is a blocking error with the shortfall", () => {
  const issues = run({
    ...demand(150, [leg("h1", "2027-05-12", "2027-05-16")]),
    contracts: [contract("h1", "2027-05-12", "2027-05-16", 100)],
  })
  const over = only(issues, "inventory.overbooked")
  assert.equal(over.length, 1)
  assert.equal(over[0].level, "error")
  assert.match(over[0].message, /50/)
})

test("time-sliced contracts add up — the 1447 pattern of many blocks per hotel", () => {
  // Two back-to-back contracts each cover part of the stay; together they do.
  const c1 = contract("h1", "2027-05-12", "2027-05-16", 100)
  const c2 = contract("h1", "2027-05-16", "2027-05-20", 100)
  const issues = run({
    ...demand(100, [leg("h1", "2027-05-12", "2027-05-20")], {
      housing_contracts: [c1.id, c2.id],
      room_mix: { 2: 0, 3: 0, 4: 100 },
    }),
    contracts: [c1, c2],
  })
  assert.ok(!codes(issues).some((x) => x.startsWith("inventory.")), codes(issues).join())
})

test("nights outside every signed window warn as a gap, not an error", () => {
  const issues = run({
    ...demand(100, [leg("h1", "2027-05-12", "2027-05-20")]),
    contracts: [contract("h1", "2027-05-12", "2027-05-16", 100)],
  })
  const gaps = only(issues, "inventory.window_gap")
  assert.equal(gaps.length, 1)
  assert.equal(gaps[0].level, "warning")
  // Nights 16..19 are uncovered (checkout on the 20th).
  assert.match(gaps[0].message, /2027-05-16/)
  assert.match(gaps[0].message, /2027-05-19/)
  assert.equal(only(issues, "inventory.overbooked").length, 0)
})

test("a used hotel with no signed contract is a prospect — warning only", () => {
  const issues = run({
    ...demand(100, [leg("h1", "2027-05-12", "2027-05-16")]),
    contracts: [contract("h1", "2027-05-12", "2027-05-16", 100, { status: "proposed" })],
  })
  const missing = only(issues, "inventory.no_contract")
  assert.equal(missing.length, 1)
  assert.equal(missing[0].level, "warning")
  assert.match(missing[0].message, /بولمان/)
})

test("stored beds_total that disagrees with the room lines is the 1447 rooms-vs-beds lie", () => {
  const bad = contract("h1", "2027-05-12", "2027-05-16", 100)
  bad.beds_total = 376 // the Excel value: rooms, not beds
  const issues = validateContract(bad, HOTELS[0])
  assert.ok(codes(issues).includes("contract.beds_total"))
})

test("a line whose beds are not rooms × room_type is an error", () => {
  const bad = contract("h1", "2027-05-12", "2027-05-16", 100)
  bad.lines[0].beds = 99
  bad.beds_total = 99
  const issues = validateContract(bad, HOTELS[0])
  assert.ok(codes(issues).includes("contract.line_beds"))
})

test("a shifting contract on a madinah hotel is rejected", () => {
  const c = contract("h2", "2027-05-12", "2027-05-16", 100, { city: "shifting" })
  const issues = validateContract(c, HOTELS[1])
  assert.ok(codes(issues).includes("contract.shifting_city"))
})

/* ── explicit bindings: package ↔ contract, package ↔ seat block ── */

test("a package bound within its contract's beds raises no binding issue", () => {
  const c = contract("h1", "2027-05-12", "2027-05-16", 100)
  const issues = run({
    ...demand(100, [leg("h1", "2027-05-12", "2027-05-16")], { housing_contracts: [c.id] }),
    contracts: [c],
  })
  assert.equal(only(issues, "inventory.contract_overallocated").length, 0)
  assert.equal(only(issues, "inventory.no_contract_link").length, 0)
})

test("bound packages over the contract's beds are a per-contract error", () => {
  const c = contract("h1", "2027-05-12", "2027-05-16", 100)
  const issues = run({
    ...demand(150, [leg("h1", "2027-05-12", "2027-05-16")], { housing_contracts: [c.id] }),
    contracts: [c],
  })
  const over = only(issues, "inventory.contract_overallocated")
  assert.equal(over.length, 1)
  assert.equal(over[0].level, "error")
  assert.match(over[0].message, /50/)
})

test("a stay at a hotel with signed contracts but no binding nudges the author", () => {
  const c = contract("h1", "2027-05-12", "2027-05-16", 100)
  const issues = run({
    ...demand(100, [leg("h1", "2027-05-12", "2027-05-16")]),
    contracts: [c],
  })
  const nudge = only(issues, "inventory.no_contract_link")
  assert.equal(nudge.length, 1)
  assert.equal(nudge[0].level, "warning")
})

test("binding a contract on a hotel the package never stays at is flagged idle", () => {
  const c = contract("h2", "2027-05-12", "2027-05-16", 100)
  const issues = run({
    ...demand(100, [leg("h1", "2027-05-12", "2027-05-16")], { housing_contracts: [c.id] }),
    contracts: [c],
  })
  assert.equal(only(issues, "inventory.link_idle").length, 1)
})

test("seat allocations are exact: block over-allocation, shortfall, and over-linking", () => {
  const block = (id, seats) => ({
    id,
    season: "s",
    direction: "arrival",
    airline_ar: "السعودية",
    flight_no: "SV214",
    contract_type: "group",
    seats,
    status: "confirmed",
  })
  // Quota small enough that the fleet covers it — the per-package nudges only
  // activate once the fleet could carry the quota.
  const smallSeason = { ...SEASON, quota_total: 40 }

  // Not linked yet → nudge, no overallocation.
  const unlinked = run({
    ...demand(150, [leg("h1", "2027-05-12", "2027-05-16")]),
    season: smallSeason,
    flightBlocks: [block("f1", 45)],
  })
  assert.equal(only(unlinked, "inventory.no_flight_link").length, 1)
  assert.equal(only(unlinked, "inventory.flight_overallocated").length, 0)

  // Reserving 60 of a 45-seat block is a per-block error, exactly.
  const over = run({
    ...demand(150, [leg("h1", "2027-05-12", "2027-05-16")], {
      flight_allocations: [{ block: "f1", seats: 60 }],
    }),
    season: smallSeason,
    flightBlocks: [block("f1", 45)],
  })
  assert.equal(only(over, "inventory.flight_overallocated").length, 1)
  assert.equal(only(over, "inventory.flight_overallocated")[0].level, "error")

  // 45 allocated of 150 capacity → shortfall warning; the block itself is fine.
  const short = run({
    ...demand(150, [leg("h1", "2027-05-12", "2027-05-16")], {
      flight_allocations: [{ block: "f1", seats: 45 }],
    }),
    season: smallSeason,
    flightBlocks: [block("f1", 45)],
  })
  assert.equal(only(short, "inventory.flight_overallocated").length, 0)
  assert.equal(only(short, "inventory.flight_shortfall").length, 1)

  // A package split across blocks with quantities: 100+50 covers 150 exactly.
  const covered = run({
    ...demand(150, [leg("h1", "2027-05-12", "2027-05-16")], {
      flight_allocations: [
        { block: "f1", seats: 100 },
        { block: "f2", seats: 50 },
      ],
    }),
    season: smallSeason,
    flightBlocks: [block("f1", 100), block("f2", 50)],
  })
  assert.equal(only(covered, "inventory.flight_shortfall").length, 0)
  assert.equal(only(covered, "inventory.flight_overallocated").length, 0)

  // Reserving more seats than pilgrims is waste — warned even when blocks fit.
  const wasteful = run({
    ...demand(150, [leg("h1", "2027-05-12", "2027-05-16")], {
      flight_allocations: [{ block: "f1", seats: 200 }],
    }),
    season: smallSeason,
    flightBlocks: [block("f1", 300)],
  })
  assert.equal(only(wasteful, "inventory.flight_overlinked").length, 1)
  assert.equal(only(wasteful, "inventory.flight_overlinked")[0].level, "warning")
})

/* ── room mix ── */

test("a room mix that does not sum to the capacity is an error", () => {
  const issues = run({
    ...demand(100, [leg("h1", "2027-05-12", "2027-05-16")], {
      room_mix: { 2: 10, 3: 0, 4: 60 },
    }),
  })
  assert.equal(only(issues, "package.room_mix_total").length, 1)
  assert.equal(only(issues, "package.room_mix_total")[0].level, "error")
})

test("a bound contract short of one room type errors even with beds to spare overall", () => {
  const c = contract("h1", "2027-05-12", "2027-05-16", 200, {
    lines: [
      { id: "l4", contract: "c", room_type: "4", rooms: 25, beds: 100 },
      { id: "l2", contract: "c", room_type: "2", rooms: 50, beds: 100 },
    ],
  })
  const issues = run({
    ...demand(150, [leg("h1", "2027-05-12", "2027-05-16")], {
      housing_contracts: [c.id],
      room_mix: { 2: 0, 3: 0, 4: 150 },
    }),
    contracts: [c],
  })
  // 150 pilgrims fit in 200 beds — but not in 100 quad beds.
  assert.equal(only(issues, "inventory.contract_overallocated").length, 0)
  const over = only(issues, "inventory.room_type_overallocated")
  assert.equal(over.length, 1)
  assert.match(over[0].message, /50/)
})

test("a bound package without a planned mix is nudged, not blocked", () => {
  const c = contract("h1", "2027-05-12", "2027-05-16", 100)
  const issues = run({
    ...demand(100, [leg("h1", "2027-05-12", "2027-05-16")], { housing_contracts: [c.id] }),
    contracts: [c],
  })
  const nudge = only(issues, "inventory.no_room_mix")
  assert.equal(nudge.length, 1)
  assert.equal(nudge[0].level, "warning")
  assert.equal(only(issues, "inventory.room_type_overallocated").length, 0)
})

/* ── categories ── */

test("every issue code maps to the category its UI group expects", () => {
  const cases = [
    ["season.quota_total", "governance"],
    ["season.mix_max", "governance"],
    ["itinerary.not_contiguous", "itinerary"],
    ["leg.nights_mismatch", "itinerary"],
    ["package.room_mix_total", "package"],
    ["package.no_body_ar", "package"],
    ["contract.beds_total", "contracts"],
    ["contract.shifting_city", "contracts"],
    ["inventory.overbooked", "housing"],
    ["inventory.no_contract_link", "housing"],
    ["inventory.room_type_overallocated", "housing"],
    ["inventory.link_dangling", "housing"],
    // the air side of the shared inventory.* namespace
    ["inventory.flight_overallocated", "flights"],
    ["inventory.no_flight_link", "flights"],
    ["inventory.flight_link_dangling", "flights"],
    ["inventory.arrival_seats", "flights"],
    ["inventory.return_seats", "flights"],
    ["something.unknown", "other"],
  ]
  for (const [code, expected] of cases) {
    assert.equal(categoryOf(code), expected, code)
  }
})

test("every code the season validator can emit has a non-other category", () => {
  // Collect codes from a season fixture that trips many rules at once.
  const c = contract("h2", "2027-05-12", "2027-05-16", 100, { city: "shifting", status: "proposed" })
  const issues = run({
    ...demand(150, [leg("h1", "2027-05-12", "2027-05-20")], {
      housing_contracts: [c.id],
      room_mix: { 2: 10, 3: 0, 4: 60 },
    }),
    contracts: [c],
    flightBlocks: [
      { id: "f1", season: "s", direction: "arrival", contract_type: "group", seats: 45, status: "confirmed" },
    ],
  })
  for (const i of issues) {
    assert.notEqual(categoryOf(i.code), "other", `uncategorized code: ${i.code}`)
  }
})

test("confirmed flight seats below the quota warn per direction; enough seats stay quiet", () => {
  const block = (direction, seats, status = "confirmed") => ({
    id: `f_${direction}_${seats}`,
    season: "s",
    direction,
    contract_type: "group",
    seats,
    status,
  })
  const short = run({ flightBlocks: [block("arrival", 4000), block("return", 7000)] })
  assert.equal(only(short, "inventory.arrival_seats").length, 1)
  assert.equal(only(short, "inventory.return_seats").length, 0)

  // Proposed seats do not count yet.
  const proposed = run({ flightBlocks: [block("arrival", 7000, "proposed"), block("return", 7000)] })
  assert.equal(only(proposed, "inventory.arrival_seats").length, 1)

  // No blocks at all = not started, no noise.
  const none = run({ flightBlocks: [] })
  assert.equal(only(none, "inventory.arrival_seats").length, 0)
})
