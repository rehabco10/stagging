import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { useSnapshot } from "valtio"
import { ChevronLeft, Copy, Package as PackageIcon, Plus, Trash2, TriangleAlert } from "lucide-react"

import { BalanceStrip } from "@/components/BalanceStrip"
import { useLocaleNavigate } from "@/i18n/LocaleProvider"
import { MasterDetail } from "@/components/MasterDetail"
import { Card, Note, PageHeader } from "@/components/PageShell"
import { MASTER_DETAIL_WIDE_QUERY, useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox, Field, Input, NumInput, SelectField, cellCls } from "@/components/ui/field"
import { FilterChips } from "@/components/ui/filter-chips"
import { MaskedPriceInput, Price } from "@/components/ui/price"
import { Meter } from "@/components/ui/meter"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PackageResources } from "@/features/inventory/PackageResources"
import { localName } from "@/lib/names"
import {
  cityShortLabel,
  publishStatusOptions,
  roleOptions,
  saleStatusOptions,
  tierLabel,
  tierOptions,
} from "@/lib/options"
import { displayCategory } from "@/lib/schemas"
import {
  addDays,
  addLeg,
  addPackage,
  allocated,
  availableRoles,
  cloneChainFrom,
  duplicatePackage,
  legNights,
  orderedLegs,
  packageNights,
  removeLeg,
  removePackage,
  retimeLeg,
  state,
  takeRemaining,
  type DraftPackage,
} from "@/store/season"
import { useIssues } from "@/store/use-issues"
import { cn, arNum } from "@/lib/utils"

const TH = "px-2.5 py-2 text-start text-[11px] font-semibold text-muted-foreground"

/**
 * «مصنع الباقات» — the packages page rebuilt around the season's actual
 * process (docs/packages-ux-bpr.md): a standing balance header steers the
 * capacity partition, the master is a read-only registry with readiness
 * dots, and the workspace sections follow the process order — identity &
 * pricing, capacity & mix, stays, resources, readiness & publishing.
 */
