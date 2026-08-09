import * as React from "react"
import {
  Copy,
  Pin,
  PinOff,
  Plus,
  SquarePen,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { useLocale } from "@/i18n/LocaleProvider"
import { LOCALE_DIR } from "@/i18n/locale"
import { SIDE_PANEL_QUERY, useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

export interface MenuAction {
  id: string
  label: string
  icon: LucideIcon
  /** Destructive actions are tinted and pushed below a divider. */
  danger?: boolean
  disabled?: boolean
  hint?: string
  run: () => void
}

export interface MenuTarget {
  nodeId: string
  title: string
  subtitle?: string
  actions: MenuAction[]
  /** Viewport coordinates of the pointer that opened it. */
  x: number
  y: number
}

const MENU_W = 232
const ITEM_H = 38

/**
 * Node actions, opened by right-click on a pointer device and by long-press on
 * touch. Wide screens get a menu anchored where the pointer was; narrow ones
 * get the same list as a bottom drawer, where a 230px popup anchored to a
 * thumb-press would sit under the thumb.
 */
export function NodeMenu({
  target,
  onClose,
}: {
  target: MenuTarget | null
  onClose: () => void
}) {
  const locale = useLocale()
  const isSide = useMediaQuery(SIDE_PANEL_QUERY)

  React.useEffect(() => {
    if (!target) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [target, onClose])

  if (!target) return null

  const items = target.actions
  const run = (a: MenuAction) => {
    if (a.disabled) return
    a.run()
    onClose()
  }

  const list = (
    <ul className="py-1">
      {items.map((a, i) => (
        <React.Fragment key={a.id}>
          {a.danger && i > 0 && !items[i - 1].danger && (
            <li aria-hidden className="my-1 h-px bg-surface-line" />
          )}
          <li>
            <button
              type="button"
              disabled={a.disabled}
              title={a.hint}
              onClick={() => run(a)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-start text-[13px] transition-colors",
                a.disabled
                  ? "cursor-not-allowed text-muted-foreground/50"
                  : a.danger
                    ? "text-[color:var(--brand-rose-deep)] hover:bg-[color:var(--brand-rose-soft)]"
                    : "text-foreground hover:bg-surface-sunken",
              )}
            >
              <a.icon className="size-4 shrink-0" />
              <span className="flex-1">{a.label}</span>
            </button>
          </li>
        </React.Fragment>
      ))}
    </ul>
  )

  const header = (
    <div className="border-b border-surface-line px-3 py-2">
      <div className="truncate text-[12px] font-bold text-foreground">{target.title}</div>
      {target.subtitle && (
        <div className="truncate text-[10px] text-muted-foreground">{target.subtitle}</div>
      )}
    </div>
  )

  if (!isSide) {
    return (
      <Drawer open onOpenChange={(o) => !o && onClose()} showSwipeHandle swipeDirection="down">
        <DrawerContent className="bg-popover">
          <DrawerTitle className="sr-only">{target.title}</DrawerTitle>
          {header}
          <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]">{list}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Flip back inside the viewport when the click landed near an edge.
  const height = items.length * ITEM_H + 56
  const left = target.x + MENU_W > window.innerWidth ? Math.max(8, target.x - MENU_W) : target.x
  const top = target.y + height > window.innerHeight ? Math.max(8, target.y - height) : target.y

  return (
    <>
      {/* Backdrop swallows the dismissing click so it cannot also hit the canvas. */}
      <div
        className="fixed inset-0 z-40"
        onPointerDown={onClose}
        onContextMenu={(e) => {
          e.preventDefault()
          onClose()
        }}
      />
      <div
        dir={LOCALE_DIR[locale]}
        role="menu"
        className="fixed z-50 overflow-hidden rounded-xl border border-surface-line bg-popover shadow-[var(--elev-3)]"
        style={{ left, top, width: MENU_W }}
        onPointerDown={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {header}
        {list}
      </div>
    </>
  )
}

export const MENU_ICONS = { Plus, SquarePen, Copy, Pin, PinOff, Trash2 }
