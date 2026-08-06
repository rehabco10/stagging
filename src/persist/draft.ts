import { proxy, snapshot, subscribe } from "valtio"

import { createClock, newDeviceId } from "@/lib/hlc"
import { state } from "@/store/season"
import { IdbConnector } from "./idb"

/**
 * Draft persistence (docs/architecture-plan.md P2): the valtio session state
 * mirrors itself into IndexedDB on every change, and boot restores it —
 * refresh no longer wipes the season. The seed remains the fallback whenever
 * there is no draft (or the draft's shape version moved on).
 *
 * Every save carries an HLC stamp + device id — the raw material any future
 * merge needs, whatever engine ends up doing the merging (§6 of the plan).
 */

const KEY = "draft/season"
/** Bump when DraftState's shape changes incompatibly — old drafts are ignored. */
const DRAFT_VERSION = 1

interface DraftRecord {
  version: number
  savedAt: string
  stamp: string
  data: Record<string, unknown>
}

export const draftStatus = proxy<{
  /** ISO time of the last successful save; null until the first one. */
  savedAt: string | null
  /** Whether boot restored a draft (vs opening on the seed). */
  source: "seed" | "draft"
  available: boolean
}>({ savedAt: null, source: "seed", available: false })

let connector: IdbConnector | null = null

function deviceId(): string {
  const KEY_ID = "hpw-device"
  let id = localStorage.getItem(KEY_ID)
  if (!id) {
    id = newDeviceId()
    localStorage.setItem(KEY_ID, id)
  }
  return id
}

/** Restore any saved draft, then start mirroring changes. Call once at boot. */
export async function initDraftPersistence(): Promise<void> {
  try {
    connector = new IdbConnector()
    const saved = (await connector.load(KEY)) as DraftRecord | undefined
    if (saved && saved.version === DRAFT_VERSION && saved.data) {
      // Top-level assignment is enough: DraftState is plain data all the way
      // down, and replacing each slice keeps the proxy identity the UI holds.
      for (const [k, v] of Object.entries(saved.data)) {
        ;(state as unknown as Record<string, unknown>)[k] = v
      }
      draftStatus.source = "draft"
      draftStatus.savedAt = saved.savedAt
      draftStatus.available = true
    }
  } catch {
    // IndexedDB unavailable (private mode, quotas): the app still works
    // memory-only, exactly as before this layer existed.
    connector = null
  }
  if (!connector) return

  const clock = createClock(deviceId())
  let timer: ReturnType<typeof setTimeout> | undefined
  const save = async () => {
    const record: DraftRecord = {
      version: DRAFT_VERSION,
      savedAt: new Date().toISOString(),
      stamp: clock.tick(),
      data: snapshot(state) as unknown as Record<string, unknown>,
    }
    try {
      await connector!.save(KEY, record)
      await connector!.setStamp(KEY, record.stamp)
      draftStatus.savedAt = record.savedAt
      draftStatus.available = true
    } catch {
      /* a failed save must never break editing */
    }
  }
  subscribe(state, () => {
    clearTimeout(timer)
    timer = setTimeout(save, 400)
  })
}

/** Drop the draft and reopen on the seed. */
export async function discardDraft(): Promise<void> {
  try {
    await connector?.remove(KEY)
    await connector?.remove(`meta:${KEY}`)
  } finally {
    location.reload()
  }
}
