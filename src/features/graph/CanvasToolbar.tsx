import { Panel } from "@xyflow/react"
import { LayoutGrid, PinOff, Plus } from "lucide-react"

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
  return (
    <Panel position={roomy ? "top-right" : "bottom-right"} className="!m-3">
      <div
        dir="rtl"
        className="flex items-center gap-1 rounded-lg border border-surface-line bg-card/95 px-1 py-1 shadow-[var(--elev-1)] backdrop-blur"
      >
        <ToolbarButton title="إضافة باقة جديدة" onClick={onAddPackage}>
          <Plus className="size-3.5" />
          <span>باقة جديدة</span>
        </ToolbarButton>
        <div className="h-5 w-px bg-border" />
        <ToolbarButton title="إعادة تأطير العرض" onClick={onFitView}>
          <LayoutGrid className="size-3.5" />
          <span>ملء الشاشة</span>
        </ToolbarButton>
        <ToolbarButton
          title={
            pinnedCount === 0
              ? "لا توجد عقد مثبَّتة"
              : `إعادة ${pinnedCount} عقدة مثبَّتة إلى الترتيب التلقائي`
          }
          disabled={pinnedCount === 0}
          onClick={onUnpinAll}
        >
          <PinOff className="size-3.5" />
          <span>فكّ التثبيت</span>
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
