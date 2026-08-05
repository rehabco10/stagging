import { useMemo } from "react"
import { useSnapshot } from "valtio"

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
  return useMemo(
    () => issuesFor(state),
    [packages, requirements, season, hotels, contracts, flightBlocks],
  )
}

export function useErrorCount(): number {
  const issues = useIssues()
  return useMemo(() => issues.filter((i) => i.level === "error").length, [issues])
}
