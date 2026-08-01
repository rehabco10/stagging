import { useSnapshot } from "valtio"
import { Copy, Plus, Trash2, TriangleAlert } from "lucide-react"

import { Card, Note, PageShell } from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Field, Input, NumInput, SelectField, cellCls } from "@/components/ui/field"
import { ROLE_OPTIONS, TIER_LABEL, TIER_OPTIONS } from "@/lib/options"
import { displayCategory } from "@/lib/schemas"
import {
  addDays,
  addLeg,
  addPackage,
  allocated,
  availableRoles,
  duplicatePackage,
  legNights,
  orderedLegs,
  packageNights,
  removeLeg,
  removePackage,
  retimeLeg,
  state,
  type DraftPackage,
} from "@/store/season"
import { useIssues } from "@/store/use-issues"
import { cn, arNum } from "@/lib/utils"

const TH = "px-2.5 py-2 text-start text-[10px] font-semibold uppercase tracking-wider"

/**
 * The classic editor: the same season as the canvas, as a grid plus forms.
 *
 * This page and the graph are 1:1 by construction, not by duplication — both
 * read and write the single valtio store and share `state.selectedId`, so a
 * package picked here is the selected node on the canvas and vice versa, and
 * every action (add, duplicate, delete, retime) is the same store function the
 * node menu calls.
 */
