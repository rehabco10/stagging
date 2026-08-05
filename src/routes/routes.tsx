import { useState } from "react"
import { useSnapshot } from "valtio"
import { PanelRightOpen } from "lucide-react"

import { PageHeader, PageShell } from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { ResponsivePanel } from "@/components/ui/responsive-panel"
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
  const [wizardOpen, setWizardOpen] = useState(false)
  const subtitle = useInspectorSubtitle()

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-surface-page">
      <PageHeader
        title="تكوين الباقات"
        description="ابدأ من عقدة «الباقات» وأضف الباقات وإقاماتها."
        actions={
          <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
            <PanelRightOpen className="size-3.5" />
            معالج تكوين الباقات
          </Button>
        }
      />

      <div className="min-h-0 flex-1">
        <PackageGraph
          // Selecting a node is what opens the wizard — the panel is
          // contextual to that selection, not a permanent column.
          onNodeActivated={() => setWizardOpen(true)}
        />
      </div>

      <ResponsivePanel
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        title="معالج تكوين الباقات"
        description={subtitle}
        footer={
          <p className="text-[10px] text-muted-foreground">
            اسحب أي عقدة لتثبيتها في مكانها · انقر عليها مرتين لإعادتها للترتيب التلقائي
          </p>
        }
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
  return (
    <PageShell
      title="الاجتماعات والمتطلبات"
      description="ما اتُّفق عليه مع الفريق ووزارة الحج والعمرة. المعتمد منه يُطبَّق على التحقق قبل الرفع."
    >
      <RequirementsPanel />
    </PageShell>
  )
}

export function ValidationPage() {
  return (
    <PageShell
      title="التحقق والرفع"
      description="ما يمنع رفع الموسم إلى نسك حج، وما يستحق المراجعة قبله."
    >
      <ValidationPanel />
    </PageShell>
  )
}

export function SettingsPage() {
  return (
    <PageShell title="الإعدادات" description="الموسم، المخطط، والتخزين.">
      <SettingsPanel />
    </PageShell>
  )
}
