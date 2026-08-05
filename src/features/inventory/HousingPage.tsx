import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useSnapshot } from "valtio"
import { Building2, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react"

import { addContract, removeHotel, state, type DraftHotel } from "@/store/season"
import { MasterDetail } from "@/components/MasterDetail"
import { Card, Note, PageHeader } from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Field, Input, SelectField } from "@/components/ui/field"
import { FilterChips } from "@/components/ui/filter-chips"
import { Meter } from "@/components/ui/meter"
import { AddHotelWizard } from "@/features/inventory/AddHotelWizard"
import { ContractCard } from "@/features/inventory/ContractCard"
import { ContractsTimeline } from "@/features/inventory/ContractsTimeline"
import { hotelIssues, hotelSummary } from "@/features/inventory/supply"
import { CITY_OPTIONS, GRADE_OPTIONS, STAR_OPTIONS } from "@/lib/options"
import { useIssues } from "@/store/use-issues"
import { cn, arNum } from "@/lib/utils"

const starLabel = (v: string) => STAR_OPTIONS.find((o) => o.value === v)?.label ?? v

/**
 * السكن as a place: hotels are a read-only registry on the start edge — name,
 * class, coverage meter, issue badge — and the selected hotel opens as a full
 * detail with its contracts on the season timeline. Editing renders only for
 * the entity the user chose; the registry itself never shows an input.
 */
