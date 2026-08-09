import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import { useSnapshot } from "valtio"
import {
  BedDouble,
  ChevronDown,
  CircleCheck,
  FileText,
  Info,
  Package,
  Plane,
  Plus,
  Route,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Database,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react"

import {
  addRequirement,
  allocated,
  removeRequirement,
  state,
  togglePrices,
  unpinAll,
} from "@/store/season"
import { discardDraft, draftStatus } from "@/persist/draft"
import { useLocale, useSwitchLocale } from "@/i18n/LocaleProvider"
import { LOCALES, type Locale } from "@/i18n/locale"
import { formats } from "@/lib/intl"
import { ISSUE_CATEGORY_ORDER, issueCategoryLabel } from "@/lib/options"
import { categoryOf, type Issue, type IssueCategory } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
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
        تُطبَّق المتطلبات المعتمدة تلقائيًا على التحقق قبل الرفع؛ وتتطلب الملاحظات
        النصية تأكيدًا يدويًا.
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

const CATEGORY_ICON: Record<IssueCategory, LucideIcon> = {
  governance: ShieldCheck,
  itinerary: Route,
  package: Package,
  contracts: FileText,
  housing: BedDouble,
  flights: Plane,
  other: Info,
}

/** Consecutive-preserving buckets of (level, code) — the unit of folding. */
function clusterIssues(items: Issue[]): Issue[][] {
  const order: string[] = []
  const map = new Map<string, Issue[]>()
  for (const i of items) {
    const k = `${i.level}|${i.code}`
    if (!map.has(k)) {
      map.set(k, [])
      order.push(k)
    }
    map.get(k)!.push(i)
  }
  return order.map((k) => map.get(k)!)
}

/**
 * The folded row's label. Messages are «entity: finding» — when every finding
 * in the bucket is the same sentence (the content-gate case), that sentence IS
 * the label; when the tails differ (per-contract numbers), stay generic and
 * let the expanded list carry the detail.
 */
function clusterLabel(bucket: Issue[]) {
  const tail = (m: string) => m.replace(/^[^:]{0,60}:\s*/, "")
  const first = tail(bucket[0].message)
  return bucket.every((i) => tail(i.message) === first) ? first : "بنود من النوع نفسه — افتح للتفاصيل"
}

const pillCls = (level: Issue["level"]) =>
  cn(
    "flex w-full gap-2 rounded-lg px-2.5 py-2 text-start text-[11px] leading-snug",
    level === "error"
      ? "bg-[color:var(--brand-rose-soft)] text-[color:var(--brand-rose-deep)]"
      : "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold-deep)]",
  )

function IssuePill({ issue }: { issue: Issue }) {
  // Only issues that can open something are interactive — and those render
  // as real buttons, so keyboard users get them too.
  const clickable = issue.scope === "package" || issue.scope === "leg"
  const cls = cn(pillCls(issue.level), clickable && "cursor-pointer transition-[filter] hover:brightness-97")
  const content = (
    <>
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
      <span>{issue.message}</span>
    </>
  )
  return clickable ? (
    <button type="button" onClick={() => (state.selectedId = issue.entityId)} className={cls}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  )
}

export function ValidationPanel() {
  const snap = useSnapshot(state)
  const issues = useIssues()
  const errors = issues.filter((i) => i.level === "error")
  const warnings = issues.filter((i) => i.level === "warning")
  const ready = errors.length === 0 && snap.packages.length > 0

  // Grouped by category, errors before warnings within each group — the
  // reader works one area at a time, not one interleaved list of 37 rows.
  const groups = ISSUE_CATEGORY_ORDER.map((cat) => {
    const items = issues
      .filter((i) => categoryOf(i.code) === cat)
      .sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1))
    return { cat, items, errorCount: items.filter((i) => i.level === "error").length }
  }).filter((g) => g.items.length > 0)

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

      <Card title="النتائج" description="مصنَّفة حسب المجال؛ اختيار البند يفتح الباقة المعنية.">
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-[color:var(--brand-green-soft)] px-3 py-2.5 text-[11px] text-[color:var(--brand-green-deep)]">
            <CircleCheck className="size-4 shrink-0" />
            <span className="font-medium">
              {ready ? "الموسم مطابق للضوابط. جاهز للرفع إلى نسك." : "لا توجد باقات بعد."}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(({ cat, items, errorCount }) => {
              const Icon = CATEGORY_ICON[cat]
              const warnCount = items.length - errorCount
              return (
                <section key={cat}>
                  <header className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-md",
                        errorCount > 0
                          ? "bg-[color:var(--brand-rose-soft)] text-[color:var(--brand-rose-deep)]"
                          : "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold-deep)]",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <h3 className="text-[12px] font-bold text-foreground">
                      {issueCategoryLabel(cat)}
                    </h3>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {errorCount > 0 && `${arNum(errorCount)} خطأ`}
                      {errorCount > 0 && warnCount > 0 && " · "}
                      {warnCount > 0 && `${arNum(warnCount)} تنبيه`}
                    </span>
                  </header>
                  {/* Two columns once there is width — the rows are one line
                      each, and a full-width column of short pills wasted half
                      the card. Runs of the same finding (same code and level,
                      e.g. 7 packages each missing the same content) fold into
                      one expandable row instead of a wall of near-identical
                      pills. */}
                  <ul className="mt-1.5 grid items-start gap-1.5 lg:grid-cols-2">
                    {clusterIssues(items).map((bucket, bi) =>
                      bucket.length < 4 ? (
                        <Fragment key={`${bucket[0].code}-${bi}`}>
                          {bucket.map((i, idx) => (
                            <li key={`${i.code}-${i.entityId}-${idx}`}>
                              <IssuePill issue={i} />
                            </li>
                          ))}
                        </Fragment>
                      ) : (
                        <li key={`${bucket[0].code}-${bi}`} className="lg:col-span-2">
                          <details className="group">
                            <summary
                              className={cn(
                                pillCls(bucket[0].level),
                                "cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden",
                              )}
                            >
                              <TriangleAlert className="size-3.5 shrink-0" />
                              <span className="min-w-0 flex-1 font-semibold">
                                {clusterLabel(bucket)}
                              </span>
                              <span className="shrink-0 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-bold tabular-nums">
                                {arNum(bucket.length)}
                              </span>
                              <ChevronDown className="size-3.5 shrink-0 transition-transform group-open:rotate-180" />
                            </summary>
                            <ul className="mt-1.5 space-y-1.5 border-s-2 border-surface-line ps-2.5">
                              {bucket.map((i, idx) => (
                                <li key={`${i.code}-${i.entityId}-${idx}`}>
                                  <IssuePill issue={i} />
                                </li>
                              ))}
                            </ul>
                          </details>
                        </li>
                      ),
                    )}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}

/* ── settings ───────────────────────────────────────────────────── */

function StorageStatus() {
  const draft = useSnapshot(draftStatus)
  const hasDraft = Boolean(draft.savedAt) || draft.source === "draft"
  return (
    <div className="space-y-2.5">
      {draft.available ? (
        <Note tone="brand" icon={<Database className="size-3.5" />}>
          تُحفظ المسودة تلقائيًا في المتصفح (IndexedDB)
          {draft.savedAt
            ? ` — آخر حفظ ${formats().time.format(new Date(draft.savedAt))}`
            : " — تُحفظ مع أول تعديل"}
          {draft.source === "draft" && "؛ فُتحت هذه الجلسة من مسودة سابقة"}.
        </Note>
      ) : (
        <Note tone="warn" icon={<Database className="size-3.5" />}>
          تعذّر الوصول إلى IndexedDB — البيانات في الذاكرة فقط لهذه الجلسة، وتحديث
          الصفحة يعيد بذرة 1447.
        </Note>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={!hasDraft}
        title="يحذف المسودة المحفوظة ويعيد فتح التطبيق على بذرة 1447"
        onClick={() => void discardDraft()}
      >
        تجاهل المسودة والعودة إلى بذرة 1447
      </Button>
    </div>
  )
}

/**
 * The language control — switching rewrites the URL prefix (`/` ⇄ `/en`) on
 * the current page, so the choice is shareable and the browser's own back
 * button undoes it. The first strings in the catalogs; the rest of the UI
 * follows in the extraction phase (docs/i18n-plan.md).
 */
function LanguageField() {
  const { t } = useTranslation()
  const locale = useLocale()
  const switchLocale = useSwitchLocale()
  return (
    <Field label={t("settings.language")} hint={t("settings.language_hint")}>
      <SelectField
        allowEmpty={false}
        value={locale}
        options={LOCALES.map((l) => ({ value: l, label: t(`settings.language_${l}`) }))}
        onChange={(v) => switchLocale(v as Locale)}
      />
    </Field>
  )
}

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
          <Field label="الحصة الإجمالية (حاج)" hint="يجب أن يساوي مجموع سعات الباقات الحصة الإجمالية. الرقم الحالي محمول من موسم 1447 حتى صدور اعتماد 1448.">
            <NumInput
              value={snap.season.quota_total}
              onChange={(e) => (state.season.quota_total = Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="بداية الموسم" hint="تُشتق منها التواريخ الافتراضية للإقامات والعقود والرحلات.">
            <DatePicker
              value={snap.season.starts_on}
              onChange={(iso) => (state.season.starts_on = iso)}
            />
          </Field>
          <Field label="نهاية الموسم">
            <DatePicker
              value={snap.season.ends_on}
              onChange={(iso) => (state.season.ends_on = iso)}
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
                ? "لا توجد عقد مثبَّتة."
                : `${arNum(Object.keys(snap.pinned).length)} عقدة تحتفظ بموضعها اليدوي.`}
            </div>
          </div>
        </div>
      </Card>

      <Card title="العرض" description="ما يظهر على الشاشة أثناء الاجتماعات.">
        <div className="space-y-3">
          <LanguageField />
          <label className="flex items-center gap-2 text-[12px] text-foreground/80">
            <Checkbox checked={snap.showPrices} onCheckedChange={() => togglePrices()} />
            إظهار الأسعار (محجوبة افتراضيًا «••••»)
          </label>
        </div>
      </Card>

      <Card title="التخزين والاتصال">
        <StorageStatus />
      </Card>
      </div>
    </div>
  )
}
