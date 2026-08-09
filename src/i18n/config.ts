import i18n from "i18next"
import ICU from "i18next-icu"
import { initReactI18next } from "react-i18next"

import arUi from "@/locales/ar/ui.json"
import arCopy from "@/locales/ar/copy.json"
import arValidation from "@/locales/ar/validation.json"
import enUi from "@/locales/en/ui.json"
import enCopy from "@/locales/en/copy.json"
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

/** `{nav:{dashboard:"…"}}` → `{"nav.dashboard":"…"}`. */
function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === "object") Object.assign(out, flatten(v as Record<string, unknown>, key))
    else out[key] = String(v)
  }
  return out
}

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
      // Arabic carries no `copy` catalog on purpose: those keys ARE the
      // Arabic sentences, so i18next's key fallback renders them verbatim
      // and the Arabic UI cannot drift from the source.
      ar: { ui: { ...flatten(arUi), ...arCopy }, validation: arValidation },
      en: { ui: { ...flatten(enUi), ...enCopy }, validation: enValidation },
    },
    // The two key schemes have to coexist: structured keys for the shared
    // vocabulary (`units.seats`) and whole Arabic sentences for one-off copy.
    // A sentence ends in "." and contains ":", so i18next must not read any
    // key as a path — hence the structured catalogs are pre-flattened to
    // dotted keys above and both separators are turned off here.
    keySeparator: false,
    nsSeparator: false,
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
