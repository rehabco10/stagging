import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"

import { FormWizard } from "@/components/ui/form-wizard"
import { Field, Input, SelectField } from "@/components/ui/field"
import { cityOptions, gradeOptions, starOptions } from "@/lib/options"
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
  const { t } = useTranslation()
  const [draft, setDraft] = useState<HotelDraft>(() => fresh(city))
  const set = (patch: Partial<HotelDraft>) => setDraft((d) => ({ ...d, ...patch }))

  useEffect(() => {
    if (open) setDraft(fresh(city))
  }, [open, city])

  return (
    <FormWizard
      open={open}
      onOpenChange={onOpenChange}
      title={t("إضافة فندق")}
      description={t("فندق جديد في مخزون هذا الموسم.")}
      finishLabel={t("إضافة الفندق")}
      onFinish={() => addHotel(draft)}
      steps={[
        {
          id: "identity",
          title: "المدينة والاسم",
          valid: draft.name_ar.trim().length > 0,
          content: (
            <>
              <Field label={t("المدينة")}>
                <SelectField
                  allowEmpty={false}
                  value={draft.city}
                  options={cityOptions()}
                  onChange={(v) => set({ city: v as CityValue })}
                />
              </Field>
              <Field label={t("الاسم (عربي)")}>
                <Input
                  autoFocus
                  placeholder={t("بولمان زمزم مكة")}
                  value={draft.name_ar}
                  onChange={(e) => set({ name_ar: e.target.value })}
                />
              </Field>
              <Field label={t("الاسم (إنجليزي)")} hint={t("كما يظهر في نسك، إن وُجد.")}>
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
              <Field label={t("التصنيف")} hint={t("«خمسة نجوم … نزل» — تصنيف الوزارة.")}>
                <SelectField
                  allowEmpty={false}
                  value={draft.star_class}
                  options={starOptions()}
                  onChange={(v) => set({ star_class: v as HotelDraft["star_class"] })}
                />
              </Field>
              <Field label={t("فئة السكن")} hint={t("فئة مستقلة عن تصنيف النجوم.")}>
                <SelectField
                  allowEmpty={false}
                  value={draft.grade}
                  options={gradeOptions()}
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
                  ["المدينة", optionLabel(cityOptions(), draft.city)],
                  ["التصنيف", optionLabel(starOptions(), draft.star_class)],
                  ["فئة السكن", draft.grade],
                ]}
              />
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                {t("يُضاف الفندق كمرشّح بلا عقود — عقود السكن تُنشأ من صفحة الفنادق.")}
              </p>
            </>
          ),
        },
      ]}
    />
  )
}
