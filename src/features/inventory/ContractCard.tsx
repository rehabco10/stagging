import { useTranslation } from "react-i18next"
import { useSnapshot } from "valtio"
import { Plus, Trash2 } from "lucide-react"

import {
  addRoomLine,
  contractBeds,
  lineBeds,
  removeContract,
  removeRoomLine,
  state,
  type DraftContract,
  type DraftRoomLine,
} from "@/store/season"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, Input, NumInput, SelectField } from "@/components/ui/field"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MaskedPriceInput } from "@/components/ui/price"
import { StatusPill } from "@/components/ui/status-pill"
import { contractCityOptions, contractStatusOptions, roomTypeOptions } from "@/lib/options"
import { cn, arNum } from "@/lib/utils"

const TH = "px-3 py-2 text-start text-[11px] font-semibold text-muted-foreground"

/**
 * One contract, fully editable, rendered inside its hotel's detail — the
 * hotel is fixed context, so there is no hotel selector to mis-click. Unlike
 * its cramped table-cell ancestor, fields here are full-size: the detail
 * column finally gives the seven fields the width they need.
 */
export function ContractCard({
  id,
  onError,
}: {
  id: string
  onError: (m: string | null) => void
}) {
  const { t } = useTranslation()
  const snap = useSnapshot(state)
  const c = snap.contracts.find((x) => x.id === id)
  const live = state.contracts.find((x) => x.id === id)
  if (!c || !live) return null
  const beds = contractBeds(c as DraftContract)
  const usedBy = snap.packages.filter((p) => p.contractIds.includes(c.id)).length

  return (
    <div className="rounded-xl border border-surface-line bg-surface-raised p-4">
      <div className="flex items-center gap-2.5">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          عقد{" "}
          <span dir="ltr" className="font-mono text-[13px] tabular-nums">
            {c.contract_no || "—"}
          </span>
        </span>
        <StatusPill status={c.status} />
        <span className="shrink-0 rounded-full bg-[color:var(--brand-teal-soft)] px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-[color:var(--brand-teal-deep)]">
          {arNum(beds)} سرير
        </span>
        {usedBy > 0 && (
          <span className="shrink-0 rounded-full bg-[color:var(--brand-gold-soft)] px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-[color:var(--brand-gold-deep)]">
            {arNum(usedBy)} باقة
          </span>
        )}
        <button
          type="button"
          aria-label={t("حذف العقد")}
          title={usedBy > 0 ? "مرتبط بباقة — لا يمكن حذفه" : "حذف"}
          onClick={() => {
            const r = removeContract(c.id)
            onError(r.ok ? null : `لا يمكن حذف العقد: مرتبط بـ${arNum(r.usedBy)} باقة.`)
          }}
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground/45 transition-colors hover:bg-[color:var(--brand-rose-soft)] hover:text-[color:var(--brand-rose-deep)]"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Field label={t("رقم العقد")} className="col-span-2">
          <Input
            dir="ltr"
            className="text-start font-mono tabular-nums"
            placeholder="202710000000000"
            value={c.contract_no}
            onChange={(e) => (live.contract_no = e.target.value)}
          />
        </Field>
        <Field label={t("المدينة")}>
          <SelectField
            allowEmpty={false}
            value={c.city}
            options={contractCityOptions()}
            onChange={(v) => (live.city = v as DraftContract["city"])}
          />
        </Field>
        <Field label={t("من")}>
          <DatePicker
            value={c.starts_on}
            onChange={(iso) => (live.starts_on = iso)}
          />
        </Field>
        <Field label={t("إلى")}>
          <DatePicker
            value={c.ends_on}
            onChange={(iso) => (live.ends_on = iso)}
          />
        </Field>
        <Field label={t("الحالة")} hint={c.status === "signed" ? undefined : "لا يُحتسب إلا الموقَّع"}>
          <SelectField
            allowEmpty={false}
            value={c.status}
            options={contractStatusOptions()}
            onChange={(v) => (live.status = v as DraftContract["status"])}
          />
        </Field>
      </div>

      {/* min-w + the Table container's overflow: phones scroll the room
          lines horizontally instead of crushing «سعر السرير/ليلة» into
          three wrapped lines. */}
      <Table className="mt-3 min-w-[26rem]">
        <TableHeader>
          <TableRow className="border-b border-surface-line">
            <TableHead className={TH}>{t("نوع الغرفة")}</TableHead>
            <TableHead className={cn(TH, "w-28")}>{t("الغرف")}</TableHead>
            <TableHead className={cn(TH, "w-24")}>{t("الأسرّة")}</TableHead>
            <TableHead className={TH}>{t("سعر السرير/ليلة")}</TableHead>
            <TableHead className={cn(TH, "w-12")} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {c.lines.map((l) => {
            const liveLine = live.lines.find((x) => x.id === l.id)!
            return (
              <TableRow key={l.id} className="border-t-0 border-b border-surface-line/60">
                <TableCell className="py-1.5 pe-2 ps-0">
                  <SelectField
                    allowEmpty={false}
                    value={l.room_type}
                    options={roomTypeOptions()}
                    onChange={(v) => (liveLine.room_type = v as DraftRoomLine["room_type"])}
                  />
                </TableCell>
                <TableCell className="py-1.5 pe-2 ps-0">
                  <NumInput
                    value={String(l.rooms || "")}
                    placeholder="0"
                    onChange={(e) => (liveLine.rooms = Math.max(0, Number(e.target.value) || 0))}
                  />
                </TableCell>
                {/* Derived, read-only — entering beds directly is how the 1447
                    sheet ended up holding rooms in a beds column. */}
                <TableCell className="px-3 py-1.5 text-sm font-semibold tabular-nums">
                  {arNum(lineBeds(l as DraftRoomLine))}
                </TableCell>
                <TableCell className="py-1.5 pe-2 ps-0">
                  <MaskedPriceInput
                    value={l.rate_sar == null ? "" : String(l.rate_sar)}
                    placeholder={t("اختياري")}
                    onChange={(e) =>
                      (liveLine.rate_sar =
                        e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </TableCell>
                <TableCell className="py-1.5 ps-0">
                  <button
                    type="button"
                    aria-label={t("حذف نوع الغرفة")}
                    onClick={() => removeRoomLine(c.id, l.id)}
                    className="grid size-8 place-items-center rounded-md text-muted-foreground/45 transition-colors hover:bg-[color:var(--brand-rose-soft)] hover:text-[color:var(--brand-rose-deep)]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {c.lines.length < 3 && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => addRoomLine(c.id)}>
          <Plus className="size-3.5" />
          {t("نوع غرفة")}
        </Button>
      )}
    </div>
  )
}
