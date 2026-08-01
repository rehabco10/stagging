/**
 * Pin / drag reconciliation tests.
 *
 * Run: node --test test/pin.test.mjs   (after `pnpm build:test`, see below)
 * These import the compiled output of src/features/graph/layout.ts.
 */
import test from "node:test"
import assert from "node:assert/strict"

import {
  ROOT_ID,
  computeLayout,
  reconcileNodes,
  structureKeyOf,
  worldExtent,
} from "../.tmp-test/features/graph/layout.js"

const SIZES = {
  root: { w: 300, h: 132 },
  pkg: { w: 260, h: 96 },
  leg: { w: 210, h: 110 },
}

const TREE = {
  packages: [
    { id: "pkg_a", legIds: ["leg_a1", "leg_a2"] },
    { id: "pkg_b", legIds: ["leg_b1"] },
  ],
  pinned: {},
}

const nodesFrom = (layout) => [...layout].map(([id, position]) => ({ id, position }))

test("layout places every node in the tree", () => {
  const layout = computeLayout(TREE, SIZES)
  for (const id of [ROOT_ID, "pkg_a", "pkg_b", "leg_a1", "leg_a2", "leg_b1"]) {
    assert.ok(layout.has(id), `missing ${id}`)
  }
  // Root above packages, packages above legs.
  assert.ok(layout.get(ROOT_ID).y < layout.get("pkg_a").y)
  assert.ok(layout.get("pkg_a").y < layout.get("leg_a1").y)
})

test("a pinned node takes exactly the pinned coordinates", () => {
  const pinned = { pkg_a: { x: 999, y: 111 } }
  const layout = computeLayout({ ...TREE, pinned }, SIZES)
  assert.deepEqual(layout.get("pkg_a"), { x: 999, y: 111 })
})

test("pinning one node does not move the others", () => {
  const before = computeLayout(TREE, SIZES)
  const after = computeLayout({ ...TREE, pinned: { pkg_a: { x: 999, y: 111 } } }, SIZES)
  for (const id of [ROOT_ID, "pkg_b", "leg_a1", "leg_a2", "leg_b1"]) {
    assert.deepEqual(after.get(id), before.get(id), `${id} moved`)
  }
})

test("structureKey changes on pin, and again on unpin", () => {
  const base = structureKeyOf(TREE)
  const pinnedKey = structureKeyOf({ ...TREE, pinned: { pkg_a: { x: 5, y: 6 } } })
  assert.notEqual(base, pinnedKey)
  assert.equal(structureKeyOf({ ...TREE, pinned: {} }), base)
})

test("structureKey is stable regardless of pin insertion order", () => {
  const a = structureKeyOf({ ...TREE, pinned: { pkg_a: { x: 1, y: 2 }, pkg_b: { x: 3, y: 4 } } })
  const b = structureKeyOf({ ...TREE, pinned: { pkg_b: { x: 3, y: 4 }, pkg_a: { x: 1, y: 2 } } })
  assert.equal(a, b)
})

/* ── the reconciliation rules ───────────────────────────────────── */

test("mid-drag: an unchanged layout never overwrites the live position", () => {
  const layout = computeLayout(TREE, SIZES)
  const initial = nodesFrom(layout)

  // React Flow has moved the card to follow the pointer.
  const dragging = initial.map((n) =>
    n.id === "pkg_a" ? { ...n, position: { x: 640, y: 480 }, dragging: true } : n,
  )

  // A re-render happens (selection changed, say) — layout is identical.
  const merged = reconcileNodes(dragging, nodesFrom(layout))
  const a = merged.find((n) => n.id === "pkg_a")
  assert.deepEqual(a.position, { x: 640, y: 480 }, "drag position was clobbered")
  assert.equal(a.dragging, true, "dragging flag lost")
})

test("drop: the node stays exactly where it was released", () => {
  const layout = computeLayout(TREE, SIZES)
  const initial = nodesFrom(layout)

  const DROP = { x: 640, y: 480 }
  const dragging = initial.map((n) => (n.id === "pkg_a" ? { ...n, position: DROP } : n))

  // onNodeDragStop -> pinNode(DROP) -> layout recomputes with the pin.
  const pinnedLayout = computeLayout({ ...TREE, pinned: { pkg_a: DROP } }, SIZES)
  const merged = reconcileNodes(dragging, nodesFrom(pinnedLayout))

  assert.deepEqual(
    merged.find((n) => n.id === "pkg_a").position,
    DROP,
    "node jumped after drop",
  )
})

test("unpin returns the node to its solver position", () => {
  const DROP = { x: 640, y: 480 }
  const pinnedLayout = computeLayout({ ...TREE, pinned: { pkg_a: DROP } }, SIZES)
  const pinnedNodes = nodesFrom(pinnedLayout)

  const freeLayout = computeLayout(TREE, SIZES)
  const merged = reconcileNodes(pinnedNodes, nodesFrom(freeLayout))

  assert.deepEqual(
    merged.find((n) => n.id === "pkg_a").position,
    freeLayout.get("pkg_a"),
    "unpinned node did not return to the auto layout",
  )
})

