import { useState } from "react"
import { useSnapshot } from "valtio"
import {
  CircleCheck,
  Info,
  Plus,
  Trash2,
  TriangleAlert,
  Database,
  LayoutGrid,
} from "lucide-react"

import {
  addHotel,
  addRequirement,
  allocated,
  removeHotel,
  removeRequirement,
  state,
  unpinAll,
  type DraftHotel,
} from "@/store/season"
import { Button } from "@/components/ui/button"
import { Card, Note, Stat } from "@/components/PageShell"
import {
  Checkbox,
  Field,
  Input,
  NumInput,
  SelectField,
  Textarea,
  cellCls,
  type SelectOption,
} from "@/components/ui/field"
import { useIssues } from "@/store/use-issues"
import { cn, arNum } from "@/lib/utils"

const STAR_OPTIONS: SelectOption[] = [
  { value: "5", label: "خمسة نجوم" },
  { value: "4", label: "أربعة نجوم" },
  { value: "3", label: "ثلاثة نجوم" },
  { value: "2", label: "نجمتان" },
  { value: "1", label: "نجمة واحدة" },
  { value: "nuzul", label: "نزل" },
]

const GRADE_OPTIONS: SelectOption[] = ["أ", "ب", "ج", "م"].map((g) => ({ value: g, label: g }))

const KIND_OPTIONS: SelectOption[] = [
  { value: "mix", label: "نسب الفئات" },
  { value: "pricing", label: "حدود السعر" },
  { value: "hotel", label: "قيد على فندق" },
  { value: "window", label: "نافذة زمنية" },
  { value: "note", label: "ملاحظة" },
]

const REQ_STATUS_OPTIONS: SelectOption[] = [
  { value: "proposed", label: "مقترح" },
  { value: "agreed", label: "معتمد" },
  { value: "superseded", label: "ملغى" },
]

const MIX_GROUP_OPTIONS: SelectOption[] = [
  { value: "standard", label: "الأساسية" },
  { value: "premium_and_above", label: "المميزة فأعلى" },
]

/** Shared header styling for the data tables. */
const TH = "px-2.5 py-2 text-start text-[10px] font-semibold uppercase tracking-wider"

/* ── hotels & camps ─────────────────────────────────────────────── */

