import { parseRequirementParams } from "./schemas"
import type {
  ItineraryWithLegs,
  ItineraryLeg,
  Package,
  Requirement,
  RequirementParamsValue,
  Season,
} from "./schemas"

/**
 * Season validation. Every rule here corresponds to a defect that actually
 * occurred in the 1447 pack (see docs/data-model.md §3) — undescribed packages,
 * a duplicated entry, a capacity total that had to be reconciled by hand.
 *
 * `error` blocks submission. `warning` is advisory.
 */

export type IssueLevel = "error" | "warning"

export interface Issue {
  level: IssueLevel
  /** Which rule fired — stable key, safe to use for i18n lookup. */
  code: string
  scope: "leg" | "itinerary" | "package" | "season"
  entityId: string
  message: string
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
    at(ctx.draft ? "warning" : "error", "itinerary.empty", "لم تُضَف أي إقامة بعد.")
    return issues
  }

  // per-leg: nights must equal the date span exactly
  for (const leg of itin.legs) {
    const span = nightsBetween(leg.starts_on, leg.ends_on)
    const legId = leg.id ?? `${id}#${leg.sequence}`
    if (span === null) {
      at("error", "leg.bad_date", "تاريخ غير صالح في الإقامة.", "leg", legId)
      continue
    }
    if (span <= 0) {
      at("error", "leg.non_positive", "تاريخ النهاية يجب أن يكون بعد تاريخ البداية.", "leg", legId)
      continue
    }
    if (span !== leg.nights) {
      at("error", "leg.nights_mismatch", `عدد الليالي (${leg.nights}) لا يطابق المدة بين التاريخين (${span}).`, "leg", legId)
    }
  }

  // roles: at most one of each, `first` required
  const byRole = new Map<string, number>()
  for (const leg of itin.legs) byRole.set(leg.role, (byRole.get(leg.role) ?? 0) + 1)
  for (const [role, n] of byRole) {
    if (n > 1) at("error", "itinerary.duplicate_role", `تكرار الإقامة بدور «${role}» ${n} مرات.`)
  }
  if (!byRole.has("first")) at("error", "itinerary.missing_first", "لا توجد إقامة أولى.")

  // contiguity, in chronological order — no gaps, no overlaps
  const chrono = chronological(itin.legs)
  for (let i = 1; i < chrono.length; i++) {
    const prev = chrono[i - 1]
    const cur = chrono[i]
    if (prev.ends_on.slice(0, 10) !== cur.starts_on.slice(0, 10)) {
      at(
        "error",
        "itinerary.not_contiguous",
        `فجوة أو تداخل بين الإقامات: تنتهي ${prev.ends_on.slice(0, 10)} وتبدأ التالية ${cur.starts_on.slice(0, 10)}.`,
      )
    }
  }

  // derived fields must agree with the legs
  const sum = itin.legs.reduce((t, l) => t + (l.nights || 0), 0)
  if (itin.total_nights !== sum) {
    at("error", "itinerary.total_nights", `إجمالي الليالي المخزَّن (${itin.total_nights}) لا يطابق مجموع الإقامات (${sum}).`)
  }

  const hasTransitional = itin.legs.some((l) => l.role === "transitional")
  if (itin.is_shifting !== hasTransitional) {
    at("error", "itinerary.shifting_flag", "علامة «الانتقالي» لا تطابق وجود إقامة انتقالية.")
  }

  if (chrono.length) {
    const first = chrono[0].starts_on.slice(0, 10)
    const last = chrono[chrono.length - 1].ends_on.slice(0, 10)
    if (itin.starts_on?.slice(0, 10) !== first) at("warning", "itinerary.starts_on", "تاريخ بداية المسار لا يطابق أول إقامة.")
    if (itin.ends_on?.slice(0, 10) !== last) at("warning", "itinerary.ends_on", "تاريخ نهاية المسار لا يطابق آخر إقامة.")
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
    at("error", "package.no_itinerary", "الباقة غير مرتبطة بمسار.")
  } else if (pkg.is_shifting !== itin.is_shifting) {
    at("error", "package.shifting_mismatch", "نوع الباقة (انتقالية) لا يطابق المسار المرتبط بها.")
  }

  // Unset while still drafting is "not done yet", not "wrong". The season-level
  // quota check is what actually blocks a set of capacities that doesn't add up.
  const unset: IssueLevel = pkg.publish_status === "draft" ? "warning" : "error"
  if (!(pkg.capacity > 0)) at(unset, "package.capacity", "لم تُحدَّد سعة الباقة بعد.")
  if (!(pkg.initial_price_sar > 0)) at(unset, "package.price", "لم يُحدَّد السعر الابتدائي بعد.")

  // The gate that would have caught packages 33–39 in 1447: priced, but never described.
  if (pkg.publish_status !== "draft") {
    if (!readiness.hasArabicBody) at("error", "package.no_body_ar", "لا يمكن رفع باقة بدون وصف عربي.")
    if (!readiness.hasEnglishBody) at("warning", "package.no_body_en", "لا يوجد وصف إنجليزي للباقة.")
    if (readiness.approvedHeroCount < 1) at("error", "package.no_hero", "لا توجد صورة رئيسية معتمدة للباقة.")
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
}

