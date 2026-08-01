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
import { ROLE_LABEL } from "@/features/graph/nodes"
import { displayCategory } from "@/lib/schemas"
import { Field, Input, NumInput, SelectField } from "@/components/ui/field"
import { ROLE_OPTIONS, TIER_OPTIONS } from "@/lib/options"
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
  const snap = useSnapshot(state)
  const used = allocated(state)
  const left = snap.season.quota_total - used

  return (
    <>
      <Section title="الموسم">
        <div className="grid grid-cols-2 gap-2">
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
        <Field label="الحصة الإجمالية (حاج)" hint="مجموع سعات الباقات يجب أن يساويها تمامًا.">
          <NumInput
            value={snap.season.quota_total}
            onChange={(e) => (state.season.quota_total = Number(e.target.value) || 0)}
          />
        </Field>
        <div className="flex items-center justify-between rounded-md bg-muted px-2.5 py-2 text-[11px] tabular-nums">
          <span className="text-muted-foreground">موزَّع {arNum(used)}</span>
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
            {left === 0 ? "مكتمل" : left < 0 ? `تجاوز ${arNum(-left)}` : `متبقٍ ${arNum(left)}`}
          </span>
        </div>
      </Section>

      <Section title="الضوابط المعتمدة">
        <ul className="space-y-1.5 text-[11px] text-foreground/75">
          <li className="flex gap-1.5">
            <Info className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
            الفاخرة والمميزة (وانتقالياتهما) ‏40% من الحصة كحد أعلى.
          </li>
          <li className="flex gap-1.5">
            <Info className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
            الأساسية ‏60% من الحصة كحد أدنى.
          </li>
        </ul>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          مصدرها اجتماعات وزارة الحج والعمرة، وتُدار من صفحة «الاجتماعات والمتطلبات».
        </p>
      </Section>
    </>
  )
}

/* ── package ────────────────────────────────────────────────────── */

