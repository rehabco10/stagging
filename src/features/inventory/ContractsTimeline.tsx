import { Suspense, lazy } from "react"
import { useSnapshot } from "valtio"

import { contractBeds, state, type DraftContract } from "@/store/season"
import { hotelNightly, dayMs, DAY_MS } from "./supply"
import { cn, arNum } from "@/lib/utils"

// The quantities chart carries the whole recharts dependency — lazy, so the
// main bundle doesn't pay for it on routes that never draw a timeline.
const TimelineChart = lazy(() => import("./TimelineChart"))

/**
 * The hotel's supply on the season's time axis, in two registers:
 * 1. Contract lanes (custom divs) — the schedule. Non-overlapping windows
 *    pack onto a shared lane, so Haram's seven time-sliced contracts read as
 *    a relay, not seven rows.
 * 2. A step chart (TimelineChart) — the quantities. Signed beds as a soft
 *    envelope, planned package capacity as the line, and the excess as a rose
 *    STATUS band stacked on the envelope: the band exists exactly where
 *    demand pokes above supply, so the finding is positional, not color-alone.
 */

interface LanedContract {
  c: DraftContract
  lane: number
}

/** Greedy interval packing: first lane whose last window ended by our start. */
function packLanes(contracts: DraftContract[]): { laned: LanedContract[]; lanes: number } {
  const laneEnds: number[] = []
  const laned: LanedContract[] = []
  for (const c of [...contracts].sort((a, b) => a.starts_on.localeCompare(b.starts_on))) {
    const s = dayMs(c.starts_on)
    let lane = laneEnds.findIndex((end) => end <= s)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(0)
    }
    laneEnds[lane] = dayMs(c.ends_on)
    laned.push({ c, lane })
  }
  return { laned, lanes: laneEnds.length }
}

const dm = (t: number) => {
  const d = new Date(t)
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`
}

export function ContractsTimeline({ hotelId }: { hotelId: string }) {
  const snap = useSnapshot(state)
  const contracts = snap.contracts.filter((c) => c.hotelId === hotelId && c.status !== "cancelled")
  const nightly = hotelNightly(hotelId, snap as never)
  if (!nightly.length && !contracts.length) return null

  const lo = Math.min(...nightly.map((p) => p.night), ...contracts.map((c) => dayMs(c.starts_on)))
  const hi = Math.max(
    ...nightly.map((p) => p.night + DAY_MS),
    ...contracts.map((c) => dayMs(c.ends_on)),
  )
  const span = Math.max(hi - lo, DAY_MS)
  const pct = (t: number) => ((t - lo) / span) * 100

  const { laned, lanes } = packLanes(contracts as unknown as DraftContract[])

  const data = nightly.map((p) => ({
    night: p.night,
    label: dm(p.night),
    supply: p.supply,
    demand: p.demand,
    overrun: Math.max(0, p.demand - p.supply),
  }))

  return (
    <div>
      {/* ── contract lanes ── */}
      <div dir="rtl" className="relative" style={{ height: `${lanes * 2}rem` }}>
        {laned.map(({ c, lane }) => {
          const s = pct(dayMs(c.starts_on))
          const w = Math.max(1.5, pct(dayMs(c.ends_on)) - s)
          const signed = c.status === "signed"
          return (
            <div
              key={c.id}
              title={`عقد ${c.contract_no || "بدون رقم"} · ${c.starts_on} → ${c.ends_on} · ${arNum(contractBeds(c))} سرير`}
              className={cn(
                "absolute flex h-7 items-center gap-2 overflow-hidden rounded-md px-2",
                signed
                  ? "bg-[color:var(--brand-teal-soft)] text-[color:var(--brand-teal-deep)]"
                  : "border border-dashed border-[color:var(--brand-gold)] bg-[color:var(--brand-gold-soft)]/40 text-[color:var(--brand-gold-deep)]",
              )}
              style={{ insetInlineStart: `${s}%`, width: `${w}%`, top: `${lane * 2}rem` }}
            >
              <span className="truncate text-[11px] font-semibold tabular-nums">
                {arNum(contractBeds(c as DraftContract))} سرير
              </span>
              <span dir="ltr" className="ms-auto hidden truncate text-[10px] tabular-nums opacity-60 sm:block">
                {dm(dayMs(c.starts_on))}–{dm(dayMs(c.ends_on))}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── quantities (lazy recharts chunk) ── */}
      {data.length > 0 && (
        <Suspense
          fallback={<div className="mt-3 h-44 animate-pulse rounded-md bg-surface-sunken/60" />}
        >
          <TimelineChart data={data} />
        </Suspense>
      )}

      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
        الأعلى: نوافذ العقود (المتقطّع مقترح غير موقَّع). الأسفل: سعات الباقات ليلةً بليلة على
        غلاف الأسرّة الموقَّعة — الشريط الوردي هو مقدار التجاوز حيث يقع.
      </p>
    </div>
  )
}
