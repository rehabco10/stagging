import { useTranslation } from "react-i18next"
import { useSnapshot } from "valtio"
import { Trash2, TriangleAlert, Info, CircleCheck } from "lucide-react"

import {
  addDays,
  allocated,
  findLeg,
  legNights,
  packageNights,
  removeLeg,
  removePackage,
  retimeLeg,
  state,
  type DraftPackage,
} from "@/store/season"
import i18n from "@/i18n/config"
import { roleLabel } from "@/lib/options"
import { PackageResources } from "@/features/inventory/PackageResources"
import { displayCategory } from "@/lib/schemas"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, Input, NumInput, SelectField } from "@/components/ui/field"
import { MaskedPriceInput } from "@/components/ui/price"
import { localName } from "@/lib/names"
import { cityShortLabel, roomTypeLabel, roleOptions, tierOptions } from "@/lib/options"
import { cn, arNum } from "@/lib/utils"
import { useIssues } from "@/store/use-issues"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border px-4 py-3.5">
      <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5 no-trim">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

/* ── season (root selected) ─────────────────────────────────────── */

function SeasonForm() {
  const { t } = useTranslation()
  const snap = useSnapshot(state)
  const used = allocated(state)
  const left = snap.season.quota_total - used

  return (
    <>
      <Section title={t("الموسم")}>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("السنة الهجرية")}>
            <NumInput
              value={snap.season.year_hijri}
              onChange={(e) => (state.season.year_hijri = Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("السنة الميلادية")}>
            <NumInput
              value={snap.season.year_gregorian}
              onChange={(e) => (state.season.year_gregorian = Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        <Field label={t("الحصة الإجمالية (حاج)")} hint={t("مجموع سعات الباقات يجب أن يساويها تمامًا.")}>
          <NumInput
            value={snap.season.quota_total}
            onChange={(e) => (state.season.quota_total = Number(e.target.value) || 0)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("بداية الموسم")}>
            <DatePicker
              value={snap.season.starts_on}
              onChange={(iso) => (state.season.starts_on = iso)}
            />
          </Field>
          <Field label={t("نهاية الموسم")}>
            <DatePicker
              value={snap.season.ends_on}
              onChange={(iso) => (state.season.ends_on = iso)}
            />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-md bg-muted px-2.5 py-2 text-[11px] tabular-nums">
          <span className="text-muted-foreground">{t("graph.allocated")} {arNum(used)}</span>
          <span
            className={cn(
              "font-semibold",
              left === 0
                ? "text-[color:var(--brand-green-deep)]"
                : left < 0
                  ? "text-[color:var(--brand-rose-deep)]"
                  : "text-foreground",
            )}
          >
            {left === 0 ? t("dashboard.complete") : left < 0 ? t("graph.over_by", { n: arNum(-left) }) : t("graph.left", { n: arNum(left) })}
          </span>
        </div>
      </Section>

      <Section title={t("الضوابط المعتمدة")}>
        <ul className="space-y-1.5 text-[11px] text-foreground/75">
          <li className="flex gap-1.5">
            <Info className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
            {t("الفاخرة والمميزة (وانتقالياتهما) ‏40% من الحصة كحد أعلى.")}
          </li>
          <li className="flex gap-1.5">
            <Info className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
            {t("الأساسية ‏60% من الحصة كحد أدنى.")}
          </li>
        </ul>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {t("مصدرها اجتماعات وزارة الحج والعمرة، وتُدار من صفحة «الاجتماعات والمتطلبات».")}
        </p>
      </Section>
    </>
  )
}

/* ── package ────────────────────────────────────────────────────── */

function PackageForm({ pkg }: { pkg: DraftPackage }) {
  const { t } = useTranslation()
  const snap = useSnapshot(state)
  const live = snap.packages.find((p) => p.id === pkg.id)
  if (!live) return null
  const nights = packageNights(pkg)
  const shifting = live.legs.some((l) => l.role === "transitional")

  return (
    <>
      <Section title={t("graph.package_no", { no: live.package_no })}>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("رقم الباقة")}>
            <Input value={live.package_no} onChange={(e) => (pkg.package_no = e.target.value)} />
          </Field>
          <Field label={t("الفئة")}>
            <SelectField
              allowEmpty={false}
              value={live.tier}
              options={tierOptions()}
              onChange={(v) => (pkg.tier = v as DraftPackage["tier"])}
            />
          </Field>
        </div>

        <Field label={t("الاسم (إنجليزي)")}>
          <Input dir="ltr" value={live.name_en} onChange={(e) => (pkg.name_en = e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label={t("السعة (حاج)")}>
            <NumInput
              value={live.capacity}
              onChange={(e) => (pkg.capacity = Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("السعر الابتدائي (ر.س)")}>
            <MaskedPriceInput
              value={live.initial_price_sar}
              onChange={(e) => (pkg.initial_price_sar = Number(e.target.value) || 0)}
            />
          </Field>
        </div>

        <Field
          label={t("توزيع الغرف (حاج)")}
          hint={(() => {
            const sum = live.room_mix["2"] + live.room_mix["3"] + live.room_mix["4"]
            if (sum === 0) return t("رباعية / ثلاثية / ثنائية — لم يُحدَّد التوزيع بعد.")
            const diff = live.capacity - sum
            if (diff === 0) return t("الموزَّع {n} — مطابق للسعة.", { n: arNum(sum) })
            return diff > 0 ? t("الموزَّع {n} — ينقص {d}.", { n: arNum(sum), d: arNum(diff) }) : t("الموزَّع {n} — يزيد {d}.", { n: arNum(sum), d: arNum(-diff) })
          })()}
        >
          <div className="grid grid-cols-3 gap-1.5">
            {/* A visible label per input — the placeholder disappears the
                moment a value exists, leaving three anonymous numbers. */}
            {(["4", "3", "2"] as const).map((rt) => {
              const name = roomTypeLabel(rt)
              return (
                <label key={rt} className="block">
                  <span className="mb-0.5 block text-[10px] font-semibold text-foreground/60">
                    {name}
                  </span>
                  <NumInput
                    aria-label={name}
                    placeholder="0"
                    value={live.room_mix[rt] ? String(live.room_mix[rt]) : ""}
                    onChange={(e) => (pkg.room_mix[rt] = Math.max(0, Number(e.target.value) || 0))}
                  />
                </label>
              )
            })}
          </div>
        </Field>

        <Field
          label={t("لاحقة التصنيف")}
          hint={t("نص يُحمل كما هو إلى نسك (مثل SA في 1447). معناه غير مؤكَّد، ولا يعتمد عليه أي منطق.")}
        >
          <Input
            dir="ltr"
            placeholder="—"
            value={live.variant_suffix}
            onChange={(e) => (pkg.variant_suffix = e.target.value)}
          />
        </Field>

        <div className="rounded-md bg-muted px-2.5 py-2 text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("التصنيف في نسك")}</span>
            <span className="font-semibold" dir="ltr">
              {displayCategory({
                tier: live.tier,
                is_shifting: shifting,
                variant_suffix: live.variant_suffix,
              })}
            </span>
          </div>
          <div className="flex justify-between tabular-nums">
            <span className="text-muted-foreground">{t("الإقامات / الليالي")}</span>
            <span className="font-semibold">
              {arNum(live.legs.length)} / {arNum(nights)}
            </span>
          </div>
        </div>
      </Section>

      <BindingsSection pkg={pkg} />

      <Section title={t("إجراءات")}>
        <button
          type="button"
          onClick={() => removePackage(pkg.id)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--brand-rose)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--brand-rose-deep)] hover:bg-[color:var(--brand-rose-soft)] cursor-pointer"
        >
          <Trash2 className="size-3.5" />
          {t("حذف الباقة")}
        </button>
      </Section>
    </>
  )
}

/* ── supply bindings ────────────────────────────────────────────── */

/** The per-decision resources panel, shared with the /packages workspace. */
function BindingsSection({ pkg }: { pkg: DraftPackage }) {
  const { t } = useTranslation()
  return (
    <Section title={t("الموارد — العقود والمقاعد")}>
      <PackageResources pkg={pkg} />
    </Section>
  )
}

/* ── leg ────────────────────────────────────────────────────────── */

function LegForm({ legId }: { legId: string }) {
  const { t } = useTranslation()
  useSnapshot(state)
  const found = findLeg(legId)
  if (!found) return null
  const { pkg, leg } = found
  const nights = legNights(leg)

  return (
    <>
      <Section title={`${roleLabel(leg.role)} — ${i18n.t("graph.package_no", { no: pkg.package_no })}`}>
        <Field label={t("الدور")}>
          <SelectField
            allowEmpty={false}
            value={leg.role}
            options={roleOptions()}
            onChange={(v) => {
              const next = v as typeof leg.role
              // Swap with whichever leg already holds the target role, so a
              // package never ends up with two "first" residences.
              const other = pkg.legs.find((l) => l.role === next && l.id !== leg.id)
              if (other) other.role = leg.role
              leg.role = next
            }}
          />
        </Field>

        <Field label={t("الفندق")}>
          {/* City is carried in the label rather than an optgroup: Base UI's
              Select has no group primitive, and the city is derivable from the
              hotel anyway. */}
          <SelectField
            allowEmpty={false}
            value={leg.hotelId}
            options={state.hotels.map((h) => ({
              value: h.id,
              label: `${localName(h)} — ${cityShortLabel(h.city)}`,
            }))}
            onChange={(v) => (leg.hotelId = v)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label={t("بداية الإقامة")}>
            <DatePicker
              value={leg.starts_on}
              onChange={(iso) => retimeLeg(leg.id, iso, addDays(iso, Math.max(1, nights)))}
            />
          </Field>
          <Field label={t("عدد الليالي")}>
            <NumInput
              value={nights}
              onChange={(e) => {
                const n = Math.max(1, Number(e.target.value) || 1)
                retimeLeg(leg.id, leg.starts_on, addDays(leg.starts_on, n))
              }}
            />
          </Field>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {t("تغيير التاريخ أو الليالي يزيح الإقامات التالية بنفس المقدار، فتبقى السلسلة متصلة بلا فجوات. النهاية الحالية:")} <span dir="ltr" className="font-medium">{leg.ends_on}</span>
        </p>
      </Section>

      <Section title={t("إجراءات")}>
        <button
          type="button"
          onClick={() => removeLeg(leg.id)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--brand-rose)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--brand-rose-deep)] hover:bg-[color:var(--brand-rose-soft)] cursor-pointer"
        >
          <Trash2 className="size-3.5" />
          {t("حذف الإقامة")}
        </button>
      </Section>
    </>
  )
}

/* ── issues ─────────────────────────────────────────────────────── */

function Issues() {
  const { t } = useTranslation()
  const snap = useSnapshot(state)
  const issues = useIssues()
  const errors = issues.filter((i) => i.level === "error")
  const warnings = issues.filter((i) => i.level === "warning")

  if (snap.packages.length === 0) return null

  return (
    <Section title={t("التحقق — {e} خطأ، {w} تنبيه", { e: arNum(errors.length), w: arNum(warnings.length) })}>
      {issues.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md bg-[color:var(--brand-green-soft)] px-2.5 py-2 text-[11px] text-[color:var(--brand-green-deep)]">
          <CircleCheck className="size-4 shrink-0" />
          <span className="font-medium">{t("الموسم مطابق للضوابط. جاهز للرفع.")}</span>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {issues.slice(0, 40).map((i, idx) => {
            // Real buttons for the openable issues — keyboard users included.
            const clickable = i.scope === "package" || i.scope === "leg"
            const cls = cn(
              "flex w-full gap-1.5 rounded-md px-2 py-1.5 text-start text-[11px] leading-snug",
              i.level === "error"
                ? "bg-[color:var(--brand-rose-soft)] text-[color:var(--brand-rose-deep)]"
                : "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold-deep)]",
              clickable && "cursor-pointer hover:brightness-97",
            )
            const content = (
              <>
                <TriangleAlert className="size-3.5 shrink-0 mt-0.5" />
                <span>{i.message}</span>
              </>
            )
            return (
              <li key={`${i.code}-${i.entityId}-${idx}`}>
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => (state.selectedId = i.entityId)}
                    className={cls}
                  >
                    {content}
                  </button>
                ) : (
                  <div className={cls}>{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

/* ── shell ──────────────────────────────────────────────────────── */

/**
 * The wizard body. Rendered inside the responsive sheet/drawer rather than a
 * docked column — it is contextual to whatever node is selected, so it comes
 * and goes with the selection instead of permanently occupying the canvas.
 */
export function InspectorContent() {
  const snap = useSnapshot(state)
  const selectedPkg = state.packages.find((p) => p.id === snap.selectedId)
  const isLeg = Boolean(findLeg(snap.selectedId))

  return (
    <>
      {selectedPkg ? (
        <PackageForm pkg={selectedPkg} />
      ) : isLeg ? (
        <LegForm legId={snap.selectedId} />
      ) : (
        <SeasonForm />
      )}
      <Issues />
    </>
  )
}

/** Sub-title for the wizard sheet — says what is currently being edited. */
export function useInspectorSubtitle() {
  const snap = useSnapshot(state)
  const pkg = snap.packages.find((p) => p.id === snap.selectedId)
  if (pkg) return i18n.t("باقة {no} — {name}", { no: pkg.package_no, name: pkg.name_en || i18n.t("بدون اسم") })
  const leg = findLeg(snap.selectedId)
  if (leg) return `${roleLabel(leg.leg.role)} — ${i18n.t("graph.package_no", { no: leg.pkg.package_no })}`
  return i18n.t("موسم {h}هـ — {g}م", { h: snap.season.year_hijri, g: snap.season.year_gregorian })
}
