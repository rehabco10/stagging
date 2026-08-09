import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "@/App"
// Side-effect import: initialises i18next (and the first paint's locale, read
// from the URL prefix) before any component asks for a translation.
import "@/i18n/config"
import { initDraftPersistence } from "@/persist/draft"
import "@/globals.css"

const root = createRoot(document.getElementById("root")!)

// Restore the IndexedDB draft BEFORE first paint — rendering the seed and
// then swapping to the draft flashes 39 wrong packages. If persistence is
// unavailable the promise still resolves and the app runs memory-only.
initDraftPersistence().finally(() =>
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
