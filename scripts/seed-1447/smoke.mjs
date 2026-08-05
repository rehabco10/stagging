/** Runs the compiled season validator over the generated seed, mirroring issuesFor(). */
import fs from "node:fs"
import { validateSeason, nightsBetween } from "file:///C:/Users/x7md/Documents/works/hajj-1448/hajj-package-wizard/.tmp-test/lib/validation.js"

const { contracts, flightBlocks, packages } = JSON.parse(
  fs.readFileSync(new URL("./seed-final.json", import.meta.url), "utf8"),
)

const HOTELS = [
  ["h_swiss", "سويس أوتيل مكة", "makkah"], ["h_pullman", "بولمان زمزم مكة", "makkah"],
  ["h_hyatt", "حياة ريجنسي", "makkah"], ["h_voco", "فوكو", "makkah"],
  ["h_aziziyah", "إثراء العزيزية", "makkah"], ["h_haram", "دار الإيمان الحرم", "madinah"],
  ["h_hilton", "هيلتون المدينة", "madinah"], ["h_taqwa", "إيلاف التقوى", "madinah"],
  ["h_maysan", "ميسان رحاب المسك", "madinah"], ["h_durrat", "درة الإيمان", "madinah"],
  ["h_deyar", "ديار الإيمان", "madinah"],
].map(([id, name_ar, city]) => ({ id, name_ar, city }))
const cityOf = (id) => HOTELS.find((h) => h.id === id)?.city ?? "makkah"

const itineraries = new Map(
  packages.map((p) => {
    const legs = [...p.legs]
      .sort((a, b) => a.starts_on.localeCompare(b.starts_on))
      .map((l, i) => ({
        id: l.id, itinerary: p.id, sequence: i + 1, role: l.role,
        city: cityOf(l.hotelId), hotel: l.hotelId,
        starts_on: l.starts_on, ends_on: l.ends_on,
        nights: nightsBetween(l.starts_on, l.ends_on) ?? 0,
      }))
    return [p.id, {
      id: p.id, season: "draft", code: p.package_no,
      is_shifting: legs.some((l) => l.role === "transitional"),
      total_nights: legs.reduce((t, l) => t + l.nights, 0),
      starts_on: legs[0]?.starts_on ?? null, ends_on: legs[legs.length - 1]?.ends_on ?? null,
      legs,
    }]
  }),
)

const issues = validateSeason({
  season: { id: "draft", year_hijri: 1448, year_gregorian: 2027, quota_total: 7000, status: "draft" },
  packages: packages.map((p) => ({
    id: p.id, season: "draft", package_no: p.package_no, name_en: p.name_en,
    tier: p.tier, is_shifting: p.legs.some((l) => l.role === "transitional"),
    variant_suffix: p.variant_suffix || null, itinerary: p.id, transport: "bus",
    capacity: p.capacity, initial_price_sar: p.initial_price_sar,
    publish_status: p.publish_status ?? "draft", sale_status: p.sale_status ?? "unavailable",
    housing_contracts: p.contractIds,
    flight_allocations: p.flightAllocations.map((a) => ({ block: a.blockId, seats: a.seats })),
    room_mix: p.room_mix,
  })),
  itineraries,
  requirements: [
    { id: "r1", season: "draft", kind: "mix", status: "agreed", title: "الفاخرة والمميزة 40%", detail: "", acknowledged: true, params: { kind: "mix", group: "premium_and_above", max_pct: 40 } },
    { id: "r2", season: "draft", kind: "mix", status: "agreed", title: "الأساسية 60%", detail: "", acknowledged: true, params: { kind: "mix", group: "standard", min_pct: 60 } },
  ],
  readiness: new Map(
    packages.map((p) => [
      p.id,
      {
        hasArabicBody: Boolean(p.content_ready_ar),
        hasEnglishBody: Boolean(p.content_ready_en),
        approvedHeroCount: p.hero_approved ? 1 : 0,
      },
    ]),
  ),
  hotels: HOTELS,
  contracts: contracts.map((c) => ({
    id: c.id, season: "draft", hotel: c.hotelId, contract_no: c.contract_no,
    city: c.city, starts_on: c.starts_on, ends_on: c.ends_on,
    beds_total: c.lines.reduce((t, l) => t + l.rooms * Number(l.room_type), 0),
    status: c.status,
    lines: c.lines.map((l) => ({ ...l, contract: c.id, beds: l.rooms * Number(l.room_type) })),
  })),
  flightBlocks: flightBlocks.map((f) => ({ ...f, season: "draft" })),
})

const byCode = {}
for (const i of issues) byCode[`${i.level}:${i.code}`] = (byCode[`${i.level}:${i.code}`] ?? 0) + 1
console.log(`total=${issues.length} errors=${issues.filter((i) => i.level === "error").length}`)
console.log(byCode)
for (const i of issues.filter((x) => x.level === "error").slice(0, 12)) console.log("E:", i.message)