test("re-pinning to a new spot adopts the new spot", () => {
  const FIRST = { x: 640, y: 480 }
  const SECOND = { x: 200, y: 900 }
  const firstLayout = computeLayout({ ...TREE, pinned: { pkg_a: FIRST } }, SIZES)
  const nodes = nodesFrom(firstLayout)

  const dragged = nodes.map((n) => (n.id === "pkg_a" ? { ...n, position: SECOND } : n))
  const secondLayout = computeLayout({ ...TREE, pinned: { pkg_a: SECOND } }, SIZES)
  const merged = reconcileNodes(dragged, nodesFrom(secondLayout))

  assert.deepEqual(merged.find((n) => n.id === "pkg_a").position, SECOND)
})

test("adding a package moves unpinned siblings but leaves a pinned one alone", () => {
  const DROP = { x: 640, y: 480 }
  const withPin = { ...TREE, pinned: { pkg_a: DROP } }
  const before = computeLayout(withPin, SIZES)
  const nodes = nodesFrom(before)

  const grown = {
    packages: [...TREE.packages, { id: "pkg_c", legIds: [] }],
    pinned: { pkg_a: DROP },
  }
  const after = computeLayout(grown, SIZES)
  const merged = reconcileNodes(nodes, nodesFrom(after))

  assert.deepEqual(
    merged.find((n) => n.id === "pkg_a").position,
    DROP,
    "pinned node drifted when a sibling was added",
  )
  // pkg_b genuinely re-ranks to make room, and must follow the solver.
  const b = merged.find((n) => n.id === "pkg_b")
  assert.deepEqual(b.position, after.get("pkg_b"))
})

test("a newly added node appears at its layout position", () => {
  const nodes = nodesFrom(computeLayout(TREE, SIZES))
  const grown = { packages: [...TREE.packages, { id: "pkg_c", legIds: [] }], pinned: {} }
  const after = computeLayout(grown, SIZES)
  const merged = reconcileNodes(nodes, nodesFrom(after))
  const c = merged.find((n) => n.id === "pkg_c")
  assert.ok(c, "new node missing")
  assert.deepEqual(c.position, after.get("pkg_c"))
})

test("removing a package drops it from the reconciled list", () => {
  const nodes = nodesFrom(computeLayout(TREE, SIZES))
  const shrunk = { packages: [{ id: "pkg_b", legIds: ["leg_b1"] }], pinned: {} }
  const merged = reconcileNodes(nodes, nodesFrom(computeLayout(shrunk, SIZES)))
  assert.equal(merged.find((n) => n.id === "pkg_a"), undefined)
  assert.equal(merged.find((n) => n.id === "leg_a1"), undefined)
})

/* ── new nodes must never stack ─────────────────────────────────── */

test("empty packages are spread apart, never stacked", () => {
  for (const n of [2, 3, 5, 9]) {
    const packages = Array.from({ length: n }, (_, i) => ({ id: `pkg_${i}`, legIds: [] }))
    const layout = computeLayout({ packages, pinned: {} }, SIZES)
    const xs = packages.map((p) => layout.get(p.id).x)
    assert.equal(new Set(xs).size, n, `${n} packages share an x position`)
    // Every pair must clear the card width, or the cards overlap on screen.
    const sorted = [...xs].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i] - sorted[i - 1] >= SIZES.pkg.w, `packages overlap at index ${i}`)
    }
  }
})

test("adding packages one at a time never leaves two at the same spot", () => {
  // Reproduces the stacking bug: each add reconciles against the previous
  // frame, exactly as the canvas does, with no intermediate settle step.
  let packages = []
  let nodes = nodesFrom(computeLayout({ packages, pinned: {} }, SIZES))

  for (let i = 0; i < 6; i++) {
    packages = [...packages, { id: `pkg_${i}`, legIds: [] }]
    const layout = computeLayout({ packages, pinned: {} }, SIZES)
    nodes = reconcileNodes(nodes, nodesFrom(layout))

    const pkgNodes = nodes.filter((n) => n.id !== ROOT_ID)
    const seen = new Set(pkgNodes.map((n) => `${n.position.x},${n.position.y}`))
    assert.equal(seen.size, pkgNodes.length, `two cards stacked after adding pkg_${i}`)
    // And each one sits where the solver put it.
    for (const n of pkgNodes) assert.deepEqual(n.position, layout.get(n.id))
  }
})

test("a new leg lands at its slot, not on its package", () => {
  const before = computeLayout(TREE, SIZES)
  const nodes = nodesFrom(before)
  const grown = {
    packages: [{ id: "pkg_a", legIds: ["leg_a1", "leg_a2", "leg_a3"] }, TREE.packages[1]],
    pinned: {},
  }
  const after = computeLayout(grown, SIZES)
  const merged = reconcileNodes(nodes, nodesFrom(after))
  const leg = merged.find((n) => n.id === "leg_a3")
  assert.deepEqual(leg.position, after.get("leg_a3"))
  assert.notDeepEqual(leg.position, after.get("pkg_a"), "leg stacked on its package")
})

test("world extent grows to contain a node pinned far outside the tree", () => {
  const FAR = { x: 5000, y: 4000 }
  const layout = computeLayout({ ...TREE, pinned: { pkg_a: FAR } }, SIZES)
  const [, [maxX, maxY]] = worldExtent(nodesFrom(layout), () => SIZES.pkg, 400)
  assert.ok(maxX >= FAR.x + SIZES.pkg.w, "extent does not reach the pinned node")
  assert.ok(maxY >= FAR.y + SIZES.pkg.h)
})
