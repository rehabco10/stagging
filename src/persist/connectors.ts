/**
 * The persistence triad (docs/architecture-plan.md §6): interfaces shaped
 * deliberately on Synclets' composition — data connector + meta connector +
 * transport — so that if tinyplex/synclets matures past pre-alpha, adopting
 * it is a swap behind these interfaces, not a rewrite. Until then our own
 * implementations fill the slots: Memory (tests), IndexedDB (drafts, in
 * ./idb.ts), PocketBase (P3, to come).
 *
 * Pure module — no browser APIs — so engine tests run it in plain node.
 */

export interface DataConnector {
  load(key: string): Promise<unknown | undefined>
  save(key: string, value: unknown): Promise<void>
  remove(key: string): Promise<void>
  keys(prefix: string): Promise<string[]>
}

/** Sync metadata (HLC stamps, per-key) — may live in a different backend. */
export interface MetaConnector {
  getStamp(key: string): Promise<string | undefined>
  setStamp(key: string, stamp: string): Promise<void>
}

export interface Transport {
  publish(topic: string, message: unknown): void
  subscribe(topic: string, cb: (message: unknown) => void): () => void
}

export interface Synclet {
  data: DataConnector
  meta: MetaConnector
  transport: Transport
  /** Save + stamp + announce in one motion. */
  put(key: string, value: unknown, stamp: string): Promise<void>
}

export function createSynclet(parts: {
  data: DataConnector
  meta: MetaConnector
  transport: Transport
}): Synclet {
  return {
    ...parts,
    async put(key, value, stamp) {
      await parts.data.save(key, value)
      await parts.meta.setStamp(key, stamp)
      parts.transport.publish("put", { key, stamp })
    },
  }
}

/* ── in-memory implementations (tests, and the app's pre-P2 default) ── */

export class MemoryConnector implements DataConnector, MetaConnector {
  private map = new Map<string, unknown>()
  private stamps = new Map<string, string>()

  async load(key: string) {
    return this.map.get(key)
  }
  async save(key: string, value: unknown) {
    this.map.set(key, value)
  }
  async remove(key: string) {
    this.map.delete(key)
  }
  async keys(prefix: string) {
    return [...this.map.keys()].filter((k) => k.startsWith(prefix))
  }
  async getStamp(key: string) {
    return this.stamps.get(key)
  }
  async setStamp(key: string, stamp: string) {
    this.stamps.set(key, stamp)
  }
}

export class MemoryTransport implements Transport {
  private topics = new Map<string, Set<(message: unknown) => void>>()

  publish(topic: string, message: unknown) {
    for (const cb of this.topics.get(topic) ?? []) cb(message)
  }
  subscribe(topic: string, cb: (message: unknown) => void) {
    const set = this.topics.get(topic) ?? new Set()
    set.add(cb)
    this.topics.set(topic, set)
    return () => set.delete(cb)
  }
}
