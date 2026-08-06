/**
 * JournalEngine — the durable workflow engine, journal flavor
 * (docs/architecture-plan.md §3): Medusa's step semantics (invoke +
 * compensate, StepResponse carrying compensation data, permanentFailure for
 * partial loops, async steps completed from outside via setStepSuccess) on top
 * of an append-only journal instead of a server.
 *
 * Durability model: every step outcome is persisted to the journal BEFORE
 * the workflow proceeds. Resuming after a crash/refresh re-runs the workflow
 * definition; the step runner returns journaled results for steps already
 * done, so `invoke` runs at-most-once per step. This is exactly Medusa's
 * idempotent-replay contract, minus their infrastructure. The VmEngine
 * (quickjs-wasi snapshots) is a later drop-in behind the same surface.
 *
 * Pure module — storage arrives through a narrow structural store interface
 * (MemoryConnector satisfies it; IdbConnector will too) — so the whole
 * engine is exercised by plain-node tests.
 */

import { createClock, newDeviceId, type HlcClock } from "../lib/hlc.js"

/* ── step surface (Medusa-shaped) ───────────────────────────────── */

export class StepResponse<O = unknown, C = unknown> {
  readonly result: O
  /** Whatever the compensation needs to undo this step. */
  readonly compensationData?: C
  constructor(result: O, compensationData?: C) {
    this.result = result
    this.compensationData = compensationData
  }
}

/** A step that failed midway but reports the partial state to compensate. */
export class PermanentFailure<C = unknown> {
  readonly message: string
  readonly compensationData?: C
  constructor(message: string, compensationData?: C) {
    this.message = message
    this.compensationData = compensationData
  }
}

export interface StepDef<I, O, C> {
  name: string
  /** Async steps park the workflow until setStepSuccess/-Failure arrives. */
  async?: boolean
  invoke?: (input: I) => Promise<StepResponse<O, C> | PermanentFailure<C>>
  compensate?: (data: C | undefined) => Promise<void>
}

export function createStep<I, O, C = unknown>(def: StepDef<I, O, C>): StepDef<I, O, C> {
  return def
}

export interface WorkflowDef<I, O> {
  id: string
  run: (input: I, step: StepRunner) => Promise<O>
}

export type StepRunner = <I2, O2, C>(def: StepDef<I2, O2, C>, input: I2) => Promise<O2>

export function createWorkflow<I, O>(id: string, run: WorkflowDef<I, O>["run"]): WorkflowDef<I, O> {
  return { id, run }
}

/* ── journal shapes ─────────────────────────────────────────────── */

export type StepStatus = "done" | "pending" | "failed" | "compensated"

export interface JournalEntry {
  seq: number
  step: string
  status: StepStatus
  result?: unknown
  compensationData?: unknown
  error?: string
  at: string // hlc stamp
}

export type ExecutionStatus = "running" | "suspended" | "done" | "failed"

export interface Execution<O = unknown> {
  txId: string
  workflowId: string
  status: ExecutionStatus
  input: unknown
  output?: O
  journal: JournalEntry[]
  device: string
  updatedAt: string
}

export interface IdempotencyKey {
  txId: string
  step: string
}

/** The narrow storage slice the engine needs (structural, connector-agnostic). */
export interface EngineStore {
  load(key: string): Promise<unknown | undefined>
  save(key: string, value: unknown): Promise<void>
  keys(prefix: string): Promise<string[]>
}

export class WorkflowFailed extends Error {
  readonly txId: string
  readonly step: string
  constructor(txId: string, step: string, message: string) {
    super(`workflow ${txId} failed at «${step}»: ${message}`)
    this.txId = txId
    this.step = step
  }
}

/** Internal control-flow signal — an async step parked the workflow. */
class Suspend extends Error {
  readonly step: string
  constructor(step: string) {
    super(`suspended at ${step}`)
    this.step = step
  }
}

export type ExecutionEvent = { txId: string; status: ExecutionStatus }

/* ── the engine ─────────────────────────────────────────────────── */

const KEY_PREFIX = "wf/"

export class JournalEngine {
  private registry = new Map<string, WorkflowDef<never, unknown>>()
  private listeners = new Map<string, Set<(e: ExecutionEvent) => void>>()
  private store: EngineStore
  private clock: HlcClock
  private device: string

  constructor(store: EngineStore, device: string = newDeviceId(), now?: () => number) {
    this.store = store
    this.device = device
    this.clock = createClock(device, now)
  }

  register<I, O>(wf: WorkflowDef<I, O>) {
    this.registry.set(wf.id, wf as WorkflowDef<never, unknown>)
    return wf
  }

  subscribe(txId: string, cb: (e: ExecutionEvent) => void): () => void {
    const set = this.listeners.get(txId) ?? new Set()
    set.add(cb)
    this.listeners.set(txId, set)
    return () => set.delete(cb)
  }

  private emit(exec: Execution) {
    for (const cb of this.listeners.get(exec.txId) ?? []) {
      cb({ txId: exec.txId, status: exec.status })
    }
  }

  private async persist(exec: Execution) {
    exec.updatedAt = this.clock.tick()
    await this.store.save(KEY_PREFIX + exec.txId, exec)
  }

  async execution(txId: string): Promise<Execution | undefined> {
    return (await this.store.load(KEY_PREFIX + txId)) as Execution | undefined
  }

