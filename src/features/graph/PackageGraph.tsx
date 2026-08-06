import { useCallback, useEffect, useMemo, useRef } from "react"
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type CoordinateExtent,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useSnapshot } from "valtio"

import {
  computeLayout,
  reconcileNodes,
  structureKeyOf,
  tierNodeId,
  worldExtent,
  TIER_ORDER,
  type LayoutSizes,
  type LayoutTree,
} from "./layout"
import {
  LEG_H,
  LEG_W,
  PACKAGE_H,
  PACKAGE_W,
  QUOTA_H,
  QUOTA_W,
  TIER_NODE_H,
  TIER_NODE_W,
  TIER_TINT,
  nodeTypes,
  type LegData,
  type PackageData,
  type QuotaData,
  type TierData,
  type Tint,
} from "./nodes"
import { CanvasToolbar } from "./CanvasToolbar"
import { NodeMenu } from "./NodeMenu"
import { useNodeMenu } from "./useNodeMenu"
import {
  addLeg,
  addPackage,
  allocated,
  availableRoles,
  clearLastAdded,
  hotelById,
  legNights,
  orderedLegs,
  packageNights,
  pinNode,
  state,
  toggleExpandedPackage,
  unpinAll,
  unpinNode,
} from "@/store/season"
import { useIssues } from "@/store/use-issues"
import { ROOMY_CANVAS_QUERY, useMediaQuery } from "@/hooks/use-media-query"

/** Pointer travel under this many px still counts as a tap, not a drag. */
const TAP_SLOP = 5
/** How much empty space to leave around the graph when bounding the pan. */
const WORLD_PAD = 400

const SIZES: LayoutSizes = {
  root: { w: QUOTA_W, h: QUOTA_H },
  pkg: { w: PACKAGE_W, h: PACKAGE_H },
  leg: { w: LEG_W, h: LEG_H },
  tier: { w: TIER_NODE_W, h: TIER_NODE_H },
}

const boxOf = (id: string) =>
  id === "root"
    ? SIZES.root
    : id.startsWith("tier_")
      ? SIZES.tier!
      : id.startsWith("leg_")
        ? SIZES.leg
        : SIZES.pkg

const TIER_AR: Record<string, string> = {
  luxury: "فاخرة",
  premium: "مميزة",
  standard: "أساسية",
}

type AnyData = QuotaData | TierData | PackageData | LegData

interface Built {
  nodes: Node<AnyData>[]
  edges: Edge[]
}

const tintVar = (t: Tint) => `var(--brand-${t})`

interface Props {
  /** Fired when the user picks a node — the host opens the wizard sheet. */
  onNodeActivated?: (id: string) => void
}

