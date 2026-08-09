import { proxy } from "valtio"
import type {
  CityValue,
  ContractCityValue,
  ContractStatusValue,
  FlightContractTypeValue,
  FlightDirectionValue,
  FlightBlockStatusValue,
  LegRoleValue,
  RoomTypeValue,
  TierValue,
} from "@/lib/schemas"
import { validateSeason, nightsBetween, type Issue } from "@/lib/validation"
import { SEED_CONTRACTS, SEED_FLIGHT_BLOCKS, SEED_PACKAGES, SEED_SEASON } from "./seed-1447"

/**
 * The draft the wizard edits, held in memory. PocketBase persistence comes
 * later — the shapes here mirror `src/lib/schemas.ts` so the mapping is 1:1.
 *
 * One deliberate simplification: legs live inline on each package rather than
 * in a shared `itineraries` table. Authoring is per-package ("add a package,
 * then build it"), so sharing is a *discovery* — identical chains get grouped
 * at export time, not while typing. See docs/data-model.md §1.
 */

export interface DraftHotel {
  id: string
  name_ar: string
  name_en: string
  city: CityValue
  star_class: "5" | "4" | "3" | "2" | "1" | "nuzul"
  grade: "أ" | "ب" | "ج" | "م"
}

export interface DraftLeg {
  id: string
  role: LegRoleValue
  hotelId: string
  starts_on: string
  ends_on: string
}

export interface DraftPackage {
  id: string
  package_no: string
  name_en: string
  tier: TierValue
  variant_suffix: string
  capacity: number
  initial_price_sar: number
  legs: DraftLeg[]
  /** Housing contracts serving this package — 1447's `contract_packages`, chosen at authoring time. */
  contractIds: string[]
  /**
   * Seat blocks carrying this package, with the seats reserved on each — a
   * bare reference could not express a 500-pilgrim package spread over
   * ~150-seat flights, which is how 1447 actually flew.
   */
  flightAllocations: DraftFlightAllocation[]
  /**
   * Pilgrims by room type. One mix for the whole trip, not per leg: 92.6% of
   * the 2,407 real 1447 bookings kept the same room type in both cities (only
   * 13 mixed types within one city). All zeros = not planned yet, and the
   * room-type supply checks stay quiet.
   */
  room_mix: Record<RoomTypeValue, number>
  /**
   * Nusuk lifecycle. Absent from the draft for the wizard's first year, which
   * meant `validatePackage`'s content gate — built specifically for 1447's
   * seven priced-but-undescribed packages — could never fire. See
   * docs/packages-ux-bpr.md §4.
   */
  publish_status: "draft" | "submitted" | "approved" | "rejected"
  sale_status: "unavailable" | "available"
  /** Content readiness — the forward contract of a future /content editor. */
  content_ready_ar: boolean
  content_ready_en: boolean
  hero_approved: boolean
}

/**
 * A block of beds at one hotel for one date window — NOT "the deal with the
 * hotel": 1447 hotels held up to seven of these, split by dates. Beds are
 * derived from the room-type lines, never entered as one number (the 1447
 * Excel total held rooms, not beds). See docs/inventory-concept.md.
 */
export interface DraftRoomLine {
  id: string
  room_type: RoomTypeValue
  rooms: number
  /** Per-bed-per-night, null while unknown — no 1447 contract carried a price. */
  rate_sar: number | null
}

export interface DraftContract {
  id: string
  hotelId: string
  contract_no: string
  city: ContractCityValue
  starts_on: string
  ends_on: string
  /** Only `signed` counts as supply in the availability checks. */
  status: ContractStatusValue
  lines: DraftRoomLine[]
}

/**
 * A purchased block of flight seats — airline, route, PNR, seats. The shape of
 * the free-text «اسم العقد» column, which was the only place 1447 kept seat
 * counts. Not referenced by packages; coverage is checked against the quota.
 */