export function PackagesPage() {
  const snap = useSnapshot(state)
  const issues = useIssues()

  // Blocking errors per package, counting its legs as part of the package.
  const errorsByPkg = new Map<string, number>()
  for (const p of snap.packages) {
    const ids = new Set<string>([p.id, ...p.legs.map((l) => l.id)])
    errorsByPkg.set(
      p.id,
      issues.filter((i) => i.level === "error" && ids.has(i.entityId)).length,
    )
  }

  const used = allocated(state)
  const quota = snap.season.quota_total
  const selected = state.packages.find((p) => p.id === snap.selectedId)

  return (
    <PageShell
      title="جدول الباقات"
      description="تحرير الباقات وإقاماتها في جداول — نفس بيانات المخطط تمامًا، بعرض كلاسيكي."
      actions={
        <Button size="sm" onClick={() => addPackage()}>
          <Plus className="size-3.5" />
          باقة جديدة
        </Button>
      }
    >
      {/* Master-detail goes side-by-side once there is width for both — the
          stacked layout on a laptop left the right half of the screen empty
          and put the detail below the fold. */}
      <div className="grid items-start gap-4 2xl:grid-cols-5">
      {/* Full width while nothing is selected — otherwise the grid reserves
          two empty columns for a detail card that is not rendered. */}
      <Card bodyClassName="p-0" className={selected ? "2xl:col-span-3" : "2xl:col-span-5"}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <thead>
              <tr className="bg-surface-sunken text-[color:var(--brand-teal-deep)]">
                <th className={cn(TH, "w-16")}>رقم</th>
                <th className={TH}>الاسم (إنجليزي)</th>
                <th className={cn(TH, "w-24")}>الفئة</th>
                <th className={cn(TH, "w-24")}>السعة</th>
                <th className={cn(TH, "w-28")}>السعر (ر.س)</th>
                <th className={cn(TH, "w-28")}>الإقامات / الليالي</th>
                <th className={cn(TH, "w-20")}>الحالة</th>
                <th className={cn(TH, "w-20")} />
              </tr>
            </thead>
            <tbody>
              {snap.packages.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[11px] text-muted-foreground">
                    لا توجد باقات بعد — أضف الأولى بزر «باقة جديدة».
                  </td>
                </tr>
              )}
              {snap.packages.map((p) => {
                const live = state.packages.find((x) => x.id === p.id)!
                const errs = errorsByPkg.get(p.id) ?? 0
                const isSel = snap.selectedId === p.id
                return (
                  <tr
                    key={p.id}
                    onClick={() => (state.selectedId = p.id)}
                    className={cn(
                      "cursor-pointer border-t border-surface-line align-middle transition-colors",
                      isSel
                        ? "bg-[color:var(--brand-teal-soft)]"
                        : "hover:bg-surface-sunken/60",
                    )}
                  >
                    <td className="px-2.5 py-1 font-semibold tabular-nums">{p.package_no}</td>
                    <td className="px-1.5 py-1">
                      <Input
                        dir="ltr"
                        className={cn(cellCls, "text-start font-medium")}
                        value={p.name_en}
                        onChange={(e) => (live.name_en = e.target.value)}
                      />
                    </td>
                    <td className="px-2.5 py-1 text-[11px]">{TIER_LABEL[p.tier]}</td>
                    <td className="px-1.5 py-1">
                      <NumInput
                        className={cellCls}
                        value={p.capacity}
                        onChange={(e) => (live.capacity = Number(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <NumInput
                        className={cellCls}
                        value={p.initial_price_sar}
                        onChange={(e) => (live.initial_price_sar = Number(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2.5 py-1 text-[11px] tabular-nums text-muted-foreground">
                      {arNum(p.legs.length)} / {arNum(packageNights(live))}
                    </td>
                    <td className="px-2.5 py-1">
                      {errs > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-rose)] px-1.5 py-0.5 text-[9px] font-bold text-white tabular-nums">
                          <TriangleAlert className="size-2.5" />
                          {arNum(errs)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[color:var(--brand-green-deep)]">سليمة</span>
                      )}
                    </td>
                    <td className="px-1 py-1">
                      <div className="flex items-center">
                        <RowIcon
                          label={`تكرار باقة ${p.package_no}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicatePackage(p.id)
                          }}
                        >
                          <Copy className="size-3.5" />
                        </RowIcon>
                        <RowIcon
                          danger
                          label={`حذف باقة ${p.package_no}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            removePackage(p.id)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </RowIcon>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {snap.packages.length > 0 && (
              <tfoot>
                <tr className="border-t border-surface-line bg-surface-sunken/70 text-[11px] font-semibold">
                  <td colSpan={3} className="px-2.5 py-2">
                    الإجمالي — {arNum(snap.packages.length)} باقة
                  </td>
                  <td
                    className={cn(
                      "px-2.5 py-2 tabular-nums",
                      used === quota
                        ? "text-[color:var(--brand-green-deep)]"
                        : used > quota
                          ? "text-[color:var(--brand-rose-deep)]"
                          : "text-foreground",
                    )}
                  >
                    {arNum(used)} / {arNum(quota)}
                  </td>
                  <td colSpan={4} className="px-2.5 py-2 text-muted-foreground">
                    {used === quota
                      ? "الحصة مستوفاة"
                      : used > quota
                        ? `تجاوز بمقدار ${arNum(used - quota)}`
                        : `متبقٍ ${arNum(quota - used)}`}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {selected ? (
        <PackageDetail pkg={selected} issues={issues} className="2xl:col-span-2" />
      ) : (
        snap.packages.length > 0 && (
          <div className="2xl:col-span-2">
            <Note>اختر باقة من الجدول لعرض تفاصيلها وإقاماتها.</Note>
          </div>
        )
      )}
      </div>
    </PageShell>
  )
}

/* ── detail: the full form + legs grid for the selected package ──── */

function PackageDetail({
  pkg,
  issues,
  className,
}: {
  pkg: DraftPackage
  issues: ReturnType<typeof useIssues>
  className?: string
}) {
  const snap = useSnapshot(state)
  const live = state.packages.find((p) => p.id === pkg.id)
  const view = snap.packages.find((p) => p.id === pkg.id)
  if (!live || !view) return null

  const shifting = view.legs.some((l) => l.role === "transitional")
  const canAdd = availableRoles(live).length > 0
  const ownIds = new Set<string>([pkg.id, ...view.legs.map((l) => l.id)])
  const own = issues.filter((i) => ownIds.has(i.entityId))

  const hotelOptions = snap.hotels.map((h) => ({
    value: h.id,
    label: `${h.name_ar} — ${h.city === "makkah" ? "مكة" : "المدينة"}`,
  }))

  return (
    <Card
      className={className}
      title={`باقة ${view.package_no} — التفاصيل`}
      description={`التصنيف في نسك: ${displayCategory({
        tier: view.tier,
        is_shifting: shifting,
        variant_suffix: view.variant_suffix,
      })}`}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => duplicatePackage(pkg.id)}>
            <Copy className="size-3.5" />
            تكرار
          </Button>
          <Button variant="destructive" size="sm" onClick={() => removePackage(pkg.id)}>
            <Trash2 className="size-3.5" />
            حذف
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="رقم الباقة">
          <Input value={view.package_no} onChange={(e) => (live.package_no = e.target.value)} />
        </Field>
        <Field label="الاسم (إنجليزي)" className="col-span-2">
          <Input dir="ltr" value={view.name_en} onChange={(e) => (live.name_en = e.target.value)} />
        </Field>
        <Field label="الفئة">
          <SelectField
            allowEmpty={false}
            value={view.tier}
            options={TIER_OPTIONS}
            onChange={(v) => (live.tier = v as DraftPackage["tier"])}
          />
        </Field>
        <Field label="السعة (حاج)">
          <NumInput
            value={view.capacity}
            onChange={(e) => (live.capacity = Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="السعر الابتدائي">
          <NumInput
            value={view.initial_price_sar}
            onChange={(e) => (live.initial_price_sar = Number(e.target.value) || 0)}
          />
        </Field>
      </div>

      <div className="mt-4 border-t border-surface-line pt-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[12px] font-bold text-foreground">
            الإقامات
            <span className="ms-2 text-[10px] font-normal text-muted-foreground tabular-nums">
              {arNum(view.legs.length)} إقامة · {arNum(packageNights(live))} ليلة
            </span>
          </h3>
          <Button
            variant="outline"
            size="sm"
            disabled={!canAdd}
            title={canAdd ? undefined : "كل الأدوار مستخدمة (أول، ثانٍ، انتقالي)"}
            onClick={() => addLeg(pkg.id)}
          >
            <Plus className="size-3.5" />
            إضافة إقامة
          </Button>
        </div>

        {view.legs.length === 0 ? (
          <p className="rounded-lg bg-surface-sunken px-3 py-4 text-center text-[11px] text-muted-foreground">
            لا توجد إقامات بعد.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-surface-line">
            <table className="w-full min-w-[42rem] border-collapse text-sm">
              <thead>
                <tr className="bg-surface-sunken text-[color:var(--brand-teal-deep)]">
                  <th className={cn(TH, "w-10")}>#</th>
                  <th className={cn(TH, "w-36")}>الدور</th>
                  <th className={TH}>الفندق</th>
                  <th className={cn(TH, "w-36")}>البداية</th>
                  <th className={cn(TH, "w-20")}>الليالي</th>
                  <th className={cn(TH, "w-28")}>النهاية</th>
                  <th className={cn(TH, "w-10")} />
                </tr>
              </thead>
              <tbody>
                {orderedLegs(live).map((leg, i) => {
                  const nights = legNights(leg)
                  return (
                    <tr key={leg.id} className="border-t border-surface-line align-middle">
                      <td className="px-2.5 py-1 text-[11px] tabular-nums text-muted-foreground">
                        {arNum(i + 1)}
                      </td>
                      <td className="px-1.5 py-1">
                        <SelectField
                          className={cellCls}
                          allowEmpty={false}
                          value={leg.role}
                          options={ROLE_OPTIONS}
                          onChange={(v) => {
                            const next = v as typeof leg.role
                            // Swap with whichever leg already holds the target
                            // role — a package never has two first residences.
                            const other = live.legs.find((l) => l.role === next && l.id !== leg.id)
                            if (other) other.role = leg.role
                            leg.role = next
                          }}
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <SelectField
                          className={cellCls}
                          allowEmpty={false}
                          value={leg.hotelId}
                          options={hotelOptions}
                          onChange={(v) => (leg.hotelId = v)}
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <Input
                          type="date"
                          dir="ltr"
                          className={cn(cellCls, "text-start")}
                          value={leg.starts_on}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v) retimeLeg(leg.id, v, addDays(v, Math.max(1, nights)))
                          }}
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <NumInput
                          className={cellCls}
                          value={nights}
                          onChange={(e) => {
                            const n = Math.max(1, Number(e.target.value) || 1)
                            retimeLeg(leg.id, leg.starts_on, addDays(leg.starts_on, n))
                          }}
                        />
                      </td>
                      <td className="px-2.5 py-1 text-[11px] tabular-nums text-muted-foreground" dir="ltr">
                        {leg.ends_on}
                      </td>
                      <td className="px-1 py-1">
                        <RowIcon danger label="حذف الإقامة" onClick={() => removeLeg(leg.id)}>
                          <Trash2 className="size-3.5" />
                        </RowIcon>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          تغيير التاريخ أو الليالي يزيح الإقامات التالية بنفس المقدار، فتبقى السلسلة متصلة بلا
          فجوات — كما في المخطط تمامًا.
        </p>
      </div>

      {own.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-surface-line pt-3">
          {own.slice(0, 5).map((i, idx) => (
            <p
              key={`${i.code}-${idx}`}
              className={cn(
                "flex gap-2 rounded-lg px-2.5 py-1.5 text-[11px] leading-snug",
                i.level === "error"
                  ? "bg-[color:var(--brand-rose-soft)] text-[color:var(--brand-rose-deep)]"
                  : "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold-deep)]",
              )}
            >
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              <span>{i.message}</span>
            </p>
          ))}
        </div>
      )}
    </Card>
  )
}

function RowIcon({
  label,
  danger,
  onClick,
  children,
}: {
  label: string
  danger?: boolean
  onClick: (e: React.MouseEvent) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground/45 transition-colors",
        danger
          ? "hover:bg-[color:var(--brand-rose-soft)] hover:text-[color:var(--brand-rose-deep)]"
          : "hover:bg-[color:var(--brand-teal-soft)] hover:text-[color:var(--brand-teal-deep)]",
      )}
    >
      {children}
    </button>
  )
}
