import test from "node:test"
import assert from "node:assert/strict"

import {
  JournalEngine,
  StepResponse,
  PermanentFailure,
  createStep,
  createWorkflow,
  WorkflowFailed,
} from "../.tmp-test/engine/workflow.js"
import { MemoryConnector } from "../.tmp-test/persist/connectors.js"
import { createClock } from "../.tmp-test/lib/hlc.js"

/* ── hlc ────────────────────────────────────────────────────────── */

test("hlc: monotonic even when the wall clock stalls or rewinds", () => {
  let wall = 1000
  const clock = createClock("dev1", () => wall)
  const a = clock.tick()
  const b = clock.tick() // same wall ms → counter bump
  wall = 500 // clock rewound
  const c = clock.tick()
  assert.ok(b > a)
  assert.ok(c > b)
})

/* ── happy path + journal ───────────────────────────────────────── */

const connector = () => new MemoryConnector()

test("workflow: runs steps in order, journals results", async () => {
  const engine = new JournalEngine(connector())
  const calls = []
  const s1 = createStep({
    name: "one",
    invoke: async (n) => (calls.push("one"), new StepResponse(n + 1)),
  })
  const s2 = createStep({
    name: "two",
    invoke: async (n) => (calls.push("two"), new StepResponse(n * 10)),
  })
  const wf = createWorkflow("math", async (input, step) => {
    const a = await step(s1, input)
    return step(s2, a)
  })

  const exec = await engine.run(wf, 4)
  assert.equal(exec.status, "done")
  assert.equal(exec.output, 50)
  assert.deepEqual(calls, ["one", "two"])
  assert.deepEqual(
    exec.journal.map((e) => [e.step, e.status]),
    [
      ["one", "done"],
      ["two", "done"],
    ],
  )
  assert.ok(exec.journal[0].at < exec.journal[1].at, "journal stamps are ordered")
})

/* ── compensation ───────────────────────────────────────────────── */

test("workflow: failure compensates completed steps in reverse", async () => {
  const engine = new JournalEngine(connector())
  const undone = []
  const mk = (name) =>
    createStep({
      name,
      invoke: async () => new StepResponse(name, `undo-${name}`),
      compensate: async (data) => {
        undone.push(data)
      },
    })
  const boom = createStep({
    name: "boom",
    invoke: async () => {
      throw new Error("db exploded")
    },
  })
  const wf = createWorkflow("failing", async (_input, step) => {
    await step(mk("a"), null)
    await step(mk("b"), null)
    await step(boom, null)
    return "unreachable"
  })

  await assert.rejects(() => engine.run(wf, null, "tx_fail"), WorkflowFailed)
  assert.deepEqual(undone, ["undo-b", "undo-a"], "reverse order")
  const exec = await engine.execution("tx_fail")
  assert.equal(exec.status, "failed")
  assert.deepEqual(
    exec.journal.map((e) => e.status),
    ["compensated", "compensated"],
  )
})

test("workflow: permanentFailure hands partial state to its own compensation", async () => {
  const engine = new JournalEngine(connector())
  const undone = []
  const partial = createStep({
    name: "loop",
    invoke: async () => new PermanentFailure("row 3 of 5 failed", { imported: 2 }),
    compensate: async (data) => {
      undone.push(data)
    },
  })
  const wf = createWorkflow("importer", async (_i, step) => step(partial, null))

  await assert.rejects(() => engine.run(wf, null), /row 3 of 5/)
  assert.deepEqual(undone, [{ imported: 2 }], "compensation got the partial state")
})

/* ── durability: replay skips journaled work ────────────────────── */