export interface DraftFlightAllocation {
  blockId: string
  seats: number
}

export interface DraftFlightBlock {
  id: string
  direction: FlightDirectionValue
  airline_ar: string
  airline_en: string
  flight_no: string
  flies_on: string
  from_city: string
  to_city: string
  contract_type: FlightContractTypeValue
  pnr: string
  seats: number
  status: FlightBlockStatusValue
}

/**
 * A rule agreed in a meeting. `quota` is deliberately absent — the season's
 * total lives on `season.quota_total` so there is only one source of truth
 * for it. Everything else the ministry sets belongs here.
 */
export interface DraftRequirement {
  id: string
  kind: "mix" | "pricing" | "hotel" | "window" | "note"
  status: "proposed" | "agreed" | "superseded"
  title: string
  detail: string
  acknowledged: boolean
  params: Record<string, unknown> | null
}

/**
 * Season setup config. The window is the season's date envelope — every date
 * default in the app (new legs, contracts, seat blocks) flows from
 * `starts_on` instead of a hardcoded constant. Seeded from the mapped 1447
 * data (rebased), edited in الإعدادات when the 1448 letters land.
 */
export interface DraftSeason {
  year_hijri: number
  year_gregorian: number
  quota_total: number
  starts_on: string
  ends_on: string
}

export interface DraftState {
  season: DraftSeason
  hotels: DraftHotel[]
  contracts: DraftContract[]
  flightBlocks: DraftFlightBlock[]
  requirements: DraftRequirement[]
  packages: DraftPackage[]
  /** Node id currently inspected — `"root"`, a package id, or a leg id. */
  selectedId: string
  /**
   * Prices render masked («••••») until toggled — the wizard is routinely on
   * screen in meetings with hotels and providers, and the price sheet is the
   * one thing that must not be in the room. One global flag: revealing any
   * price reveals them all, deliberately, so a presenter knows the state.
   */
  showPrices: boolean
  /**
   * The one package whose legs render on the canvas — accordion, not a set:
   * 39 seeded packages with ~90 legs at fit-view zoom are unreadable specks,
   * so the tree shows package cards only and opens one branch at a time.
   */
  expandedPackageId: string | null
  /** Nodes the user has dragged; re-layout leaves these alone. */
  pinned: Record<string, { x: number; y: number }>
  /**
   * The node created by the last add, so the canvas can frame it instead of
   * re-fitting the whole tree. Cleared once the viewport has moved.
   */
  lastAdded: { id: string; parentId: string } | null
}

/**
 * Hotels used in 1447, as a starting inventory. Verified from ocr/; the
 * English names are the registry names from the 1447 system's
 * `housing_providers` table (Voco keeps its brand name — the registry entry
 * is its operating company, «MAAD INTERNATIONAL HOTEL CO LTD»).
 */
const SEED_HOTELS: DraftHotel[] = [
  { id: "h_swiss", name_ar: "سويس أوتيل مكة", name_en: "Swissotel Makkah Hotel", city: "makkah", star_class: "5", grade: "أ" },
  { id: "h_pullman", name_ar: "بولمان زمزم مكة", name_en: "Zamzam Pullman Makkah Hotel", city: "makkah", star_class: "5", grade: "أ" },
  { id: "h_hyatt", name_ar: "حياة ريجنسي", name_en: "Jabal Omar Hyatt Regency Hotel", city: "makkah", star_class: "5", grade: "أ" },
  { id: "h_voco", name_ar: "فوكو", name_en: "Voco Makkah (MAAD International)", city: "makkah", star_class: "4", grade: "ج" },
  { id: "h_aziziyah", name_ar: "إثراء العزيزية", name_en: "Ithraa Al Aziziyah Hotel", city: "makkah", star_class: "nuzul", grade: "م" },
  { id: "h_haram", name_ar: "دار الإيمان الحرم", name_en: "Dar Al Eiman Al Haram Hotel", city: "madinah", star_class: "5", grade: "أ" },
  { id: "h_hilton", name_ar: "هيلتون المدينة", name_en: "Madinah Hilton Hotel", city: "madinah", star_class: "5", grade: "أ" },
  { id: "h_taqwa", name_ar: "إيلاف التقوى", name_en: "Elaf Al Taqwa Hotel", city: "madinah", star_class: "4", grade: "أ" },
  { id: "h_maysan", name_ar: "ميسان رحاب المسك", name_en: "Maysan Rehab Al Misk Hotel", city: "madinah", star_class: "3", grade: "ج" },
  { id: "h_durrat", name_ar: "درة الإيمان", name_en: "Durrat Al Eman Hotel", city: "madinah", star_class: "1", grade: "ج" },
  { id: "h_deyar", name_ar: "ديار الإيمان", name_en: "Diyar Al Eman Hotel", city: "madinah", star_class: "1", grade: "ج" },
]

