import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryState } from "nuqs"
import { useSnapshot } from "valtio"
import { PanelRightOpen } from "lucide-react"

import { PageHeader, PageShell } from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { ResponsivePanel } from "@/components/ui/responsive-panel"
import { JourneyGraph } from "@/features/graph/JourneyGraph"
import { PackageGraph } from "@/features/graph/PackageGraph"
import { InspectorContent, useInspectorSubtitle } from "@/features/inspector/Inspector"
import {
  RequirementsPanel,
  SettingsPanel,
  ValidationPanel,
} from "@/features/panels/panels"
import { state } from "@/store/season"

/* ── the canvas, with the wizard as a sheet / drawer ─────────────── */

export function CanvasPage() {
  const snap = useSnapshot(state)
  const { t } = useTranslation()
  const [wizardOpen, setWizardOpen] = useState(false)
  const subtitle = useInspectorSubtitle()

  // The journey viewer is URL state (?journey=<pkgId>) — linkable, and the
  // browser back button closes it like any other screen.
  const [journeyId, setJourneyId] = useQueryState("journey", { history: "push" })
  const journeyPkg = journeyId ? snap.packages.find((p) => p.id === journeyId) : undefined
  const openJourney = (pkgId: string) => {
    setWizardOpen(false) // one sheet at a time
    void setJourneyId(pkgId)
  }
  const closeJourney = () => void setJourneyId(null)

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-surface-page">
      <PageHeader
        title={t("page.canvas")}
        description={t("page.canvas_desc")}
        actions={
          <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
            <PanelRightOpen className="size-3.5" />
            {t("canvas.open_wizard")}
          </Button>
        }
      />

      <div className="min-h-0 flex-1">
        {/* Journey mode replaces the tree — the canvas itself becomes one
            pilgrim's vertical trip, and رجوع (or browser back) restores it. */}
        {journeyPkg ? (
          <JourneyGraph pkgId={journeyPkg.id} onBack={closeJourney} />
        ) : (
          <PackageGraph
            // Selecting a node is what opens the wizard — the panel is
            // contextual to that selection, not a permanent column.
            onNodeActivated={() => setWizardOpen(true)}
            onJourney={openJourney}
          />
        )}
      </div>

      <ResponsivePanel
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        title={t("canvas.wizard_title")}
        description={subtitle}
        footer={<p className="text-[10px] text-muted-foreground">{t("canvas.pin_hint")}</p>}
      >
        <InspectorContent />
      </ResponsivePanel>

      {/* Keeps the subtitle honest when the sheet is shut. */}
      <span className="sr-only">{snap.selectedId}</span>
    </div>
  )
}

/* ── ordinary pages ─────────────────────────────────────────────── */

export function RequirementsPage() {
  const { t } = useTranslation()
  return (
    <PageShell title={t("page.requirements")} description={t("page.requirements_desc")}>
      <RequirementsPanel />
    </PageShell>
  )
}

export function ValidationPage() {
  const { t } = useTranslation()
  return (
    <PageShell title={t("page.validation")} description={t("page.validation_desc")}>
      <ValidationPanel />
    </PageShell>
  )
}

export function SettingsPage() {
  const { t } = useTranslation()
  return (
    <PageShell title={t("page.settings")} description={t("page.settings_desc")}>
      <SettingsPanel />
    </PageShell>
  )
}
