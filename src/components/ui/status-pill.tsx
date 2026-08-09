import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

/**
 * The shared status vocabulary of the supply entities. One component so a
 * «موقَّع» pill on a contract and a «مؤكَّد» pill on a seat block read as the
 * same state (committed supply), and the tentative/dead states likewise.
 *
 * The label comes from the catalog under `status.*` — deliberately its own key
 * space rather than reusing contract/flight status: those are the *editor's*
 * option lists, while this is the shared badge shown across entity kinds.
 */
const STYLE: Record<string, string> = {
  // committed
  signed: "bg-[color:var(--brand-green-soft)] text-[color:var(--brand-green-deep)]",
  confirmed: "bg-[color:var(--brand-green-soft)] text-[color:var(--brand-green-deep)]",
  // tentative
  proposed: "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold-deep)]",
  // dead
  cancelled: "bg-muted text-muted-foreground",
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const { t } = useTranslation()
  const known = status in STYLE
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        known ? STYLE[status] : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {known ? t(`status.${status}`) : status}
    </span>
  )
}