export function HousingPage() {
  const { hotelId } = useParams()
  const navigate = useNavigate()
  const snap = useSnapshot(state)
  const issues = useIssues()
  const [addCity, setAddCity] = useState<DraftHotel["city"] | null>(null)
  const [cityFilter, setCityFilter] = useState<DraftHotel["city"] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selected = hotelId ? snap.hotels.find((h) => h.id === hotelId) : undefined

  const masterRow = (h: (typeof snap.hotels)[number]) => {
    const sum = hotelSummary(h.id, snap as never)
    const iss = hotelIssues(h.id, snap.contracts as never, issues)
    const active = h.id === hotelId
    return (
      <li key={h.id}>
        <button
          type="button"
          onClick={() => navigate(`/hotels/${h.id}`)}
          className={cn(
            "w-full rounded-xl border px-3.5 py-3 text-start transition-colors",
            active
              ? "border-[color:var(--brand-teal)]/50 bg-[color:var(--brand-teal-soft)]/50 shadow-[var(--elev-1)]"
              : "border-surface-line bg-surface-raised hover:bg-surface-sunken/60",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
              {h.name_ar || h.name_en || "فندق بلا اسم"}
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
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {starLabel(h.star_class)} · فئة {h.grade} ·{" "}
            {sum.contracts === 0 ? "بلا عقود" : `${arNum(sum.contracts)} عقد`}
          </div>
          {sum.peakSupply > 0 && (
            <Meter className="mt-2" value={sum.peakDemand} max={sum.peakSupply} />
          )}
        </button>
      </li>
    )
  }

  const citySection = (city: DraftHotel["city"], title: string) => {
    const rows = snap.hotels.filter((h) => h.city === city)
    return (
      <section>
        <header className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[13px] font-bold text-foreground">{title}</h2>
          <Button variant="ghost" size="sm" onClick={() => setAddCity(city)}>
            <Plus className="size-3.5" />
            فندق
          </Button>
        </header>
        <ul className="space-y-2">
          {rows.length === 0 ? (
            <li className="rounded-xl border border-dashed border-surface-line px-3 py-5 text-center text-[12px] text-muted-foreground">
              لا فنادق بعد.
            </li>
          ) : (
            rows.map(masterRow)
          )}
        </ul>
      </section>
    )
  }

  return (
    // Chat-app scrolling: the page is fixed; the master column and the detail
    // column scroll independently inside MasterDetail.
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-page">
      <PageHeader
        title="السكن"
        description="الفنادق وعقودها على محور الموسم — القياس مقابل سعات الباقات."
      />
      <AddHotelWizard
        open={addCity !== null}
        onOpenChange={(o) => !o && setAddCity(null)}
        city={addCity ?? "makkah"}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-4">
        {error && (
          <Note tone="warn" icon={<TriangleAlert className="size-3.5" />}>
            {error}
          </Note>
        )}
        <div className="min-h-0 flex-1">
          <MasterDetail
            detailOpen={Boolean(selected)}
            onBack={() => navigate("/hotels")}
            placeholder={
              <span className="flex items-center gap-2">
                <Building2 className="size-4" />
                اختر فندقًا لعرض عقوده وتغطيته
              </span>
            }
            master={
              <>
                {/* Sticky inside the master's own scroll, as a solid toolbar
                    card — cards scrolling beneath a transparent strip read as
                    an overlap glitch. */}
                <div className="sticky top-0 z-10 rounded-xl border border-surface-line bg-surface-raised p-2 shadow-[var(--elev-1)]">
                  <FilterChips
                    value={cityFilter}
                    onChange={setCityFilter}
                    options={[
                      {
                        value: "makkah",
                        label: "مكة",
                        count: snap.hotels.filter((h) => h.city === "makkah").length,
                      },
                      {
                        value: "madinah",
                        label: "المدينة",
                        count: snap.hotels.filter((h) => h.city === "madinah").length,
                      },
                    ]}
                  />
                </div>
                {(cityFilter === null || cityFilter === "makkah") &&
                  citySection("makkah", "مكة المكرمة")}
                {(cityFilter === null || cityFilter === "madinah") &&
                  citySection("madinah", "المدينة المنورة")}
              </>
            }
            detail={selected && <HotelDetail key={selected.id} id={selected.id} onError={setError} />}
          />
        </div>
      </div>
    </div>
  )
}

/* ── the selected hotel ─────────────────────────────────────────── */

function HotelDetail({ id, onError }: { id: string; onError: (m: string | null) => void }) {
  const navigate = useNavigate()
  const snap = useSnapshot(state)
  const [editing, setEditing] = useState(false)
  const h = snap.hotels.find((x) => x.id === id)
  const live = state.hotels.find((x) => x.id === id)
  if (!h || !live) return null
  const contracts = snap.contracts.filter((c) => c.hotelId === id)
  const sum = hotelSummary(id, snap as never)
  const usedLegs = snap.packages.reduce(
    (t, p) => t + p.legs.filter((l) => l.hotelId === id).length,
    0,
  )

  return (
    <>
      <Card bodyClassName="p-4">
        {!editing ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-foreground">
                {h.name_ar || "فندق بلا اسم"}
              </h2>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                <span dir="ltr">{h.name_en}</span>
                {h.name_en && " · "}
                {starLabel(h.star_class)} · فئة {h.grade} ·{" "}
                {h.city === "makkah" ? "مكة المكرمة" : "المدينة المنورة"} ·{" "}
                {arNum(usedLegs)} إقامة في الباقات
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
              تحرير
            </Button>
            <button
              type="button"
              aria-label={`حذف ${h.name_ar || "الفندق"}`}
              onClick={() => {
                const r = removeHotel(id)
                if (r.ok) {
                  navigate("/hotels")
                  onError(null)
                } else {
                  onError(
                    r.usedBy > 0
                      ? `لا يمكن حذف «${h.name_ar}»: مستخدم في ${arNum(r.usedBy)} إقامة.`
                      : `لا يمكن حذف «${h.name_ar}»: عليه ${arNum(r.contractCount)} عقد سكن.`,
                  )
                }
              }}
              className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground/45 transition-colors hover:bg-[color:var(--brand-rose-soft)] hover:text-[color:var(--brand-rose-deep)]"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Field label="الاسم (عربي)">
              <Input value={h.name_ar} onChange={(e) => (live.name_ar = e.target.value)} />
            </Field>
            <Field label="الاسم (إنجليزي)">
              <Input
                dir="ltr"
                className="text-start"
                value={h.name_en}
                onChange={(e) => (live.name_en = e.target.value)}
              />
            </Field>
            <Field label="المدينة">
              <SelectField
                allowEmpty={false}
                value={h.city}
                options={CITY_OPTIONS}
                onChange={(v) => (live.city = v as DraftHotel["city"])}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="التصنيف">
                <SelectField
                  allowEmpty={false}
                  value={h.star_class}
                  options={STAR_OPTIONS}
                  onChange={(v) => (live.star_class = v as DraftHotel["star_class"])}
                />
              </Field>
              <Field label="الفئة">
                <SelectField
                  allowEmpty={false}
                  value={h.grade}
                  options={GRADE_OPTIONS}
                  onChange={(v) => (live.grade = v as DraftHotel["grade"])}
                />
              </Field>
            </div>
            <div className="col-span-2 lg:col-span-4">
              <Button size="sm" onClick={() => setEditing(false)}>
                تم
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card
        title="العقود على محور الموسم"
        description={
          sum.peakSupply > 0
            ? `ذروة الأسرّة الموقَّعة ${arNum(sum.peakSupply)} · ذروة سعات الباقات ${arNum(sum.peakDemand)}`
            : "لا عقود موقَّعة بعد."
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => addContract(id)}>
            <Plus className="size-3.5" />
            إضافة عقد
          </Button>
        }
      >
        {contracts.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-muted-foreground">
            الفندق مرشّح بلا عقود — يظهر تنبيه عند استخدامه في الباقات.
          </p>
        ) : (
          <ContractsTimeline hotelId={id} />
        )}
      </Card>

      {contracts.length > 0 && (
        <div className="space-y-3">
          {contracts.map((c) => (
            <ContractCard key={c.id} id={c.id} onError={onError} />
          ))}
        </div>
      )}
    </>
  )
}
