import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { Card } from "@/components/PageShell"
import { ResponsivePanel } from "@/components/ui/responsive-panel"
import { SIDE_PANEL_QUERY, useMediaQuery } from "@/hooks/use-media-query"

/**
 * The standing balance header of the workroom pages, in two postures:
 *
 * - Wide / landscape: the full meters card, always visible — the steering
 *   instrument the pages were designed around.
 * - Narrow portrait: the card cost ~360px of an 844px phone and repeated
 *   unchanged in every scroll position, so it collapses to a one-line strip
 *   (the verdict, not the instruments) that opens the full meters in the
 *   bottom drawer on demand.
 *
 * The strip content is the page's own summary line — this component only owns
 * the collapse/drawer mechanics, not what a "balance" means per page.
 */
export function BalanceStrip({
  title,
  summary,
  children,
}: {
  /** Drawer heading on mobile, e.g. «ميزان الحصة». */
  title: string
  /** The one-line collapsed strip content (mobile only). */
  summary: React.ReactNode
  /** The full meters block, hosted by the card (wide) or the drawer (narrow). */
  children: React.ReactNode
}) {
  const wide = useMediaQuery(SIDE_PANEL_QUERY)
  const [open, setOpen] = useState(false)

  if (wide) return <Card bodyClassName="p-4">{children}</Card>

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex w-full items-center gap-2 rounded-xl border border-surface-line bg-surface-raised px-3 py-2 text-start shadow-[var(--elev-1)] transition-colors hover:bg-surface-sunken/60"
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">{summary}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground/60" />
      </button>
      <ResponsivePanel open={open} onOpenChange={setOpen} title={title}>
        <div className="space-y-4 p-4">{children}</div>
      </ResponsivePanel>
    </>
  )
}
