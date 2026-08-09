import { Panel } from "@xyflow/react"
import { useTranslation } from "react-i18next"
import { LayoutGrid, PinOff, Plus } from "lucide-react"

import { useLocale } from "@/i18n/LocaleProvider"
import { LOCALE_DIR } from "@/i18n/locale"
import { cn } from "@/lib/utils"

/**
 * The floating canvas toolbar. Anchored top on a roomy canvas; on a short one
 * it moves to the bottom edge, where the root card (framed dead-centre by
 * fitView) cannot end up underneath it.
 */
export function CanvasToolbar({
  roomy,
  pinnedCount,
  onAddPackage,
  onFitView,
  onUnpinAll,
}: {
  roomy: boolean
  pinnedCount: number
  onAddPackage: () => void
  onFitView: () => void
  onUnpinAll: () => void
}) {
  const { t } = useTranslation()
  // The canvas itself stays LTR in both languages, so the toolbar has to be
  // told the reading direction explicitly.
  const locale = useLocale()
  return (
    <Panel position={roomy ? "top-right" : "bottom-right"} className="!m-3">
      <div
        dir={LOCALE_DIR[locale]}
        className="flex items-center gap-1 rounded-lg border border-surface-line bg-card/95 px-1 py-1 shadow-[var(--elev-1)] backdrop-blur"
      >
        <ToolbarButton title={t("toolbar.add_package_title")} onClick={onAddPackage}>
          <Plus className="size-3.5" />
          <span>{t("toolbar.add_package")}</span>
        </ToolbarButton>
        <div className="h-5 w-px bg-border" />
        <ToolbarButton title={t("toolbar.fit_view_title")} onClick={onFitView}>
          <LayoutGrid className="size-3.5" />
          <span>{t("toolbar.fit_view")}</span>
        </ToolbarButton>
        <ToolbarButton
          title={
            pinnedCount === 0
              ? t("toolbar.no_pinned")
              : t("toolbar.unpin_all_title", { n: pinnedCount })
          }
          disabled={pinnedCount === 0}
          onClick={onUnpinAll}
        >
          <PinOff className="size-3.5" />
          <span>{t("toolbar.unpin_all")}</span>
          {pinnedCount > 0 && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary tabular-nums">
              {pinnedCount}
            </span>
          )}
        </ToolbarButton>
      </div>
    </Panel>
  )
}

function ToolbarButton({
  disabled,
  title,
  onClick,
  children,
}: {
  disabled?: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        disabled
          ? "cursor-not-allowed text-muted-foreground/60"
          : "cursor-pointer text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}
