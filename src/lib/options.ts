import type { SelectOption } from "@/components/ui/field"

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
