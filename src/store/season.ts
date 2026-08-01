import { proxy } from "valtio"
import type { CityValue, LegRoleValue, TierValue } from "@/lib/schemas"
import { validateSeason, nightsBetween, type Issue } from "@/lib/validation"

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

export interface DraftState {
  season: { year_hijri: number; year_gregorian: number; quota_total: number }
  hotels: DraftHotel[]
  requirements: DraftRequirement[]
  packages: DraftPackage[]
  /** Node id currently inspected — `"root"`, a package id, or a leg id. */
  selectedId: string
  /** Nodes the user has dragged; re-layout leaves these alone. */
  pinned: Record<string, { x: number; y: number }>
  /**
   * The node created by the last add, so the canvas can frame it instead of
   * re-fitting the whole tree. Cleared once the viewport has moved.
   */
  lastAdded: { id: string; parentId: string } | null
}

/** Hotels used in 1447, as a starting inventory. Verified from ocr/. */
const SEED_HOTELS: DraftHotel[] = [
  { id: "h_swiss", name_ar: "سويس أوتيل مكة", name_en: "Swiss Makkah", city: "makkah", star_class: "5", grade: "أ" },
  { id: "h_pullman", name_ar: "بولمان زمزم مكة", name_en: "Pullman Makkah", city: "makkah", star_class: "5", grade: "أ" },
  { id: "h_hyatt", name_ar: "حياة ريجنسي", name_en: "Hyatt Regency", city: "makkah", star_class: "5", grade: "أ" },
  { id: "h_voco", name_ar: "فوكو", name_en: "Voco", city: "makkah", star_class: "4", grade: "ج" },
  { id: "h_aziziyah", name_ar: "إثراء العزيزية", name_en: "Ithraa Al Aziziyah", city: "makkah", star_class: "nuzul", grade: "م" },
  { id: "h_haram", name_ar: "دار الإيمان الحرم", name_en: "Dar Al Iman Al Haram", city: "madinah", star_class: "5", grade: "أ" },
  { id: "h_hilton", name_ar: "هيلتون المدينة", name_en: "Hilton Madinah", city: "madinah", star_class: "5", grade: "أ" },
  { id: "h_taqwa", name_ar: "إيلاف التقوى", name_en: "Ilaf Al Taqwa", city: "madinah", star_class: "4", grade: "أ" },
  { id: "h_maysan", name_ar: "ميسان رحاب المسك", name_en: "Maysan Rehab Almisk", city: "madinah", star_class: "3", grade: "ج" },
  { id: "h_durrat", name_ar: "درة الإيمان", name_en: "Durrat Al Iman", city: "madinah", star_class: "1", grade: "ج" },
  { id: "h_deyar", name_ar: "ديار الإيمان", name_en: "Deyar Al Iman", city: "madinah", star_class: "1", grade: "ج" },
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
  season: { year_hijri: 1448, year_gregorian: 2027, quota_total: 7000 },
  hotels: SEED_HOTELS,
  requirements: SEED_REQUIREMENTS,
  packages: [],
  selectedId: "root",
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

/* ── actions ────────────────────────────────────────────────────── */

/** Next unused two-digit package number. */
function nextPackageNo(): string {
  const used = new Set(state.packages.map((p) => Number(p.package_no)))
  let n = 1
  while (used.has(n)) n++
  return String(n).padStart(2, "0")
}

export function addPackage(): string {
  const no = nextPackageNo()
  const id = nextId("pkg")
  // Give the new package whatever quota is still unallocated, so the root
  // node stays balanced the moment it appears rather than going red.
  const left = Math.max(0, remaining())
  state.packages.push({
    id,
    package_no: no,
    name_en: `ITHRAA ALKHAIR ${no}`,
    tier: "standard",
    variant_suffix: "",
    capacity: left,
    initial_price_sar: 0,
    legs: [],
  })
  state.selectedId = id
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
  })
  state.selectedId = newId
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
  const start = chain.length ? chain[chain.length - 1].ends_on : `${state.season.year_gregorian}-05-12`
  const end = addDays(start, 3)

  // Alternate cities so the default chain reads Madinah → Makkah like most
  // of the 1447 itineraries.
  const lastHotel = chain.length ? hotelById(chain[chain.length - 1].hotelId) : undefined
  const wantCity: CityValue = lastHotel?.city === "madinah" ? "makkah" : "madinah"
  const hotel = state.hotels.find((h) => h.city === wantCity) ?? state.hotels[0]

  const id = nextId("leg")
  pkg.legs.push({ id, role, hotelId: hotel.id, starts_on: start, ends_on: end })
  state.selectedId = id
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
      publish_status: "draft" as const,
      sale_status: "unavailable" as const,
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
    readiness: new Map(),
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

export function addHotel(city: CityValue = "makkah"): string {
  const id = nextId("h")
  state.hotels.push({
    id,
    name_ar: "",
    name_en: "",
    city,
    star_class: "5",
    grade: "أ",
  })
  return id
}

/** Refuses to remove a hotel that a stay leg still points at. */
export function removeHotel(id: string): { ok: boolean; usedBy: number } {
  const usedBy = state.packages.reduce(
    (t, p) => t + p.legs.filter((l) => l.hotelId === id).length,
    0,
  )
  if (usedBy > 0) return { ok: false, usedBy }
  const i = state.hotels.findIndex((h) => h.id === id)
  if (i >= 0) state.hotels.splice(i, 1)
  return { ok: true, usedBy: 0 }
}
