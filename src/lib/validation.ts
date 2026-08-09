// Extension included so the emitted ESM runs in plain node for the tests
// (tsconfig.test.json) — bundler resolution maps it back to schemas.ts.
import { parseRequirementParams } from "./schemas.js"
import type {
  ContractWithLines,
  FlightBlock,
  Hotel,
  ItineraryWithLegs,
  ItineraryLeg,
  Package,
  Requirement,
  RequirementParamsValue,
  Season,
} from "./schemas.js"

/**
 * Season validation. Every rule here corresponds to a defect that actually
 * occurred in the 1447 pack (see docs/data-model.md §3) — undescribed packages,
 * a duplicated entry, a capacity total that had to be reconciled by hand.
 *
 * `error` blocks submission. `warning` is advisory.
 */

/* ── message translation bridge (docs/i18n-plan.md §2) ──────────────
 *
 * The engine's messages are Arabic templates with `{param}` slots. This
 * module stays pure and node-testable, so it carries its own formatter: the
 * default substitutes params into the Arabic template — byte-identical to
 * the pre-i18n literals, which is what keeps the tests untouched. The app
 * swaps the formatter for i18next at bootstrap (see i18n/config.ts), where
 * an English catalog entry wins and a missing one falls back to Arabic.
 */
export type MessageParams = Record<string, string | number>

export const formatMessage = (key: string, params?: MessageParams): string =>
  key.replace(/\{(\w+)\}/g, (_, k) => String(params?.[k] ?? ""))

let translateMessage: (key: string, params?: MessageParams) => string = formatMessage

export const setMessageTranslator = (fn: typeof translateMessage): void => {
  translateMessage = fn
}

const M = (key: string, params?: MessageParams): string => translateMessage(key, params)

/**
 * Entity display names inside messages (hotels, for now). The engine cannot
 * import `lib/names` — that module reaches the i18n config, which imports this
 * file for the translator hook — so the same choice is injected the same way:
 * default Arabic, and the app swaps in the locale-aware picker at startup.
 */
export type NamedEntity = { name_ar?: string | null; name_en?: string | null }

let pickEntityName: (e: NamedEntity) => string = (e) => e.name_ar || e.name_en || ""

export const setEntityNameLocalizer = (fn: typeof pickEntityName): void => {
  pickEntityName = fn
}

const N = (e: NamedEntity | undefined): string => (e ? pickEntityName(e) : "")

export type IssueLevel = "error" | "warning"

export interface Issue {
  level: IssueLevel
  /** Which rule fired — stable key, safe to use for i18n lookup. */
  code: string
  /** `contract` = one contract's own fields; `inventory` = supply vs demand, keyed by hotel. */
  scope: "leg" | "itinerary" | "package" | "season" | "contract" | "inventory"
  entityId: string
  message: string
}

/* ── categories: how the UI groups findings ─────────────────────── */

export type IssueCategory =
  | "governance" // season rules: quota, mix, pricing, requirements
  | "itinerary" // stay chains: dates, contiguity, roles
  | "package" // one package's own fields
  | "contracts" // a housing contract's own fields
  | "housing" // housing supply vs demand: beds, windows, bindings
  | "flights" // seat blocks: coverage and bindings
  | "other"

/** The `inventory.*` namespace mixes housing and air — these are the air side. */
const FLIGHT_CODES = new Set([
  "inventory.flight_overallocated",
  "inventory.flight_shortfall",
  "inventory.flight_overlinked",
  "inventory.no_flight_link",
  "inventory.flight_link_dangling",
  "inventory.link_cancelled",
  "inventory.arrival_seats",
  "inventory.return_seats",
])

/**
 * Category is derived from the code, not stored on the issue — one mapping
 * here instead of a second field to keep correct at forty push sites.
 */
export function categoryOf(code: string): IssueCategory {
  if (code.startsWith("leg.") || code.startsWith("itinerary.")) return "itinerary"
  if (code.startsWith("package.")) return "package"
  if (code.startsWith("season.")) return "governance"
  if (code.startsWith("contract.")) return "contracts"
  if (code.startsWith("inventory.")) return FLIGHT_CODES.has(code) ? "flights" : "housing"
  return "other"
}

/** PocketBase dates arrive as "YYYY-MM-DD" or a full timestamp. */
function toUTCDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!m) return null
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
}

const DAY_MS = 86_400_000

/**
 * Numbers inside messages use Latin digits, like the rest of the UI and like
 * Nusuk. Plain `toLocaleString("ar-SA")` yields ٧٬٠٠٠, which does not match
 * what the operator sees in the fields the message is telling them to fix.
 */
const NUM = new Intl.NumberFormat("ar-SA-u-nu-latn")
const n = (v: number) => NUM.format(v)

/** Whole days between two PB date strings, or null if either is unparseable. */
export function nightsBetween(start: string, end: string): number | null {
  const a = toUTCDate(start)
  const b = toUTCDate(end)
  if (!a || !b) return null
  return Math.round((b.getTime() - a.getTime()) / DAY_MS)
}

/** Legs in true chronological order. Role labels are NOT order — see §1. */
export function chronological(legs: ItineraryLeg[]): ItineraryLeg[] {
  return [...legs].sort((a, b) => a.starts_on.localeCompare(b.starts_on))
}

/* ── itinerary ──────────────────────────────────────────────────── */