  /**
   * Run (or resume) a workflow. Steps already journaled as done return their
   * stored result without re-invoking; the first un-journaled step runs live.
   */
  async run<I, O>(wf: WorkflowDef<I, O>, input: I, txId?: string): Promise<Execution<O>> {
    this.register(wf)
    const id = txId ?? `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const existing = await this.execution(id)
    const exec: Execution =
      existing ?? {
        txId: id,
        workflowId: wf.id,
        status: "running",
        input,
        journal: [],
        device: this.device,
        updatedAt: "",
      }
    if (exec.status === "done" || exec.status === "failed") return exec as Execution<O>
    exec.status = "running"
    await this.persist(exec)

    // Defs seen during (re)play — the compensation pass needs their handlers.
    const seen = new Map<string, StepDef<never, unknown, unknown>>()
    let seq = 0

    const stepRunner: StepRunner = async (def, stepInput) => {
      const mySeq = seq++
      seen.set(`${mySeq}:${def.name}`, def as StepDef<never, unknown, unknown>)
      const entry = exec.journal.find((e) => e.seq === mySeq && e.step === def.name)

      if (entry?.status === "done") return entry.result as never
      if (entry?.status === "failed") throw new WorkflowFailed(id, def.name, entry.error ?? "failed")

      if (def.async) {
        if (!entry) {
          exec.journal.push({ seq: mySeq, step: def.name, status: "pending", at: this.clock.tick() })
          await this.persist(exec)
        }
        // Journaled as pending (fresh or from a previous run): stay parked.
        throw new Suspend(def.name)
      }

      const out = await def.invoke!(stepInput as never)
      if (out instanceof PermanentFailure) {
        exec.journal.push({
          seq: mySeq,
          step: def.name,
          status: "failed",
          error: out.message,
          compensationData: out.compensationData,
          at: this.clock.tick(),
        })
        await this.persist(exec)
        throw new WorkflowFailed(id, def.name, out.message)
      }
      exec.journal.push({
        seq: mySeq,
        step: def.name,
        status: "done",
        result: out.result,
        compensationData: out.compensationData,
        at: this.clock.tick(),
      })
      await this.persist(exec)
      return out.result as never
    }

    try {
      const output = await wf.run(input, stepRunner)
      exec.status = "done"
      exec.output = output
      await this.persist(exec)
      this.emit(exec)
      return exec as Execution<O>
    } catch (e) {
      if (e instanceof Suspend) {
        exec.status = "suspended"
        await this.persist(exec)
        this.emit(exec)
        return exec as Execution<O>
      }
      await this.compensate(exec, seen)
      this.emit(exec)
      throw e instanceof WorkflowFailed ? e : new WorkflowFailed(id, "?", String(e))
    }
  }

  /** Undo journaled work in reverse order (failed step first, via its partial data). */
  private async compensate(exec: Execution, seen: Map<string, StepDef<never, unknown, unknown>>) {
    const undoable = exec.journal
      .filter((e) => e.status === "done" || e.status === "failed")
      .sort((a, b) => b.seq - a.seq)
    for (const entry of undoable) {
      const def = seen.get(`${entry.seq}:${entry.step}`)
      if (def?.compensate) {
        await def.compensate(entry.compensationData as never)
      }
      entry.status = "compensated"
      await this.persist(exec)
    }
    exec.status = "failed"
    await this.persist(exec)
  }

  /** Complete a parked async step from outside, then resume the workflow. */
  async setStepSuccess(key: IdempotencyKey, result: unknown): Promise<Execution> {
    const exec = await this.mustLoad(key)
    const entry = this.mustPending(exec, key)
    entry.status = "done"
    entry.result = result
    entry.at = this.clock.tick()
    await this.persist(exec)
    return this.resume(exec)
  }

  /** Fail a parked async step — resuming will roll earlier steps back. */
  async setStepFailure(key: IdempotencyKey, error: string): Promise<Execution> {
    const exec = await this.mustLoad(key)
    const entry = this.mustPending(exec, key)
    entry.status = "failed"
    entry.error = error
    entry.at = this.clock.tick()
    await this.persist(exec)
    return this.resume(exec).catch(() => this.execution(exec.txId) as Promise<Execution>)
  }

  /** Re-drive every interrupted execution (call once at app boot). */
  async resumeAll(): Promise<Execution[]> {
    const keys = await this.store.keys(KEY_PREFIX)
    const out: Execution[] = []
    for (const key of keys) {
      const exec = (await this.store.load(key)) as Execution
      // `running` means a crash mid-flight; `suspended` still waits its step.
      if (exec.status === "running") out.push(await this.resume(exec))
    }
    return out
  }

  private async resume(exec: Execution): Promise<Execution> {
    const wf = this.registry.get(exec.workflowId)
    if (!wf) throw new Error(`workflow «${exec.workflowId}» not registered — register before resume`)
    return this.run(wf as WorkflowDef<unknown, unknown>, exec.input, exec.txId)
  }

  private async mustLoad(key: IdempotencyKey): Promise<Execution> {
    const exec = await this.execution(key.txId)
    if (!exec) throw new Error(`no execution ${key.txId}`)
    return exec
  }

  private mustPending(exec: Execution, key: IdempotencyKey): JournalEntry {
    const entry = exec.journal.find((e) => e.step === key.step && e.status === "pending")
    if (!entry) throw new Error(`no pending step «${key.step}» in ${key.txId}`)
    return entry
  }
}
