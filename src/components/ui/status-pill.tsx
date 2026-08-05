import { cn } from "@/lib/utils"

/**
 * The shared status vocabulary of the supply entities. One component so a
 * «موقَّع» pill on a contract and a «مؤكَّد» pill on a seat block read as the
 * same state (committed supply), and the tentative/dead states likewise.
 */
const STYLE: Record<string, { label: string; cls: string }> = {
  // committed
  signed: { label: "موقَّع", cls: "bg-[color:var(--brand-green-soft)] text-[color:var(--brand-green-deep)]" },
  confirmed: { label: "مؤكَّد", cls: "bg-[color:var(--brand-green-soft)] text-[color:var(--brand-green-deep)]" },
  // tentative
  proposed: { label: "مقترح", cls: "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold-deep)]" },
  // dead
  cancelled: { label: "ملغى", cls: "bg-muted text-muted-foreground" },
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const s = STYLE[status] ?? { label: status, cls: "bg-muted text-muted-foreground" }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        s.cls,
        className,
      )}
    >
      {s.label}
    </span>
  )
}