function PackageGraphInner({ onNodeActivated }: Props) {
  const snap = useSnapshot(state)
  const flow = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  // Overlays only earn their space on a tall enough canvas.
  const roomy = useMediaQuery(ROOMY_CANVAS_QUERY)
  const { menu, closeMenu, longPressHandlers, openFromContextMenu } = useNodeMenu(onNodeActivated)

  // Shared with the rail badge and the validation page — one computation.
  const issues = useIssues()
  const errorCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const i of issues) {
      if (i.level !== "error") continue
      m.set(i.entityId, (m.get(i.entityId) ?? 0) + 1)
    }
    return m
  }, [issues])
  const errorIds = useMemo(() => new Set(errorCounts.keys()), [errorCounts])

  const totalAllocated = allocated(state)
  const standardPct = useMemo(() => {
    const tot = totalAllocated
    if (tot <= 0) return 0
    const std = snap.packages.filter((p) => p.tier === "standard").reduce((t, p) => t + p.capacity, 0)
    return (std / tot) * 100
  }, [snap.packages, totalAllocated])

  /* ── build + lay out ─────────────────────────────────────────── */

  /**
   * Layout runs on *structure* only — which packages exist and the order of
   * their legs. Hover and selection must never reach dagre: routing them
   * through the layout memo rebuilt every node and re-ran the solver on each
   * mouse-over, which read as a flicker across the whole canvas.
   */
  const tree: LayoutTree = useMemo(
    () => ({
      // Accordion: only the expanded package contributes its legs to the
      // layout — 39 packages × ~90 legs at once was an unreadable smear, and
      // dagre spread it wider than the pan extent could make comfortable.
      packages: state.packages.map((p) => ({
        id: p.id,
        tier: p.tier,
        legIds:
          p.id === state.expandedPackageId ? orderedLegs(p).map((l) => l.id) : [],
      })),
      pinned: { ...state.pinned },
    }),
    // snap is the reactive trigger; we read the live proxy for the values.
    [snap.packages, snap.pinned, snap.expandedPackageId],
  )

  const structureKey = useMemo(() => structureKeyOf(tree), [tree])

  const layout = useMemo(
    () => computeLayout(tree, SIZES),
    // structureKey is the whole dependency — see the comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structureKey],
  )

  const built: Built = useMemo(() => {
    const nodes: Node<AnyData>[] = []
    const edges: Edge[] = []
    const at = (id: string) => layout.get(id) ?? { x: 0, y: 0 }

    nodes.push({
      id: "root",
      type: "quota",
      position: at("root"),
      // Hand React Flow the same box we gave dagre, so it never has to
      // measure a card and layout can't disagree with what's painted.
      width: QUOTA_W,
      height: QUOTA_H,
      draggable: false,
      selectable: true,
      data: {
        quota: snap.season.quota_total,
        allocated: totalAllocated,
        packageCount: snap.packages.length,
        standardPct,
        selected: snap.selectedId === "root",
        errorCount: issues.filter((i) => i.level === "error").length,
        onAdd: () => addPackage(),
      } satisfies QuotaData,
    })

    // Pseudo tier nodes: quota → tier → its packages. Derived, never stored.
    for (const tier of TIER_ORDER) {
      const members = snap.packages.filter((p) => p.tier === tier)
      if (!members.length) continue
      const id = tierNodeId(tier)
      const capacity = members.reduce((t, p) => t + (p.capacity || 0), 0)
      nodes.push({
        id,
        type: "tier",
        position: at(id),
        width: TIER_NODE_W,
        height: TIER_NODE_H,
        draggable: true,
        selectable: false,
        className: snap.pinned[id] ? "is-pinned" : undefined,
        data: {
          tier: tier as PackageData["pkg"]["tier"],
          label: TIER_AR[tier] ?? tier,
          count: members.length,
          capacity,
          pct: totalAllocated > 0 ? (capacity / totalAllocated) * 100 : 0,
          onAdd: () => addPackage(tier as PackageData["pkg"]["tier"]),
        } satisfies TierData,
      })
      edges.push({
        id: `root->${id}`,
        source: "root",
        target: id,
        type: "smoothstep",
        style: {
          stroke: `color-mix(in srgb, ${tintVar(TIER_TINT[tier as keyof typeof TIER_TINT])} 60%, transparent)`,
          strokeWidth: 2,
        },
      })
    }

    for (const pkg of snap.packages) {
      const live = state.packages.find((p) => p.id === pkg.id)!
      const tint = TIER_TINT[pkg.tier]

      nodes.push({
        id: pkg.id,
        type: "package",
        position: at(pkg.id),
        width: PACKAGE_W,
        height: PACKAGE_H,
        draggable: true,
        selectable: true,
        className: snap.pinned[pkg.id] ? "is-pinned" : undefined,
        data: {
          pkg: live,
          nights: packageNights(live),
          shifting: pkg.legs.some((l) => l.role === "transitional"),
          legCount: pkg.legs.length,
          canAddLeg: availableRoles(live).length > 0,
          selected: snap.selectedId === pkg.id,
          pinned: Boolean(snap.pinned[pkg.id]),
          invalid: errorIds.has(pkg.id),
          errorCount: errorCounts.get(pkg.id) ?? 0,
          expanded: snap.expandedPackageId === pkg.id,
          onToggle: () => toggleExpandedPackage(pkg.id),
          onAdd: () => addLeg(pkg.id),
        } satisfies PackageData,
      })
      edges.push({
        id: `${tierNodeId(pkg.tier)}->${pkg.id}`,
        source: tierNodeId(pkg.tier),
        target: pkg.id,
        type: "smoothstep",
        style: { stroke: `color-mix(in srgb, ${tintVar(tint)} 55%, transparent)`, strokeWidth: 1.75 },
      })

      if (snap.expandedPackageId !== pkg.id) continue
      orderedLegs(live).forEach((leg, i) => {
        nodes.push({
          id: leg.id,
          type: "leg",
          position: at(leg.id),
          width: LEG_W,
          height: LEG_H,
          draggable: true,
          selectable: true,
          className: snap.pinned[leg.id] ? "is-pinned" : undefined,
          data: {
            leg,
            hotel: hotelById(leg.hotelId),
            nights: legNights(leg),
            order: i + 1,
            selected: snap.selectedId === leg.id,
            pinned: Boolean(snap.pinned[leg.id]),
            invalid: errorIds.has(leg.id),
          } satisfies LegData,
        })
        edges.push({
          id: `${pkg.id}->${leg.id}`,
          source: pkg.id,
          target: leg.id,
          type: "smoothstep",
          style: { stroke: `color-mix(in srgb, ${tintVar(tint)} 55%, transparent)`, strokeWidth: 1.5 },
        })
      })
    }

    return { nodes, edges }
  }, [snap, layout, errorIds, errorCounts, issues, totalAllocated, standardPct])

  /* ── live node state ─────────────────────────────────────────
   * React Flow must own positions during a drag. Passing `built.nodes`
   * straight to the `nodes` prop without an `onNodesChange` handler meant
   * every render clobbered the in-flight drag position, so the card only
   * appeared to move once the drag ended and the store updated — the lag.
   */
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AnyData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    setNodes((prev) => reconcileNodes(prev, built.nodes))
  }, [built.nodes, setNodes])

  useEffect(() => {
    setEdges(built.edges)
  }, [built.edges, setEdges])

  /* ── bounded world, like the computing-fields canvas ─────────── */

  const translateExtent: CoordinateExtent = useMemo(
    () => worldExtent(nodes, boxOf, WORLD_PAD),
    [nodes],
  )

  /* ── refit only when the shape changes, never on hover ───────── */

  /**
   * Focus is decided and executed in two steps. Deciding happens when the
   * structure mutates; executing must wait until the target node is actually
   * IN the `nodes` state React Flow renders — fitting inside a lone rAF fired
   * before the store had ingested a freshly added package, so fitView resolved
   * empty bounds and parked the viewport over blank canvas.
   *
   * One focus rule: frame the open branch (adding a package or a leg both
   * expand their package). Collapse leaves the viewport where the user is.
   */
  const shape = `${snap.packages.length}:${snap.packages.map((p) => p.legs.length).join(",")}:${snap.expandedPackageId ?? ""}`
  const lastShape = useRef<string | null>(null)
  const pendingFocus = useRef<"all" | string | null>(null)
  useEffect(() => {
    if (lastShape.current === shape) return
    const isFirstPass = lastShape.current === null
    lastShape.current = shape
    pendingFocus.current = isFirstPass ? "all" : state.expandedPackageId
    clearLastAdded()
  }, [shape])

  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    if (target !== "all") {
      const legIds = state.packages.find((p) => p.id === target)?.legs.map((l) => l.id) ?? []
      const present = new Set(nodes.map((n) => n.id))
      if (![target, ...legIds].every((id) => present.has(id))) return // not committed yet
      // We own the layout, so the branch rect is computed here rather than
      // asked of React Flow — fitView({nodes:[{id}]}) silently fell back to
      // fitting everything, which zoomed the grid out on every add.
      const boxes = [target, ...legIds]
        .map((id) => ({ pos: layout.get(id), box: boxOf(id) }))
        .filter((b): b is { pos: { x: number; y: number }; box: { w: number; h: number } } =>
          Boolean(b.pos),
        )
      if (!boxes.length) return
      pendingFocus.current = null
      const minX = Math.min(...boxes.map((b) => b.pos.x))
      const minY = Math.min(...boxes.map((b) => b.pos.y))
      const maxX = Math.max(...boxes.map((b) => b.pos.x + b.box.w))
      const maxY = Math.max(...boxes.map((b) => b.pos.y + b.box.h))
      // Inflate so the implied zoom never exceeds ~0.95 — a lone new card
      // otherwise fills the screen edge to edge.
      const el = wrapperRef.current
      const cw = el?.clientWidth ?? 1200
      const ch = el?.clientHeight ?? 800
      const w = Math.max((maxX - minX) * 1.5, cw / 0.95)
      const h = Math.max((maxY - minY) * 1.6, ch / 0.95)
      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      // Fire-and-forget, deliberately no cleanup: consuming the focus also
      // triggers store writes (clearLastAdded) whose re-render would run this
      // effect's cleanup and cancel the frames before they ever fired — the
      // focus silently never happened. The wrapper check covers unmount.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!wrapperRef.current) return
          flow.fitBounds(
            { x: cx - w / 2, y: cy - h / 2, width: w, height: h },
            { duration: 420 },
          )
        }),
      )
      return
    }
    if (nodes.length === 0) return
    pendingFocus.current = null
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!wrapperRef.current) return
        flow.fitView({ padding: 0.18, duration: 420, minZoom: 0.2, maxZoom: 1 })
      }),
    )
  }, [nodes, layout, flow])

  /* ── drag: pin where dropped, but only past the tap threshold ── */

  // React Flow hands us a DOM MouseEvent | TouchEvent here, not a React one.
  const onNodeDragStart = useCallback((_e: MouseEvent | TouchEvent, node: Node) => {
    dragStart.current = { x: node.position.x, y: node.position.y }
  }, [])

  const onNodeDragStop = useCallback((_e: MouseEvent | TouchEvent, node: Node) => {
    const from = dragStart.current
    dragStart.current = null
    if (!from) return
    // Under the slop this was a tap that wobbled — leave the node to dagre.
    if (Math.hypot(node.position.x - from.x, node.position.y - from.y) <= TAP_SLOP) return
    pinNode(node.id, node.position.x, node.position.y)
  }, [])

  const pinnedCount = Object.keys(snap.pinned).length
  const hasPackages = snap.packages.length > 0

  return (
    // React Flow's transform math needs LTR; the cards inside are dir="rtl".
    <div ref={wrapperRef} dir="ltr" className="relative h-full w-full" {...longPressHandlers}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        translateExtent={translateExtent}
        fitView
        fitViewOptions={{ padding: 0.18, minZoom: 0.2, maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        minZoom={0.2}
        maxZoom={1.8}
        // Touch reports sub-pixel jitter even on a stationary finger; with the
        // default threshold that jitter registers as a drag start, and React
        // Flow then suppresses the click — so on phones, taps never reached
        // `onNodeClick` and the wizard could not be opened at all. Matching
        // TAP_SLOP keeps tap-vs-drag consistent with our own pin logic.
        nodeDragThreshold={TAP_SLOP}
        onNodeClick={(_e, n) => {
          // Tier nodes are derived grouping chrome — nothing to inspect.
          if (n.id.startsWith("tier_")) return
          state.selectedId = n.id
          onNodeActivated?.(n.id)
        }}
        onNodeDoubleClick={(_e, n) => {
          // Double-click hands a node back to the auto-layout.
          if (state.pinned[n.id]) unpinNode(n.id)
        }}
        onNodeContextMenu={(e, n) => openFromContextMenu(e, n.id)}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={() => {
          state.selectedId = "root"
        }}
      >
        <Background gap={20} size={1} color="rgba(148,163,184,0.18)" />

        <CanvasToolbar
          roomy={roomy}
          pinnedCount={pinnedCount}
          onAddPackage={() => addPackage()}
          onFitView={() => flow.fitView({ padding: 0.18, duration: 420, minZoom: 0.2, maxZoom: 1 })}
          onUnpinAll={unpinAll}
        />

        {!hasPackages && (
          <Panel position="top-center" className="!mt-3">
            <div
              dir="rtl"
              className="rounded-lg border border-dashed border-border bg-card/90 backdrop-blur px-4 py-3 text-center shadow-sm"
            >
              <div className="text-sm font-semibold text-foreground">لا باقات بعد</div>
              <div className="text-xs text-muted-foreground mt-1">
                تُضاف الباقة الأولى من عقدة «الباقات» بزر (+).
              </div>
            </div>
          </Panel>
        )}

        {/* Zoom in/out/fit stay available at every size — pinch on touch is
            imprecise and "fit" is the escape hatch when the tree wanders off
            screen. It was gated behind `roomy` together with the minimap, which
            left phones with no zoom affordance at all. Only the minimap (the
            actual space hog) keeps that gate. */}
        {hasPackages && (
          <Controls
            position="bottom-left"
            showInteractive={false}
            className="!rounded-lg !border !border-surface-line !bg-surface-raised !shadow-[var(--elev-1)]"
          />
        )}
        {roomy && (
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            nodeStrokeWidth={0}
            nodeColor={(n) => {
              if (n.type === "quota") return "var(--brand-teal)"
              if (n.type === "tier") {
                const d = n.data as TierData
                return tintVar(TIER_TINT[d.tier])
              }
              if (n.type === "package") {
                const d = n.data as PackageData
                return tintVar(TIER_TINT[d.pkg.tier])
              }
              const d = n.data as LegData
              return d.leg.role === "transitional"
                ? "var(--brand-rose)"
                : d.hotel?.city === "makkah"
                  ? "var(--brand-teal)"
                  : "var(--brand-green)"
            }}
            maskColor="rgba(2,63,66,0.06)"
            className="!rounded-lg !border !border-surface-line !bg-surface-raised !shadow-[var(--elev-1)]"
          />
        )}
      </ReactFlow>

      <NodeMenu target={menu} onClose={closeMenu} />
    </div>
  )
}

export function PackageGraph(props: Props) {
  return (
    <ReactFlowProvider>
      <PackageGraphInner {...props} />
    </ReactFlowProvider>
  )
}
