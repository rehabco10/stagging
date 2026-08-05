import { useEffect, useState } from "react"

import { FormWizard } from "@/components/ui/form-wizard"
import { Field, Input, SelectField } from "@/components/ui/field"
import { CITY_OPTIONS, GRADE_OPTIONS, STAR_OPTIONS } from "@/lib/options"
import { addHotel, type DraftHotel } from "@/store/season"
import type { CityValue } from "@/lib/schemas"

type HotelDraft = Omit<DraftHotel, "id">

const fresh = (city: CityValue): HotelDraft => ({
  name_ar: "",
  name_en: "",
  city,
  star_class: "5",
  grade: "أ",
})

const optionLabel = (options: { value: string; label: string }[], value: string) =>
  options.find((o) => o.value === value)?.label ?? value

function Review({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-surface-line rounded-lg border border-surface-line">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-3 px-3 py-2">
          <dt className="text-[11px] text-muted-foreground">{label}</dt>
          <dd className="text-[12px] font-semibold">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  )
}

export { Review }

export function AddHotelWizard({
  open,
  onOpenChange,
  city = "makkah",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Preselected city — each city table's add button passes its own. */
  city?: CityValue
}) {
  const [draft, setDraft] = useState<HotelDraft>(() => fresh(city))
  const set = (patch: Partial<HotelDraft>) => setDraft((d) => ({ ...d, ...patch }))

  useEffect(() => {
    if (open) setDraft(fresh(city))
  }, [open, city])

  return (
    <FormWizard
      open={open}
      onOpenChange={onOpenChange}
      title="إضافة فندق"
      description="فندق جديد في مخزون هذا الموسم."
      finishLabel="إضافة الفندق"
      onFinish={() => addHotel(draft)}
      steps={[
        {
          id: "identity",
          title: "المدينة والاسم",
          valid: draft.name_ar.trim().length > 0,
          content: (
            <>
              <Field label="المدينة">
                <SelectField
                  allowEmpty={false}
                  value={draft.city}
                  options={CITY_OPTIONS}
                  onChange={(v) => set({ city: v as CityValue })}
                />
              </Field>
              <Field label="الاسم (عربي)">
                <Input
                  autoFocus
                  placeholder="بولمان زمزم مكة"
                  value={draft.name_ar}
                  onChange={(e) => set({ name_ar: e.target.value })}
                />
              </Field>
              <Field label="الاسم (إنجليزي)" hint="كما يظهر في نسك، إن وُجد.">
                <Input
                  dir="ltr"
                  className="text-start"
                  placeholder="Pullman Makkah"
                  value={draft.name_en}
                  onChange={(e) => set({ name_en: e.target.value })}
                />
              </Field>
            </>
          ),
        },
        {
          id: "class",
          title: "التصنيف",
          content: (
            <>
              <Field label="التصنيف" hint="«خمسة نجوم … نزل» — تصنيف الوزارة.">
                <SelectField
                  allowEmpty={false}
                  value={draft.star_class}
                  options={STAR_OPTIONS}
                  onChange={(v) => set({ star_class: v as HotelDraft["star_class"] })}
                />
              </Field>
              <Field label="فئة السكن" hint="محور مستقل عن التصنيف — فوكو ٤ نجوم فئة ج.">
                <SelectField
                  allowEmpty={false}
                  value={draft.grade}
                  options={GRADE_OPTIONS}
                  onChange={(v) => set({ grade: v as HotelDraft["grade"] })}
                />
              </Field>
            </>
          ),
        },
        {
          id: "review",
          title: "مراجعة",
          content: (
            <>
              <Review
                rows={[
                  ["الاسم", draft.name_ar],
                  ["الاسم (إنجليزي)", draft.name_en],
                  ["المدينة", optionLabel(CITY_OPTIONS, draft.city)],
                  ["التصنيف", optionLabel(STAR_OPTIONS, draft.star_class)],
                  ["فئة السكن", draft.grade],
                ]}
              />
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                يُضاف الفندق كمرشّح بلا عقود — عقود السكن تُنشأ من صفحة الفنادق.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}
