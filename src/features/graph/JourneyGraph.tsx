import { useMemo } from "react"
import {
  Background,
  Controls,
  Handle,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { ArrowRight, BedDouble, PlaneLanding, PlaneTakeoff } from "lucide-react"
// Locale-aware Link — see @/i18n/LocaleProvider.
import { LocaleLink as Link } from "@/i18n/LocaleProvider"
import { useSnapshot } from "valtio"

import { Meter } from "@/components/ui/meter"
import { Price } from "@/components/ui/price"
import { StatusPill } from "@/components/ui/status-pill"
import { dayMs } from "@/features/inventory/supply"
import { SIDE_PANEL_QUERY, useMediaQuery } from "@/hooks/use-media-query"
import { ROLE_OPTIONS, TIER_LABEL } from "@/lib/options"
import { contractBeds, legNights, packageNights, state, type DraftContract, type DraftPackage } from "@/store/season"
import { cn, arNum } from "@/lib/utils"

/**
 * Journey mode — the canvas re-rendered as one pilgrim's trip: a horizontal
 * chain of stops (arrival seats → the stays in date order with their bound
 * housing contracts → return seats), flowing the same direction as the main
 * sideways tree. A separate React Flow instance, not a state of the main
 * tree: the tree's reconcile/layout machinery stays untouched, and leaving
 * the mode simply unmounts this one.
 *
 * Read-only by design — editing lives in the wizard and the workroom.
 */

const dm = (iso: string) => {
  const d = new Date(dayMs(iso))
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`
}
const roleLabel = (role: string) => ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role

const NODE_W = 380
const GAP = 56

type StopKind = "arrival" | "stay" | "return"
interface StopData extends Record<string, unknown> {
  kind: StopKind
  pkgId: string
  legId?: string
  /** Narrow portrait stacks the chain vertically — handles flip with it. */
  vertical: boolean
}

/* ── per-stop card ──────────────────────────────────────────────── */

function useJourneyPkg(pkgId: string) {
  const snap = useSnapshot(state)
  return { snap, pkg: snap.packages.find((p) => p.id === pkgId) }
}

function flightsOf(
  snap: ReturnType<typeof useJourneyPkg>["snap"],
  pkg: NonNullable<ReturnType<typeof useJourneyPkg>["pkg"]>,
  direction: "arrival" | "return",
) {
  return pkg.flightAllocations
    .map((a) => ({ a, f: snap.flightBlocks.find((f) => f.id === a.blockId) }))
    .filter(
      (x): x is { a: (typeof pkg.flightAllocations)[number]; f: NonNullable<typeof x.f> } =>
        Boolean(x.f && x.f.direction === direction && x.f.status !== "cancelled"),
    )
    .sort((x, y) => x.f.flies_on.localeCompare(y.f.flies_on))
}

function JourneyStopNode({ data }: NodeProps<Node<StopData>>) {
  const { snap, pkg } = useJourneyPkg(data.pkgId)
  if (!pkg) return null

  const shell = (tone: string, icon: React.ReactNode, title: React.ReactNode, body: React.ReactNode) => (
    <div
      dir="rtl"
      style={{ width: NODE_W }}
      className="rounded-xl border border-surface-line bg-surface-raised p-3 shadow-[var(--elev-2)]"
    >
      <Handle
        type="target"
        position={data.vertical ? Position.Top : Position.Left}
        className="!size-0 !min-h-0 !min-w-0 !border-0 !bg-transparent"
      />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", tone)}>{icon}</span>
        {title}
      </div>
      {body}
      <Handle
        type="source"
        position={data.vertical ? Position.Bottom : Position.Right}
        className="!size-0 !min-h-0 !min-w-0 !border-0 !bg-transparent"
      />
    </div>
  )

  const flightRows = (list: ReturnType<typeof flightsOf>) => (
    <ul className="mt-2 space-y-1">
      {list.map(({ a, f }) => (
        <li
          key={f.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg bg-surface-sunken/70 px-2.5 py-1.5"
        >
          <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
            {f.airline_ar || f.airline_en || "—"}
            {f.flight_no && (
              <span dir="ltr" className="ms-1.5 font-mono text-[11px] font-normal text-muted-foreground">
                {f.flight_no}
              </span>
            )}
          </span>
          <span dir="ltr" className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {f.flies_on ? dm(f.flies_on) : ""}
          </span>
          <span className="shrink-0 text-[12px] font-semibold tabular-nums">{arNum(a.seats)} مقعد</span>
        </li>
      ))}
    </ul>
  )

  if (data.kind === "arrival" || data.kind === "return") {
    const list = flightsOf(snap, pkg, data.kind)
    const seats = list.reduce((t, x) => t + x.a.seats, 0)
    const Icon = data.kind === "arrival" ? PlaneLanding : PlaneTakeoff
    return shell(
      "bg-[color:var(--brand-teal-soft)]",
      <Icon className="size-4 text-[color:var(--brand-teal-deep)]" />,
      <>
        <span className="text-[13px] font-bold">{data.kind === "arrival" ? "الوصول" : "المغادرة"}</span>
        <Meter className="min-w-28 flex-1" value={seats} max={pkg.capacity} bound="min" />
      </>,
      list.length ? (
        flightRows(list)
      ) : (
        <p className="mt-1.5 text-[11px] text-[color:var(--brand-rose-deep)]">لا مقاعد مخصصة.</p>
      ),
    )
  }

  const leg = pkg.legs.find((l) => l.id === data.legId)
  if (!leg) return null
  const hotel = snap.hotels.find((h) => h.id === leg.hotelId)
  const bound = snap.contracts.filter((c) => c.hotelId === leg.hotelId && pkg.contractIds.includes(c.id))
  return shell(
    "bg-[color:var(--brand-gold-soft)]",
    <BedDouble className="size-4 text-[color:var(--brand-gold-deep)]" />,
    <>
      <Link to={`/hotels/${leg.hotelId}`} className="text-[13px] font-bold text-foreground hover:underline">
        {hotel?.name_ar ?? leg.hotelId}
      </Link>
      <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
        {hotel?.city === "makkah" ? "مكة" : "المدينة"}
      </span>
      <span className="text-[10px] text-muted-foreground">{roleLabel(leg.role)}</span>
      <span dir="ltr" className="ms-auto text-[11px] tabular-nums text-muted-foreground">
        {dm(leg.starts_on)} – {dm(leg.ends_on)}
      </span>
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {arNum(legNights(leg as never))} ليلة
      </span>
    </>,
    bound.length ? (
      <ul className="mt-2 space-y-1">
        {bound.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg bg-surface-sunken/70 px-2.5 py-1.5"
          >
            <span dir="ltr" className="font-mono text-[11px] tabular-nums">
              {c.contract_no || "—"}
            </span>
            <span dir="ltr" className="text-[11px] tabular-nums text-muted-foreground">
              {dm(c.starts_on)}–{dm(c.ends_on)}
            </span>
            <span className="ms-auto text-[12px] font-semibold tabular-nums">
              {arNum(contractBeds(c as DraftContract))} سرير
            </span>
            <StatusPill status={c.status} />
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-1.5 text-[11px] text-[color:var(--brand-rose-deep)]">لا عقود سكن مرتبطة.</p>
    ),
  )
}

const journeyNodeTypes = { stop: JourneyStopNode }

/* ── the vertical chain ─────────────────────────────────────────── */

function JourneyGraphInner({ pkgId, onBack }: { pkgId: string; onBack: () => void }) {
  const { snap, pkg } = useJourneyPkg(pkgId)
  // Wide/landscape reads left-to-right like the main tree; narrow portrait
  // stacks the trip vertically — a 4-stop horizontal chain fitted into a
  // 390px viewport rendered as unreadable specks.
  const horizontal = useMediaQuery(SIDE_PANEL_QUERY)

  const { nodes, edges } = useMemo(() => {
    if (!pkg) return { nodes: [] as Node<StopData>[], edges: [] as Edge[] }
    const legs = [...pkg.legs].sort((a, b) => a.starts_on.localeCompare(b.starts_on))
    const rowsOf = (s: { kind: StopKind; legId?: string }) =>
      s.kind === "stay"
        ? snap.contracts.filter(
            (c) =>
              c.hotelId === legs.find((l) => l.id === s.legId)?.hotelId &&
              pkg.contractIds.includes(c.id),
          ).length || 1
        : flightsOf(snap, pkg, s.kind).length || 1
    const stops: { id: string; data: StopData }[] = [
      { id: "j_arrival", data: { kind: "arrival", pkgId, vertical: !horizontal } },
      ...legs.map((l) => ({
        id: `j_${l.id}`,
        data: { kind: "stay" as const, pkgId, legId: l.id, vertical: !horizontal },
      })),
      { id: "j_return", data: { kind: "return", pkgId, vertical: !horizontal } },
    ]
    // Horizontal: fixed node width makes the stacking exact. Vertical:
    // estimated heights (auto-sized cards) only need to prevent overlap.
    const estimate = (rows: number) => 64 + rows * 40
    let y = 0
    const nodes: Node<StopData>[] = stops.map((s, i) => {
      const node: Node<StopData> = {
        id: s.id,
        type: "stop",
        position: horizontal ? { x: i * (NODE_W + GAP), y: 0 } : { x: 0, y },
        data: s.data,
        draggable: false,
        connectable: false,
      }
      y += estimate(rowsOf(s.data)) + GAP
      return node
    })
    const edges: Edge[] = stops.slice(1).map((s, i) => ({
      id: `je_${i}`,
      source: stops[i].id,
      target: s.id,
      type: "smoothstep",
      style: { stroke: "var(--brand-teal)", strokeWidth: 1.5, opacity: 0.5 },
    }))
    return { nodes, edges }
  }, [snap, pkg, pkgId, horizontal])

  if (!pkg) return null

  return (
    <div dir="ltr" className="relative h-full w-full">
      <ReactFlow
        // Remount on orientation flip so fitView frames the new layout.
        key={horizontal ? "h" : "v"}
        nodes={nodes}
        edges={edges}
        nodeTypes={journeyNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, minZoom: 0.3, maxZoom: 1.1 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        minZoom={0.25}
        maxZoom={1.6}
      >
        <Background gap={20} size={1} color="rgba(148,163,184,0.18)" />

        {/* Wide: a centred title card. Narrow: a compact start-edge pill so
            it never collides with the back button on the end edge. */}
        <Panel position={horizontal ? "top-center" : "top-left"} className="!m-3">
          <div
            dir="rtl"
            className="flex max-w-[55vw] flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-surface-line bg-card/90 px-3 py-2 shadow-sm backdrop-blur sm:max-w-none sm:px-4"
          >
            <span className="truncate text-[13px] font-bold">
              رحلة الحاج — باقة {pkg.package_no}
            </span>
            <span dir="ltr" className="hidden text-[11px] text-muted-foreground sm:inline">
              {pkg.name_en}
            </span>
            <span className="hidden rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-semibold sm:inline">
              {TIER_LABEL[pkg.tier]}
            </span>
            <span className="hidden text-[11px] tabular-nums text-muted-foreground sm:inline">
              {arNum(pkg.capacity)} حاج · {arNum(packageNights(pkg as DraftPackage))} ليلة
            </span>
            {pkg.initial_price_sar > 0 && (
              <span className="hidden sm:inline-flex">
                <Price value={`${arNum(Math.round(pkg.initial_price_sar))} ر.س`} />
              </span>
            )}
          </div>
        </Panel>

        <Panel position="top-right" className="!m-3">
          <div dir="rtl">
            {/* Same chrome as the canvas panels — a card floating on the
                surface, not a form control. */}
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 rounded-lg border border-surface-line bg-card/90 px-4 py-2 text-[13px] text-foreground shadow-sm backdrop-blur transition-colors hover:bg-surface-sunken/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <ArrowRight className="size-4" />
              رجوع إلى المخطط
            </button>
          </div>
        </Panel>

        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!rounded-lg !border !border-surface-line !bg-surface-raised !shadow-[var(--elev-1)]"
        />
      </ReactFlow>
    </div>
  )
}

export function JourneyGraph(props: { pkgId: string; onBack: () => void }) {
  return (
    <ReactFlowProvider>
      {/* Keyed remount per package: fitView runs fresh for each journey. */}
      <JourneyGraphInner key={props.pkgId} {...props} />
    </ReactFlowProvider>
  )
}
