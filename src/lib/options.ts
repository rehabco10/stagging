import i18n from "@/i18n/config"
import type { SelectOption } from "@/components/ui/field"
import type { IssueCategory } from "@/lib/validation"

/**
 * Domain option lists shared by every editor of the same fields — the wizard
 * sheet on the canvas and the classic grid editor edit the same store, so
 * their vocabularies must come from one place or they will drift.
 *
 * Values are data and never translated (they are what the store, the seed and
 * PocketBase hold); labels come from the catalog, which is why these are
 * functions rather than the constant arrays they used to be — a module-level
 * array would freeze the language at import time.
 *
 * Calling `i18n.t` directly rather than taking a `t` argument keeps ~30 call
 * sites unchanged apart from the parentheses. It is safe because a language
 * switch is a route change (`/` ⇄ `/en`), which re-renders every consumer.
 */

const t = (key: string) => i18n.t(key) as string

const options = <T extends string>(ns: string, values: readonly T[]): SelectOption[] =>
  values.map((value) => ({ value, label: t(`${ns}.${value}`) }))

/* ── packages ───────────────────────────────────────────────────── */

export const TIER_VALUES = ["luxury", "premium", "standard"] as const
export const ROLE_VALUES = ["first", "second", "transitional"] as const
export const PUBLISH_STATUS_VALUES = ["draft", "submitted", "approved", "rejected"] as const
export const SALE_STATUS_VALUES = ["unavailable", "available"] as const

// Arabic keeps the tier Arabic-only: the bilingual form («أساسية — Standard»)
// clipped to a cryptic tail in narrow select triggers, and the English tier is
// always visible in the «التصنيف في نسك» summary right beneath these fields.
export const tierOptions = () => options("tier", TIER_VALUES)
export const roleOptions = () => options("role", ROLE_VALUES)
export const publishStatusOptions = () => options("publish_status", PUBLISH_STATUS_VALUES)
export const saleStatusOptions = () => options("sale_status", SALE_STATUS_VALUES)

export const tierLabel = (tier: string) => t(`tier.${tier}`)
export const roleLabel = (role: string) => t(`role.${role}`)

/* ── hotels ─────────────────────────────────────────────────────── */

export const CITY_VALUES = ["makkah", "madinah"] as const
export const STAR_VALUES = ["5", "4", "3", "2", "1", "nuzul"] as const
/** Ministry housing grades — the letters are the data, the labels transliterate. */
export const GRADE_VALUES = ["أ", "ب", "ج", "م"] as const

export const cityOptions = () => options("city", CITY_VALUES)
export const starOptions = () => options("star", STAR_VALUES)
export const gradeOptions = () => options("grade", GRADE_VALUES)

export const cityLabel = (city: string) => t(`city.${city}`)
/** The compact form used inside dense rows and chips. */
export const cityShortLabel = (city: string) => t(`city.${city}_short`)
export const starLabel = (star: string) => t(`star.${star}`)
export const gradeLabel = (grade: string) => t(`grade.${grade}`)

/* ── inventory: housing contracts & flight blocks ───────────────── */

export const ROOM_TYPE_VALUES = ["4", "3", "2"] as const
export const CONTRACT_CITY_VALUES = ["makkah", "madinah", "shifting"] as const
export const CONTRACT_STATUS_VALUES = ["proposed", "signed", "cancelled"] as const
export const FLIGHT_DIRECTION_VALUES = ["arrival", "return"] as const
export const FLIGHT_TYPE_VALUES = ["group", "gds"] as const
export const FLIGHT_STATUS_VALUES = ["proposed", "confirmed", "cancelled"] as const

export const roomTypeOptions = () => options("room_type", ROOM_TYPE_VALUES)
export const contractCityOptions = () => options("contract_city", CONTRACT_CITY_VALUES)
export const contractStatusOptions = () => options("contract_status", CONTRACT_STATUS_VALUES)
export const flightDirectionOptions = () => options("flight_direction", FLIGHT_DIRECTION_VALUES)
export const flightTypeOptions = () => options("flight_type", FLIGHT_TYPE_VALUES)
export const flightStatusOptions = () => options("flight_status", FLIGHT_STATUS_VALUES)

export const roomTypeLabel = (rt: string) => t(`room_type.${rt}`)
export const contractStatusLabel = (s: string) => t(`contract_status.${s}`)
export const flightStatusLabel = (s: string) => t(`flight_status.${s}`)
export const flightDirectionLabel = (d: string) => t(`flight_direction.${d}`)

/* ── validation categories ──────────────────────────────────────── */

/** Display order: what blocks submission first, supply detail last. */
export const ISSUE_CATEGORY_ORDER: IssueCategory[] = [
  "governance",
  "itinerary",
  "package",
  "contracts",
  "housing",
  "flights",
  "other",
]

export const issueCategoryLabel = (cat: IssueCategory) => t(`issue_category.${cat}`)
