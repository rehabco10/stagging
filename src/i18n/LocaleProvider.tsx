import * as React from "react"
import { DirectionProvider } from "@base-ui/react/direction-provider"
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  type LinkProps,
  type NavigateOptions,
} from "react-router-dom"
import { useTranslation } from "react-i18next"

import { setIntlLocale } from "@/lib/intl"
import {
  DEFAULT_LOCALE,
  LOCALE_DIR,
  rememberLocale,
  storedLocale,
  withLocale,
  type Locale,
} from "./locale"

/**
 * Everything the app needs to know it is in a locale: the current one, the
 * document's `lang`/`dir`, Base UI's direction context (so its popups,
 * selects and drawers flip with the page), and the helpers that keep internal
 * navigation inside the current prefix.
 *
 * A single link built with a bare `/hotels` would silently drop an English
 * user back into Arabic, so `useLocalePath` / `LocaleLink` / `useLocaleNavigate`
 * are the only sanctioned ways to move around.
 */

const LocaleContext = React.createContext<Locale>(DEFAULT_LOCALE)

export const useLocale = () => React.useContext(LocaleContext)

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const dir = LOCALE_DIR[locale]

  // Layout effect, not a render side effect: the document attributes and the
  // formatters must be right before the browser paints this locale.
  React.useLayoutEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = dir
    setIntlLocale(locale)
    if (i18n.resolvedLanguage !== locale) void i18n.changeLanguage(locale)
    rememberLocale(locale)
  }, [locale, dir, i18n])

  return (
    <LocaleContext.Provider value={locale}>
      <DirectionProvider direction={dir}>{children}</DirectionProvider>
    </LocaleContext.Provider>
  )
}

/* ── navigation helpers ─────────────────────────────────────────── */

/** Prefixes an app-absolute path with the current locale (`/x` → `/en/x`). */
export function useLocalePath() {
  const locale = useLocale()
  return React.useCallback((path: string) => withLocale(path, locale), [locale])
}

/** `<Link>` that stays inside the current locale. */
export function LocaleLink({ to, ...props }: Omit<LinkProps, "to"> & { to: string }) {
  const localePath = useLocalePath()
  return <Link to={localePath(to)} {...props} />
}

/** `navigate()` that stays inside the current locale. */
export function useLocaleNavigate() {
  const navigate = useNavigate()
  const localePath = useLocalePath()
  return React.useCallback(
    (to: string, options?: NavigateOptions) => navigate(localePath(to), options),
    [navigate, localePath],
  )
}

/** Switches locale in place — same page, other prefix. */
export function useSwitchLocale() {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  return React.useCallback(
    (next: Locale) => {
      rememberLocale(next)
      navigate(`${withLocale(pathname, next)}${search}`, { replace: true })
    },
    [navigate, pathname, search],
  )
}

/**
 * Honours a remembered English preference when the visitor lands on the bare
 * root. Only the root redirects: a deep Arabic link stays Arabic, because an
 * explicit URL outranks a stored preference.
 */
export function RootLocaleRedirect({ children }: { children: React.ReactNode }) {
  const { pathname, search } = useLocation()
  const stored = storedLocale()
  if (pathname === "/" && stored && stored !== DEFAULT_LOCALE) {
    return <Navigate to={`${withLocale("/", stored)}${search}`} replace />
  }
  return <>{children}</>
}
