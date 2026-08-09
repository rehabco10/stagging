import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { useSnapshot } from "valtio"
import { ChevronLeft, MapPin, Plane, PlaneLanding, PlaneTakeoff, Plus, Trash2, TriangleAlert } from "lucide-react"

import { removeFlightBlock, state, type DraftFlightBlock } from "@/store/season"
import { BalanceStrip } from "@/components/BalanceStrip"
import { useLocaleNavigate } from "@/i18n/LocaleProvider"
import { MasterDetail } from "@/components/MasterDetail"
import { Card, Note, PageHeader } from "@/components/PageShell"
import { MASTER_DETAIL_WIDE_QUERY, useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, Input, NumInput, SelectField } from "@/components/ui/field"
import { FilterChips } from "@/components/ui/filter-chips"
import { Meter } from "@/components/ui/meter"
import { StatusPill } from "@/components/ui/status-pill"
import { AddFlightWizard } from "@/features/inventory/AddFlightWizard"
import { carrierIssues } from "@/features/inventory/supply"
import { flightDirectionOptions, flightStatusOptions, flightTypeOptions } from "@/lib/options"
import { useIssues } from "@/store/use-issues"
import { cn, arNum } from "@/lib/utils"

const carrierKey = (f: { airline_ar: string; airline_en: string }) =>
  f.airline_ar || f.airline_en || "بدون ناقل"

/** A hand-typed or mangled deep link must not crash the page. */
const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return undefined
  }
}

/**
 * الطيران as a place: carriers on the start edge — fleet size, seats per
 * direction, issue badge — and the selected carrier opens as a detail with
 * its blocks split by direction, read-only until a row is opened for edit.
 * A block is always created FROM a carrier, preset in the wizard.
 */
