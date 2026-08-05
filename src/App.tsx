import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { Navigation } from "@/components/NavRail"
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

export default function App() {
  return (
    // Mount under whatever `base` this build was made for ("/" or "/stagging/").
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* RTL row order: the rail sits on the start edge, the page fills the rest. */}
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-background lg:flex-row landscape:flex-row">
        <Navigation />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/canvas" element={<CanvasPage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/packages/:pkgId" element={<PackagesPage />} />
          <Route path="/requirements" element={<RequirementsPage />} />
          <Route path="/hotels" element={<HousingPage />} />
          <Route path="/hotels/:hotelId" element={<HousingPage />} />
          <Route path="/flights" element={<CarriersPage />} />
          <Route path="/flights/:carrier" element={<CarriersPage />} />
          <Route path="/validation" element={<ValidationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
