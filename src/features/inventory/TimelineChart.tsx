import { useTranslation } from "react-i18next"
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { arNum } from "@/lib/utils"

/**
 * The quantities half of the contracts timeline — split into its own module
 * and loaded lazily, because recharts is the heaviest library in the bundle
 * and only this view uses it. Default export for React.lazy.
 *
 * Colors are fixed hexes from the brand tokens (SVG presentation attributes
 * cannot resolve CSS vars): line #004A4D (teal-deep — validated ΔE 13.8
 * protan against the rose #E5446D band), envelope #008085 at low opacity.
 */

const TEAL = "#008085"
const TEAL_DEEP = "#004A4D"
const ROSE = "#E5446D"

export interface TimelinePoint {
  night: number
  label: string
  supply: number
  demand: number
  overrun: number
}

export default function TimelineChart({ data }: { data: TimelinePoint[] }) {
  const { t } = useTranslation()
  return (
    <div className="mt-3">
      {/* legend: identity never rides on color alone */}
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ background: TEAL_DEEP }} />
          {t("سعات الباقات")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm" style={{ background: TEAL, opacity: 0.25 }} />
          {t("الأسرّة الموقَّعة")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm" style={{ background: ROSE, opacity: 0.65 }} />
          {t("تجاوز")}
        </span>
      </div>
      {/* ltr wrapper + reversed axis: Recharts math stays sane, time still
          flows right→left to match the lanes above */}
      <div dir="ltr" className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--surface-line)" />
            <XAxis
              dataKey="label"
              reversed
              tick={{ fontSize: 10, fill: "var(--muted-foreground, #888)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--surface-line)" }}
              interval={6}
            />
            <YAxis
              orientation="right"
              width={44}
              tick={{ fontSize: 10, fill: "var(--muted-foreground, #888)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: TEAL_DEEP, strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload as TimelinePoint
                return (
                  <div
                    dir="rtl"
                    className="rounded-lg border border-surface-line bg-surface-raised px-3 py-2 text-[11px] shadow-[var(--elev-2)]"
                  >
                    <div dir="ltr" className="mb-1 font-semibold tabular-nums text-foreground">
                      {new Date(p.night).toISOString().slice(0, 10)}
                    </div>
                    <div className="space-y-0.5 tabular-nums text-muted-foreground">
                      <div>سعات الباقات: {arNum(p.demand)}</div>
                      <div>الأسرّة الموقَّعة: {arNum(p.supply)}</div>
                      {p.overrun > 0 && (
                        <div className="font-semibold text-[color:var(--brand-rose-deep)]">
                          تجاوز: {arNum(p.overrun)} سرير
                        </div>
                      )}
                    </div>
                  </div>
                )
              }}
            />
            <Area
              type="stepAfter"
              dataKey="supply"
              stackId="cap"
              name="الأسرّة الموقَّعة"
              fill={TEAL}
              fillOpacity={0.14}
              stroke="none"
              isAnimationActive={false}
            />
            <Area
              type="stepAfter"
              dataKey="overrun"
              stackId="cap"
              name="تجاوز"
              fill={ROSE}
              fillOpacity={0.55}
              stroke="none"
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="demand"
              name="سعات الباقات"
              stroke={TEAL_DEEP}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
