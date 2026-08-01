import { useCallback, useState } from "react"
import { Copy, Pin, PinOff, Plus, SquarePen, Trash2 } from "lucide-react"

import {
  addLeg,
  addPackage,
  availableRoles,
  duplicatePackage,
  findLeg,
  removeLeg,
  removePackage,
  state,
  unpinNode,
} from "@/store/season"
import { ROLE_LABEL } from "./nodes"
import { useLongPress } from "@/hooks/use-long-press"
import { arNum } from "@/lib/utils"
import type { MenuAction, MenuTarget } from "./NodeMenu"

/**
 * All node-menu concerns in one hook: what the menu contains per node type,
 * and the two ways it opens (right-click on pointer devices, long-press on
 * touch). The graph component just spreads the handlers and renders the menu.
 *
 * `menuFor` reads the live valtio proxy at call time rather than closing over
 * a snapshot — a menu is built at the moment it opens, so there is nothing to
 * go stale.
 */
export function useNodeMenu(onNodeActivated?: (id: string) => void) {
  const [menu, setMenu] = useState<MenuTarget | null>(null)

  const menuFor = useCallback(
    (nodeId: string, x: number, y: number): MenuTarget | null => {
      const open = () => {
        state.selectedId = nodeId
        onNodeActivated?.(nodeId)
      }
      const pinned = Boolean(state.pinned[nodeId])
      const togglePin: MenuAction = pinned
        ? { id: "unpin", label: "إعادة للترتيب التلقائي", icon: PinOff, run: () => unpinNode(nodeId) }
        : {
            id: "pin",
            label: "تثبيت في المكان",
            icon: Pin,
            // Pinning happens by dragging — a node has no position to pin to
            // until the user has actually placed it somewhere.
            hint: "اسحب العقدة لتثبيتها في مكانها",
            disabled: true,
            run: () => {},
          }

      if (nodeId === "root") {
        return {
          nodeId,
          title: "الباقات",
          subtitle: `الحصة ${arNum(state.season.quota_total)} حاج`,
          x,
          y,
          actions: [
            { id: "add", label: "إضافة باقة", icon: Plus, run: () => addPackage() },
            { id: "season", label: "إعدادات الموسم", icon: SquarePen, run: open },
          ],
        }
      }

      const pkg = state.packages.find((p) => p.id === nodeId)
      if (pkg) {
        const canAdd = availableRoles(pkg).length > 0
        return {
          nodeId,
          title: `باقة ${pkg.package_no}`,
          subtitle: pkg.name_en || undefined,
          x,
          y,
          actions: [
            {
              id: "add-leg",
              label: "إضافة إقامة",
              icon: Plus,
              disabled: !canAdd,
              hint: canAdd ? undefined : "كل الأدوار مستخدمة",
              run: () => addLeg(pkg.id),
            },
            { id: "edit", label: "فتح في المعالج", icon: SquarePen, run: open },
            {
              id: "dup",
              label: "تكرار الباقة",
              icon: Copy,
              hint: "نسخة بنفس المسار وسعة صفر",
              run: () => duplicatePackage(pkg.id),
            },
            togglePin,
            { id: "del", label: "حذف الباقة", icon: Trash2, danger: true, run: () => removePackage(pkg.id) },
          ],
        }
      }

      const found = findLeg(nodeId)
      if (found) {
        return {
          nodeId,
          title: ROLE_LABEL[found.leg.role],
          subtitle: `باقة ${found.pkg.package_no}`,
          x,
          y,
          actions: [
            { id: "edit", label: "فتح في المعالج", icon: SquarePen, run: open },
            togglePin,
            { id: "del", label: "حذف الإقامة", icon: Trash2, danger: true, run: () => removeLeg(nodeId) },
          ],
        }
      }
      return null
    },
    [onNodeActivated],
  )

  /** Long-press resolves the node from the DOM — React Flow has no hook for it. */
  const longPress = useLongPress((x, y, target) => {
    const el = (target as Element | null)?.closest?.("[data-id]")
    const id = el?.getAttribute("data-id")
    if (id) setMenu(menuFor(id, x, y))
  })

  /** For React Flow's `onNodeContextMenu`. */
  const openFromContextMenu = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault()
      // Android synthesises `contextmenu` mid-hold on a long-press. Our own
      // long-press path opens the menu on release; letting the native event
      // through as well would open it under the still-down finger — the exact
      // race the release deferral exists to avoid.
      if (longPress.isTouchActive()) return
      setMenu(menuFor(nodeId, e.clientX, e.clientY))
    },
    [menuFor, longPress],
  )

  return {
    menu,
    closeMenu: useCallback(() => setMenu(null), []),
    longPressHandlers: longPress.handlers,
    openFromContextMenu,
  }
}
