import { Handle, Position, type Node, type NodeProps } from "@xyflow/react"
import { Plus, Pin, MoveRight, TriangleAlert } from "lucide-react"
import { cn, arNum } from "@/lib/utils"
import type { DraftLeg, DraftPackage, DraftHotel } from "@/store/season"

export type Tint = "teal" | "green" | "gold" | "rose" | "slate"

const TINT_BG: Record<Tint, string> = {
  teal: "bg-[color:var(--brand-teal-soft)] border-[color:color-mix(in_srgb,var(--brand-teal)_35%,transparent)]",
  green: "bg-[color:var(--brand-green-soft)] border-[color:color-mix(in_srgb,var(--brand-green)_35%,transparent)]",
  gold: "bg-[color:var(--brand-gold-soft)] border-[color:color-mix(in_srgb,var(--brand-gold)_40%,transparent)]",
  rose: "bg-[color:var(--brand-rose-soft)] border-[color:color-mix(in_srgb,var(--brand-rose)_35%,transparent)]",
  slate: "bg-[color:var(--brand-slate-soft)] border-[color:color-mix(in_srgb,var(--brand-slate)_30%,transparent)]",
}
const TINT_FG: Record<Tint, string> = {
  teal: "text-[color:var(--brand-teal-deep)]",
  green: "text-[color:var(--brand-green-deep)]",
  gold: "text-[color:var(--brand-gold-deep)]",
  rose: "text-[color:var(--brand-rose-deep)]",
  slate: "text-[color:var(--brand-slate-deep)]",
}
const TINT_BAR: Record<Tint, string> = {
  teal: "bg-[color:var(--brand-teal)]",
  green: "bg-[color:var(--brand-green)]",
  gold: "bg-[color:var(--brand-gold)]",
  rose: "bg-[color:var(--brand-rose)]",
  slate: "bg-[color:var(--brand-slate)]",
}

export const TIER_TINT: Record<DraftPackage["tier"], Tint> = {
  luxury: "gold",
  premium: "green",
  standard: "slate",
}

export const ROLE_LABEL: Record<DraftLeg["role"], string> = {
  first: "السكن الأول",
  second: "السكن الثاني",
  transitional: "السكن الانتقالي",
}

const STAR_LABEL: Record<DraftHotel["star_class"], string> = {
  "5": "خمسة نجوم",
  "4": "أربعة نجوم",
  "3": "ثلاثة نجوم",
  "2": "نجمتان",
  "1": "نجمة واحدة",
  nuzul: "نزل",
}

/* ── shared chrome ──────────────────────────────────────────────── */

/**
 * The floating (+). Sits half over the card's bottom edge so it reads as
 * "grow the tree from here". `nodrag nopan` keeps a click on it from starting
 * a node drag or a canvas pan.
 *
 * Visibility is pure CSS (`group-hover`), never React state: routing hover
 * through state re-rendered every node and re-ran the dagre layout on each
 * mouse-over, which made the whole canvas flicker. The button is a DOM
 * descendant of the group, so `:hover` still matches while the pointer is on
 * the button itself even though it overhangs the card's box.
 */
function AddButton({
  visible,
  disabled,
  title,
  onClick,
}: {
  /** Force-visible regardless of hover (used when the node is selected). */
  visible: boolean
  disabled?: boolean
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onClick()
      }}
      className={cn(
        "nodrag nopan absolute left-1/2 -bottom-3.5 -translate-x-1/2 z-10",
        "grid place-items-center size-7 rounded-full border shadow-sm",
        "transition-[opacity,transform,background-color,color] duration-150",
        visible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:scale-100 focus-visible:pointer-events-auto",
        disabled
          ? "bg-muted border-border text-muted-foreground/60 cursor-not-allowed"
          : "bg-card border-[color:var(--brand-teal)] text-[color:var(--brand-teal-deep)] hover:bg-[color:var(--brand-teal)] hover:text-white cursor-pointer",
      )}
    >
      <Plus className="size-4" strokeWidth={2.5} />
    </button>
  )
}