export function PackagesPage() {
  const { pkgId } = useParams()
  const navigate = useLocaleNavigate()
  const snap = useSnapshot(state)
  const issues = useIssues()
  const { t } = useTranslation()
  const wide = useMediaQuery(MASTER_DETAIL_WIDE_QUERY)
  const [tierFilter, setTierFilter] = useState<DraftPackage["tier"] | null>(null)
  const [search, setSearch] = useState("")

  const errorsByPkg = new Map<string, number>()
  for (const p of snap.packages) {
    const ids = new Set<string>([p.id, ...p.legs.map((l) => l.id)])
    errorsByPkg.set(p.id, issues.filter((i) => i.level === "error" && ids.has(i.entityId)).length)
  }

  const used = allocated(state)
  const quota = snap.season.quota_total
  const standard = snap.packages
    .filter((p) => p.tier === "standard")
    .reduce((t, p) => t + p.capacity, 0)
  const stdPct = used > 0 ? (standard / used) * 100 : 0
  const premPct = used > 0 ? 100 - stdPct : 0

  const ordered = [...snap.packages].sort((a, b) => a.package_no.localeCompare(b.package_no))
  const filtered = ordered.filter(
    (p) =>
      (tierFilter === null || p.tier === tierFilter) &&
      (search.trim() === "" ||
        p.name_en.toLowerCase().includes(search.trim().toLowerCase()) ||
        p.package_no.includes(search.trim())),
  )
  const selected = pkgId ? snap.packages.find((p) => p.id === pkgId) : undefined
  // Never an empty pane while packages exist — default to the first.
  const shown = selected ?? filtered[0] ?? ordered[0]

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-page">
      <PageHeader
        title={t("page.packages")}
        description={t("page.packages_desc")}
        actions={
          <Button size="sm" onClick={() => addPackage()}>
            <Plus className="size-3.5" />
            {t("باقة جديدة")}
          </Button>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-4">
        {/* الميزان — the steering instrument for the capacity partition.
            Narrow portrait collapses it to a verdict strip + drawer. */}
        <BalanceStrip
          title={t("ميزان الحصة")}
          summary={
            <>
              <span className="text-[12px] font-semibold text-foreground">{t("الحصة")}</span>
              <span dir="ltr" className="text-[12px] tabular-nums text-muted-foreground">
                <b className="font-bold text-foreground">{arNum(used)}</b> / {arNum(quota)}
              </span>
              <QuotaChip used={used} quota={quota} />
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Meter className="min-w-64 flex-[2]" label={t("الحصة")} value={used} max={quota} />
            <Meter
              className="min-w-52 flex-1"
              label={t("فاخرة+مميزة ≤٤٠٪")}
              value={Math.round(premPct * 10) / 10}
              max={40}
            />
            <Meter
              className="min-w-52 flex-1"
              label={t("أساسية ≥٦٠٪")}
              value={Math.round(stdPct * 10) / 10}
              max={60}
              bound="min"
            />
            <QuotaChip used={used} quota={quota} />
          </div>
        </BalanceStrip>

        <div className="min-h-0 flex-1">
          <MasterDetail
            detailOpen={Boolean(selected)}
            onBack={() => navigate("/packages")}
            placeholder={
              <span className="flex items-center gap-2">
                <PackageIcon className="size-4" />
                {t("اختر باقة من القائمة")}
              </span>
            }
            master={
              <>
                {/* A solid toolbar card, not floating chips: cards scrolling
                    beneath a transparent strip looked like an overlap glitch —
                    a bordered surface makes passing under it read as intended.
                    Below lg it bleeds to the pane edges so no half-row peeks
                    through the pane's px-1 gutters beside it. */}
                <div className="sticky top-0 z-10 space-y-2 rounded-xl border border-surface-line bg-surface-raised p-2.5 shadow-[var(--elev-1)] max-lg:-mx-1 max-lg:rounded-none max-lg:border-x-0">
                  <Input
                    placeholder={t("بحث بالاسم أو الرقم…")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <FilterChips
                    value={tierFilter}
                    onChange={setTierFilter}
                    options={(["luxury", "premium", "standard"] as const).map((t) => ({
                      value: t,
                      label: tierLabel(t),
                      count: snap.packages.filter((p) => p.tier === t).length,
                    }))}
                  />
                </div>
                <ul className="space-y-2">
                  {filtered.length === 0 && (
                    <li className="rounded-xl border border-dashed border-surface-line px-3 py-5 text-center text-[12px] text-muted-foreground">
                      {t("لا نتائج.")}
                    </li>
                  )}
                  {filtered.map((p) => (
                    <MasterRow
                      key={p.id}
                      pkg={p as DraftPackage}
                      // On narrow screens the detail is a pushed screen, so the
                      // wide-mode default highlight would mark a row whose
                      // detail is not visible — only explicit picks highlight.
                      active={p.id === (wide ? shown?.id : selected?.id)}
                      errors={errorsByPkg.get(p.id) ?? 0}
                      onSelect={() => navigate(`/packages/${p.id}`)}
                    />
                  ))}
                </ul>
              </>
            }
            detail={
              shown && <Workspace key={shown.id} id={shown.id} issues={issues} />
            }
          />
        </div>
      </div>
    </div>
  )
}

/** The quota verdict pill — shared by the full meters and the mobile strip. */
function QuotaChip({ used, quota }: { used: number; quota: number }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums",
        used === quota
          ? "bg-[color:var(--brand-green-soft)] text-[color:var(--brand-green-deep)]"
          : used > quota
            ? "bg-[color:var(--brand-rose-soft)] text-[color:var(--brand-rose-deep)]"
            : "bg-surface-sunken text-foreground/80",
      )}
    >
      {used === quota
        ? "الحصة مستوفاة"
        : used > quota
          ? t("graph.over_by", { n: arNum(used - quota) })
          : t("graph.left", { n: arNum(quota - used) })}
    </span>
  )
}

/* ── master row: read-only, scannable ───────────────────────────── */

function readinessDots(p: DraftPackage) {
  return [
    { key: "بيانات", ok: Boolean(p.name_en) && p.capacity > 0 && p.initial_price_sar > 0 },
    { key: "إقامات", ok: p.legs.length >= 2 },
    { key: "موارد", ok: p.contractIds.length > 0 },
    { key: "محتوى", ok: p.content_ready_ar && p.hero_approved },
  ]
}

const TIER_EDGE: Record<DraftPackage["tier"], string> = {
  luxury: "var(--brand-gold)",
  premium: "var(--brand-green)",
  standard: "var(--brand-slate)",
}