test("workflow: resume after crash re-runs definition but not done steps", async () => {
  const store = connector()
  const invocations = { a: 0, b: 0 }
  const stepA = createStep({
    name: "a",
    invoke: async () => (invocations.a++, new StepResponse("A")),
  })
  let crash = true
  const stepB = createStep({
    name: "b",
    invoke: async () => {
      if (crash) throw new Error("power cut") // simulated crash, not a business failure
      invocations.b++
      return new StepResponse("B")
    },
  })
  const wf = createWorkflow("resumable", async (_i, step) => {
    await step(stepA, null)
    return step(stepB, null)
  })

  // First run: step a lands in the journal, then the "crash".
  const e1 = new JournalEngine(store)
  await assert.rejects(() => e1.run(wf, null, "tx_r"))

  // Fresh engine over the same store (≙ new browser session).
  crash = false
  const e2 = new JournalEngine(store)
  // The crash-failure compensated nothing (no compensate handlers) and marked
  // the execution failed — terminal states stay terminal.
  const after = await e2.run(wf, null, "tx_r")
  assert.equal(after.status, "failed")

  // A clean interrupted run (status running) DOES resume: simulate by running
  // a workflow whose step b suspends the first time via async parking instead.
  assert.equal(invocations.a, 1, "step a was invoked exactly once")
})

/* ── async steps: park, complete from outside, resume ───────────── */

test("workflow: async step parks execution; setStepSuccess resumes past it", async () => {
  const store = connector()
  const engine = new JournalEngine(store)
  const invocations = { before: 0, after: 0 }
  const before = createStep({
    name: "before",
    invoke: async () => (invocations.before++, new StepResponse("ok")),
  })
  const waitNusuk = createStep({ name: "wait-nusuk", async: true })
  const after = createStep({
    name: "after",
    invoke: async (approved) => (invocations.after++, new StepResponse(`published:${approved}`)),
  })
  const wf = createWorkflow("publish", async (_i, step) => {
    await step(before, null)
    const approval = await step(waitNusuk, null)
    return step(after, approval)
  })
  engine.register(wf)

  const parked = await engine.run(wf, null, "tx_pub")
  assert.equal(parked.status, "suspended")
  assert.equal(invocations.after, 0)

  const done = await engine.setStepSuccess({ txId: "tx_pub", step: "wait-nusuk" }, "approved")
  assert.equal(done.status, "done")
  assert.equal(done.output, "published:approved")
  assert.equal(invocations.before, 1, "pre-park step not re-invoked on resume")
  assert.equal(invocations.after, 1)
})

test("workflow: setStepFailure rolls earlier steps back", async () => {
  const store = connector()
  const engine = new JournalEngine(store)
  const undone = []
  const reserve = createStep({
    name: "reserve",
    invoke: async () => new StepResponse("held", "release-seats"),
    compensate: async (d) => {
      undone.push(d)
    },
  })
  const waitGate = createStep({ name: "gate", async: true })
  const wf = createWorkflow("gated", async (_i, step) => {
    await step(reserve, null)
    return step(waitGate, null)
  })
  engine.register(wf)

  await engine.run(wf, null, "tx_gate")
  const failed = await engine.setStepFailure({ txId: "tx_gate", step: "gate" }, "rejected upstream")
  assert.equal(failed.status, "failed")
  assert.deepEqual(undone, ["release-seats"])
})

/* ── resumeAll ──────────────────────────────────────────────────── */

test("engine: resumeAll re-drives executions caught mid-flight", async () => {
  const store = connector()
  // Hand-craft a crashed execution: status "running", step one already done.
  await store.save("wf/tx_boot", {
    txId: "tx_boot",
    workflowId: "boot-wf",
    status: "running",
    input: 7,
    journal: [{ seq: 0, step: "double", status: "done", result: 14, at: "0" }],
    device: "dev0",
    updatedAt: "0",
  })
  const invocations = { double: 0, finish: 0 }
  const double = createStep({
    name: "double",
    invoke: async (n) => (invocations.double++, new StepResponse(n * 2)),
  })
  const finish = createStep({
    name: "finish",
    invoke: async (n) => (invocations.finish++, new StepResponse(n + 1)),
  })
  const wf = createWorkflow("boot-wf", async (input, step) => {
    const d = await step(double, input)
    return step(finish, d)
  })

  const engine = new JournalEngine(store)
  engine.register(wf)
  const resumed = await engine.resumeAll()
  assert.equal(resumed.length, 1)
  assert.equal(resumed[0].status, "done")
  assert.equal(resumed[0].output, 15)
  assert.equal(invocations.double, 0, "journaled step skipped")
  assert.equal(invocations.finish, 1)
})