/** The 1447 ministry rules, as a starting point for this season's intake. */
const SEED_REQUIREMENTS: DraftRequirement[] = [
  {
    id: "req_mix_hi",
    kind: "mix",
    status: "agreed",
    title: "الفاخرة والمميزة 40% كحد أعلى",
    detail: "تشمل الباقات الفاخرة والمميزة وانتقالياتهما، من إجمالي الحصة.",
    acknowledged: true,
    params: { kind: "mix", group: "premium_and_above", max_pct: 40 },
  },
  {
    id: "req_mix_lo",
    kind: "mix",
    status: "agreed",
    title: "الأساسية 60% كحد أدنى",
    detail: "الباقات الأساسية (الاقتصادية) من إجمالي الحصة المخصصة.",
    acknowledged: true,
    params: { kind: "mix", group: "standard", min_pct: 60 },
  },
]

export const state = proxy<DraftState>({
  season: { ...SEED_SEASON },
  hotels: SEED_HOTELS,
  // The real 1447 season, unshifted — the wizard opens on the reference
  // season as it was; planning 1448 starts by editing الإعدادات. Starting
  // from last season's packages and signed supply is how a season actually
  // gets planned: clone, adjust, delete what won't repeat.
  contracts: SEED_CONTRACTS,
  flightBlocks: SEED_FLIGHT_BLOCKS,
  requirements: SEED_REQUIREMENTS,
  packages: SEED_PACKAGES,
  selectedId: "root",
  showPrices: false,
  expandedPackageId: null,
  pinned: {},
  lastAdded: null,
})

/* ── ids ────────────────────────────────────────────────────────── */