function PinnedMark({ pinned }: { pinned: boolean }) {
  if (!pinned) return null
  return (
    <span
      title="مثبَّت — لن تحركه إعادة الترتيب. انقر مرتين لفكّ التثبيت."
      className="absolute -top-2 -start-2 grid place-items-center size-5 rounded-full bg-card border border-border shadow-sm"
    >
      <Pin className="size-3 text-muted-foreground" />
    </span>
  )
}

function Card({
  tint,
  selected,
  invalid,
  width,
  height,
  children,
}: {
  tint: Tint
  selected: boolean
  invalid?: boolean
  width: number
  height: number
  children: React.ReactNode
}) {
  return (
    <div
      dir="rtl"
      // Fixed box: React Flow is told the same width/height, so nothing has to
      // be measured and layout can't disagree with what's painted.
      style={{ width, height }}
      className={cn(
        "group relative rounded-xl border-2 shadow-sm px-3 py-2.5 flex flex-col gap-1.5",
        "transition-shadow hover:shadow-md",
        TINT_BG[tint],
        selected && "ring-2 ring-[color:var(--brand-teal)] ring-offset-2 ring-offset-background shadow-lg",
        invalid && "border-[color:var(--brand-rose)]",
      )}
    >
      {children}
    </div>
  )
}

/* ── quota root ─────────────────────────────────────────────────── */

export interface QuotaData extends Record<string, unknown> {
  quota: number
  allocated: number
  packageCount: number
  standardPct: number
  selected: boolean
  errorCount: number
  onAdd: () => void
}

export const QUOTA_W = 300
export const QUOTA_H = 132

export function QuotaNode({ data }: NodeProps<Node<QuotaData>>) {
  const { quota, allocated, packageCount, standardPct, errorCount } = data
  const left = quota - allocated
  const pct = quota > 0 ? Math.min(100, (allocated / quota) * 100) : 0
  const over = left < 0

  return (
    <>
      <Card tint="teal" selected={data.selected} invalid={over} width={QUOTA_W} height={QUOTA_H}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-foreground/70">
              الحصة الإجمالية
            </div>
            <div className="text-base font-bold text-foreground leading-tight mt-0.5">الباقات</div>
          </div>
          <div className="text-end">
            <div className={cn("text-lg font-bold tabular-nums", TINT_FG.teal)}>{arNum(quota)}</div>
            <div className="text-[10px] text-foreground/60">حاج</div>
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-white/70 overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", over ? TINT_BAR.rose : TINT_BAR.teal)}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] tabular-nums">
          <span className="text-foreground/70">
            موزَّع <b className="font-semibold text-foreground">{arNum(allocated)}</b>
          </span>
          <span className={cn("font-semibold", over ? "text-[color:var(--brand-rose-deep)]" : "text-foreground/70")}>
            {over ? `تجاوز ${arNum(-left)}` : `متبقٍ ${arNum(left)}`}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-foreground/60 border-t border-white/60 pt-1.5">
          <span>{packageCount === 0 ? "لا توجد باقات بعد" : `${arNum(packageCount)} باقة`}</span>
          {packageCount > 0 && <span className="tabular-nums">أساسية {standardPct.toFixed(0)}%</span>}
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[color:var(--brand-rose-deep)] font-semibold">
              <TriangleAlert className="size-3" />
              {arNum(errorCount)}
            </span>
          )}
        </div>

        <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        <AddButton visible={data.selected} title="إضافة باقة" onClick={data.onAdd} />
      </Card>
    </>
  )
}

/* ── package ────────────────────────────────────────────────────── */

export interface PackageData extends Record<string, unknown> {
  pkg: DraftPackage
  nights: number
  shifting: boolean
  legCount: number
  canAddLeg: boolean
  selected: boolean
  pinned: boolean
  /** Has at least one blocking error. */
  invalid: boolean
  errorCount: number
  onAdd: () => void
}

export const PACKAGE_W = 260
export const PACKAGE_H = 96