export function validateItinerary(
  itin: ItineraryWithLegs,
  /**
   * Context for severity and wording. A package still in `draft` is *unfinished*,
   * not *wrong* — flagging an empty brand-new card as a blocking error painted
   * the whole canvas red the moment you added anything.
   */
  ctx: { draft?: boolean; label?: string } = {},
): Issue[] {
  const issues: Issue[] = []
  const id = itin.id ?? itin.code
  const where = ctx.label ? `${ctx.label}: ` : ""
  const at = (level: IssueLevel, code: string, message: string, scope: Issue["scope"] = "itinerary", entityId = id) =>
    issues.push({ level, code, scope, entityId, message: `${where}${message}` })

  if (itin.legs.length === 0) {
    at(ctx.draft ? "warning" : "error", "itinerary.empty", M("لم تُضَف أي إقامة بعد."))
    return issues
  }

  // per-leg: nights must equal the date span exactly
  for (const leg of itin.legs) {
    const span = nightsBetween(leg.starts_on, leg.ends_on)
    const legId = leg.id ?? `${id}#${leg.sequence}`
    if (span === null) {
      at("error", "leg.bad_date", M("تاريخ غير صالح في الإقامة."), "leg", legId)
      continue
    }
    if (span <= 0) {
      at("error", "leg.non_positive", M("تاريخ النهاية يجب أن يكون بعد تاريخ البداية."), "leg", legId)
      continue
    }
    if (span !== leg.nights) {
      at("error", "leg.nights_mismatch", M("عدد الليالي ({p0}) لا يطابق المدة بين التاريخين ({span}).", { p0: leg.nights, span: span }), "leg", legId)
    }
  }

  // roles: at most one of each, `first` required
  const byRole = new Map<string, number>()
  for (const leg of itin.legs) byRole.set(leg.role, (byRole.get(leg.role) ?? 0) + 1)
  for (const [role, n] of byRole) {
    if (n > 1) at("error", "itinerary.duplicate_role", M("تكرار الإقامة بدور «{role}» {n} مرات.", { role: role, n: n }))
  }
  if (!byRole.has("first")) at("error", "itinerary.missing_first", M("لا توجد إقامة أولى."))

  // contiguity, in chronological order — no gaps, no overlaps
  const chrono = chronological(itin.legs)
  for (let i = 1; i < chrono.length; i++) {
    const prev = chrono[i - 1]
    const cur = chrono[i]
    if (prev.ends_on.slice(0, 10) !== cur.starts_on.slice(0, 10)) {
      at(
        "error",
        "itinerary.not_contiguous",
        M("فجوة أو تداخل بين الإقامات: تنتهي {p0} وتبدأ التالية {p1}.", { p0: prev.ends_on.slice(0, 10), p1: cur.starts_on.slice(0, 10) }),
      )
    }
  }

  // derived fields must agree with the legs
  const sum = itin.legs.reduce((t, l) => t + (l.nights || 0), 0)
  if (itin.total_nights !== sum) {
    at("error", "itinerary.total_nights", M("إجمالي الليالي المخزَّن ({p0}) لا يطابق مجموع الإقامات ({sum}).", { p0: itin.total_nights, sum: sum }))
  }

  const hasTransitional = itin.legs.some((l) => l.role === "transitional")
  if (itin.is_shifting !== hasTransitional) {
    at("error", "itinerary.shifting_flag", M("علامة «الانتقالي» لا تطابق وجود إقامة انتقالية."))
  }

  if (chrono.length) {
    const first = chrono[0].starts_on.slice(0, 10)
    const last = chrono[chrono.length - 1].ends_on.slice(0, 10)
    if (itin.starts_on?.slice(0, 10) !== first) at("warning", "itinerary.starts_on", M("تاريخ بداية المسار لا يطابق أول إقامة."))
    if (itin.ends_on?.slice(0, 10) !== last) at("warning", "itinerary.ends_on", M("تاريخ نهاية المسار لا يطابق آخر إقامة."))
  }

  return issues
}

/* ── package ────────────────────────────────────────────────────── */

export interface PackageReadiness {
  hasArabicBody: boolean
  hasEnglishBody: boolean
  approvedHeroCount: number
}

export function validatePackage(
  pkg: Package,
  itin: ItineraryWithLegs | undefined,
  readiness: PackageReadiness,
): Issue[] {
  const issues: Issue[] = []
  const id = pkg.id ?? pkg.package_no
  const at = (level: IssueLevel, code: string, message: string) =>
    issues.push({ level, code, scope: "package", entityId: id, message })

  if (!itin) {
    at("error", "package.no_itinerary", M("الباقة غير مرتبطة بمسار."))
  } else if (pkg.is_shifting !== itin.is_shifting) {
    at("error", "package.shifting_mismatch", M("نوع الباقة (انتقالية) لا يطابق المسار المرتبط بها."))
  }

  // Unset while still drafting is "not done yet", not "wrong". The season-level
  // quota check is what actually blocks a set of capacities that doesn't add up.
  const unset: IssueLevel = pkg.publish_status === "draft" ? "warning" : "error"
  if (!(pkg.capacity > 0)) at(unset, "package.capacity", M("لم تُحدَّد سعة الباقة بعد."))
  if (!(pkg.initial_price_sar > 0)) at(unset, "package.price", M("لم يُحدَّد السعر الابتدائي بعد."))

  // A partially-entered mix is wrong, not merely unfinished — a mix that
  // doesn't sum to the capacity houses ghosts or leaves pilgrims roomless.
  const mixSum = roomMixTotal(pkg)
  if (mixSum > 0 && pkg.capacity > 0 && mixSum !== pkg.capacity) {
    at("error", "package.room_mix_total", M("توزيع الغرف ({p0} حاج) لا يساوي سعة الباقة ({p1}).", { p0: n(mixSum), p1: n(pkg.capacity) }))
  }

  // The gate that would have caught packages 33–39 in 1447: priced, but never described.
  if (pkg.publish_status !== "draft") {
    if (!readiness.hasArabicBody) at("error", "package.no_body_ar", M("لا يمكن رفع باقة بدون وصف عربي."))
    if (!readiness.hasEnglishBody) at("warning", "package.no_body_en", M("لا يوجد وصف إنجليزي للباقة."))
    if (readiness.approvedHeroCount < 1) at("error", "package.no_hero", M("لا توجد صورة رئيسية معتمدة للباقة."))
  }

  return issues
}

