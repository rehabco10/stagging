import type { DataConnector, MetaConnector } from "./connectors"

/**
 * IndexedDB as a persistence connector — one database, one `kv` object store,
 * stamps beside data under a `meta:` prefix. Deliberately tiny: no schema
 * versioning games, no index tricks. If it ever needs to get clever, that is
 * the moment to reevaluate Synclets' browser connector instead.
 */
export class IdbConnector implements DataConnector, MetaConnector {
  private db: Promise<IDBDatabase>

  constructor(name = "hajj-package-wizard") {
    this.db = new Promise((resolve, reject) => {
      const req = indexedDB.open(name, 1)
      req.onupgradeneeded = () => req.result.createObjectStore("kv")
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  private async tx<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.db
    return new Promise<T>((resolve, reject) => {
      const req = op(db.transaction("kv", mode).objectStore("kv"))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  async load(key: string) {
    return this.tx("readonly", (s) => s.get(key)) as Promise<unknown | undefined>
  }
  async save(key: string, value: unknown) {
    await this.tx("readwrite", (s) => s.put(value, key))
  }
  async remove(key: string) {
    await this.tx("readwrite", (s) => s.delete(key))
  }
  async keys(prefix: string) {
    const all = (await this.tx("readonly", (s) => s.getAllKeys())) as string[]
    return all.filter((k) => typeof k === "string" && k.startsWith(prefix))
  }

  async getStamp(key: string) {
    return (await this.load(`meta:${key}`)) as string | undefined
  }
  async setStamp(key: string, stamp: string) {
    await this.save(`meta:${key}`, stamp)
  }
}