export function PackageNode({ data }: NodeProps<Node<PackageData>>) {
  const { pkg, nights, shifting, legCount } = data
  const tint = TIER_TINT[pkg.tier]

  return (
    <Card tint={tint} selected={data.selected} invalid={data.invalid} width={PACKAGE_W} height={PACKAGE_H}>
      <PinnedMark pinned={data.pinned} />
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-foreground/70">
            <span>باقة {pkg.package_no}</span>
            {shifting && (
              <span className="inline-flex items-center gap-0.5 normal-case tracking-normal text-foreground/55">
                <MoveRight className="size-3" />
                انتقالية
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-foreground leading-tight mt-0.5 truncate" title={pkg.name_en}>
            {pkg.name_en || "—"}
          </div>
        </div>
        <div className={cn("text-base font-bold tabular-nums shrink-0", TINT_FG[tint])}>
          {arNum(pkg.capacity)}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-foreground/70 tabular-nums border-t border-white/60 pt-1.5">
        <span>
          {legCount === 0 ? "بدون إقامات" : `${arNum(legCount)} إقامة · ${arNum(nights)} ليلة`}
        </span>
        {data.invalid ? (
          // A compact chip, not a red card. Every package is "incomplete" for
          // most of its life; painting each one rose made the whole canvas read
          // as broken and drowned out the packages that are genuinely wrong.
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-rose)] px-1.5 py-0.5 text-[9px] font-bold text-white">
            <TriangleAlert className="size-2.5" />
            {arNum(data.errorCount)}
          </span>
        ) : (
          <span>
            {pkg.initial_price_sar > 0
              ? `${arNum(Math.round(pkg.initial_price_sar))} ر.س`
              : "بدون سعر"}
          </span>
        )}
      </div>

      <AddButton
        visible={data.selected}
        disabled={!data.canAddLeg}
        title={data.canAddLeg ? "إضافة إقامة" : "كل الأدوار مستخدمة (أول، ثانٍ، انتقالي)"}
        onClick={data.onAdd}
      />
    </Card>
  )
}

/* ── leg ────────────────────────────────────────────────────────── */

export interface LegData extends Record<string, unknown> {
  leg: DraftLeg
  hotel: DraftHotel | undefined
  nights: number
  order: number
  selected: boolean
  pinned: boolean
  invalid: boolean
}

export const LEG_W = 210
export const LEG_H = 110

export function LegNode({ data }: NodeProps<Node<LegData>>) {
  const { leg, hotel, nights, order } = data
  const tint: Tint = leg.role === "transitional" ? "rose" : hotel?.city === "makkah" ? "teal" : "green"

  return (
    <Card tint={tint} selected={data.selected} invalid={data.invalid} width={LEG_W} height={LEG_H}>
      <PinnedMark pinned={data.pinned} />
      <Handle type="target" position={Position.Top} className="!opacity-0" />

      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-foreground/70">
        <span className="uppercase tracking-wider">{ROLE_LABEL[leg.role]}</span>
        {/* Chronological index — role labels are not order. */}
        <span className="tabular-nums text-foreground/50">#{arNum(order)}</span>
      </div>

      <div className="text-[13px] font-bold text-foreground leading-tight truncate" title={hotel?.name_ar}>
        {hotel?.name_ar ?? "— اختر فندقًا —"}
      </div>

      <div className="flex items-center justify-between text-[10px] text-foreground/65">
        <span>{hotel ? `${hotel.city === "makkah" ? "مكة المكرمة" : "المدينة المنورة"} · ${STAR_LABEL[hotel.star_class]}` : "—"}</span>
        <span className={cn("font-semibold tabular-nums", TINT_FG[tint])}>{arNum(nights)} ليلة</span>
      </div>

      <div className="text-[10px] text-foreground/55 tabular-nums border-t border-white/60 pt-1.5" dir="ltr">
        {leg.starts_on} → {leg.ends_on}
      </div>
    </Card>
  )
}

export const nodeTypes = { quota: QuotaNode, package: PackageNode, leg: LegNode } as const