/** Σ of a package's room mix; 0 when absent (older callers, unplanned drafts). */
function roomMixTotal(pkg: Package): number {
  const m = pkg.room_mix
  if (!m) return 0
  return (Number(m["2"]) || 0) + (Number(m["3"]) || 0) + (Number(m["4"]) || 0)
}

const ROOM_TYPE_LABEL: Record<string, string> = {
  "2": "الثنائية",
  "3": "الثلاثية",
  "4": "الرباعية",
}

/* ── contract ───────────────────────────────────────────────────── */

/** The slice of a hotel the inventory rules need. */
export type HotelRef = Pick<Hotel, "id" | "name_ar" | "city"> & NamedEntity

export function validateContract(c: ContractWithLines, hotel: HotelRef | undefined): Issue[] {
  const issues: Issue[] = []
  const id = c.id ?? c.contract_no
  const label = M("عقد {p0}{p1}", { p0: c.contract_no || M("بدون رقم"), p1: hotel ? ` — ${N(hotel)}` : "" })
  const at = (level: IssueLevel, code: string, message: string) =>
    issues.push({ level, code, scope: "contract", entityId: id, message: `${label}: ${message}` })

  const span = nightsBetween(c.starts_on, c.ends_on)
  if (span === null) at("error", "contract.bad_date", M("تاريخ غير صالح في نافذة العقد."))
  else if (span <= 0) at("error", "contract.window", M("نهاية العقد يجب أن تكون بعد بدايته."))

  if (!c.contract_no) at("warning", "contract.no_number", M("لم يُدخَل رقم العقد بعد."))
  if (!hotel) at("error", "contract.no_hotel", M("العقد غير مرتبط بفندق."))

  // The 1447 lesson: the entered total lied (rooms, or double-sold beds).
  // Beds are only ever the sum of the room-type lines.
  let total = 0
  for (const line of c.lines) {
    const expect = line.rooms * Number(line.room_type)
    if (line.beds !== expect) {
      at(
        "error",
        "contract.line_beds",
        M("أسرّة الغرف {p0} ({p1}) لا تطابق عدد الغرف × السعة ({p2}).", { p0: M(ROOM_TYPE_LABEL[line.room_type] ?? line.room_type), p1: n(line.beds), p2: n(expect) }),
      )
    }
    total += line.beds
  }
  if (c.lines.length === 0) at("warning", "contract.no_lines", M("لا توجد أنواع غرف — العقد لا يوفّر أي سرير."))
  if (c.beds_total !== total) {
    at("error", "contract.beds_total", M("إجمالي الأسرّة المخزَّن ({p0}) لا يطابق مجموع الغرف ({p1}).", { p0: n(c.beds_total), p1: n(total) }))
  }

  // Shifting supply is Makkah supply by definition; a madinah hotel can't carry it.
  if (c.city === "shifting" && hotel && hotel.city !== "makkah") {
    at("error", "contract.shifting_city", M("عقد انتقالي على فندق خارج مكة المكرمة."))
  }

  return issues
}

/* ── season ─────────────────────────────────────────────────────── */

export interface SeasonInput {
  season: Season
  packages: Package[]
  itineraries: Map<string, ItineraryWithLegs>
  /** Agreed requirements from meetings — the source of quota, mix and pricing bounds. */
  requirements: Requirement[]
  readiness: Map<string, PackageReadiness>
  /** Supply side — optional so callers without inventory keep working unchanged. */
  hotels?: HotelRef[]
  contracts?: ContractWithLines[]
  flightBlocks?: FlightBlock[]
}

const EMPTY_READINESS: PackageReadiness = {
  hasArabicBody: false,
  hasEnglishBody: false,
  approvedHeroCount: 0,
}