function PackageForm({ pkg }: { pkg: DraftPackage }) {
  const snap = useSnapshot(state)
  const live = snap.packages.find((p) => p.id === pkg.id)
  if (!live) return null
  const nights = packageNights(pkg)
  const shifting = live.legs.some((l) => l.role === "transitional")

  return (
    <>
      <Section title={`باقة ${live.package_no}`}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="رقم الباقة">
            <Input value={live.package_no} onChange={(e) => (pkg.package_no = e.target.value)} />
          </Field>
          <Field label="الفئة">
            <SelectField
              allowEmpty={false}
              value={live.tier}
              options={TIER_OPTIONS}
              onChange={(v) => (pkg.tier = v as DraftPackage["tier"])}
            />
          </Field>
        </div>

        <Field label="الاسم (إنجليزي)">
          <Input dir="ltr" value={live.name_en} onChange={(e) => (pkg.name_en = e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="السعة (حاج)">
            <NumInput
              value={live.capacity}
              onChange={(e) => (pkg.capacity = Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="السعر الابتدائي (ر.س)">
            <NumInput
              value={live.initial_price_sar}
              onChange={(e) => (pkg.initial_price_sar = Number(e.target.value) || 0)}
            />
          </Field>
        </div>

        <Field
          label="لاحقة التصنيف"
          hint="نص يُحمل كما هو إلى نسك (مثل SA في 1447). معناه غير مؤكَّد، ولا يعتمد عليه أي منطق."
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
            <span className="text-muted-foreground">التصنيف في نسك</span>
            <span className="font-semibold" dir="ltr">
              {displayCategory({
                tier: live.tier,
                is_shifting: shifting,
                variant_suffix: live.variant_suffix,
              })}
            </span>
          </div>
          <div className="flex justify-between tabular-nums">
            <span className="text-muted-foreground">الإقامات / الليالي</span>
            <span className="font-semibold">
              {arNum(live.legs.length)} / {arNum(nights)}
            </span>
          </div>
        </div>
      </Section>

      <Section title="إجراءات">
        <button
          type="button"
          onClick={() => removePackage(pkg.id)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--brand-rose)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--brand-rose-deep)] hover:bg-[color:var(--brand-rose-soft)] cursor-pointer"
        >
          <Trash2 className="size-3.5" />
          حذف الباقة
        </button>
      </Section>
    </>
  )
}

/* ── leg ────────────────────────────────────────────────────────── */

function LegForm({ legId }: { legId: string }) {
  useSnapshot(state)
  const found = findLeg(legId)
  if (!found) return null
  const { pkg, leg } = found
  const nights = legNights(leg)

  return (
    <>
      <Section title={`${ROLE_LABEL[leg.role]} — باقة ${pkg.package_no}`}>
        <Field label="الدور">
          <SelectField
            allowEmpty={false}
            value={leg.role}
            options={ROLE_OPTIONS}
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

        <Field label="الفندق">
          {/* City is carried in the label rather than an optgroup: Base UI's
              Select has no group primitive, and the city is derivable from the
              hotel anyway. */}
          <SelectField
            allowEmpty={false}
            value={leg.hotelId}
            options={state.hotels.map((h) => ({
              value: h.id,
              label: `${h.name_ar} — ${h.city === "makkah" ? "مكة" : "المدينة"}`,
            }))}
            onChange={(v) => (leg.hotelId = v)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="بداية الإقامة">
            <Input
              type="date"
              dir="ltr"
              value={leg.starts_on}
              onChange={(e) => {
                const v = e.target.value
                if (!v) return
                retimeLeg(leg.id, v, addDays(v, Math.max(1, nights)))
              }}
            />
          </Field>
          <Field label="عدد الليالي">
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
          تغيير التاريخ أو الليالي يزيح الإقامات التالية بنفس المقدار، فتبقى السلسلة متصلة بلا
          فجوات. النهاية الحالية: <span dir="ltr" className="font-medium">{leg.ends_on}</span>
        </p>
      </Section>

      <Section title="إجراءات">
        <button
          type="button"
          onClick={() => removeLeg(leg.id)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--brand-rose)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--brand-rose-deep)] hover:bg-[color:var(--brand-rose-soft)] cursor-pointer"
        >
          <Trash2 className="size-3.5" />
          حذف الإقامة
        </button>
      </Section>
    </>
  )
}

/* ── issues ─────────────────────────────────────────────────────── */

function Issues() {
  const snap = useSnapshot(state)
  const issues = useIssues()
  const errors = issues.filter((i) => i.level === "error")
  const warnings = issues.filter((i) => i.level === "warning")

  if (snap.packages.length === 0) return null

  return (
    <Section title={`التحقق — ${arNum(errors.length)} خطأ، ${arNum(warnings.length)} تنبيه`}>
      {issues.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md bg-[color:var(--brand-green-soft)] px-2.5 py-2 text-[11px] text-[color:var(--brand-green-deep)]">
          <CircleCheck className="size-4 shrink-0" />
          <span className="font-medium">الموسم مطابق للضوابط. جاهز للرفع.</span>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {issues.slice(0, 40).map((i, idx) => (
            <li
              key={`${i.code}-${i.entityId}-${idx}`}
              onClick={() => {
                if (i.scope === "package" || i.scope === "leg") state.selectedId = i.entityId
              }}
              className={cn(
                "flex gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug",
                i.level === "error"
                  ? "bg-[color:var(--brand-rose-soft)] text-[color:var(--brand-rose-deep)]"
                  : "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold-deep)]",
                (i.scope === "package" || i.scope === "leg") && "cursor-pointer hover:brightness-97",
              )}
            >
              <TriangleAlert className="size-3.5 shrink-0 mt-0.5" />
              <span>{i.message}</span>
            </li>
          ))}
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
  if (pkg) return `باقة ${pkg.package_no} — ${pkg.name_en || "بدون اسم"}`
  const leg = findLeg(snap.selectedId)
  if (leg) return `${ROLE_LABEL[leg.leg.role]} — باقة ${leg.pkg.package_no}`
  return `موسم ${snap.season.year_hijri}هـ — ${snap.season.year_gregorian}م`
}