export function CarriersPage() {
  const { t } = useTranslation()
  const params = useParams()
  const carrier = params.carrier ? safeDecode(params.carrier) : undefined
  const navigate = useLocaleNavigate()
  const snap = useSnapshot(state)
  const issues = useIssues()
  const wide = useMediaQuery(MASTER_DETAIL_WIDE_QUERY)
  const [adding, setAdding] = useState<{ ar: string; en: string } | null | "new">(null)
  const [error, setError] = useState<string | null>(null)

  const groups = new Map<string, (typeof snap.flightBlocks)[number][]>()
  for (const f of snap.flightBlocks) {
    const key = carrierKey(f)
    const list = groups.get(key) ?? []
    list.push(f)
    groups.set(key, list)
  }
  const sorted = [...groups.entries()].sort(
    (a, b) => b[1].reduce((t, f) => t + f.seats, 0) - a[1].reduce((t, f) => t + f.seats, 0),
  )
  const selected = carrier && groups.has(carrier) ? carrier : undefined
  // The pane should never sit on a placeholder while carriers exist — default
  // to the biggest fleet. The URL still records only explicit picks, which is
  // what drives the narrow-screen push.
  const shown = selected ?? sorted[0]?.[0]

  const seatsOf = (list: (typeof snap.flightBlocks)[number][], direction: "arrival" | "return") =>
    list.filter((f) => f.direction === direction).reduce((t, f) => t + f.seats, 0)

  const confirmed = (direction: "arrival" | "return") =>
    snap.flightBlocks
      .filter((f) => f.direction === direction && f.status === "confirmed")
      .reduce((t, f) => t + f.seats, 0)

  return (
    // Chat-app scrolling: header and quota meters stay put; the carrier list
    // and the blocks detail scroll independently.
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-page">
      <PageHeader title={t("page.flights")} description={t("page.flights_desc")} />
      <AddFlightWizard
        open={adding !== null}
        onOpenChange={(o) => !o && setAdding(null)}
        airline={adding && adding !== "new" ? adding : undefined}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-4">
        {error && (
          <Note tone="warn" icon={<TriangleAlert className="size-3.5" />}>
            {error}
          </Note>
        )}

        <BalanceStrip
          title="ميزان المقاعد"
          summary={
            <>
              <span className="inline-flex items-center gap-1 text-[12px] tabular-nums text-muted-foreground">
                <PlaneLanding className="size-3.5" />
                <b className="font-bold text-foreground">{arNum(confirmed("arrival"))}</b>
              </span>
              <span className="inline-flex items-center gap-1 text-[12px] tabular-nums text-muted-foreground">
                <PlaneTakeoff className="size-3.5" />
                <b className="font-bold text-foreground">{arNum(confirmed("return"))}</b>
              </span>
              <span dir="ltr" className="text-[12px] tabular-nums text-muted-foreground">
                / {arNum(snap.season.quota_total)}
              </span>
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Meter className="min-w-56 flex-1" label="وصول مؤكَّد" value={confirmed("arrival")} max={snap.season.quota_total} />
            <Meter className="min-w-56 flex-1" label="مغادرة مؤكَّدة" value={confirmed("return")} max={snap.season.quota_total} />
            <Button variant="outline" size="sm" onClick={() => setAdding("new")}>
              <Plus className="size-3.5" />
              كتلة لناقل جديد
            </Button>
          </div>
        </BalanceStrip>

        <div className="min-h-0 flex-1">
          <MasterDetail
        detailOpen={Boolean(selected)}
        onBack={() => navigate("/flights")}
        placeholder={
          <span className="flex items-center gap-2">
            <Plane className="size-4" />
            اختر ناقلًا لعرض كتله
          </span>
        }
        master={
          <ul className="space-y-2">
            {sorted.length === 0 && (
              <li className="rounded-xl border border-dashed border-surface-line px-3 py-5 text-center text-[12px] text-muted-foreground">
                لا كتل مقاعد بعد.
              </li>
            )}
            {sorted.map(([name, list]) => {
              const iss = carrierIssues(new Set(list.map((f) => f.id)), issues)
              // Narrow screens push the detail — only explicit picks highlight,
              // or the default row reads as "this is all there is".
              const active = name === (wide ? shown : selected)
              const en = list.find((f) => f.airline_en)?.airline_en
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => navigate(`/flights/${encodeURIComponent(name)}`)}
                    className={cn(
                      "w-full rounded-xl border px-3.5 py-3 text-start transition-colors",
                      active
                        ? "border-[color:var(--brand-teal)]/50 bg-[color:var(--brand-teal-soft)]/50 shadow-[var(--elev-1)]"
                        : "border-surface-line bg-surface-raised hover:bg-surface-sunken/60",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                        {name}
                      </span>
                      {iss.errors + iss.warnings > 0 && (
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                            iss.errors > 0
                              ? "bg-[color:var(--brand-rose-soft)] text-[color:var(--brand-rose-deep)]"
                              : "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold-deep)]",
                          )}
                        >
                          <TriangleAlert className="size-3" />
                          {arNum(iss.errors + iss.warnings)}
                        </span>
                      )}
                      {/* Rows push a detail screen on narrow viewports — say so. */}
                      <ChevronLeft className="size-4 shrink-0 text-muted-foreground/50 lg:hidden" />
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] tabular-nums text-muted-foreground">
                      {en && (
                        <span dir="ltr" className="truncate">
                          {en}
                        </span>
                      )}
                      <span>{t("units.blocks", { n: arNum(list.length), count: list.length })}</span>
                      <span className="inline-flex items-center gap-1">
                        <PlaneLanding className="size-3" />
                        {arNum(seatsOf(list, "arrival"))}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <PlaneTakeoff className="size-3" />
                        {arNum(seatsOf(list, "return"))}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        }
        detail={
          shown && (
            <CarrierDetail
              key={shown}
              name={shown}
              blocks={groups.get(shown)!}
              onAdd={() =>
                setAdding({
                  ar: shown === "بدون ناقل" ? "" : shown,
                  en: groups.get(shown)!.find((f) => f.airline_en)?.airline_en ?? "",
                })
              }
              onError={setError}
            />
          )
        }
          />
        </div>
      </div>
    </div>
  )
}

/* ── the selected carrier ───────────────────────────────────────── */

function CarrierDetail({
  name,
  blocks,
  onAdd,
  onError,
}: {
  name: string
  blocks: readonly DraftFlightBlock[]
  onAdd: () => void
  onError: (m: string | null) => void
}) {
  const { t } = useTranslation()
  const snap = useSnapshot(state)
  const arrivalSeats = blocks.filter((f) => f.direction === "arrival").reduce((s, f) => s + f.seats, 0)
  const returnSeats = blocks.filter((f) => f.direction === "return").reduce((s, f) => s + f.seats, 0)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [dirFilter, setDirFilter] = useState<"arrival" | "return" | null>(null)
  const usage = (id: string) =>
    snap.packages.filter((p) => p.flightAllocations.some((a) => a.blockId === id)).length
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const section = (direction: "arrival" | "return", title: string, Icon: typeof PlaneLanding) => {
    const list = blocks
      .filter((f) => f.direction === direction)
      .slice()
      .sort((a, b) => a.flies_on.localeCompare(b.flies_on))
    if (!list.length) return null
    const seats = list.reduce((t, f) => t + f.seats, 0)

    // Split by the SAUDI-side point — where arrivals land and returns lift
    // off (to_city or from_city respectively). The 1447 values are free
    // text (Jeddah / Madina / Riyadh / متعدد), so match loosely.
    const saudiSide = (f: (typeof list)[number]) =>
      direction === "arrival" ? f.to_city : f.from_city
    const pointKey = (s: string) => {
      const v = s.trim().toLowerCase()
      if (/jed|جدة|جده/.test(v)) return "jeddah"
      if (/mad|med|المدينة|المدينه/.test(v)) return "madinah"
      if (/riyadh|ruh|الرياض/.test(v)) return "riyadh"
      if (v === "متعدد" || v === "") return "multi"
      return "other"
    }
    const POINTS: { key: string; label: string }[] = [
      { key: "jeddah", label: "جدة" },
      { key: "madinah", label: "المدينة المنورة" },
      { key: "riyadh", label: "الرياض (ترانزيت)" },
      { key: "multi", label: "متعدد / غير محدد" },
      { key: "other", label: "أخرى" },
    ]
    const groups = POINTS.map((p) => ({
      ...p,
      list: list.filter((f) => pointKey(saudiSide(f)) === p.key),
    })).filter((g) => g.list.length > 0)

    return (
      <Card
        title={title}
        description={`${t("units.blocks", { n: arNum(list.length), count: list.length })} · ${t("units.seats", { n: arNum(seats), count: seats })}`}
        bodyClassName="p-0"
      >
        {groups.map((g) => (
          <div key={g.key}>
            <div className="flex items-center gap-2 border-t border-surface-line bg-surface-sunken/60 px-4 py-1.5 first:border-t-0">
              <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="text-[11px] font-bold text-foreground">{g.label}</span>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {t("units.blocks", { n: arNum(g.list.length), count: g.list.length })} ·{" "}
                {t("units.seats", { n: arNum(g.list.reduce((sum, f) => sum + f.seats, 0)), count: g.list.reduce((sum, f) => sum + f.seats, 0) })}
              </span>
            </div>
        <ul>
          {g.list.map((f) => {
            const live = state.flightBlocks.find((x) => x.id === f.id)!
            const opened = open.has(f.id)
            const used = usage(f.id)
            return (
              <li key={f.id} className="border-t border-surface-line first:border-t-0">
                <button
                  type="button"
                  onClick={() => toggle(f.id)}
                  aria-expanded={opened}
                  className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-start transition-colors hover:bg-surface-sunken/60"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span dir="ltr" className="w-16 shrink-0 font-mono text-[13px] tabular-nums">
                    {f.flight_no || "—"}
                  </span>
                  <span dir="ltr" className="w-24 shrink-0 text-[13px] tabular-nums text-muted-foreground">
                    {f.flies_on}
                  </span>
                  {/* Pinned ltr: mixed Latin city names in an RTL line flip
                      the arrow's reading, turning an arrival into a departure. */}
                  <span dir="ltr" className="min-w-0 flex-1 truncate text-start text-[13px]">
                    {f.from_city || "—"} → {f.to_city || "—"}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums">
                    {t("units.seats", { n: arNum(f.seats), count: f.seats })}
                  </span>
                  {used > 0 && (
                    <span className="shrink-0 rounded-full bg-[color:var(--brand-teal-soft)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[color:var(--brand-teal-deep)]">
                      {arNum(used)} باقة
                    </span>
                  )}
                  <StatusPill status={f.status} />
                </button>
                {opened && (
                  <div className="border-t border-dashed border-surface-line bg-surface-sunken/40 px-4 py-3">
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <Field label="الاتجاه">
                        <SelectField
                          allowEmpty={false}
                          value={f.direction}
                          options={flightDirectionOptions()}
                          onChange={(v) => (live.direction = v as DraftFlightBlock["direction"])}
                        />
                      </Field>
                      <Field label="رقم الرحلة">
                        <Input
                          dir="ltr"
                          className="text-start"
                          placeholder="SV214"
                          value={f.flight_no}
                          onChange={(e) => (live.flight_no = e.target.value)}
                        />
                      </Field>
                      <Field label="التاريخ">
                        <DatePicker
                          value={f.flies_on}
                          onChange={(iso) => (live.flies_on = iso)}
                        />
                      </Field>
                      <Field label="المقاعد">
                        <NumInput
                          value={String(f.seats || "")}
                          placeholder="0"
                          onChange={(e) => (live.seats = Math.max(0, Number(e.target.value) || 0))}
                        />
                      </Field>
                      <Field label="من">
                        <Input value={f.from_city} onChange={(e) => (live.from_city = e.target.value)} />
                      </Field>
                      <Field label="إلى">
                        <Input value={f.to_city} onChange={(e) => (live.to_city = e.target.value)} />
                      </Field>
                      <Field label="PNR">
                        <Input
                          dir="ltr"
                          className="text-start uppercase"
                          placeholder="—"
                          value={f.pnr}
                          onChange={(e) => (live.pnr = e.target.value)}
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="النوع">
                          <SelectField
                            allowEmpty={false}
                            value={f.contract_type}
                            options={flightTypeOptions()}
                            onChange={(v) => (live.contract_type = v as DraftFlightBlock["contract_type"])}
                          />
                        </Field>
                        <Field label="الحالة">
                          <SelectField
                            allowEmpty={false}
                            value={f.status}
                            options={flightStatusOptions()}
                            onChange={(v) => (live.status = v as DraftFlightBlock["status"])}
                          />
                        </Field>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        title={used > 0 ? "مرتبطة بباقة — لا يمكن حذفها" : undefined}
                        onClick={() => {
                          const r = removeFlightBlock(f.id)
                          onError(r.ok ? null : `لا يمكن حذف الكتلة: مرتبطة بـ${arNum(r.usedBy)} باقة.`)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        حذف الكتلة
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
          </div>
        ))}
      </Card>
    )
  }

  return (
    <>
      <Card bodyClassName="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-foreground">{name}</h2>
            <div className="mt-0.5 text-[12px] tabular-nums text-muted-foreground">
              {t("units.blocks", { n: arNum(blocks.length), count: blocks.length })} · {t("flight_direction.arrival")}{" "}
              {t("units.seats", { n: arNum(arrivalSeats), count: arrivalSeats })} ·{" "}
              {t("flight_direction.return")}{" "}
              {t("units.seats", { n: arNum(returnSeats), count: returnSeats })}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="size-3.5" />
            إضافة كتلة
          </Button>
        </div>
        <FilterChips
          className="mt-3"
          value={dirFilter}
          onChange={setDirFilter}
          options={[
            {
              value: "arrival",
              label: "وصول",
              count: blocks.filter((f) => f.direction === "arrival").length,
            },
            {
              value: "return",
              label: "مغادرة",
              count: blocks.filter((f) => f.direction === "return").length,
            },
          ]}
        />
      </Card>
      {(dirFilter === null || dirFilter === "arrival") && section("arrival", "الوصول", PlaneLanding)}
      {(dirFilter === null || dirFilter === "return") && section("return", "المغادرة", PlaneTakeoff)}
    </>
  )
}