export function validateSeason(input: SeasonInput): Issue[] {
  const { season, packages, itineraries, requirements, readiness } = input
  const { hotels = [], contracts = [], flightBlocks = [] } = input
  const issues: Issue[] = []
  const seasonId = season.id ?? String(season.year_hijri)
  const at = (level: IssueLevel, code: string, message: string) =>
    issues.push({ level, code, scope: "season", entityId: seasonId, message })

  // Only requirements the parties actually agreed on are enforced.
  const agreed = requirements.filter((r) => r.status === "agreed")

  // Itineraries are validated through their owning package so every message can
  // say which package it is about, and inherit that package's draft status.
  const ownerOf = new Map<string, Package>()
  for (const pkg of packages) if (pkg.itinerary) ownerOf.set(pkg.itinerary, pkg)

  for (const [itinId, itin] of itineraries) {
    const owner = ownerOf.get(itinId)
    issues.push(
      ...validateItinerary(itin, {
        draft: owner ? owner.publish_status === "draft" : true,
        label: owner ? M("باقة {p0}", { p0: owner.package_no }) : undefined,
      }),
    )
  }

  for (const pkg of packages) {
    const itin = pkg.itinerary ? itineraries.get(pkg.itinerary) : undefined
    const own = validatePackage(pkg, itin, readiness.get(pkg.id ?? "") ?? EMPTY_READINESS)
    // Same treatment for package-level messages.
    for (const i of own) issues.push({ ...i, message: M("باقة {p0}: {p1}", { p0: pkg.package_no, p1: i.message }) })
  }

  // uniqueness within the season
  for (const [field, label] of [
    ["package_no", "رقم الباقة"],
    ["nusuk_id", "معرّف نسك"],
  ] as const) {
    const seen = new Map<string, number>()
    for (const p of packages) {
      const v = p[field]
      if (!v) continue
      seen.set(v, (seen.get(v) ?? 0) + 1)
    }
    for (const [v, n] of seen) {
      if (n > 1) at("error", `season.duplicate_${field}`, M("{label} «{v}» مكرر {n} مرات.", { label: M(label), v: v, n: n }))
    }
  }

  // total capacity must land exactly on the quota — 1447 hit 7000 on the nose.
  // An agreed `quota` requirement overrides the season's stored figure.
  const total = packages.reduce((t, p) => t + (p.capacity || 0), 0)
  const quotaReq = agreed
    .map(parseRequirementParams)
    .find((p): p is Extract<RequirementParamsValue, { kind: "quota" }> => p?.kind === "quota")
  const quota = quotaReq?.total ?? season.quota_total
  if (total !== quota) {
    const diff = total - quota
    at(
      "error",
      "season.quota_total",
      M("مجموع سعات الباقات {p0} {p1} من الحصة {p2} بمقدار {p3}.", { p0: n(total), p1: diff > 0 ? "أكبر" : "أقل", p2: n(quota), p3: n(Math.abs(diff)) }),
    )
  }

  // tier mix: premium-and-above vs standard
  if (total > 0) {
    const standard = packages.filter((p) => p.tier === "standard").reduce((t, p) => t + (p.capacity || 0), 0)
    const pct = {
      standard: (standard / total) * 100,
      premium_and_above: ((total - standard) / total) * 100,
    }
    for (const req of agreed) {
      const params = parseRequirementParams(req)
      if (params?.kind !== "mix") continue
      const actual = pct[params.group]
      if (params.max_pct != null && actual > params.max_pct + 1e-9) {
        at("error", "season.mix_max", M("«{p0}»: النسبة {p1}% تتجاوز الحد الأعلى {p2}%.", { p0: req.title, p1: actual.toFixed(1), p2: params.max_pct }))
      }
      if (params.min_pct != null && actual < params.min_pct - 1e-9) {
        at("error", "season.mix_min", M("«{p0}»: النسبة {p1}% أقل من الحد الأدنى {p2}%.", { p0: req.title, p1: actual.toFixed(1), p2: params.min_pct }))
      }
    }
  }

  // pricing bounds per tier
  for (const req of agreed) {
    const params = parseRequirementParams(req)
    if (params?.kind !== "pricing") continue
    for (const p of packages.filter((x) => x.tier === params.tier)) {
      if (params.max_sar != null && p.initial_price_sar > params.max_sar) {
        at("error", "season.price_max", M("«{p0}»: سعر الباقة {p1} يتجاوز الحد الأعلى {p2}.", { p0: req.title, p1: p.package_no, p2: params.max_sar }))
      }
      if (params.min_sar != null && p.initial_price_sar < params.min_sar) {
        at("error", "season.price_min", M("«{p0}»: سعر الباقة {p1} أقل من الحد الأدنى {p2}.", { p0: req.title, p1: p.package_no, p2: params.min_sar }))
      }
    }
  }

  // hotel constraints
  const usedHotels = new Set<string>()
  for (const itin of itineraries.values()) for (const leg of itin.legs) usedHotels.add(leg.hotel)
  for (const req of agreed) {
    const params = parseRequirementParams(req)
    if (params?.kind !== "hotel") continue
    const used = usedHotels.has(params.hotel)
    if (params.rule === "must_not_use" && used) {
      at("error", "season.hotel_forbidden", M("«{p0}»: فندق مستبعد ما زال مستخدمًا في أحد المسارات.", { p0: req.title }))
    }
    if (params.rule === "must_use" && !used) {
      at("warning", "season.hotel_unused", M("«{p0}»: فندق مطلوب لم يُستخدم في أي مسار.", { p0: req.title }))
    }
  }

  // free-text requirements are not machine-checkable — they must be signed off
  for (const req of agreed) {
    if (req.kind === "note" && !req.acknowledged) {
      at("warning", "season.note_unacknowledged", M("متطلب غير مؤكَّد: «{p0}».", { p0: req.title }))
    }
  }

  const quotaForFlights =
    agreed
      .map(parseRequirementParams)
      .find((p): p is Extract<RequirementParamsValue, { kind: "quota" }> => p?.kind === "quota")
      ?.total ?? season.quota_total

  issues.push(
    ...validateInventory({ packages, itineraries, hotels, contracts, flightBlocks, quota: quotaForFlights }),
  )

  // Flight coverage: enough confirmed seats to move the quota, each direction.
  // Warnings only, and only once blocks exist — seat blocks firm up later than
  // housing, and an empty list is "not started", not "short".
  if (flightBlocks.length > 0) {
    for (const [direction, code, label] of [
      ["arrival", "inventory.arrival_seats", "الوصول"],
      ["return", "inventory.return_seats", "المغادرة"],
    ] as const) {
      const seats = flightBlocks
        .filter((f) => f.direction === direction && f.status === "confirmed")
        .reduce((t, f) => t + (f.seats || 0), 0)
      if (seats < quotaForFlights) {
        issues.push({
          level: "warning",
          code,
          scope: "inventory",
          entityId: seasonId,
          message: M("مقاعد {label} المؤكَّدة ({p1}) أقل من الحصة ({p2}).", { label: M(label), p1: n(seats), p2: n(quotaForFlights) }),
        })
      }
    }
  }

  return issues
}

/* ── inventory: supply vs demand, per hotel per night ───────────── */

