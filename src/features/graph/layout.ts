import dagre from "@dagrejs/dagre"

/**
 * Graph layout + the pin reconciliation rules, kept pure and free of React so
 * they can be exercised directly. The pinning behaviour is subtle enough that
 * reasoning about it inside a component was not good enough — see
 * `test/pin.test.mjs`.
 */

export interface Pos {
  x: number
  y: number
}

export interface Box {
  w: number
  h: number
}

export interface LayoutTree {
  /** Packages in order, each with its legs already in chronological order. */
  packages: Array<{ id: string; legIds: string[] }>
  /** Nodes the user has dragged; these override the solver's position. */
  pinned: Record<string, Pos>
}

export interface LayoutSizes {
  root: Box
  pkg: Box
  leg: Box
}

export const ROOT_ID = "root"

/**
 * Top-down dagre tree: quota root → packages → stay legs.
 *
 * Pinned nodes are laid out normally and then overridden, deliberately: the
 * solver still reserves their rank so the rest of the tree keeps a sane shape
 * whether or not the user has parked a card somewhere.
 */
export function computeLayout(tree: LayoutTree, sizes: LayoutSizes): Map<string, Pos> {
  const boxes = new Map<string, Box>()
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB", nodesep: 32, ranksep: 88, edgesep: 16, marginx: 40, marginy: 40 })

  boxes.set(ROOT_ID, sizes.root)
  g.setNode(ROOT_ID, { width: sizes.root.w, height: sizes.root.h })

  for (const pkg of tree.packages) {
    boxes.set(pkg.id, sizes.pkg)
    g.setNode(pkg.id, { width: sizes.pkg.w, height: sizes.pkg.h })
    g.setEdge(ROOT_ID, pkg.id)
    for (const legId of pkg.legIds) {
      boxes.set(legId, sizes.leg)
      g.setNode(legId, { width: sizes.leg.w, height: sizes.leg.h })
      g.setEdge(pkg.id, legId)
    }
  }

  dagre.layout(g)

  const out = new Map<string, Pos>()
  for (const [id, box] of boxes) {
    const pin = tree.pinned[id]
    if (pin) {
      out.set(id, { x: pin.x, y: pin.y })
      continue
    }
    const n = g.node(id)
    // dagre reports centres; React Flow positions from the top-left corner.
    out.set(id, { x: (n?.x ?? 0) - box.w / 2, y: (n?.y ?? 0) - box.h / 2 })
  }
  return out
}

/** A stable key for "has the tree's shape or pinning changed?". */
export function structureKeyOf(tree: LayoutTree): string {
  const shape = tree.packages.map((p) => `${p.id}:${p.legIds.join("|")}`).join(";")
  const pins = Object.entries(tree.pinned)
    .map(([k, v]) => `${k}@${v.x},${v.y}`)
    .sort()
    .join(";")
  return `${shape}#${pins}`
}

export interface ReconcilableNode {
  id: string
  position: Pos
  selected?: boolean
  dragging?: boolean
}

/**
 * Merge a freshly derived node list into the one React Flow is holding.
 *
 * The rule is simply: **the solver wins, except during a live drag.** Pinned
 * coordinates are already baked into the layout, so an idle node has no reason
 * to hold a position the layout doesn't give it. React Flow owns the position
 * only between dragstart and dragstop, which is what `dragging` marks.
 *
 * An earlier version compared each node against a snapshot of "the layout we
 * handed out last time" and kept the old position when nothing had moved. That
 * read correctly but was impossible to drive safely from a component: the
 * snapshot lived in a ref that got overwritten straight after `setNodes`, while
 * the functional updater only ran on the next render — so it compared the new
 * layout against itself, decided nothing had moved, and pinned every card to
 * its first position. New cards then piled onto the same slot. Comparing
 * against `dragging` needs no external state and cannot go stale.
 */
export function reconcileNodes<T extends ReconcilableNode>(prev: T[], next: T[]): T[] {
  const prevById = new Map(prev.map((n) => [n.id, n]))
  return next.map((n) => {
    const old = prevById.get(n.id)
    if (!old) return { ...n, selected: false }
    return {
      ...n,
      position: old.dragging ? old.position : n.position,
      // React Flow owns the selection flag; our ring comes from `data.selected`.
      selected: old.selected ?? false,
      dragging: old.dragging,
    }
  })
}

/** Bounding box of every node, padded — the pannable world. */
export function worldExtent(
  nodes: Array<{ id: string; position: Pos }>,
  boxOf: (id: string) => Box,
  pad: number,
): [[number, number], [number, number]] {
  if (nodes.length === 0) {
    return [
      [-pad, -pad],
      [pad, pad],
    ]
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    const b = boxOf(n.id)
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
    maxX = Math.max(maxX, n.position.x + b.w)
    maxY = Math.max(maxY, n.position.y + b.h)
  }
  return [
    [minX - pad, minY - pad],
    [maxX + pad, maxY + pad],
  ]
}