function HotelTable({
  city,
  onError,
}: {
  city: DraftHotel["city"]
  onError: (m: string | null) => void
}) {
  const snap = useSnapshot(state)
  const rows = snap.hotels.filter((h) => h.city === city)
  const usage = (id: string) =>
    snap.packages.reduce((t, p) => t + p.legs.filter((l) => l.hotelId === id).length, 0)

  return (
    <Card
      title={city === "makkah" ? "مكة المكرمة" : "المدينة المنورة"}
      description={`${arNum(rows.length)} فندق في المخزون`}
      actions={
        <Button variant="outline" size="sm" onClick={() => addHotel(city)}>
          <Plus className="size-3.5" />
          إضافة
        </Button>
      }
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-sunken text-[color:var(--brand-teal-deep)]">
              <th className={TH}>الاسم (عربي)</th>
              <th className={TH}>الاسم (إنجليزي)</th>
              <th className={cn(TH, "w-32")}>التصنيف</th>
              <th className={cn(TH, "w-16")}>الفئة</th>
              <th className={cn(TH, "w-24")}>الاستخدام</th>
              <th className={cn(TH, "w-10")} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[11px] text-muted-foreground">
                  لا توجد فنادق في هذه المدينة بعد.
                </td>
              </tr>
            )}
            {rows.map((h) => {
              const live = state.hotels.find((x) => x.id === h.id)!
              const used = usage(h.id)
              return (
                <tr
                  key={h.id}
                  className="border-t border-surface-line align-middle transition-colors hover:bg-surface-sunken/60"
                >
                  <td className="px-1.5 py-1">
                    <Input
                      className={cn(cellCls, "font-medium")}
                      placeholder="اسم الفندق"
                      value={h.name_ar}
                      onChange={(e) => (live.name_ar = e.target.value)}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <Input
                      dir="ltr"
                      className={cn(cellCls, "text-start")}
                      placeholder="Hotel name"
                      value={h.name_en}
                      onChange={(e) => (live.name_en = e.target.value)}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <SelectField
                      className={cellCls}
                      allowEmpty={false}
                      value={h.star_class}
                      options={STAR_OPTIONS}
                      onChange={(v) => (live.star_class = v as DraftHotel["star_class"])}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <SelectField
                      className={cellCls}
                      allowEmpty={false}
                      value={h.grade}
                      options={GRADE_OPTIONS}
                      onChange={(v) => (live.grade = v as DraftHotel["grade"])}
                    />
                  </td>
                  <td className="px-2.5 py-1">
                    {used === 0 ? (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-[color:var(--brand-teal-soft)] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[color:var(--brand-teal-deep)]">
                        {arNum(used)} إقامة
                      </span>
                    )}
                  </td>
                  <td className="px-1 py-1">
                    {/* Destructive action stays quiet until hovered. */}
                    <button
                      type="button"
                      aria-label={`حذف ${h.name_ar || "الفندق"}`}
                      title={used > 0 ? "مستخدم في باقة — لا يمكن حذفه" : "حذف"}
                      onClick={() => {
                        const r = removeHotel(h.id)
                        onError(
                          r.ok ? null : `لا يمكن حذف «${h.name_ar}»: مستخدم في ${arNum(r.usedBy)} إقامة.`,
                        )
                      }}
                      className="grid size-7 place-items-center rounded-md text-muted-foreground/45 transition-colors hover:bg-[color:var(--brand-rose-soft)] hover:text-[color:var(--brand-rose-deep)]"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function HotelsPanel() {
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      {error && (
        <Note tone="warn" icon={<TriangleAlert className="size-3.5" />}>
          {error}
        </Note>
      )}
      {/* Both cities fit beside each other on a wide screen; stacked they
          left half the viewport empty and pushed Madinah below the fold. */}
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <HotelTable city="makkah" onError={setError} />
        <HotelTable city="madinah" onError={setError} />
      </div>
      <Note icon={<Info className="size-3.5" />}>
        المخيمات («المخيم المستهدف» في نموذج الوزارة) لم تُضَف بعد — انظر{" "}
        <span className="font-mono text-[10px]">docs/pages-and-sync.md</span>.
      </Note>
    </>
  )
}

/* ── meetings & requirements ────────────────────────────────────── */

const STATUS_STYLE: Record<string, string> = {
  agreed: "bg-[color:var(--brand-green-soft)] text-[color:var(--brand-green-deep)]",
  proposed: "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold-deep)]",
  superseded: "bg-muted text-muted-foreground",
}
const STATUS_LABEL: Record<string, string> = {
  agreed: "معتمد",
  proposed: "مقترح",
  superseded: "ملغى",
}

export function RequirementsPanel() {
  const snap = useSnapshot(state)
  const agreed = snap.requirements.filter((r) => r.status === "agreed").length

  return (
    <>
      <Note tone="brand" icon={<Info className="size-3.5" />}>
        المتطلبات مصدرها اجتماعات الفريق ووزارة الحج والعمرة. ما كان منها «معتمدًا» يُطبَّق
        تلقائيًا على التحقق قبل الرفع؛ والملاحظات النصية تحتاج تأكيدًا يدويًا.
      </Note>

      <Card
        title="المتطلبات"
        description={`${arNum(agreed)} معتمد من ${arNum(snap.requirements.length)}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => addRequirement("note")}>
            <Plus className="size-3.5" />
            إضافة
          </Button>
        }
        bodyClassName="p-3"
      >
        <ul className="grid items-start gap-3 xl:grid-cols-2">
          {snap.requirements.length === 0 && (
            <li className="px-4 py-8 text-center text-[11px] text-muted-foreground xl:col-span-2">
              لم يُسجَّل أي متطلب بعد.
            </li>
          )}
          {snap.requirements.map((r) => {
            const live = state.requirements.find((x) => x.id === r.id)!
            const params = (r.params ?? {}) as Record<string, unknown>
            return (
              <li key={r.id} className="rounded-lg border border-surface-line p-3">
                <div className="flex items-center gap-2">
                  <Input
                    className={cn(cellCls, "flex-1 text-[13px] font-semibold")}
                    placeholder="عنوان المتطلب"
                    value={r.title}
                    onChange={(e) => (live.title = e.target.value)}
                  />
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      STATUS_STYLE[r.status],
                    )}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                  <button
                    type="button"
                    aria-label="حذف المتطلب"
                    onClick={() => removeRequirement(r.id)}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground/45 transition-colors hover:bg-[color:var(--brand-rose-soft)] hover:text-[color:var(--brand-rose-deep)]"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <Textarea
                  rows={2}
                  className="mt-2 resize-y"
                  placeholder="التفاصيل كما وردت في الاجتماع"
                  value={r.detail}
                  onChange={(e) => (live.detail = e.target.value)}
                />

                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Field label="النوع">
                    <SelectField
                      allowEmpty={false}
                      value={r.kind}
                      options={KIND_OPTIONS}
                      onChange={(v) => (live.kind = v as typeof live.kind)}
                    />
                  </Field>
                  <Field label="الحالة">
                    <SelectField
                      allowEmpty={false}
                      value={r.status}
                      options={REQ_STATUS_OPTIONS}
                      onChange={(v) => (live.status = v as typeof live.status)}
                    />
                  </Field>

                  {r.kind === "mix" && (
                    <>
                      <Field label="المجموعة">
                        <SelectField
                          allowEmpty={false}
                          value={String(params.group ?? "standard")}
                          options={MIX_GROUP_OPTIONS}
                          onChange={(v) => (live.params = { ...params, group: v })}
                        />
                      </Field>
                      <Field label="الحد (%)">
                        <div className="flex gap-1.5">
                          <NumInput
                            placeholder="أدنى"
                            value={String(params.min_pct ?? "")}
                            onChange={(e) =>
                              (live.params = {
                                ...params,
                                min_pct: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                          />
                          <NumInput
                            placeholder="أعلى"
                            value={String(params.max_pct ?? "")}
                            onChange={(e) =>
                              (live.params = {
                                ...params,
                                max_pct: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </Field>
                    </>
                  )}
                </div>

                {r.kind === "note" && (
                  <label className="mt-2.5 flex items-center gap-2 text-[11px] text-foreground/80">
                    <Checkbox
                      checked={r.acknowledged}
                      onCheckedChange={(checked) => (live.acknowledged = Boolean(checked))}
                    />
                    تم التأكيد قبل الرفع
                  </label>
                )}
              </li>
            )
          })}
        </ul>
      </Card>
    </>
  )
}

/* ── validation ─────────────────────────────────────────────────── */

export function ValidationPanel() {
  const snap = useSnapshot(state)
  const issues = useIssues()
  const errors = issues.filter((i) => i.level === "error")
  const warnings = issues.filter((i) => i.level === "warning")
  const ready = errors.length === 0 && snap.packages.length > 0

  return (
    <>
      <Card bodyClassName="p-3">
        <div className="grid grid-cols-3 gap-2">
          <Stat
            value={arNum(errors.length)}
            label="أخطاء تمنع الرفع"
            tone={errors.length === 0 ? "good" : "bad"}
          />
          <Stat value={arNum(warnings.length)} label="تنبيهات" tone="warn" />
          <Stat value={arNum(snap.packages.length)} label="باقات" />
        </div>
      </Card>

      <Card title="النتائج" description="اضغط على أي بند لفتح الباقة المعنية.">
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-[color:var(--brand-green-soft)] px-3 py-2.5 text-[11px] text-[color:var(--brand-green-deep)]">
            <CircleCheck className="size-4 shrink-0" />
            <span className="font-medium">
              {ready ? "الموسم مطابق للضوابط. جاهز للرفع إلى نسك." : "لا توجد باقات بعد."}
            </span>
          </div>
        ) : (
          // Two columns once there is width — the rows are one line each, and
          // a single full-width column of short pills wasted half the card.
          <ul className="grid items-start gap-1.5 lg:grid-cols-2">
            {issues.map((i, idx) => (
              <li
                key={`${i.code}-${i.entityId}-${idx}`}
                onClick={() => {
                  if (i.scope === "package" || i.scope === "leg") state.selectedId = i.entityId
                }}
                className={cn(
                  "flex gap-2 rounded-lg px-2.5 py-2 text-[11px] leading-snug",
                  i.level === "error"
                    ? "bg-[color:var(--brand-rose-soft)] text-[color:var(--brand-rose-deep)]"
                    : "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold-deep)]",
                  (i.scope === "package" || i.scope === "leg") &&
                    "cursor-pointer transition-[filter] hover:brightness-97",
                )}
              >
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>{i.message}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

/* ── settings ───────────────────────────────────────────────────── */

export function SettingsPanel() {
  const snap = useSnapshot(state)
  const used = allocated(state)
  const left = snap.season.quota_total - used

  return (
    // Bento at width: the season form is the substantial tile; the two small
    // cards stack beside it instead of stringing every card down one column.
    <div className="grid items-start gap-4 lg:grid-cols-3">
      <Card
        className="lg:col-span-2"
        title="الموسم"
        description="السنة والحصة المعتمدة من الوزارة."
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="السنة الهجرية">
            <NumInput
              value={snap.season.year_hijri}
              onChange={(e) => (state.season.year_hijri = Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="السنة الميلادية">
            <NumInput
              value={snap.season.year_gregorian}
              onChange={(e) => (state.season.year_gregorian = Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="الحصة الإجمالية (حاج)" hint="مجموع سعات الباقات يجب أن يساويها تمامًا.">
            <NumInput
              value={snap.season.quota_total}
              onChange={(e) => (state.season.quota_total = Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat value={arNum(used)} label="موزَّع على الباقات" />
          <Stat
            value={left === 0 ? "مكتمل" : arNum(Math.abs(left))}
            label={left === 0 ? "الحصة مستوفاة" : left < 0 ? "تجاوز الحصة" : "متبقٍ للتوزيع"}
            tone={left === 0 ? "good" : left < 0 ? "bad" : "neutral"}
          />
        </div>
      </Card>

      <div className="space-y-4">
      <Card
        title="المخطط"
        description="سلوك لوحة تكوين الباقات."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={Object.keys(snap.pinned).length === 0}
            onClick={unpinAll}
          >
            فكّ الكل
          </Button>
        }
      >
        <div className="flex items-start gap-2.5">
          <LayoutGrid className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <div className="text-[12px] font-medium text-foreground">العقد المثبَّتة</div>
            <div className="text-[11px] text-muted-foreground">
              {Object.keys(snap.pinned).length === 0
                ? "لا توجد عقد مثبَّتة — كل شيء يتبع الترتيب التلقائي."
                : `${arNum(Object.keys(snap.pinned).length)} عقدة تحتفظ بموضعها اليدوي.`}
            </div>
          </div>
        </div>
      </Card>

      <Card title="التخزين والاتصال">
        <Note tone="warn" icon={<Database className="size-3.5" />}>
          البيانات محفوظة في الذاكرة فقط: تحديث الصفحة يمسح المسودة. حفظ IndexedDB
          وتصدير/استيراد JSON ثم ربط PocketBase هي الخطوات التالية.
        </Note>
      </Card>
      </div>
    </div>
  )
}