/** A dated amount: `amount` beds (or pilgrims) for `nights` nights from `start`. */
interface Span {
  start: number // UTC ms of the first night
  nights: number
  amount: number
}

const coversNight = (s: Span, night: number) =>
  night >= s.start && night < s.start + s.nights * DAY_MS

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

interface SweepRun {
  kind: "gap" | "over"
  from: number
  to: number
  /** Peak shortfall across the run (beds); 0 for gaps. */
  short: number
}

/**
 * Night-by-night comparison of demand against supply over the demanded range.
 * Consecutive nights with the same finding merge into one run — a 4-night
 * shortfall is one result at its peak, not four. Shared by the hotel-level
 * aggregate check and the per-contract binding check.
 */
function sweepShortfalls(demand: Span[], supply: Span[]): SweepRun[] {
  if (demand.length === 0) return []
  const first = Math.min(...demand.map((s) => s.start))
  const last = Math.max(...demand.map((s) => s.start + (s.nights - 1) * DAY_MS))
  const runs: SweepRun[] = []
  let run: { kind: "ok" | "gap" | "over"; from: number; to: number; short: number } | null = null

  // The season spans weeks; the cap only guards against a typo'd year turning
  // the sweep into a decade.
  for (let night = first, i = 0; night <= last && i < 400; night += DAY_MS, i++) {
    const need = demand.filter((s) => coversNight(s, night)).reduce((t, s) => t + s.amount, 0)
    let kind: "ok" | "gap" | "over" = "ok"
    let short = 0
    if (need > 0) {
      const covering = supply.filter((s) => coversNight(s, night))
      if (covering.length === 0) kind = "gap"
      else {
        const have = covering.reduce((t, s) => t + s.amount, 0)
        if (need > have) {
          kind = "over"
          short = need - have
        }
      }
    }
    if (run && run.kind === kind) {
      run.to = night
      run.short = Math.max(run.short, short)
    } else {
      if (run && run.kind !== "ok") runs.push(run as SweepRun)
      run = { kind, from: night, to: night, short }
    }
  }
  if (run && run.kind !== "ok") runs.push(run as SweepRun)
  return runs
}

const rangeLabel = (r: SweepRun) =>
  r.from === r.to ? M("ليلة {p0}", { p0: iso(r.from) }) : M("الليالي من {p0} حتى {p1}", { p0: iso(r.from), p1: iso(r.to) })

/**
 * The check 1447 structurally could not run: its rooms carried no dates, so a
 * room stayed "full" after its occupants left and stays were never compared to
 * contract windows. Here legs have exact dates and contracts have windows, so
 * supply and demand meet night by night.
 *
 * Only `signed` contracts are supply. A used hotel with no signed contract is a
 * warning, not an error — hotels start as prospects and a bare list must not
 * block itinerary drafting.
 */
function validateInventory(input: {
  packages: Package[]
  itineraries: Map<string, ItineraryWithLegs>
  hotels: HotelRef[]
  contracts: ContractWithLines[]
  flightBlocks: FlightBlock[]
  quota: number
}): Issue[] {
  const { packages, itineraries, hotels, contracts } = input
  const issues: Issue[] = []
  const hotelName = (id: string) => N(hotels.find((h) => h.id === id)) || id

  // Duplicate business keys — a warning, since the platform occasionally reissues.
  const seen = new Map<string, number>()
  for (const c of contracts) if (c.contract_no) seen.set(c.contract_no, (seen.get(c.contract_no) ?? 0) + 1)
  for (const [no, count] of seen) {
    if (count > 1) {
      issues.push({
        level: "warning",
        code: "inventory.duplicate_contract_no",
        scope: "inventory",
        entityId: no,
        message: M("رقم العقد {no} مكرر {p1} مرات.", { no: no, p1: n(count) }),
      })
    }
  }

  // demand: each leg loads its hotel with the owning package's capacity
  const demandBy = new Map<string, Span[]>()
  for (const pkg of packages) {
    if (!(pkg.capacity > 0) || !pkg.itinerary) continue
    const itin = itineraries.get(pkg.itinerary)
    if (!itin) continue
    for (const leg of itin.legs) {
      const start = toUTCDate(leg.starts_on)
      const nights = nightsBetween(leg.starts_on, leg.ends_on)
      if (!start || !nights || nights <= 0) continue // bad dates already reported per leg
      const spans = demandBy.get(leg.hotel) ?? []
      spans.push({ start: start.getTime(), nights, amount: pkg.capacity })
      demandBy.set(leg.hotel, spans)
    }
  }

  // supply: signed contract windows
  const supplyBy = new Map<string, Span[]>()
  for (const c of contracts) {
    if (c.status !== "signed" || !c.hotel) continue
    const start = toUTCDate(c.starts_on)
    const nights = nightsBetween(c.starts_on, c.ends_on)
    if (!start || !nights || nights <= 0) continue // contract's own issues already reported
    const spans = supplyBy.get(c.hotel) ?? []
    spans.push({ start: start.getTime(), nights, amount: c.beds_total })
    supplyBy.set(c.hotel, spans)
  }

  for (const [hotelId, demand] of demandBy) {
    const supply = supplyBy.get(hotelId)
    if (!supply) {
      issues.push({
        level: "warning",
        code: "inventory.no_contract",
        scope: "inventory",
        entityId: hotelId,
        message: M("فندق «{p0}»: لا يوجد عقد سكن موقَّع لهذا الفندق.", { p0: hotelName(hotelId) }),
      })
      continue
    }

    for (const r of sweepShortfalls(demand, supply)) {
      if (r.kind === "gap") {
        issues.push({
          level: "warning",
          code: "inventory.window_gap",
          scope: "inventory",
          entityId: hotelId,
          message: M("فندق «{p0}»: {p1} خارج نافذة أي عقد موقَّع.", { p0: hotelName(hotelId), p1: rangeLabel(r) }),
        })
      } else {
        issues.push({
          level: "error",
          code: "inventory.overbooked",
          scope: "inventory",
          entityId: hotelId,
          // «سعات الباقات», not «الطلب»: the figure is planned capacity at
          // full sell-out, not today's bookings.
          message: M("فندق «{p0}»: سعات الباقات تتجاوز الأسرّة المتعاقد عليها بمقدار {p1} سرير ({p2}).", { p0: hotelName(hotelId), p1: n(r.short), p2: rangeLabel(r) }),
        })
      }
    }
  }

  issues.push(...validateBindings(input))

  return issues
}

