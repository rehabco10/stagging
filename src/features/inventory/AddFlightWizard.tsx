import { useEffect, useState } from "react"

import { FormWizard } from "@/components/ui/form-wizard"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, Input, NumInput, SelectField } from "@/components/ui/field"
import { flightDirectionOptions, flightTypeOptions } from "@/lib/options"
import { addFlightBlock, state, type DraftFlightBlock } from "@/store/season"
import { arNum } from "@/lib/utils"
import { Review } from "./AddHotelWizard"

type FlightDraft = Omit<DraftFlightBlock, "id">

/**
 * The block mirrors the 1447 «اسم العقد» free text — airline → route → PNR →
 * seats — as real fields. It enters as `proposed`; confirming seats is a
 * deliberate second act, same as signing a housing contract.
 */
const fresh = (airline?: { ar: string; en: string }): FlightDraft => ({
  direction: "arrival",
  airline_ar: airline?.ar ?? "",
  airline_en: airline?.en ?? "",
  flight_no: "",
  flies_on: state.season.starts_on,
  from_city: "",
  to_city: "جدة",
  contract_type: "group",
  pnr: "",
  seats: 0,
  status: "proposed",
})

export function AddFlightWizard({
  open,
  onOpenChange,
  airline,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Preset carrier — the per-airline add button passes its own group. */
  airline?: { ar: string; en: string }
}) {
  const [draft, setDraft] = useState<FlightDraft>(() => fresh(airline))
  const set = (patch: Partial<FlightDraft>) => setDraft((d) => ({ ...d, ...patch }))

  useEffect(() => {
    if (open) setDraft(fresh(airline))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, airline?.ar, airline?.en])

  return (
    <FormWizard
      open={open}
      onOpenChange={onOpenChange}
      title="إضافة كتلة مقاعد"
      description="إضافة كتلة مقاعد متعاقد عليها."
      finishLabel="إضافة الكتلة"
      onFinish={() => addFlightBlock(draft)}
      steps={[
        {
          id: "flight",
          title: "الرحلة",
          valid: draft.airline_ar.trim().length > 0,
          content: (
            <>
              <Field label="الاتجاه">
                <SelectField
                  allowEmpty={false}
                  value={draft.direction}
                  options={flightDirectionOptions()}
                  onChange={(v) => {
                    const direction = v as FlightDraft["direction"]
                    set({
                      direction,
                      // Jeddah is the fixed end of the route; swap it to
                      // whichever side the direction implies.
                      from_city: direction === "return" ? "جدة" : draft.to_city === "جدة" ? draft.from_city : "",
                      to_city: direction === "arrival" ? "جدة" : "",
                    })
                  }}
                />
              </Field>
              <Field label="شركة الطيران">
                <Input
                  autoFocus
                  placeholder="السعودية"
                  value={draft.airline_ar}
                  onChange={(e) => set({ airline_ar: e.target.value })}
                />
              </Field>
              <Field label="شركة الطيران (إنجليزي)">
                <Input
                  dir="ltr"
                  className="text-start"
                  placeholder="Saudia"
                  value={draft.airline_en}
                  onChange={(e) => set({ airline_en: e.target.value })}
                />
              </Field>
              <Field label="رقم الرحلة" hint="يُترك فارغًا إذا لم يُؤكَّد الحجز بعد.">
                <Input
                  dir="ltr"
                  className="text-start"
                  placeholder="SV214"
                  value={draft.flight_no}
                  onChange={(e) => set({ flight_no: e.target.value })}
                />
              </Field>
              <Field label="التاريخ">
                <DatePicker
                  value={draft.flies_on}
                  onChange={(iso) => set({ flies_on: iso })}
                />
              </Field>
            </>
          ),
        },
        {
          id: "route",
          title: "المسار",
          content: (
            <>
              <Field label="من">
                <Input
                  placeholder={draft.direction === "arrival" ? "أمستردام" : "جدة"}
                  value={draft.from_city}
                  onChange={(e) => set({ from_city: e.target.value })}
                />
              </Field>
              <Field label="إلى">
                <Input
                  placeholder={draft.direction === "arrival" ? "جدة" : "أمستردام"}
                  value={draft.to_city}
                  onChange={(e) => set({ to_city: e.target.value })}
                />
              </Field>
            </>
          ),
        },
        {
          id: "seats",
          title: "المقاعد والعقد",
          valid: draft.seats > 0,
          content: (
            <>
              <Field label="عدد المقاعد">
                <NumInput
                  placeholder="45"
                  value={draft.seats ? String(draft.seats) : ""}
                  onChange={(e) => set({ seats: Math.max(0, Number(e.target.value) || 0) })}
                />
              </Field>
              <Field label="نوع العقد">
                <SelectField
                  allowEmpty={false}
                  value={draft.contract_type}
                  options={flightTypeOptions()}
                  onChange={(v) => set({ contract_type: v as FlightDraft["contract_type"] })}
                />
              </Field>
              <Field label="PNR" hint="مرجع الحجز لدى الناقل، إن وُجد.">
                <Input
                  dir="ltr"
                  className="text-start uppercase"
                  placeholder="8WMNM3"
                  value={draft.pnr}
                  onChange={(e) => set({ pnr: e.target.value })}
                />
              </Field>
              <Review
                rows={[
                  [
                    "الرحلة",
                    `${draft.airline_ar}${draft.flight_no ? ` ${draft.flight_no}` : ""} · ${draft.flies_on}`,
                  ],
                  ["المسار", `${draft.from_city || "—"} ← ${draft.to_city || "—"}`],
                  ["المقاعد", draft.seats ? arNum(draft.seats) : ""],
                ]}
              />
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                تُضاف الكتلة بحالة «مقترح» — لا تُحتسب في تغطية الحصة إلا بعد تأكيدها من الجدول.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}
