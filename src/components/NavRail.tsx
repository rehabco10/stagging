import { useEffect, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useSnapshot } from "valtio"
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Network,
  Settings,
  ShieldCheck,
  Table2,
  type LucideIcon,
} from "lucide-react"

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { SIDE_PANEL_QUERY, useMediaQuery } from "@/hooks/use-media-query"
import { state } from "@/store/season"
import { useErrorCount } from "@/store/use-issues"
import { cn, arNum } from "@/lib/utils"

interface Item {
  to: string
  label: string
  icon: LucideIcon
  /** Show the blocking-error count on this item. */
  badge?: boolean
}

const ITEMS: Item[] = [
  { to: "/", label: "لوحة المعلومات", icon: LayoutDashboard },
  { to: "/canvas", label: "تكوين الباقات — المخطط", icon: Network },
  { to: "/packages", label: "جدول الباقات", icon: Table2 },
  { to: "/requirements", label: "الاجتماعات والمتطلبات", icon: ClipboardList },
  { to: "/hotels", label: "الفنادق والمخيمات", icon: Building2 },
  { to: "/validation", label: "التحقق والرفع", icon: ShieldCheck, badge: true },
  { to: "/settings", label: "الإعدادات", icon: Settings },
]

/**
 * The rail carries the brand: deep teal, the identity motif behind it, the
 * mark at the top. Everything else in the app is a light surface, so this is
 * the one element that says whose product this is — and it anchors the layout
 * on the start edge at every breakpoint.
 */
/**
 * Wide screens get the rail; narrow ones get a burger that opens the same
 * destinations as a drawer. A 64px rail on a 390px viewport is 16% of the
 * width permanently spent on navigation.
 */
export function Navigation() {
  const wide = useMediaQuery(SIDE_PANEL_QUERY)
  return wide ? <NavRail /> : <NavBurger />
}

export function NavRail() {
  const snap = useSnapshot(state)
  const errorCount = useErrorCount()

  return (
    <nav
      aria-label="الأقسام"
      className="relative z-20 flex w-16 shrink-0 flex-col items-center gap-1 overflow-hidden bg-surface-brand py-3 text-surface-brand-foreground shadow-[var(--elev-2)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "var(--brand-pattern)", backgroundSize: "300px" }}
      />

      {/* Solid white chip: the mark's teal/gold fills are drawn for a light
          ground and lost definition sitting directly on the dark rail. */}
      <div className="relative mb-2 grid size-10 place-items-center rounded-xl bg-white shadow-[var(--elev-1)] ring-1 ring-white/20">
        <img src={`${import.meta.env.BASE_URL}logo-icon.svg`} alt="إثراء الخير" className="size-7" />
      </div>

      <div className="relative flex flex-col items-center gap-1">
        {ITEMS.map((item, i) => (
          <div key={item.to} className="contents">
            {/* Groups: overview | the two editors | supporting data. */}
            {(i === 1 || i === 3) && <span className="my-1.5 h-px w-7 bg-white/15" />}
            <NavLink
              to={item.to}
              end={item.to === "/"}
              title={item.label}
              aria-label={item.label}
              className={({ isActive }) =>
                cn(
                  "group relative grid size-11 place-items-center rounded-xl transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  isActive
                    ? "bg-white text-[color:var(--brand-teal-deep)] shadow-[var(--elev-1)]"
                    : "text-white/65 hover:bg-white/12 hover:text-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active marker, inset so it stays within the rail rather
                      than spilling a gold sliver onto the page beside it. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute end-0 h-6 w-1 rounded-full bg-[color:var(--brand-gold)] transition-opacity",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <item.icon className="size-5" />
                  {item.badge && errorCount > 0 && (
                    <span
                      className="absolute -top-0.5 -end-0.5 min-w-4 rounded-full bg-[color:var(--brand-rose)] px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-[color:var(--surface-brand)] tabular-nums"
                      aria-label={`${errorCount} خطأ`}
                    >
                      {arNum(errorCount)}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </div>
        ))}
      </div>

      <div className="relative mt-auto flex flex-col items-center gap-0.5 text-white/45">
        <span className="text-[10px] font-semibold tabular-nums text-white/70">
          {String(snap.season.year_hijri)}
        </span>
        <span className="text-[9px] tabular-nums">{String(snap.season.year_gregorian)}</span>
      </div>
    </nav>
  )
}

/* ── narrow screens ─────────────────────────────────────────────── */

function NavBurger() {
  const snap = useSnapshot(state)
  const errorCount = useErrorCount()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // A route change means the user picked something — close behind them.
  useEffect(() => setOpen(false), [pathname])

  const current = ITEMS.find((i) => (i.to === "/" ? pathname === "/" : pathname.startsWith(i.to)))

  return (
    <>
      {/* A slim brand bar instead of a rail: mark, current section, burger. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-2 bg-surface-brand px-3 text-surface-brand-foreground shadow-[var(--elev-2)]">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white shadow-[var(--elev-1)]">
          <img src={`${import.meta.env.BASE_URL}logo-icon.svg`} alt="إثراء الخير" className="size-6" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
          {current?.label ?? "إثراء الخير"}
        </span>
        <button
          type="button"
          aria-label="فتح القائمة"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="relative grid size-9 shrink-0 place-items-center rounded-lg text-white/85 transition-colors hover:bg-white/12 hover:text-white"
        >
          <Menu className="size-5" />
          {errorCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 min-w-4 rounded-full bg-[color:var(--brand-rose)] px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-[color:var(--surface-brand)] tabular-nums">
              {arNum(errorCount)}
            </span>
          )}
        </button>
      </div>
      {/* Spacer so page content is not hidden behind the fixed bar. */}
      <div aria-hidden className="h-12 shrink-0" />

      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle swipeDirection="down">
        <DrawerContent className="bg-popover">
          <DrawerTitle className="border-b border-surface-line px-4 py-3 text-[13px] font-bold">
            الأقسام
            <span className="ms-2 text-[10px] font-normal text-muted-foreground tabular-nums">
              موسم {String(snap.season.year_hijri)}هـ
            </span>
          </DrawerTitle>
          <ul className="py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {ITEMS.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)
              return (
                <li key={item.to}>
                  <button
                    type="button"
                    onClick={() => navigate(item.to)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-start text-[13px] transition-colors",
                      active
                        ? "bg-[color:var(--brand-teal-soft)] font-semibold text-[color:var(--brand-teal-deep)]"
                        : "text-foreground hover:bg-surface-sunken",
                    )}
                  >
                    <item.icon className="size-4.5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && errorCount > 0 && (
                      <span className="rounded-full bg-[color:var(--brand-rose)] px-1.5 text-[10px] font-bold leading-5 text-white tabular-nums">
                        {arNum(errorCount)}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </DrawerContent>
      </Drawer>
    </>
  )
}