function MasterRow({
  pkg,
  active,
  errors,
  onSelect,
}: {
  pkg: DraftPackage
  active: boolean
  errors: number
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const dots = readinessDots(pkg)
  const done = dots.filter((d) => d.ok).length
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "relative w-full rounded-xl border py-3 pe-3.5 ps-4 text-start transition-colors",
          active
            ? "border-[color:var(--brand-teal)]/50 bg-[color:var(--brand-teal-soft)]/50 shadow-[var(--elev-1)]"
            : "border-surface-line bg-surface-raised hover:bg-surface-sunken/60",
        )}
      >
        {/* tier tint on the start edge — scan by color, same hues as the canvas */}
        <span
          aria-hidden
          className="absolute inset-y-2.5 start-1.5 w-1 rounded-full"
          style={{ background: TIER_EDGE[pkg.tier] }}
        />
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
            {pkg.package_no}
          </span>
          <span dir="ltr" className="min-w-0 flex-1 truncate text-start text-[13px] font-semibold">
            {pkg.name_en || "—"}
          </span>
          {errors > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[color:var(--brand-rose-soft)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[color:var(--brand-rose-deep)]">
              <TriangleAlert className="size-3" />
              {arNum(errors)}
            </span>
          )}
          {/* Rows push a detail screen on narrow viewports — say so. */}
          <ChevronLeft className="size-4 shrink-0 text-muted-foreground/50 lg:hidden" />
        </div>
        <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
          {tierLabel(pkg.tier)} ·{" "}
          <b className="font-semibold text-foreground/80">
            {t("units.pilgrims", { n: arNum(pkg.capacity), count: pkg.capacity })}
          </b>
          {pkg.initial_price_sar > 0 && (
            <>
              {" "}
              ·{" "}
              <Price
                interactive={false}
                value={t("{n} ر.س", { n: arNum(Math.round(pkg.initial_price_sar)) })}
              />
            </>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          {dots.map((d) => (
            <span
              key={d.key}
              title={`${t(d.key)}: ${d.ok ? t("جاهز") : t("ناقص")}`}
              className={cn(
                "size-2 rounded-full",
                d.ok ? "bg-[color:var(--brand-green)]" : "bg-surface-line",
              )}
            />
          ))}
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {t("units.readiness", { done: arNum(done), total: arNum(dots.length) })}
          </span>
        </div>
      </button>
    </li>
  )
}

/* ── workspace: the selected package, sections in process order ─── */

