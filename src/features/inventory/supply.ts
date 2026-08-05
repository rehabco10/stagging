import type { DraftContract, DraftState } from "@/store/season"
import { contractBeds } from "@/store/season"
import type { Issue } from "@/lib/validation"

/**
 * Pure supply-vs-demand derivations for the inventory UI — the same span
 * arithmetic the validator sweeps with, exposed as data so the pages can
 * draw meters and timelines without re-deriving the rules.
 */

export const DAY_MS = 86_400_000
export const dayMs = (d: string) => Date.parse(`${d.slice(0, 10)}T00:00:00Z`)
export const dayIso = (t: number) => new Date(t).toISOString().slice(0, 10)

interface Span {
  s: number
  e: number
  a: number
}

export interface NightPoint {
  night: number
  demand: number
  supply: number
}

const demandSpans = (hotelId: string, s: DraftState): Span[] => {
  const out: Span[] = []
  for (const p of s.packages) {
    if (!(p.capacity > 0)) continue
    for (const l of p.legs) {
      if (l.hotelId !== hotelId) continue
      out.push({ s: dayMs(l.starts_on), e: dayMs(l.ends_on), a: p.capacity })
    }
  }
  return out
}

const supplySpans = (hotelId: string, s: DraftState): Span[] =>
  s.contracts
    .filter((c) => c.hotelId === hotelId && c.status === "signed")
    .map((c) => ({ s: dayMs(c.starts_on), e: dayMs(c.ends_on), a: contractBeds(c) }))

/** Night-by-night demand and signed supply for one hotel. Empty when idle. */
export function hotelNightly(hotelId: string, s: DraftState): NightPoint[] {
  const demand = demandSpans(hotelId, s)
  const supply = supplySpans(hotelId, s)
  const all = [...demand, ...supply]
  if (!all.length) return []
  const lo = Math.min(...all.map((x) => x.s))
  const hi = Math.max(...all.map((x) => x.e))
  const out: NightPoint[] = []
  for (let night = lo; night < hi && out.length < 200; night += DAY_MS) {
    out.push({
      night,
      demand: demand.filter((x) => night >= x.s && night < x.e).reduce((t, x) => t + x.a, 0),
      supply: supply.filter((x) => night >= x.s && night < x.e).reduce((t, x) => t + x.a, 0),
    })
  }
  return out
}

export interface HotelSummary {
  contracts: number
  signedContracts: number
  /** Most beds any single night holds under signed contract. */
  peakSupply: number
  /** Most pilgrims any single night asks of the hotel (planned capacity). */
  peakDemand: number
}

export function hotelSummary(hotelId: string, s: DraftState): HotelSummary {
  const contracts = s.contracts.filter((c) => c.hotelId === hotelId)
  const nightly = hotelNightly(hotelId, s)
  return {
    contracts: contracts.length,
    signedContracts: contracts.filter((c) => c.status === "signed").length,
    peakSupply: nightly.reduce((t, p) => Math.max(t, p.supply), 0),
    peakDemand: nightly.reduce((t, p) => Math.max(t, p.demand), 0),
  }
}

/** Validation issues that concern one hotel: its supply findings + its contracts'. */
export function hotelIssues(hotelId: string, contracts: readonly DraftContract[], issues: Issue[]) {
  const cids = new Set(contracts.filter((c) => c.hotelId === hotelId).map((c) => c.id))
  const mine = issues.filter(
    (i) =>
      (i.scope === "inventory" && i.entityId === hotelId) ||
      (i.scope === "contract" && cids.has(i.entityId)),
  )
  return {
    errors: mine.filter((i) => i.level === "error").length,
    warnings: mine.filter((i) => i.level === "warning").length,
  }
}

/** Issues attached to a carrier's blocks (block-scoped findings only). */
export function carrierIssues(blockIds: Set<string>, issues: Issue[]) {
  const mine = issues.filter((i) => i.scope === "inventory" && blockIds.has(i.entityId))
  return {
    errors: mine.filter((i) => i.level === "error").length,
    warnings: mine.filter((i) => i.level === "warning").length,
  }
}
