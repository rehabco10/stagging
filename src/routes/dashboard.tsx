// Every internal link goes through the locale-aware Link, or an English
// session would land back on the Arabic route.
import { useTranslation } from "react-i18next"
import { LocaleLink as Link } from "@/i18n/LocaleProvider"
import { useSnapshot } from "valtio"
import {
  ArrowLeft,
  Building2,
  CircleCheck,
  ClipboardList,
  Network,
  Plane,
  ShieldCheck,
  Table2,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { Card, Note, PageShell, Stat } from "@/components/PageShell"
import { allocated, confirmedSeats, peakSignedBeds, state, type DraftState } from "@/store/season"
import { useIssues } from "@/store/use-issues"
import { cn, arNum } from "@/lib/utils"

/**
 * The landing page: where the season stands, at a glance. Every number is
 * derived live from the same store the editors write to — nothing cached, so
 * this page can never disagree with the canvas or the grid.
 *
 * Layout is a bento mosaic on a 12-column grid. Auto-placement fills rows
 * right-to-left (the document is RTL): hero progress (7) beside the stat
 * block (5), then sections (7) beside the issues feed (5). On narrow screens
 * everything stacks in source order, which is also priority order.
 */
export function DashboardPage() {
  const { t } = useTranslation()
  const snap = useSnapshot(state)
  const issues = useIssues()

  const errors = issues.filter((i) => i.level === "error").length
  const warnings = issues.length - errors
  const quota = snap.season.quota_total
  const used = allocated(state)
  const left = quota - used
  const pkgs = snap.packages.length
  const withLegs = snap.packages.filter((p) => p.legs.length > 0).length
  const agreed = snap.requirements.filter((r) => r.status === "agreed").length

  // Supply side, read through the snapshot so contract edits re-render here.
  const s = snap as unknown as DraftState
  const signedBeds = peakSignedBeds(s)
  const arrivalSeats = confirmedSeats("arrival", s)

  const std = snap.packages
    .filter((p) => p.tier === "standard")
    .reduce((t, p) => t + p.capacity, 0)
  const stdPct = used > 0 ? (std / used) * 100 : 0
  const premPct = used > 0 ? 100 - stdPct : 0

  const usedPct = quota > 0 ? Math.min(100, (used / quota) * 100) : 0
  const over = left < 0

  // Errors lead — they are what the reader needs to act on.
  const preview = [...issues]
    .sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1))
    .slice(0, 5)

  return (
    <PageShell
      title={t("page.dashboard")}
      description={t("page.dashboard_desc", {
        hijri: String(snap.season.year_hijri),
        gregorian: String(snap.season.year_gregorian),
      })}
    >
      <div className="grid items-start gap-4 lg:grid-cols-12">
        {/* ── hero: quota progress + tier mix ─────────────────────── */}
        <Card
          className="lg:col-span-7"
          title="تقدّم توزيع الحصة"
          description="مجموع سعات الباقات مقابل الحصة المعتمدة."
        >
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                over ? "bg-[color:var(--brand-rose)]" : "bg-[color:var(--brand-teal)]",
              )}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>
              موزَّع <b className="font-semibold text-foreground">{arNum(used)}</b> من{" "}
              {arNum(quota)}
            </span>
            <span className={cn("font-semibold", over && "text-[color:var(--brand-rose-deep)]")}>
              {usedPct.toFixed(1)}%
            </span>
          </div>

          {pkgs > 0 && (
            <div className="mt-4 space-y-3 border-t border-surface-line pt-3">
              <MixBar label="الأساسية" pct={stdPct} boundLabel="حد أدنى 60%" ok={stdPct >= 60} />
              <MixBar
                label="الفاخرة والمميزة"
                pct={premPct}
                boundLabel="حد أعلى 40%"
                ok={premPct <= 40}
              />
            </div>
          )}
        </Card>

        {/* ── stat tiles + readiness ──────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-5">
          <Stat value={arNum(quota)} label="الحصة المعتمدة (حاج)" />
          <Stat value={arNum(used)} label="موزَّع على الباقات" />
          <Stat
            value={left === 0 ? "مكتمل" : arNum(Math.abs(left))}
            label={left === 0 ? "الحصة مستوفاة" : over ? "تجاوز الحصة" : "متبقٍ للتوزيع"}
            tone={left === 0 ? "good" : over ? "bad" : "neutral"}
          />
          <Stat value={arNum(pkgs)} label={`باقة · ${arNum(withLegs)} لها إقامات`} />
          <Stat
            value={arNum(signedBeds)}
            label="سرير متعاقد عليه (ذروة الليلة)"
            tone={signedBeds >= quota ? "good" : "neutral"}
          />
          <Stat
            value={arNum(arrivalSeats)}
            label="مقعد وصول مؤكَّد"
            tone={arrivalSeats >= quota ? "good" : "neutral"}
          />

          {/* Readiness is a door, not just a number — it opens the validation page. */}
          <Link
            to="/validation"
            className={cn(
              "col-span-2 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-[var(--elev-1)] transition-[filter] hover:brightness-98",
              errors === 0
                ? "border-[color:var(--brand-green)]/30 bg-[color:var(--brand-green-soft)]"
                : "border-[color:var(--brand-rose)]/30 bg-[color:var(--brand-rose-soft)]",
            )}
          >
            {errors === 0 ? (
              <CircleCheck className="size-8 shrink-0 text-[color:var(--brand-green-deep)]" />
            ) : (
              <TriangleAlert className="size-8 shrink-0 text-[color:var(--brand-rose-deep)]" />
            )}
            <span className="min-w-0">
              <span
                className={cn(
                  "block text-[13px] font-bold",
                  errors === 0
                    ? "text-[color:var(--brand-green-deep)]"
                    : "text-[color:var(--brand-rose-deep)]",
                )}
              >
                {errors === 0 ? "لا أخطاء تمنع الرفع" : `${arNum(errors)} خطأ يمنع الرفع`}
              </span>
              <span
                className={cn(
                  "block text-[10px] tabular-nums",
                  errors === 0
                    ? "text-[color:var(--brand-green-deep)]/80"
                    : "text-[color:var(--brand-rose-deep)]/80",
                )}
              >
                {warnings === 0 ? "لا تنبيهات" : `${arNum(warnings)} تنبيه`} · افتح التحقق والرفع
              </span>
            </span>
            <ArrowLeft className="ms-auto size-4 shrink-0 text-muted-foreground" />
          </Link>
        </div>

        {/* ── sections ────────────────────────────────────────────── */}
        <Card className="lg:col-span-7" title="الأقسام" bodyClassName="p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SectionTile
              to="/canvas"
              icon={Network}
              title="تكوين الباقات — المخطط"
              sub={pkgs === 0 ? "لا باقات بعد" : `${arNum(pkgs)} باقة على اللوحة`}
            />
            <SectionTile
              to="/packages"
              icon={Table2}
              title="جدول الباقات"
              sub="بيانات الباقات في جداول قابلة للتحرير"
            />
            <SectionTile
              to="/requirements"
              icon={ClipboardList}
              title="الاجتماعات والمتطلبات"
              sub={`${arNum(agreed)} متطلب معتمد من ${arNum(snap.requirements.length)}`}
            />
            <SectionTile
              to="/hotels"
              icon={Building2}
              title="الفنادق والمخيمات"
              sub={`${arNum(snap.hotels.length)} فندق · ${arNum(snap.contracts.length)} عقد سكن`}
            />
            <SectionTile
              to="/flights"
              icon={Plane}
              title="مقاعد الطيران"
              sub={
                snap.flightBlocks.length === 0
                  ? "لا كتل مقاعد بعد"
                  : `${arNum(snap.flightBlocks.length)} كتلة · ${arNum(arrivalSeats)} مقعد وصول مؤكَّد`
              }
            />
          </div>
        </Card>

        {/* ── issues feed / getting-started ───────────────────────── */}
        <div className="lg:col-span-5">
          {pkgs === 0 ? (
            <Note tone="brand">
              لا توجد باقات — تُنشأ من{" "}
              <Link to="/canvas" className="font-semibold underline underline-offset-2">
                المخطط
              </Link>{" "}
              أو من{" "}
              <Link to="/packages" className="font-semibold underline underline-offset-2">
                جدول الباقات
              </Link>
              .
            </Note>
          ) : preview.length > 0 ? (
            <Card
              title="أحدث الملاحظات"
              actions={
                <Link
                  to="/validation"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[color:var(--brand-teal-deep)] hover:underline"
                >
                  عرض الكل ({arNum(issues.length)})
                  <ArrowLeft className="size-3" />
                </Link>
              }
              bodyClassName="p-3"
            >
              <ul className="space-y-1.5">
                {preview.map((i, idx) => (
                  <li
                    key={`${i.code}-${i.entityId}-${idx}`}
                    className={cn(
                      "flex gap-2 rounded-lg px-2.5 py-2 text-[11px] leading-snug",
                      i.level === "error"
                        ? "bg-[color:var(--brand-rose-soft)] text-[color:var(--brand-rose-deep)]"
                        : "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold-deep)]",
                    )}
                  >
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                    <span>{i.message}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Note tone="brand" icon={<ShieldCheck className="size-3.5" />}>
              لا ملاحظات — الموسم مطابق للضوابط.
            </Note>
          )}
        </div>
      </div>
    </PageShell>
  )
}

function MixBar({
  label,
  pct,
  boundLabel,
  ok,
}: {
  label: string
  pct: number
  boundLabel: string
  ok: boolean
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums">
          <b
            className={cn(
              "font-semibold",
              ok ? "text-foreground" : "text-[color:var(--brand-rose-deep)]",
            )}
          >
            {pct.toFixed(1)}%
          </b>{" "}
          <span className="text-muted-foreground">· {boundLabel}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className={cn(
            "h-full rounded-full",
            ok ? "bg-[color:var(--brand-green)]" : "bg-[color:var(--brand-rose)]",
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

function SectionTile({
  to,
  icon: Icon,
  title,
  sub,
}: {
  to: string
  icon: LucideIcon
  title: string
  sub: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border border-surface-line bg-surface-raised px-3 py-2.5 transition-colors hover:bg-surface-sunken"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[color:var(--brand-teal-soft)] text-[color:var(--brand-teal-deep)]">
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-foreground">{title}</span>
        <span className="block truncate text-[10px] tabular-nums text-muted-foreground">{sub}</span>
      </span>
    </Link>
  )
}