const EMPTY_READINESS: PackageReadiness = {
  hasArabicBody: false,
  hasEnglishBody: false,
  approvedHeroCount: 0,
}

export function validateSeason(input: SeasonInput): Issue[] {
  const { season, packages, itineraries, requirements, readiness } = input
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
        label: owner ? `باقة ${owner.package_no}` : undefined,
      }),
    )
  }

  for (const pkg of packages) {
    const itin = pkg.itinerary ? itineraries.get(pkg.itinerary) : undefined
    const own = validatePackage(pkg, itin, readiness.get(pkg.id ?? "") ?? EMPTY_READINESS)
    // Same treatment for package-level messages.
    for (const i of own) issues.push({ ...i, message: `باقة ${pkg.package_no}: ${i.message}` })
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
      if (n > 1) at("error", `season.duplicate_${field}`, `${label} «${v}» مكرر ${n} مرات.`)
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
      `مجموع سعات الباقات ${n(total)} ${diff > 0 ? "أكبر" : "أقل"} من الحصة ${n(quota)} بمقدار ${n(Math.abs(diff))}.`,
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
        at("error", "season.mix_max", `«${req.title}»: النسبة ${actual.toFixed(1)}% تتجاوز الحد الأعلى ${params.max_pct}%.`)
      }
      if (params.min_pct != null && actual < params.min_pct - 1e-9) {
        at("error", "season.mix_min", `«${req.title}»: النسبة ${actual.toFixed(1)}% أقل من الحد الأدنى ${params.min_pct}%.`)
      }
    }
  }

  // pricing bounds per tier
  for (const req of agreed) {
    const params = parseRequirementParams(req)
    if (params?.kind !== "pricing") continue
    for (const p of packages.filter((x) => x.tier === params.tier)) {
      if (params.max_sar != null && p.initial_price_sar > params.max_sar) {
        at("error", "season.price_max", `«${req.title}»: سعر الباقة ${p.package_no} يتجاوز الحد الأعلى ${params.max_sar}.`)
      }
      if (params.min_sar != null && p.initial_price_sar < params.min_sar) {
        at("error", "season.price_min", `«${req.title}»: سعر الباقة ${p.package_no} أقل من الحد الأدنى ${params.min_sar}.`)
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
      at("error", "season.hotel_forbidden", `«${req.title}»: فندق مستبعد ما زال مستخدمًا في أحد المسارات.`)
    }
    if (params.rule === "must_use" && !used) {
      at("warning", "season.hotel_unused", `«${req.title}»: فندق مطلوب لم يُستخدم في أي مسار.`)
    }
  }

  // free-text requirements are not machine-checkable — they must be signed off
  for (const req of agreed) {
    if (req.kind === "note" && !req.acknowledged) {
      at("warning", "season.note_unacknowledged", `متطلب غير مؤكَّد: «${req.title}».`)
    }
  }

  return issues
}

export const hasBlockingErrors = (issues: Issue[]) => issues.some((i) => i.level === "error")
