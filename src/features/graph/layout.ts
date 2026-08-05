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
  packages: Array<{ id: string; legIds: string[]; tier?: string }>
  /** Nodes the user has dragged; these override the solver's position. */
  pinned: Record<string, Pos>
}

export interface LayoutSizes {
  root: Box
  pkg: Box
  leg: Box
  /** Box for the pseudo tier nodes; falls back to `pkg` when absent. */
  tier?: Box
}

export const ROOT_ID = "root"
/** Fixed display order of the tier sections; unknown tiers append after. */
export const TIER_ORDER = ["luxury", "premium", "standard"]
export const tierNodeId = (tier: string) => `tier_${tier}`

const MARGIN = 40
const GAP_Y = 28
const RANK_GAP = 88
const LEG_DROP = 56
const LEG_GAP_Y = 16
/** Packages per column. One dagre-style rank of 39 packages was a 12,000px smear. */
const WRAP_AT = 7

/**
 * Deterministic sideways grid: quota root on the left, packages flowing
 * rightward in columns of `WRAP_AT`, and the expanded package's legs in a
 * band beside its column. Horizontal because stay chains read as sequences
 * and screens are wide: the top-down version stacked 39 packages into rows
 * and every expansion fought its neighbours for vertical room.
 *
 * This replaced a dagre single-rank layout the day the real 39-package season
 * seeded in — one rank made every card an unreadable speck at fit-view, and
 * with the canvas accordion only one package shows legs at a time anyway.
 *
 * Pinned nodes are laid out normally and then overridden, deliberately: the
 * solver still reserves their slot so the rest of the tree keeps a sane shape
 * whether or not the user has parked a card somewhere.
 */
const SECTION_GAP = 72

export function computeLayout(tree: LayoutTree, sizes: LayoutSizes): Map<string, Pos> {
  const out = new Map<string, Pos>()
  const tierBox = sizes.tier ?? sizes.pkg
  const place = (id: string, x: number, y: number) => {
    const pin = tree.pinned[id]
    out.set(id, pin ? { x: pin.x, y: pin.y } : { x, y })
  }

  // Group into tier sections, fixed order, unknown tiers appended.
  const byTier = new Map<string, LayoutTree["packages"]>()
  for (const pkg of tree.packages) {
    const tier = pkg.tier ?? "standard"
    const list = byTier.get(tier) ?? []
    list.push(pkg)
    byTier.set(tier, list)
  }
  const tiers = [
    ...TIER_ORDER.filter((t) => byTier.has(t)),
    ...[...byTier.keys()].filter((t) => !TIER_ORDER.includes(t)),
  ]

  const sectionH = (count: number) => {
    const rows = Math.max(1, Math.min(WRAP_AT, count))
    return rows * sizes.pkg.h + (rows - 1) * GAP_Y
  }
  const totalH = tiers.reduce((t, tier) => t + sectionH(byTier.get(tier)!.length), 0) +
    Math.max(0, tiers.length - 1) * SECTION_GAP

  place(ROOT_ID, MARGIN, MARGIN + Math.max(totalH, sizes.root.h) / 2 - sizes.root.h / 2)
  const tierX = MARGIN + sizes.root.w + RANK_GAP
  const pkgX0 = tierX + tierBox.w + RANK_GAP

  let sectionTop = MARGIN
  for (const tier of tiers) {
    const pkgs = byTier.get(tier)!
    const secH = sectionH(pkgs.length)
    place(tierNodeId(tier), tierX, sectionTop + secH / 2 - tierBox.h / 2)

    let x = pkgX0
    for (let start = 0; start < pkgs.length; start += WRAP_AT) {
      const col = pkgs.slice(start, start + WRAP_AT)
      const colH = col.length * sizes.pkg.h + (col.length - 1) * GAP_Y
      const yStart = sectionTop + (secH - colH) / 2

      col.forEach((pkg, i) => place(pkg.id, x, yStart + i * (sizes.pkg.h + GAP_Y)))

      // Legs band beside this column: each package's legs centred on it, but
      // never overlapping the neighbour's band — the cursor walks the column.
      const legX = x + sizes.pkg.w + LEG_DROP
      let cursor = -Infinity
      let colHasLegs = false
      col.forEach((pkg, i) => {
        if (!pkg.legIds.length) return
        colHasLegs = true
        const bandH = pkg.legIds.length * sizes.leg.h + (pkg.legIds.length - 1) * LEG_GAP_Y
        const centre = yStart + i * (sizes.pkg.h + GAP_Y) + sizes.pkg.h / 2
        const bandY = Math.max(sectionTop, centre - bandH / 2, cursor + LEG_GAP_Y)
        pkg.legIds.forEach((legId, j) => place(legId, legX, bandY + j * (sizes.leg.h + LEG_GAP_Y)))
        cursor = bandY + bandH
      })

      x += sizes.pkg.w + (colHasLegs ? LEG_DROP + sizes.leg.w : 0) + RANK_GAP
    }

    sectionTop += secH + SECTION_GAP
  }

  return out
}

/** A stable key for "has the tree's shape or pinning changed?". */
export function structureKeyOf(tree: LayoutTree): string {
  // Tier is part of the shape: retiering a package moves it between sections.
  const shape = tree.packages.map((p) => `${p.id}~${p.tier ?? ""}:${p.legIds.join("|")}`).join(";")
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
