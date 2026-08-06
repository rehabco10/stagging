/**
 * Hybrid-logical-clock-ish timestamps (docs/architecture-plan.md §6).
 *
 * Not a full HLC — there is no remote-clock merge yet because nothing merges
 * yet. What matters now is that every journal entry and draft save carries a
 * stamp that is (a) monotonic on this device even when the wall clock jumps
 * backwards, and (b) globally orderable as a plain string, so a future CRDT
 * merge (TinyBase-style LWW or our own) has the raw material it needs.
 *
 * Pure module — no browser APIs — so the engine tests run it in plain node.
 */

export interface HlcClock {
  /** Next stamp, strictly greater than every stamp this clock has issued. */
  tick(): string
}

/** `0000018f4c2a7b10.0003.k3x9q2` — sortable as a string. */
const format = (ts: number, count: number, device: string) =>
  `${ts.toString(16).padStart(16, "0")}.${count.toString(36).padStart(4, "0")}.${device}`

export function createClock(device: string, now: () => number = () => Date.now()): HlcClock {
  let lastTs = 0
  let count = 0
  return {
    tick() {
      const wall = now()
      if (wall > lastTs) {
        lastTs = wall
        count = 0
      } else {
        count++
      }
      return format(lastTs, count, device)
    },
  }
}

export function newDeviceId(): string {
  return Math.random().toString(36).slice(2, 8)
}