let counter = 0
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}`

/* ── derived ────────────────────────────────────────────────────── */

export const hotelById = (id: string) => state.hotels.find((h) => h.id === id)

export function legNights(leg: DraftLeg): number {
  return nightsBetween(leg.starts_on, leg.ends_on) ?? 0
}

export function packageNights(pkg: DraftPackage): number {
  return pkg.legs.reduce((t, l) => t + legNights(l), 0)
}

export const isShifting = (pkg: DraftPackage) => pkg.legs.some((l) => l.role === "transitional")

export function allocated(s: DraftState = state): number {
  return s.packages.reduce((t, p) => t + (p.capacity || 0), 0)
}

export function remaining(s: DraftState = state): number {
  return s.season.quota_total - allocated(s)
}

/** Legs in true chronological order — role labels are not order. */
export function orderedLegs(pkg: DraftPackage): DraftLeg[] {
  return [...pkg.legs].sort((a, b) => a.starts_on.localeCompare(b.starts_on))
}

export const lineBeds = (l: DraftRoomLine) => l.rooms * Number(l.room_type)

export const contractBeds = (c: DraftContract) => c.lines.reduce((t, l) => t + lineBeds(l), 0)

/**
 * The most beds any single night has under signed contract — the honest
 * supply headline. Summing whole contracts would double-count a hotel's
 * time-sliced blocks, which never all exist on the same night.
 */
export function peakSignedBeds(s: DraftState = state): number {
  const deltas = new Map<string, number>()
  for (const c of s.contracts) {
    if (c.status !== "signed") continue
    const beds = contractBeds(c)
    if (beds <= 0 || (nightsBetween(c.starts_on, c.ends_on) ?? 0) <= 0) continue
    deltas.set(c.starts_on, (deltas.get(c.starts_on) ?? 0) + beds)
    deltas.set(c.ends_on, (deltas.get(c.ends_on) ?? 0) - beds)
  }
  let peak = 0
  let level = 0
  for (const [, d] of [...deltas.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    level += d
    peak = Math.max(peak, level)
  }
  return peak
}

export function confirmedSeats(direction: DraftFlightBlock["direction"], s: DraftState = state): number {
  return s.flightBlocks
    .filter((f) => f.direction === direction && f.status === "confirmed")
    .reduce((t, f) => t + (f.seats || 0), 0)
}

/* ── actions ────────────────────────────────────────────────────── */

/** Next unused two-digit package number. */
function nextPackageNo(): string {
  const used = new Set(state.packages.map((p) => Number(p.package_no)))
  let n = 1
  while (used.has(n)) n++
  return String(n).padStart(2, "0")
}

export function addPackage(tier: TierValue = "standard"): string {
  const no = nextPackageNo()
  const id = nextId("pkg")
  // Give the new package whatever quota is still unallocated, so the root
  // node stays balanced the moment it appears rather than going red.
  const left = Math.max(0, remaining())
  state.packages.push({
    id,
    package_no: no,
    name_en: `ITHRAA ALKHAIR ${no}`,
    tier,
    variant_suffix: "",
    capacity: left,
    initial_price_sar: 0,
    legs: [],
    contractIds: [],
    flightAllocations: [],
    room_mix: { "2": 0, "3": 0, "4": 0 },
    publish_status: "draft",
    sale_status: "unavailable",
    content_ready_ar: false,
    content_ready_en: false,
    hero_approved: false,
  })
  state.selectedId = id
  state.expandedPackageId = id
  state.lastAdded = { id, parentId: "root" }
  return id
}

/**
 * Clone a package with its whole stay chain.
 *
 * This is how a season actually gets built: most packages are a variation on
 * one already made — 1447 had seven Premium packages sharing an identical
 * hotel chain and differing only in capacity and dates. The copy starts with
 * zero capacity so it cannot silently push the quota over.
 */
export function duplicatePackage(id: string): string | null {
  const src = state.packages.find((p) => p.id === id)
  if (!src) return null
  const no = nextPackageNo()
  const newId = nextId("pkg")
  state.packages.push({
    id: newId,
    package_no: no,
    name_en: src.name_en.replace(/\d+\s*$/, "").trim() + ` ${no}`,
    tier: src.tier,
    variant_suffix: src.variant_suffix,
    capacity: 0,
    initial_price_sar: src.initial_price_sar,
    legs: src.legs.map((l) => ({ ...l, id: nextId("leg") })),
    // Same chain → same contracts. Capacity starts at 0, so the copy cannot
    // overallocate a contract by merely existing — and the room mix and seat
    // allocations reset with it, since both are sized to the capacity.
    contractIds: [...src.contractIds],
    flightAllocations: [],
    room_mix: { "2": 0, "3": 0, "4": 0 },
    // A variant starts its own lifecycle: it needs its own content and its
    // own Nusuk approval regardless of what the original earned.
    publish_status: "draft",
    sale_status: "unavailable",
    content_ready_ar: false,
    content_ready_en: false,
    hero_approved: false,
  })
  state.selectedId = newId
  state.expandedPackageId = newId
  state.lastAdded = { id: newId, parentId: "root" }
  return newId
}

export function removePackage(id: string) {
  const i = state.packages.findIndex((p) => p.id === id)
  if (i < 0) return
  for (const leg of state.packages[i].legs) delete state.pinned[leg.id]
  delete state.pinned[id]
  state.packages.splice(i, 1)
  if (state.selectedId === id) state.selectedId = "root"
  if (state.expandedPackageId === id) state.expandedPackageId = null
}

/* ── season-level balance & pricing actions (BPR) ───────────────── */

/** Assign the season's unallocated remainder to this package. */
export function takeRemaining(packageId: string) {
  const pkg = state.packages.find((p) => p.id === packageId)
  if (!pkg) return
  pkg.capacity += Math.max(0, remaining())
}

/**
 * Price the tier, not each package: 1447's SA variants were priced identical
 * to the fils, and per-category averages show one decision per tier.
 */
export function applyTierPrice(tier: TierValue, sar: number) {
  for (const p of state.packages) if (p.tier === tier) p.initial_price_sar = sar
}

/**
 * Copy another package's stay chain onto this one — the 1447 composition
 * reality (seven Premium packages shared one identical chain) as a first-class
 * action instead of only whole-package duplication.
 */
export function cloneChainFrom(targetId: string, sourceId: string) {
  const target = state.packages.find((p) => p.id === targetId)
  const source = state.packages.find((p) => p.id === sourceId)
  if (!target || !source || target === source) return
  for (const leg of target.legs) delete state.pinned[leg.id]
  target.legs = source.legs.map((l) => ({ ...l, id: nextId("leg") }))
  state.expandedPackageId = targetId
}

/** Roles a package can still take — one `first`, one `second`, one optional `transitional`. */
export function availableRoles(pkg: DraftPackage): LegRoleValue[] {
  const taken = new Set(pkg.legs.map((l) => l.role))
  return (["first", "second", "transitional"] as LegRoleValue[]).filter((r) => !taken.has(r))
}

export function addLeg(packageId: string): string | null {
  const pkg = state.packages.find((p) => p.id === packageId)
  if (!pkg) return null
  const role = availableRoles(pkg)[0]
  if (!role) return null

  // New legs append to the end of the chain so it stays contiguous by
  // construction — the validator should never have to report a gap the user
  // didn't deliberately create.
  const chain = orderedLegs(pkg)
  const start = chain.length ? chain[chain.length - 1].ends_on : state.season.starts_on
  const end = addDays(start, 3)

  // Alternate cities so the default chain reads Madinah → Makkah like most
  // of the 1447 itineraries.
  const lastHotel = chain.length ? hotelById(chain[chain.length - 1].hotelId) : undefined
  const wantCity: CityValue = lastHotel?.city === "madinah" ? "makkah" : "madinah"
  const hotel = state.hotels.find((h) => h.city === wantCity) ?? state.hotels[0]

  const id = nextId("leg")
  pkg.legs.push({ id, role, hotelId: hotel.id, starts_on: start, ends_on: end })
  state.selectedId = id
  // The new leg must be visible — open this package's branch.
  state.expandedPackageId = packageId
  state.lastAdded = { id, parentId: packageId }
  return id
}

export function clearLastAdded() {
  state.lastAdded = null
}

export function removeLeg(legId: string) {
  for (const pkg of state.packages) {
    const i = pkg.legs.findIndex((l) => l.id === legId)
    if (i < 0) continue
    pkg.legs.splice(i, 1)
    delete state.pinned[legId]
    if (state.selectedId === legId) state.selectedId = pkg.id
    return
  }
}

export function findLeg(legId: string): { pkg: DraftPackage; leg: DraftLeg } | null {
  for (const pkg of state.packages) {
    const leg = pkg.legs.find((l) => l.id === legId)
    if (leg) return { pkg, leg }
  }
  return null
}

/**
 * Move a leg's dates while keeping the chain contiguous: everything after it
 * shifts by the same delta. This is what makes a gap impossible to create by
 * editing a start date.
 */
export function retimeLeg(legId: string, starts_on: string, ends_on: string) {
  const found = findLeg(legId)
  if (!found) return
  const { pkg, leg } = found
  const chain = orderedLegs(pkg)
  const idx = chain.findIndex((l) => l.id === legId)
  const oldEnd = leg.ends_on

  leg.starts_on = starts_on
  leg.ends_on = ends_on

  const delta = daysBetween(oldEnd, ends_on)
  if (delta !== 0) {
    for (let i = idx + 1; i < chain.length; i++) {
      chain[i].starts_on = addDays(chain[i].starts_on, delta)
      chain[i].ends_on = addDays(chain[i].ends_on, delta)
    }
  }
}

export function togglePrices() {
  state.showPrices = !state.showPrices
}

/** Accordion toggle: open this package's branch, closing whichever was open. */
export function toggleExpandedPackage(id: string) {
  state.expandedPackageId = state.expandedPackageId === id ? null : id
}

export function pinNode(id: string, x: number, y: number) {
  state.pinned[id] = { x, y }
}

export function unpinNode(id: string) {
  delete state.pinned[id]
}

export function unpinAll() {
  state.pinned = {}
}

/* ── dates ──────────────────────────────────────────────────────── */

const DAY = 86_400_000

function parse(d: string): Date {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, day))
}

export function addDays(d: string, n: number): string {
  return new Date(parse(d).getTime() + n * DAY).toISOString().slice(0, 10)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / DAY)
}

/* ── validation bridge ──────────────────────────────────────────── */

/** Run the shared rules over the draft. Snapshot in, issues out. */
export function issuesFor(s: DraftState): Issue[] {
  const itineraries = new Map(
    s.packages.map((p) => {
      const legs = [...p.legs]
        .sort((a, b) => a.starts_on.localeCompare(b.starts_on))
        .map((l, i) => ({
          id: l.id,
          itinerary: p.id,
          sequence: i + 1,
          role: l.role,
          city: hotelById(l.hotelId)?.city ?? "makkah",
          hotel: l.hotelId,
          starts_on: l.starts_on,
          ends_on: l.ends_on,
          nights: nightsBetween(l.starts_on, l.ends_on) ?? 0,
        }))
      return [
        p.id,
        {
          id: p.id,
          season: "draft",
          code: p.package_no,
          is_shifting: legs.some((l) => l.role === "transitional"),
          total_nights: legs.reduce((t, l) => t + l.nights, 0),
          starts_on: legs[0]?.starts_on ?? null,
          ends_on: legs[legs.length - 1]?.ends_on ?? null,
          legs,
        },
      ] as const
    }),
  )

  return validateSeason({
    season: {
      id: "draft",
      year_hijri: s.season.year_hijri,
      year_gregorian: s.season.year_gregorian,
      quota_total: s.season.quota_total,
      status: "draft",
    },
    packages: s.packages.map((p) => ({
      id: p.id,
      season: "draft",
      package_no: p.package_no,
      name_en: p.name_en,
      tier: p.tier,
      is_shifting: p.legs.some((l) => l.role === "transitional"),
      variant_suffix: p.variant_suffix || null,
      itinerary: p.id,
      transport: "bus" as const,
      capacity: p.capacity,
      initial_price_sar: p.initial_price_sar,
      publish_status: p.publish_status,
      sale_status: p.sale_status,
      housing_contracts: [...p.contractIds],
      flight_allocations: p.flightAllocations.map((a) => ({ block: a.blockId, seats: a.seats })),
      room_mix: { ...p.room_mix },
    })),
    itineraries,
    requirements: s.requirements.map((r) => ({
      id: r.id,
      season: "draft",
      kind: r.kind,
      status: r.status,
      title: r.title,
      detail: r.detail,
      acknowledged: r.acknowledged,
      params: r.params,
    })),
    // Content readiness now feeds the gate built for 1447's seven
    // priced-but-undescribed packages — it received an empty map (gate
    // permanently disarmed) until the /packages BPR added these flags.
    readiness: new Map(
      s.packages.map((p) => [
        p.id,
        {
          hasArabicBody: p.content_ready_ar,
          hasEnglishBody: p.content_ready_en,
          approvedHeroCount: p.hero_approved ? 1 : 0,
        },
      ]),
    ),
    hotels: s.hotels.map((h) => ({ id: h.id, name_ar: h.name_ar, name_en: h.name_en, city: h.city })),
    // Derived fields (beds, beds_total) are computed here, not stored — so the
    // mismatch rules exist for imported data, and the draft can't trip them.
    contracts: s.contracts.map((c) => ({
      id: c.id,
      season: "draft",
      hotel: c.hotelId,
      contract_no: c.contract_no,
      city: c.city,
      starts_on: c.starts_on,
      ends_on: c.ends_on,
      beds_total: contractBeds(c),
      status: c.status,
      lines: c.lines.map((l) => ({
        id: l.id,
        contract: c.id,
        room_type: l.room_type,
        rooms: l.rooms,
        beds: lineBeds(l),
        rate_sar: l.rate_sar,
      })),
    })),
    flightBlocks: s.flightBlocks.map((f) => ({
      id: f.id,
      season: "draft",
      direction: f.direction,
      airline_ar: f.airline_ar || null,
      airline_en: f.airline_en || null,
      flight_no: f.flight_no || null,
      flies_on: f.flies_on || null,
      from_city: f.from_city || null,
      to_city: f.to_city || null,
      contract_type: f.contract_type,
      pnr: f.pnr || null,
      seats: f.seats,
      status: f.status,
    })),
  })
}

/* ── requirements ───────────────────────────────────────────────── */

export function addRequirement(kind: DraftRequirement["kind"] = "note"): string {
  const id = nextId("req")
  state.requirements.push({
    id,
    kind,
    status: "proposed",
    title: "",
    detail: "",
    acknowledged: false,
    params: kind === "mix" ? { kind: "mix", group: "standard", min_pct: 60 } : null,
  })
  return id
}

export function removeRequirement(id: string) {
  const i = state.requirements.findIndex((r) => r.id === id)
  if (i >= 0) state.requirements.splice(i, 1)
}

/* ── hotels ─────────────────────────────────────────────────────── */

/** The add wizard collects the whole shape, so no empty-row state exists. */
export function addHotel(data: Omit<DraftHotel, "id">): string {
  const id = nextId("h")
  state.hotels.push({ id, ...data })
  return id
}

/** Refuses to remove a hotel that a stay leg or a housing contract still points at. */
export function removeHotel(id: string): { ok: boolean; usedBy: number; contractCount: number } {
  const usedBy = state.packages.reduce(
    (t, p) => t + p.legs.filter((l) => l.hotelId === id).length,
    0,
  )
  const contractCount = state.contracts.filter((c) => c.hotelId === id).length
  if (usedBy > 0 || contractCount > 0) return { ok: false, usedBy, contractCount }
  const i = state.hotels.findIndex((h) => h.id === id)
  if (i >= 0) state.hotels.splice(i, 1)
  return { ok: true, usedBy: 0, contractCount: 0 }
}

/* ── housing contracts & flight blocks ──────────────────────────── */

export function addContract(hotelId?: string): string {
  const hotel = (hotelId && hotelById(hotelId)) || state.hotels[0]
  const id = nextId("hc")
  const start = state.season.starts_on
  state.contracts.push({
    id,
    hotelId: hotel?.id ?? "",
    contract_no: "",
    city: hotel?.city ?? "makkah",
    starts_on: start,
    ends_on: addDays(start, 5),
    // Supply must be opted into: the nightly checks only count `signed`, so a
    // half-typed contract can never manufacture beds.
    status: "proposed",
    lines: [{ id: nextId("crl"), room_type: "4", rooms: 0, rate_sar: null }],
  })
  return id
}

/** Refuses to remove a contract that a package is still bound to. */
export function removeContract(id: string): { ok: boolean; usedBy: number } {
  const usedBy = state.packages.filter((p) => p.contractIds.includes(id)).length
  if (usedBy > 0) return { ok: false, usedBy }
  const i = state.contracts.findIndex((c) => c.id === id)
  if (i >= 0) state.contracts.splice(i, 1)
  return { ok: true, usedBy: 0 }
}

/** Bind / unbind a package to a housing contract. */
export function toggleContractLink(packageId: string, contractId: string) {
  const pkg = state.packages.find((p) => p.id === packageId)
  if (!pkg) return
  const i = pkg.contractIds.indexOf(contractId)
  if (i >= 0) pkg.contractIds.splice(i, 1)
  else pkg.contractIds.push(contractId)
}

/**
 * Bind / unbind a package to a seat block. Binding defaults the reserved
 * seats to what the package still needs in that direction, capped by the
 * block — the common case is "fill the rest of my pilgrims onto this flight".
 */
export function toggleFlightAllocation(packageId: string, blockId: string) {
  const pkg = state.packages.find((p) => p.id === packageId)
  if (!pkg) return
  const i = pkg.flightAllocations.findIndex((a) => a.blockId === blockId)
  if (i >= 0) {
    pkg.flightAllocations.splice(i, 1)
    return
  }
  const block = state.flightBlocks.find((f) => f.id === blockId)
  const already = pkg.flightAllocations.reduce((t, a) => {
    const b = state.flightBlocks.find((f) => f.id === a.blockId)
    return b?.direction === block?.direction ? t + a.seats : t
  }, 0)
  const remaining = Math.max(0, (pkg.capacity || 0) - already)
  const seats = Math.min(block?.seats ?? 0, remaining > 0 ? remaining : block?.seats ?? 0)
  pkg.flightAllocations.push({ blockId, seats })
}

export function setFlightAllocationSeats(packageId: string, blockId: string, seats: number) {
  const pkg = state.packages.find((p) => p.id === packageId)
  const alloc = pkg?.flightAllocations.find((a) => a.blockId === blockId)
  if (alloc) alloc.seats = Math.max(0, seats)
}

export function addRoomLine(contractId: string): string | null {
  const c = state.contracts.find((x) => x.id === contractId)
  if (!c) return null
  // First room type not already listed, largest first — the 1447 sheets were
  // overwhelmingly quads.
  const taken = new Set(c.lines.map((l) => l.room_type))
  const room_type = (["4", "3", "2"] as const).find((t) => !taken.has(t)) ?? "4"
  const id = nextId("crl")
  c.lines.push({ id, room_type, rooms: 0, rate_sar: null })
  return id
}

export function removeRoomLine(contractId: string, lineId: string) {
  const c = state.contracts.find((x) => x.id === contractId)
  if (!c) return
  const i = c.lines.findIndex((l) => l.id === lineId)
  if (i >= 0) c.lines.splice(i, 1)
}

/** The add wizard collects the whole shape, so no empty-row state exists. */
export function addFlightBlock(data: Omit<DraftFlightBlock, "id">): string {
  const id = nextId("fb")
  state.flightBlocks.push({ id, ...data })
  return id
}

/** Refuses to remove a seat block that a package is still bound to. */
export function removeFlightBlock(id: string): { ok: boolean; usedBy: number } {
  const usedBy = state.packages.filter((p) => p.flightAllocations.some((a) => a.blockId === id)).length
  if (usedBy > 0) return { ok: false, usedBy }
  const i = state.flightBlocks.findIndex((f) => f.id === id)
  if (i >= 0) state.flightBlocks.splice(i, 1)
  return { ok: true, usedBy: 0 }
}
