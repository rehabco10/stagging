import { Link } from "react-router-dom"
import { useSnapshot } from "valtio"
import { PlaneLanding, PlaneTakeoff, X } from "lucide-react"

import {
  contractBeds,
  setFlightAllocationSeats,
  state,
  toggleContractLink,
  toggleFlightAllocation,
  type DraftContract,
  type DraftPackage,
} from "@/store/season"
import { Checkbox, NumInput, SelectField } from "@/components/ui/field"
import { Meter } from "@/components/ui/meter"
import { StatusPill } from "@/components/ui/status-pill"
import { dayMs, DAY_MS } from "@/features/inventory/supply"
import { cn, arNum } from "@/lib/utils"

const dm = (iso: string) => {
  const d = new Date(dayMs(iso))
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`
}

/**
 * The package's resources, organized by the two decisions being made
 * (docs/packages-ux-bpr.md):
 *
 * - Housing is a PER-HOTEL coverage decision: for each hotel this package
 *   stays at, which of that hotel's contracts cover MY nights, and do the
 *   bound beds reach my capacity on the worst night. Contracts are grouped
 *   under their hotel with a coverage meter and a covers/partial/outside
 *   verdict per contract — not one flat checklist across hotels.
 * - Flights are a PER-DIRECTION coverage decision: fill the capacity with
 *   seat allocations. Only ALLOCATED blocks render as rows (123 blocks as a
 *   checklist was unusable); adding is a select per direction.
 */
export function PackageResources({ pkg }: { pkg: DraftPackage }) {
  const snap = useSnapshot(state)
  const live = snap.packages.find((p) => p.id === pkg.id)
  if (!live) return null

  /* ── housing: group by the package's leg hotels ── */

  const legHotels = [...new Set(live.legs.map((l) => l.hotelId))]
  // Bound contracts on hotels the package no longer stays at — still shown,
  // so a stale binding can be unbound instead of becoming invisible.
  const strayIds = live.contractIds.filter((cid) => {
    const c = snap.contracts.find((x) => x.id === cid)
    return c && !legHotels.includes(c.hotelId)
  })

  const stayAt = (hotelId: string) =>
    live.legs
      .filter((l) => l.hotelId === hotelId)
      .map((l) => ({ s: dayMs(l.starts_on), e: dayMs(l.ends_on) }))

  const coverage = (c: { starts_on: string; ends_on: string }, hotelId: string) => {
    const spans = stayAt(hotelId)
    const total = spans.reduce((t, sp) => t + (sp.e - sp.s) / DAY_MS, 0)
    if (!total) return { covered: 0, total: 0 }
    const cs = dayMs(c.starts_on)
    const ce = dayMs(c.ends_on)
    const covered = spans.reduce(
      (t, sp) => t + Math.max(0, (Math.min(sp.e, ce) - Math.max(sp.s, cs)) / DAY_MS),
      0,
    )
    return { covered, total }
  }

  /** Worst-night beds this package has bound at the hotel, across its stay. */
  const worstNightBeds = (hotelId: string) => {
    const bound = live.contractIds
      .map((cid) => snap.contracts.find((x) => x.id === cid))
      .filter((c): c is NonNullable<typeof c> => Boolean(c && c.hotelId === hotelId))
    let worst = Infinity
    for (const sp of stayAt(hotelId)) {
      for (let night = sp.s; night < sp.e; night += DAY_MS) {
        const beds = bound
          .filter((c) => night >= dayMs(c.starts_on) && night < dayMs(c.ends_on))
          .reduce((t, c) => t + contractBeds(c as DraftContract), 0)
        worst = Math.min(worst, beds)
      }
    }
    return worst === Infinity ? 0 : worst
  }

  const contractRow = (c: (typeof snap.contracts)[number], hotelId: string) => {
    const bound = live.contractIds.includes(c.id)
    const { covered, total } = coverage(c, hotelId)
    const verdict =
      total === 0
        ? null
        : covered >= total
          ? { text: "يغطي كامل مدة الإقامة", cls: "text-[color:var(--brand-green-deep)]" }
          : covered > 0
            ? { text: `يغطي ${arNum(covered)} من ${arNum(total)} ليلة`, cls: "text-[color:var(--brand-gold-deep)]" }
            : { text: "خارج مدة الإقامة", cls: "text-[color:var(--brand-rose-deep)]" }
    return (
      <li key={c.id}>
        <label
          className={cn(
            "flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 transition-colors",
            bound
              ? "border-[color:var(--brand-teal)]/40 bg-[color:var(--brand-teal-soft)]/40"
              : "border-surface-line hover:bg-surface-sunken/60",
          )}
        >
          <Checkbox checked={bound} onCheckedChange={() => toggleContractLink(pkg.id, c.id)} />
          <span dir="ltr" className="font-mono text-[12px] tabular-nums">
            {c.contract_no || "—"}
          </span>
          <span dir="ltr" className="text-[11px] tabular-nums text-muted-foreground">
            {dm(c.starts_on)}–{dm(c.ends_on)}
          </span>
          <span className="text-[12px] font-semibold tabular-nums">
            {arNum(contractBeds(c as DraftContract))} سرير
          </span>
          <StatusPill status={c.status} />
          {verdict && <span className={cn("ms-auto text-[11px]", verdict.cls)}>{verdict.text}</span>}
        </label>
      </li>
    )
  }

  /* ── flights: per direction, allocated rows + add-select ── */

  const allocOf = (blockId: string) => live.flightAllocations.find((a) => a.blockId === blockId)

  const directionGroup = (direction: "arrival" | "return", label: string, Icon: typeof PlaneLanding) => {
    const allocated = live.flightAllocations
      .map((a) => ({ a, f: snap.flightBlocks.find((f) => f.id === a.blockId) }))
      .filter((x): x is { a: (typeof live.flightAllocations)[number]; f: NonNullable<typeof x.f> } =>
        Boolean(x.f && x.f.direction === direction),
      )
    const seats = allocated
      .filter((x) => x.f.status !== "cancelled")
      .reduce((t, x) => t + x.a.seats, 0)
    const addable = snap.flightBlocks.filter(
      (f) => f.direction === direction && f.status !== "cancelled" && !allocOf(f.id),
    )
    return (
      <div>
        <div className="flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-[12px] font-bold">{label}</span>
          <Meter className="min-w-40 max-w-72 flex-1" value={seats} max={live.capacity} bound="min" />
        </div>
        {allocated.length > 0 && (
          <ul className="mt-2 space-y-1">
            {allocated.map(({ a, f }) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-surface-line px-3 py-1.5"
              >
                {/* The date lives OUTSIDE the truncating span: inside it, a
                    long carrier name («حجوزات أفراد (GDS)…») swallowed the
                    date into the ellipsis as one mangled token. */}
                <span className="min-w-0 flex-1 truncate text-[12px]">
                  {f.airline_ar || f.airline_en || "—"}
                  {f.flight_no && (
                    <span dir="ltr" className="ms-1 font-mono text-[11px] text-muted-foreground">
                      {f.flight_no}
                    </span>
                  )}
                </span>
                {f.flies_on && (
                  <span dir="ltr" className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {dm(f.flies_on)}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground">
                  <NumInput
                    className="h-7 w-16 px-2 text-[12px]"
                    aria-label="المقاعد المخصصة"
                    value={a.seats ? String(a.seats) : ""}
                    placeholder="0"
                    onChange={(e) =>
                      setFlightAllocationSeats(pkg.id, f.id, Number(e.target.value) || 0)
                    }
                  />
                  / {arNum(f.seats)}
                </span>
                {f.status === "cancelled" ? <StatusPill status="cancelled" /> : null}
                <button
                  type="button"
                  aria-label="إزالة التخصيص"
                  onClick={() => toggleFlightAllocation(pkg.id, f.id)}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground/50 transition-colors hover:bg-[color:var(--brand-rose-soft)] hover:text-[color:var(--brand-rose-deep)]"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 max-w-96">
          <SelectField
            placeholder={`إضافة كتلة ${label}…`}
            value=""
            options={addable.map((f) => ({
              value: f.id,
              label: `${f.airline_ar || f.airline_en} ${f.flight_no || ""} · ${f.flies_on ? dm(f.flies_on) : ""} · ${arNum(f.seats)} مقعد`,
            }))}
            onChange={(v) => v && toggleFlightAllocation(pkg.id, v)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── السكن ── */}
      <div className="space-y-4">
        {legHotels.length === 0 && (
          <p className="text-[12px] text-muted-foreground">
            لا يمكن ربط عقود السكن قبل إضافة الإقامات.
          </p>
        )}
        {legHotels.map((hotelId) => {
          const hotel = snap.hotels.find((h) => h.id === hotelId)
          const contracts = snap.contracts.filter((c) => c.hotelId === hotelId)
          const worst = worstNightBeds(hotelId)
          const spans = stayAt(hotelId)
          const range =
            spans.length > 0
              ? `${dm(new Date(Math.min(...spans.map((s) => s.s))).toISOString())}–${dm(new Date(Math.max(...spans.map((s) => s.e))).toISOString())}`
              : ""
          return (
            <div key={hotelId}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link
                  to={`/hotels/${hotelId}`}
                  className="text-[12px] font-bold text-foreground hover:underline"
                >
                  {hotel?.name_ar ?? hotelId}
                </Link>
                <span dir="ltr" className="text-[11px] tabular-nums text-muted-foreground">
                  {range}
                </span>
                {contracts.length > 0 && (
                  <Meter
                    className="min-w-40 max-w-72 flex-1"
                    value={worst}
                    max={live.capacity}
                    bound="min"
                  />
                )}
              </div>
              {contracts.length === 0 ? (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  لا عقود لهذا الفندق —{" "}
                  <Link to={`/hotels/${hotelId}`} className="font-semibold underline underline-offset-2">
                    إضافة عقد من صفحة السكن
                  </Link>
                  .
                </p>
              ) : (
                <ul className="mt-2 space-y-1">{contracts.map((c) => contractRow(c, hotelId))}</ul>
              )}
            </div>
          )
        })}
        {strayIds.length > 0 && (
          <div>
            <div className="text-[12px] font-bold text-[color:var(--brand-gold-deep)]">
              عقود مرتبطة خارج فنادق الإقامات
            </div>
            <ul className="mt-2 space-y-1">
              {strayIds.map((cid) => {
                const c = snap.contracts.find((x) => x.id === cid)!
                return contractRow(c, c.hotelId)
              })}
            </ul>
          </div>
        )}
      </div>

      {/* ── الطيران ── */}
      <div className="space-y-4 border-t border-surface-line pt-4">
        {directionGroup("arrival", "الوصول", PlaneLanding)}
        {directionGroup("return", "المغادرة", PlaneTakeoff)}
      </div>
    </div>
  )
}
