import type { SelectOption } from "@/components/ui/field"
import type { IssueCategory } from "@/lib/validation"

/**
 * Domain option lists shared by every editor of the same fields — the wizard
 * sheet on the canvas and the classic grid editor edit the same store, so
 * their vocabularies must come from one place or they will drift.
 */

// Arabic-only: the bilingual form («أساسية — Standard») clipped to a cryptic
// tail in narrow select triggers, and the English tier is always visible in
// the «التصنيف في نسك» summary right beneath these fields.
export const TIER_OPTIONS: SelectOption[] = [
  { value: "luxury", label: "فاخرة" },
  { value: "premium", label: "مميزة" },
  { value: "standard", label: "أساسية" },
]

export const ROLE_OPTIONS: SelectOption[] = [
  { value: "first", label: "السكن الأول" },
  { value: "second", label: "السكن الثاني" },
  { value: "transitional", label: "السكن الانتقالي" },
]

export const TIER_LABEL: Record<string, string> = {
  luxury: "فاخرة",
  premium: "مميزة",
  standard: "أساسية",
}

export const PUBLISH_STATUS_OPTIONS: SelectOption[] = [
  { value: "draft", label: "مسودة" },
  { value: "submitted", label: "مرفوعة" },
  { value: "approved", label: "معتمدة" },
  { value: "rejected", label: "مرفوضة" },
]

export const SALE_STATUS_OPTIONS: SelectOption[] = [
  { value: "unavailable", label: "غير متاح" },
  { value: "available", label: "متاح للبيع" },
]

/* ── hotels ─────────────────────────────────────────────────────── */

export const CITY_OPTIONS: SelectOption[] = [
  { value: "makkah", label: "مكة المكرمة" },
  { value: "madinah", label: "المدينة المنورة" },
]

export const STAR_OPTIONS: SelectOption[] = [
  { value: "5", label: "خمسة نجوم" },
  { value: "4", label: "أربعة نجوم" },
  { value: "3", label: "ثلاثة نجوم" },
  { value: "2", label: "نجمتان" },
  { value: "1", label: "نجمة واحدة" },
  { value: "nuzul", label: "نزل" },
]

export const GRADE_OPTIONS: SelectOption[] = ["أ", "ب", "ج", "م"].map((g) => ({
  value: g,
  label: g,
}))

/* ── inventory: housing contracts & flight blocks ───────────────── */

export const ROOM_TYPE_OPTIONS: SelectOption[] = [
  { value: "4", label: "رباعية" },
  { value: "3", label: "ثلاثية" },
  { value: "2", label: "ثنائية" },
]

export const CONTRACT_CITY_OPTIONS: SelectOption[] = [
  { value: "makkah", label: "مكة المكرمة" },
  { value: "madinah", label: "المدينة المنورة" },
  { value: "shifting", label: "انتقالي (مكة)" },
]

export const CONTRACT_STATUS_OPTIONS: SelectOption[] = [
  { value: "proposed", label: "مقترح" },
  { value: "signed", label: "موقَّع" },
  { value: "cancelled", label: "ملغى" },
]

export const FLIGHT_DIRECTION_OPTIONS: SelectOption[] = [
  { value: "arrival", label: "وصول" },
  { value: "return", label: "مغادرة" },
]

export const FLIGHT_TYPE_OPTIONS: SelectOption[] = [
  { value: "group", label: "رحلات مجموعات" },
  { value: "gds", label: "رحلات GDS" },
]

export const FLIGHT_STATUS_OPTIONS: SelectOption[] = [
  { value: "proposed", label: "مقترح" },
  { value: "confirmed", label: "مؤكَّد" },
  { value: "cancelled", label: "ملغى" },
]

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

export const ISSUE_CATEGORY_LABEL: Record<IssueCategory, string> = {
  governance: "الحصة والضوابط",
  itinerary: "المسارات والإقامات",
  package: "بيانات الباقات",
  contracts: "عقود السكن",
  housing: "التسكين والتوفّر",
  flights: "مقاعد الطيران",
  other: "أخرى",
}
