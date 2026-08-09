import i18n from "i18next"
import ICU from "i18next-icu"
import { initReactI18next } from "react-i18next"

import arUi from "@/locales/ar/ui.json"
import arValidation from "@/locales/ar/validation.json"
import enUi from "@/locales/en/ui.json"
import enValidation from "@/locales/en/validation.json"
import { DEFAULT_LOCALE, localeFromPath, stripBase, type Locale } from "./locale"
import { setIntlLocale } from "@/lib/intl"

/**
 * The i18next runtime (docs/i18n-plan.md §2).
 *
 * ICU rather than i18next's own plural suffixes: Arabic has six plural forms
 * and most of the counted strings in this app are Arabic-first, so the
 * catalogs carry real `{n, plural, …}` messages the translators can reason
 * about. Two namespaces — `ui` for the interface, `validation` for the engine
 * messages, which are produced by a non-React module (`lib/validation.ts`)
 * that will call `i18n.t` directly rather than a hook.
 *
 * Catalogs are bundled, not fetched: the whole app is one offline-capable SPA
 * and a language switch must not wait on the network.
 */

/** The locale the first paint should use — read from the URL, then storage. */
function initialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  return localeFromPath(stripBase(window.location.pathname))
}

void i18n
  .use(ICU)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { ui: arUi, validation: arValidation },
      en: { ui: enUi, validation: enValidation },
    },
    lng: initialLocale(),
    fallbackLng: DEFAULT_LOCALE,
    ns: ["ui", "validation"],
    defaultNS: "ui",
    // React escapes for us; ICU handles the formatting.
    interpolation: { escapeValue: false },
    returnNull: false,
  })

setIntlLocale(initialLocale())

export default i18n
