import i18n from "@/i18n/config"

/**
 * Entity display names per locale, with fallback — hotels and carriers carry
 * both `name_ar`/`name_en` (`airline_ar`/`airline_en`) in the data model, and
 * the UI historically showed only the Arabic one. Data stays bilingual; only
 * the display choice moves with the language. An entity missing one form
 * falls back to the other rather than rendering blank.
 */

const english = () => i18n.resolvedLanguage === "en"

export const localName = (e: { name_ar?: string; name_en?: string } | undefined): string =>
  (english() ? e?.name_en || e?.name_ar : e?.name_ar || e?.name_en) ?? ""

export const airlineName = (f: { airline_ar?: string; airline_en?: string } | undefined): string =>
  (english() ? f?.airline_en || f?.airline_ar : f?.airline_ar || f?.airline_en) ?? ""