function Workspace({ id, issues }: { id: string; issues: ReturnType<typeof useIssues> }) {
  const { t } = useTranslation()
  const navigate = useLocaleNavigate()
  const snap = useSnapshot(state)
  const live = state.packages.find((p) => p.id === id)
  const view = snap.packages.find((p) => p.id === id)
  const [cloneSrc, setCloneSrc] = useState("")
  if (!live || !view) return null

  const shifting = view.legs.some((l) => l.role === "transitional")
  const canAdd = availableRoles(live).length > 0
  const ownIds = new Set<string>([id, ...view.legs.map((l) => l.id)])
  const own = issues.filter((i) => ownIds.has(i.entityId))
  const gateErrors = own.filter((i) => i.level === "error")
  const left = snap.season.quota_total - allocated(state)

  // The agreed pricing bounds of this tier, straight from the requirements.
  const bounds = snap.requirements.find(
    (r) =>
      r.status === "agreed" &&
      r.kind === "pricing" &&
      (r.params as { tier?: string } | null)?.tier === view.tier,
  )?.params as { min_sar?: number | null; max_sar?: number | null } | undefined
  const outOfBounds =
    view.initial_price_sar > 0 &&
    Boolean(
      (bounds?.min_sar != null && view.initial_price_sar < bounds.min_sar) ||
        (bounds?.max_sar != null && view.initial_price_sar > bounds.max_sar),
    )

  const hotelOptions = snap.hotels.map((h) => ({
    value: h.id,
    label: `${localName(h)} — ${cityShortLabel(h.city)}`,
  }))
  const mixSum = view.room_mix["2"] + view.room_mix["3"] + view.room_mix["4"]

  // Swap with whichever leg already holds the target role — a package never
  // has two first residences. Shared by the table and the mobile cards.
  const setLegRole = (leg: (typeof live.legs)[number], next: (typeof leg)["role"]) => {
    const other = live.legs.find((l) => l.role === next && l.id !== leg.id)
    if (other) other.role = leg.role
    leg.role = next
  }

  return (
    <>
      {/* ── ١ الهوية والتسعير ── */}
      <Card
        title={t("graph.package_no", { no: view.package_no })}
        description={`التصنيف في نسك: ${displayCategory({
          tier: view.tier,
          is_shifting: shifting,
          variant_suffix: view.variant_suffix,
        })}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`/packages/${duplicatePackage(id)}`)}>
              <Copy className="size-3.5" />
              {t("تكرار")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                removePackage(id)
                navigate("/packages")
              }}
            >
              <Trash2 className="size-3.5" />
              {t("حذف")}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Field label={t("رقم الباقة")}>
            <Input value={view.package_no} onChange={(e) => (live.package_no = e.target.value)} />
          </Field>
          <Field label={t("الاسم (إنجليزي)")} className="col-span-2 lg:col-span-1">
            <Input dir="ltr" value={view.name_en} onChange={(e) => (live.name_en = e.target.value)} />
          </Field>
          <Field label={t("الفئة")}>
            <SelectField
              allowEmpty={false}
              value={view.tier}
              options={tierOptions()}
              onChange={(v) => (live.tier = v as DraftPackage["tier"])}
            />
          </Field>
          <Field label={t("لاحقة التصنيف")}>
            <Input
              dir="ltr"
              placeholder="—"
              value={view.variant_suffix}
              onChange={(e) => (live.variant_suffix = e.target.value)}
            />
          </Field>
          <Field
            label={t("السعر الابتدائي (ر.س)")}
            hint={
              bounds
                ? t("حدود {tier} المعتمدة: {min} – {max}", { tier: tierLabel(view.tier), min: arNum(bounds.min_sar ?? 0), max: bounds.max_sar != null ? arNum(bounds.max_sar) : "—" })
                : "لا حدود سعرية معتمدة لهذه الفئة بعد."
            }
            error={outOfBounds ? "خارج الحدود المعتمدة للفئة." : undefined}
          >
            <MaskedPriceInput
              value={view.initial_price_sar}
              onChange={(e) => (live.initial_price_sar = Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </Card>

      {/* ── ٢ السعة والتوزيع ── */}
      <Card title={t("السعة وتوزيع الغرف")}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Field
            label={t("السعة (حاج)")}
            hint={
              left > 0
                ? t("المتبقي غير الموزَّع من الحصة: {n}.", { n: arNum(left) })
                : "الحصة موزَّعة بالكامل."
            }
          >
            {/* Joined input-group, Base UI NumberField-style: one shared
                height, the input drops its shared edge (no -ms-px overlap),
                only the outer corners are rounded, and the focused input
                lifts above the button so its ring is never clipped. */}
            <div className="flex">
              {/* Physical sides on purpose: NumInput pins dir="ltr", which
                  flips its logical s/e against the RTL row it sits in — the
                  joined edge is its physical LEFT here, always. */}
              <NumInput
                className="relative rounded-l-none border-l-0 focus-visible:z-10"
                value={view.capacity}
                onChange={(e) => (live.capacity = Number(e.target.value) || 0)}
              />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-s-none bg-clip-padding"
                disabled={left <= 0}
                onClick={() => takeRemaining(id)}
                title={t("إسناد المتبقي من الحصة إلى هذه الباقة")}
              >
                إسناد المتبقي{left > 0 && ` (${arNum(left)})`}
              </Button>
            </div>
          </Field>
          <Field
            label={t("توزيع الغرف (حاج)")}
            hint={
              mixSum === 0
                ? "لم يُحدَّد التوزيع بعد."
                : mixSum === view.capacity
                  ? t("الموزَّع {n} — مطابق للسعة.", { n: arNum(mixSum) })
                  : mixSum < view.capacity ? t("الموزَّع {n} — ينقص {d}.", { n: arNum(mixSum), d: arNum(view.capacity - mixSum) }) : t("الموزَّع {n} — يزيد {d}.", { n: arNum(mixSum), d: arNum(mixSum - view.capacity) })
            }
          >
            <div className="grid grid-cols-3 gap-1.5">
              {/* A visible label per input — the placeholder disappears the
                  moment a value exists, leaving three anonymous numbers. */}
              {(["4", "3", "2"] as const).map((rt) => {
                const name = rt === "4" ? "رباعية" : rt === "3" ? "ثلاثية" : "ثنائية"
                return (
                  <label key={rt} className="block">
                    <span className="mb-0.5 block text-[10px] font-semibold text-foreground/60">
                      {name}
                    </span>
                    <NumInput
                      aria-label={name}
                      placeholder="0"
                      value={view.room_mix[rt] ? String(view.room_mix[rt]) : ""}
                      onChange={(e) => (live.room_mix[rt] = Math.max(0, Number(e.target.value) || 0))}
                    />
                  </label>
                )
              })}
            </div>
          </Field>
        </div>
      </Card>

      {/* ── ٣ الإقامات ── */}
      <Card
        title={t("الإقامات")}
        description={t("graph.legs_summary", { legs: view.legs.length, nights: packageNights(live) })}
        actions={
          <>
            <SelectField
              className="w-44"
              placeholder={t("نسخ مسار باقة…")}
              value={cloneSrc}
              options={snap.packages
                .filter((p) => p.id !== id && p.legs.length > 0)
                .map((p) => ({ value: p.id, label: t("باقة {no} — {name}", { no: p.package_no, name: p.name_en || t("بدون اسم") }) }))}
              onChange={(v) => {
                if (v) cloneChainFrom(id, v)
                setCloneSrc("")
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!canAdd}
              title={canAdd ? undefined : "كل الأدوار مستخدمة (أول، ثانٍ، انتقالي)"}
              onClick={() => addLeg(id)}
            >
              <Plus className="size-3.5" />
              {t("إضافة")}
            </Button>
          </>
        }
        bodyClassName="p-0"
      >
        {view.legs.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
            {t("لا توجد إقامات.")}
          </p>
        ) : (
          <>
          {/* Phone: a card per leg. The table needs 42rem and showed 3 of its
              6 columns on a 390px viewport with no hint the rest existed. */}
          <ul className="divide-y divide-surface-line sm:hidden">
            {orderedLegs(live).map((leg, i) => {
              const nights = legNights(leg)
              return (
                <li key={leg.id} className="space-y-2 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-center text-[11px] font-bold tabular-nums text-muted-foreground">
                      {arNum(i + 1)}
                    </span>
                    <SelectField
                      className="flex-1"
                      allowEmpty={false}
                      value={leg.role}
                      options={roleOptions()}
                      onChange={(v) => setLegRole(leg, v as typeof leg.role)}
                    />
                    <button
                      type="button"
                      aria-label={t("حذف الإقامة")}
                      onClick={() => removeLeg(leg.id)}
                      className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground/45 transition-colors hover:bg-[color:var(--brand-rose-soft)] hover:text-[color:var(--brand-rose-deep)]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <SelectField
                    allowEmpty={false}
                    value={leg.hotelId}
                    options={hotelOptions}
                    onChange={(v) => (leg.hotelId = v)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label={t("البداية")}>
                      <DatePicker
                        value={leg.starts_on}
                        onChange={(iso) => retimeLeg(leg.id, iso, addDays(iso, Math.max(1, nights)))}
                      />
                    </Field>
                    <Field label={t("الليالي")}>
                      <NumInput
                        value={nights}
                        onChange={(e) => {
                          const n = Math.max(1, Number(e.target.value) || 1)
                          retimeLeg(leg.id, leg.starts_on, addDays(leg.starts_on, n))
                        }}
                      />
                    </Field>
                  </div>
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {t("النهاية")} <span dir="ltr">{leg.ends_on}</span>
                  </p>
                </li>
              )
            })}
          </ul>
          <Table className="min-w-[42rem]" containerClassName="hidden sm:block">
            <TableHeader>
              <TableRow className="border-t-0 bg-surface-sunken">
                <TableHead className={cn(TH, "w-10")}>#</TableHead>
                <TableHead className={cn(TH, "w-36")}>{t("الدور")}</TableHead>
                <TableHead className={TH}>{t("الفندق")}</TableHead>
                <TableHead className={cn(TH, "w-36")}>{t("البداية")}</TableHead>
                <TableHead className={cn(TH, "w-20")}>{t("الليالي")}</TableHead>
                <TableHead className={cn(TH, "w-28")}>{t("النهاية")}</TableHead>
                <TableHead className={cn(TH, "w-10")} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedLegs(live).map((leg, i) => {
                const nights = legNights(leg)
                return (
                  <TableRow key={leg.id}>
                    <TableCell className="px-2.5 text-[11px] tabular-nums text-muted-foreground">
                      {arNum(i + 1)}
                    </TableCell>
                    <TableCell>
                      <SelectField
                        className={cellCls}
                        allowEmpty={false}
                        value={leg.role}
                        options={roleOptions()}
                        onChange={(v) => setLegRole(leg, v as typeof leg.role)}
                      />
                    </TableCell>
                    <TableCell>
                      <SelectField
                        className={cellCls}
                        allowEmpty={false}
                        value={leg.hotelId}
                        options={hotelOptions}
                        onChange={(v) => (leg.hotelId = v)}
                      />
                    </TableCell>
                    <TableCell>
                      <DatePicker
                        className={cellCls}
                        value={leg.starts_on}
                        onChange={(iso) => retimeLeg(leg.id, iso, addDays(iso, Math.max(1, nights)))}
                      />
                    </TableCell>
                    <TableCell>
                      <NumInput
                        className={cellCls}
                        value={nights}
                        onChange={(e) => {
                          const n = Math.max(1, Number(e.target.value) || 1)
                          retimeLeg(leg.id, leg.starts_on, addDays(leg.starts_on, n))
                        }}
                      />
                    </TableCell>
                    <TableCell className="px-2.5 text-[11px] tabular-nums text-muted-foreground" dir="ltr">
                      {leg.ends_on}
                    </TableCell>
                    <TableCell className="px-1">
                      <button
                        type="button"
                        aria-label={t("حذف الإقامة")}
                        onClick={() => removeLeg(leg.id)}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground/45 transition-colors hover:bg-[color:var(--brand-rose-soft)] hover:text-[color:var(--brand-rose-deep)]"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </>
        )}
      </Card>

      {/* ── ٤ الموارد ── */}
      <Card
        title={t("الموارد — العقود والمقاعد")}
        description={t("عقود السكن ومقاعد الطيران المخصصة لهذه الباقة.")}
      >
        <PackageResources pkg={live} />
      </Card>

      {/* ── ٥ الجاهزية والنشر ── */}
      <Card
        title={t("الجاهزية والنشر")}
        description={t("حالة النشر في نسك ومتطلبات اكتمال المحتوى.")}
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Field label={t("حالة النشر في نسك")}>
            <SelectField
              allowEmpty={false}
              value={view.publish_status}
              options={publishStatusOptions()}
              onChange={(v) => (live.publish_status = v as DraftPackage["publish_status"])}
            />
          </Field>
          <Field label={t("حالة البيع")}>
            <SelectField
              allowEmpty={false}
              value={view.sale_status}
              options={saleStatusOptions()}
              onChange={(v) => (live.sale_status = v as DraftPackage["sale_status"])}
            />
          </Field>
          <div className="col-span-2 space-y-1.5">
            {(
              [
                ["content_ready_ar", "الوصف العربي جاهز"],
                ["content_ready_en", "الوصف الإنجليزي جاهز"],
                ["hero_approved", "الصورة الرئيسية معتمدة"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-[12px] text-foreground/80">
                <Checkbox
                  checked={view[key]}
                  onCheckedChange={(c) => (live[key] = Boolean(c))}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        {gateErrors.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-surface-line pt-3">
            {gateErrors.slice(0, 6).map((i, idx) => (
              <p
                key={`${i.code}-${idx}`}
                className="flex gap-2 rounded-lg bg-[color:var(--brand-rose-soft)] px-2.5 py-1.5 text-[11px] leading-snug text-[color:var(--brand-rose-deep)]"
              >
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>{i.message}</span>
              </p>
            ))}
          </div>
        )}
        {gateErrors.length === 0 && (
          <Note tone="brand">{t("لا أخطاء تمنع رفع هذه الباقة.")}</Note>
        )}
      </Card>
    </>
  )
}