/* ── explicit bindings: package ↔ contract, package ↔ seat block ── */

/**
 * The 1447 system pinned beds to packages downstream, in the contract sheet.
 * Here the author binds each package to the contracts and seat blocks that
 * serve it, so the checks can be per-contract and per-block instead of only
 * per-hotel aggregate. The aggregate sweep above stays as the safety net for
 * whatever is not bound yet.
 */
function validateBindings(input: {
  packages: Package[]
  itineraries: Map<string, ItineraryWithLegs>
  hotels: HotelRef[]
  contracts: ContractWithLines[]
  flightBlocks: FlightBlock[]
  quota: number
}): Issue[] {
  const { packages, itineraries, hotels, contracts, flightBlocks, quota } = input
  const issues: Issue[] = []
  const hotelName = (id: string) => N(hotels.find((h) => h.id === id)) || id
  const contractById = new Map(contracts.map((c) => [c.id ?? c.contract_no, c]))
  const at = (
    level: IssueLevel,
    code: string,
    scope: Issue["scope"],
    entityId: string,
    message: string,
  ) => issues.push({ level, code, scope, entityId, message })

  /* housing contracts */

  // Beds each bound package asks of each contract, per night. When several
  // bound contracts on one hotel cover the same night, the demand SPLITS
  // between them in proportion to their beds — charging the full demand to
  // each would flag overlapping windows (Haram's raw 16–21 and 18–21 really
  // overlap) as short when their combined beds suffice.
  const nightLoad = new Map<string, Map<number, number>>() // contractId → night → beds
  const nightTypeLoad = new Map<string, Map<number, number>>() // `${contractId}|${rt}`
  // Hotels each package is bound to through its contracts.
  const boundHotels = new Map<string, Set<string>>()

  const contractBedsOf = (c: ContractWithLines) =>
    c.lines.reduce((t, l) => t + (l.beds || 0), 0)
  const typeBedsOf = (c: ContractWithLines, rt: string) =>
    c.lines.filter((l) => l.room_type === rt).reduce((t, l) => t + (l.beds || 0), 0)
  const bump = (m: Map<string, Map<number, number>>, key: string, night: number, amount: number) => {
    const inner = m.get(key) ?? new Map<number, number>()
    inner.set(night, (inner.get(night) ?? 0) + amount)
    m.set(key, inner)
  }

  for (const pkg of packages) {
    const pkgId = pkg.id ?? pkg.package_no
    const itin = pkg.itinerary ? itineraries.get(pkg.itinerary) : undefined
    const legHotels = new Set(itin?.legs.map((l) => l.hotel) ?? [])
    const bound = new Set<string>()
    const usableByHotel = new Map<string, ContractWithLines[]>()
    boundHotels.set(pkgId, bound)

    for (const cid of pkg.housing_contracts ?? []) {
      const c = contractById.get(cid)
      if (!c) {
        // The store refuses removals while bound, so this only happens to imported data.
        at("warning", "inventory.link_dangling", "package", pkgId, M("باقة {p0}: مرتبطة بعقد سكن لم يعد موجودًا.", { p0: pkg.package_no }))
        continue
      }
      if (!c.hotel || !legHotels.has(c.hotel)) {
        at(
          "warning",
          "inventory.link_idle",
          "package",
          pkgId,
          M("باقة {p0}: مرتبطة بعقد {p1} على فندق «{p2}» ولا إقامة لها فيه.", { p0: pkg.package_no, p1: c.contract_no || M("بدون رقم"), p2: hotelName(c.hotel ?? "") }),
        )
        continue
      }
      if (c.status !== "signed") {
        at(
          "warning",
          "inventory.link_unsigned",
          "package",
          pkgId,
          M("باقة {p0}: مرتبطة بعقد {p1} غير موقَّع.", { p0: pkg.package_no, p1: c.contract_no || M("بدون رقم") }),
        )
      }
      bound.add(c.hotel)
      const list = usableByHotel.get(c.hotel) ?? []
      list.push(c)
      usableByHotel.set(c.hotel, list)
    }

    if (!(pkg.capacity > 0) || !itin) continue
    const mix = roomMixTotal(pkg) > 0 ? pkg.room_mix : null
    for (const leg of itin.legs) {
      const candidates = usableByHotel.get(leg.hotel)
      if (!candidates?.length) continue
      const start = toUTCDate(leg.starts_on)
      const nights = nightsBetween(leg.starts_on, leg.ends_on)
      if (!start || !nights || nights <= 0) continue
      for (let i = 0, night = start.getTime(); i < nights && i < 400; i++, night += DAY_MS) {
        const covering = candidates.filter((c) => {
          const s = toUTCDate(c.starts_on)
          const n = nightsBetween(c.starts_on, c.ends_on)
          return s && n && n > 0 && coversNight({ start: s.getTime(), nights: n, amount: 0 }, night)
        })
        if (!covering.length) continue // the union gap check below owns this night
        const totalBeds = covering.reduce((t, c) => t + contractBedsOf(c), 0)
        for (const c of covering) {
          const share = totalBeds > 0 ? contractBedsOf(c) / totalBeds : 1 / covering.length
          bump(nightLoad, c.id ?? c.contract_no, night, pkg.capacity * share)
        }
        if (mix && covering.some((c) => c.city !== "shifting")) {
          for (const rt of ["2", "3", "4"] as const) {
            const people = Number(mix[rt]) || 0
            if (people <= 0) continue
            const eligible = covering.filter((c) => c.city !== "shifting")
            const totalType = eligible.reduce((t, c) => t + typeBedsOf(c, rt), 0)
            for (const c of eligible) {
              const share = totalType > 0 ? typeBedsOf(c, rt) / totalType : 1 / eligible.length
              bump(nightTypeLoad, `${c.id ?? c.contract_no}|${rt}`, night, people * share)
            }
          }
        }
      }
    }
  }

  // Merge consecutive short nights into one finding at its peak.
  const overRuns = (nights: Map<number, number>, limit: number): SweepRun[] => {
    const sorted = [...nights.entries()].sort(([a], [b]) => a - b)
    const runs: SweepRun[] = []
    let run: SweepRun | null = null
    for (const [night, load] of sorted) {
      const short = Math.round(load) - limit
      if (short > 0 && run && night === run.to + DAY_MS) {
        run.to = night
        run.short = Math.max(run.short, short)
      } else if (short > 0) {
        if (run) runs.push(run)
        run = { kind: "over", from: night, to: night, short }
      } else if (run) {
        runs.push(run)
        run = null
      }
    }
    if (run) runs.push(run)
    return runs
  }

  // Each contract against the share of demand that actually falls on it.
  // «سعات الباقات» in the messages, deliberately: the number is the planned
  // capacity at full sell-out, not today's bookings — 1447 validated fine at
  // its real 62% occupancy while these same gaps existed on paper.
  for (const [cid, nights] of nightLoad) {
    const c = contractById.get(cid)!
    const label = M("عقد {p0} — {p1}", { p0: c.contract_no || M("بدون رقم"), p1: hotelName(c.hotel) })
    for (const r of overRuns(nights, contractBedsOf(c))) {
      at(
        "error",
        "inventory.contract_overallocated",
        "contract",
        cid,
        M("{label}: سعات الباقات المرتبطة به تتجاوز أسرّته بمقدار {p1} سرير ({p2}).", { label: label, p1: n(r.short), p2: rangeLabel(r) }),
      )
    }
  }

  // Same, one room type at a time: a contract can have beds to spare overall
  // and still be short of quads — the 1447 supply is 80% quads, and the
  // premium mixes want the scarce doubles and triples. Shifting contracts
  // were exempted during accumulation: the 1447 shifting building was
  // quad-only nuzul housing while its packages sold doubles and triples.
  for (const [key, nights] of nightTypeLoad) {
    const [cid, rt] = key.split("|")
    const c = contractById.get(cid)!
    for (const r of overRuns(nights, typeBedsOf(c, rt))) {
      at(
        "error",
        "inventory.room_type_overallocated",
        "contract",
        cid,
        M("عقد {p0} — {p1}: الغرف {p2} تنقص {p3} سريرًا عن خطة توزيع الغرف عند اكتمال سعات الباقات المرتبطة ({p4}).", { p0: c.contract_no || M("بدون رقم"), p1: hotelName(c.hotel), p2: M(ROOM_TYPE_LABEL[rt]), p3: n(r.short), p4: rangeLabel(r) }),
      )
    }
  }

  // Per package × hotel: the union of its bound contracts' windows must cover
  // the stay. Beds are irrelevant here (the checks above own that), so the
  // union spans carry effectively infinite capacity to silence "over" runs.
  for (const pkg of packages) {
    const pkgId = pkg.id ?? pkg.package_no
    const itin = pkg.itinerary ? itineraries.get(pkg.itinerary) : undefined
    if (!itin) continue
    const byHotel = new Map<string, Span[]>()
    for (const cid of pkg.housing_contracts ?? []) {
      const c = contractById.get(cid)
      if (!c?.hotel) continue
      const start = toUTCDate(c.starts_on)
      const nights = nightsBetween(c.starts_on, c.ends_on)
      if (!start || !nights || nights <= 0) continue
      const spans = byHotel.get(c.hotel) ?? []
      spans.push({ start: start.getTime(), nights, amount: Number.MAX_SAFE_INTEGER })
      byHotel.set(c.hotel, spans)
    }
    for (const [hotelId, windows] of byHotel) {
      const stay: Span[] = []
      for (const leg of itin.legs) {
        if (leg.hotel !== hotelId) continue
        const start = toUTCDate(leg.starts_on)
        const nights = nightsBetween(leg.starts_on, leg.ends_on)
        if (!start || !nights || nights <= 0) continue
        stay.push({ start: start.getTime(), nights, amount: 1 })
      }
      for (const r of sweepShortfalls(stay, windows)) {
        if (r.kind !== "gap") continue
        at(
          "warning",
          "inventory.link_window",
          "package",
          pkgId,
          M("باقة {p0}: {p1} في فندق «{p2}» خارج نوافذ العقود المرتبطة.", { p0: pkg.package_no, p1: rangeLabel(r), p2: hotelName(hotelId) }),
        )
      }
    }
  }

  // Nudge: a stay at a hotel that has signed contracts, none of them bound.
  const signedHotels = new Set(
    contracts.filter((c) => c.status === "signed" && c.hotel).map((c) => c.hotel),
  )
  for (const pkg of packages) {
    const pkgId = pkg.id ?? pkg.package_no
    const itin = pkg.itinerary ? itineraries.get(pkg.itinerary) : undefined
    if (!itin) continue
    const bound = boundHotels.get(pkgId) ?? new Set()
    const flagged = new Set<string>()
    for (const leg of itin.legs) {
      if (!signedHotels.has(leg.hotel) || bound.has(leg.hotel) || flagged.has(leg.hotel)) continue
      flagged.add(leg.hotel)
      at(
        "warning",
        "inventory.no_contract_link",
        "package",
        pkgId,
        M("باقة {p0}: لا ترتبط بأي عقد سكن لفندق «{p1}» رغم وجود عقود موقَّعة عليه.", { p0: pkg.package_no, p1: hotelName(leg.hotel) }),
      )
    }
    // Once beds are bound, the mix decides *which* beds — nudge for it.
    if (pkg.capacity > 0 && (boundHotels.get(pkgId)?.size ?? 0) > 0 && roomMixTotal(pkg) === 0) {
      at(
        "warning",
        "inventory.no_room_mix",
        "package",
        pkgId,
        M("باقة {p0}: مرتبطة بعقود سكن دون توزيع الحجاج على أنواع الغرف.", { p0: pkg.package_no }),
      )
    }
  }

  /* flight seat blocks */

  const blockById = new Map(flightBlocks.map((f) => [f.id ?? "", f]))
  const blockLabel = (f: FlightBlock) =>
    M("كتلة {p0} {p1}", { p0: M(f.direction === "arrival" ? "الوصول" : "المغادرة"), p1: [N({ name_ar: f.airline_ar, name_en: f.airline_en }), f.flight_no].filter(Boolean).join(" ") || f.pnr || "" }).trim()

  // Allocations carry seat counts, so the block check is exact arithmetic:
  // Σ allocated seats per block against its seats. No splitting heuristics —
  // a 500-pilgrim package allocates, say, 150+180+170 across three flights.
  const blockLoad = new Map<string, number>()
  const allocatedByDirection = new Map<string, { arrival: number; return: number; linked: Set<"arrival" | "return"> }>()
  for (const pkg of packages) {
    const pkgId = pkg.id ?? pkg.package_no
    const tally = { arrival: 0, return: 0, linked: new Set<"arrival" | "return">() }
    allocatedByDirection.set(pkgId, tally)
    for (const alloc of pkg.flight_allocations ?? []) {
      const f = blockById.get(alloc.block)
      if (!f) {
        at("warning", "inventory.flight_link_dangling", "package", pkgId, M("باقة {p0}: مرتبطة بكتلة مقاعد لم تعد موجودة.", { p0: pkg.package_no }))
        continue
      }
      if (f.status === "cancelled") {
        at("warning", "inventory.link_cancelled", "package", pkgId, M("باقة {p0}: مرتبطة بكتلة مقاعد ملغاة ({p1}).", { p0: pkg.package_no, p1: blockLabel(f) }))
        continue
      }
      tally.linked.add(f.direction)
      tally[f.direction] += alloc.seats || 0
      blockLoad.set(alloc.block, (blockLoad.get(alloc.block) ?? 0) + (alloc.seats || 0))
    }
  }
  for (const [fid, load] of blockLoad) {
    const f = blockById.get(fid)!
    if (load > (f.seats || 0)) {
      at(
        "error",
        "inventory.flight_overallocated",
        "inventory",
        fid,
        M("{p0}: المقاعد المخصصة للباقات ({p1}) تتجاوز مقاعدها ({p2}).", { p0: blockLabel(f), p1: n(load), p2: n(f.seats || 0) }),
      )
    }
  }

  // Per package per direction. Coverage nudges are gated on the fleet being
  // able to carry the quota at all — while it can't, the missing links are one
  // season-level problem (the seats warnings above), not a nag on every
  // package. Over-linking (more seats reserved than pilgrims) is waste and is
  // flagged regardless of the fleet.
  for (const direction of ["arrival", "return"] as const) {
    const fleet = flightBlocks
      .filter((f) => f.direction === direction && f.status !== "cancelled")
      .reduce((t, f) => t + (f.seats || 0), 0)
    const fleetCovers = fleet > 0 && fleet >= quota
    const label = M(direction === "arrival" ? "الوصول" : "المغادرة")
    for (const pkg of packages) {
      if (!(pkg.capacity > 0)) continue
      const pkgId = pkg.id ?? pkg.package_no
      const tally = allocatedByDirection.get(pkgId)!
      const allocated = tally[direction]
      if (allocated > pkg.capacity) {
        at(
          "warning",
          "inventory.flight_overlinked",
          "package",
          pkgId,
          M("باقة {p0}: مقاعد {label} المخصصة ({p2}) أكثر من سعتها ({p3}).", { p0: pkg.package_no, label: label, p2: n(allocated), p3: n(pkg.capacity) }),
        )
      }
      if (!fleetCovers) continue
      if (!tally.linked.has(direction)) {
        at("warning", "inventory.no_flight_link", "package", pkgId, M("باقة {p0}: لا ترتبط بأي كتلة مقاعد {label}.", { p0: pkg.package_no, label: label }))
      } else if (allocated < pkg.capacity) {
        at(
          "warning",
          "inventory.flight_shortfall",
          "package",
          pkgId,
          M("باقة {p0}: مقاعد {label} المخصصة ({p2}) أقل من سعتها ({p3}).", { p0: pkg.package_no, label: label, p2: n(allocated), p3: n(pkg.capacity) }),
        )
      }
    }
  }

  return issues
}

export const hasBlockingErrors = (issues: Issue[]) => issues.some((i) => i.level === "error")
