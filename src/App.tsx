import { NuqsAdapter } from "nuqs/adapters/react-router/v7"
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom"

import { Navigation } from "@/components/NavRail"
import { LocaleProvider, RootLocaleRedirect } from "@/i18n/LocaleProvider"
import type { Locale } from "@/i18n/locale"
import { DashboardPage } from "@/routes/dashboard"
import { PackagesPage } from "@/routes/packages"
import { CarriersPage } from "@/features/inventory/CarriersPage"
import { HousingPage } from "@/features/inventory/HousingPage"
import {
  CanvasPage,
  RequirementsPage,
  SettingsPage,
  ValidationPage,
} from "@/routes/routes"

/**
 * The app shell, once per locale. `/` is Arabic and `/en` is English
 * (docs/i18n-plan.md §2) — the same section tree mounted under two parents
 * rather than an optional `:lang?` segment, which would match `/hotels` as a
 * language and break every unprefixed route.
 */
function LocaleShell({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider locale={locale}>
      {/* RTL row order: the rail sits on the start edge, the page fills the rest. */}
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-background lg:flex-row landscape:flex-row">
        <Navigation />
        <Outlet />
      </div>
    </LocaleProvider>
  )
}

/** The section tree, relative — it resolves under whichever locale mounts it. */
const sections = (locale: Locale) => [
  <Route key={`${locale}-home`} index element={<DashboardPage />} />,
  <Route key={`${locale}-canvas`} path="canvas" element={<CanvasPage />} />,
  <Route key={`${locale}-packages`} path="packages" element={<PackagesPage />} />,
  <Route key={`${locale}-package`} path="packages/:pkgId" element={<PackagesPage />} />,
  <Route key={`${locale}-requirements`} path="requirements" element={<RequirementsPage />} />,
  <Route key={`${locale}-hotels`} path="hotels" element={<HousingPage />} />,
  <Route key={`${locale}-hotel`} path="hotels/:hotelId" element={<HousingPage />} />,
  <Route key={`${locale}-flights`} path="flights" element={<CarriersPage />} />,
  <Route key={`${locale}-carrier`} path="flights/:carrier" element={<CarriersPage />} />,
  <Route key={`${locale}-validation`} path="validation" element={<ValidationPage />} />,
  <Route key={`${locale}-settings`} path="settings" element={<SettingsPage />} />,
]

export default function App() {
  return (
    // Mount under whatever `base` this build was made for ("/" or "/stagging/").
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <NuqsAdapter>
        <RootLocaleRedirect>
          <Routes>
            <Route path="/" element={<LocaleShell locale="ar" />}>
              {sections("ar")}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="/en" element={<LocaleShell locale="en" />}>
              {sections("en")}
              <Route path="*" element={<Navigate to="/en" replace />} />
            </Route>
          </Routes>
        </RootLocaleRedirect>
      </NuqsAdapter>
    </BrowserRouter>
  )
}
