import { useMemo } from "react"
import { useSnapshot } from "valtio"

import { useLocale } from "@/i18n/LocaleProvider"
import { issuesFor, state } from "@/store/season"
import type { Issue } from "@/lib/validation"

/**
 * The single way to read validation results in a component.
 *
 * `issuesFor` walks the raw valtio proxy, which does **not** register as
 * property access for `useSnapshot`. A component that called it directly while
 * only touching, say, `snap.season.year_hijri` would render once with the right
 * count and then never update — the nav rail sat on a stale error badge while
 * the panel beside it showed the correct number.
 *
 * Reading every slice the validator actually depends on marks them as
 * tracked, so any change to them re-renders the caller.
 */
export function useIssues(): Issue[] {
  const snap = useSnapshot(state)
  const { packages, requirements, season, hotels, contracts, flightBlocks } = snap
  // Messages are rendered in the interface language (the validation bridge),
  // so a language switch must recompute them even though no data changed.
  const locale = useLocale()
  return useMemo(
    () => issuesFor(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [packages, requirements, season, hotels, contracts, flightBlocks, locale],
  )
}

export function useErrorCount(): number {
  const issues = useIssues()
  return useMemo(() => issues.filter((i) => i.level === "error").length, [issues])
}
