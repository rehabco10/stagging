/**
 * Audit of the seeded season's findings for misinterpretation risk.
 *
 * Hypothesis 1 — end-date convention: legs treat `ends_on` as checkout
 * (exclusive). If the raw ContractEndDate means "last night" (inclusive),
 * every contract is one night shorter in our model than in reality, and
 * last-night "overbooked"/"gap" findings are artifacts.
 *
 * Hypothesis 2 — double-charge on overlap: the per-contract checks charge a
 * package's FULL demand to every bound contract covering a night. Two bound
 * contracts overlapping on the same hotel (Haram's 16–21 and 18–21 exist in
 * the raw data) would each be charged the whole demand — combined supply is
 * fine, but each looks short.
 */
const fs = require("fs")
const path = require("path")
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed-final.json"), "utf8"))

const DAY = 86_400_000
const ms = (d) => Date.parse(`${d}T00:00:00Z`)
const iso = (t) => new Date(t).toISOString().slice(0, 10)
const beds = (c) => c.lines.reduce((t, l) => t + l.rooms * Number(l.room_type), 0)
const typeBeds = (c, rt) =>
  c.lines.filter((l) => l.room_type === rt).reduce((t, l) => t + l.rooms * Number(rt), 0)

const contractById = new Map(seed.contracts.map((c) => [c.id, c]))

/* ── 1. end-date convention evidence ── */
console.log("== 1. contract end-date vs bound stays' checkout ==")
const diffs = {}
for (const p of seed.packages) {
  for (const cid of p.contractIds) {
    const c = contractById.get(cid)
    const legs = p.legs.filter((l) => l.hotelId === c.hotelId)
    if (!legs.length) continue
    const checkout = legs.map((l) => l.ends_on).sort().slice(-1)[0]
    // only stays that END at/near the contract end are informative
    const d = Math.round((ms(checkout) - ms(c.ends_on)) / DAY)
    if (d >= -1 && d <= 2) diffs[d] = (diffs[d] ?? 0) + 1
  }
}
console.log("checkout minus contract-end (days) for near-aligned pairs:", diffs)
// Measured on the real data: 0 dominates (37 of 39) — ContractEndDate is a
// checkout date, exactly the model's [starts_on, ends_on) convention. A
// +1-dominant histogram would have meant inclusive ends instead.

/* ── 2. overlapping same-hotel bound contracts ── */
console.log("\n== 2. overlap double-charge ==")
let overlapPairs = 0
for (const p of seed.packages) {
  const byHotel = {}
  for (const cid of p.contractIds) {
    const c = contractById.get(cid)
    ;(byHotel[c.hotelId] ??= []).push(c)
  }
  for (const list of Object.values(byHotel)) {
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        if (ms(a.starts_on) < ms(b.ends_on) && ms(b.starts_on) < ms(a.ends_on)) overlapPairs++
      }
  }
}
console.log(`bound same-hotel overlapping contract pairs: ${overlapPairs}`)

/* ── 3. recompute per-contract findings under corrected semantics ── */
// corrected = (a) inclusive contract end (+1 night), (b) demand split across
// the package's bound contracts covering the night, proportional to beds.
function recompute({ inclusiveEnd, split }) {
  const out = { contract: new Map(), type: new Map() }
  for (const p of seed.packages) {
    if (!(p.capacity > 0)) continue
    const bound = p.contractIds.map((id) => contractById.get(id))
    const mixTotal = p.room_mix["2"] + p.room_mix["3"] + p.room_mix["4"]
    for (const leg of p.legs) {
      const covering = (night) =>
        bound.filter(
          (c) =>
            c.hotelId === leg.hotelId &&
            night >= ms(c.starts_on) &&
            night < ms(c.ends_on) + (inclusiveEnd ? DAY : 0),
        )
      for (let night = ms(leg.starts_on); night < ms(leg.ends_on); night += DAY) {
        const cs = covering(night)
        if (!cs.length) continue
        const totalBeds = cs.reduce((t, c) => t + beds(c), 0) || 1
        for (const c of cs) {
          const share = split ? beds(c) / totalBeds : 1
          const key = `${c.id}|${night}`
          out.contract.set(key, (out.contract.get(key) ?? 0) + p.capacity * share)
          if (mixTotal > 0 && c.city !== "shifting") {
            for (const rt of ["2", "3", "4"]) {
              const tb = cs.reduce((t, x) => t + typeBeds(x, rt), 0) || 1
              const tshare = split ? typeBeds(c, rt) / tb : 1
              const tkey = `${c.id}|${rt}|${night}`
              out.type.set(tkey, (out.type.get(tkey) ?? 0) + p.room_mix[rt] * tshare)
            }
          }
        }
      }
    }
  }
  // aggregate worst shortfall per contract / per contract+type
  const short = { contract: new Map(), type: new Map() }
  for (const [key, load] of out.contract) {
    const [cid] = key.split("|")
    const c = contractById.get(cid)
    const s = Math.round(load) - beds(c)
    if (s > 0) short.contract.set(cid, Math.max(short.contract.get(cid) ?? 0, s))
  }
  for (const [key, load] of out.type) {
    const [cid, rt] = key.split("|")
    const c = contractById.get(cid)
    const s = Math.round(load) - typeBeds(c, rt)
    if (s > 0) short.type.set(`${cid}|${rt}`, Math.max(short.type.get(`${cid}|${rt}`) ?? 0, s))
  }
  return short
}

for (const variant of [
  { name: "current (exclusive end, full charge)", inclusiveEnd: false, split: false },
  { name: "inclusive end only", inclusiveEnd: true, split: false },
  { name: "split only", inclusiveEnd: false, split: true },
  { name: "inclusive end + split", inclusiveEnd: true, split: true },
]) {
  const s = recompute(variant)
  console.log(`\n-- ${variant.name}: contract-over=${s.contract.size} type-over=${s.type.size}`)
  for (const [cid, v] of s.contract) {
    const c = contractById.get(cid)
    console.log(`   over ${c.contract_no} (${c.hotelId}): peak ${v}`)
  }
  for (const [k, v] of s.type) {
    const [cid, rt] = k.split("|")
    const c = contractById.get(cid)
    console.log(`   type ${c.contract_no} (${c.hotelId}) rt=${rt}: peak ${v}`)
  }
}

/* ── 4. the 4 hotel-level overbooked findings under inclusive end ── */
console.log("\n== 4. hotel-level overbooked, exclusive vs inclusive contract end ==")
for (const mode of [false, true]) {
  const shortByHotel = new Map()
  const hotels = [...new Set(seed.packages.flatMap((p) => p.legs.map((l) => l.hotelId)))]
  for (const h of hotels) {
    const demand = []
    for (const p of seed.packages) {
      if (!(p.capacity > 0)) continue
      for (const leg of p.legs) if (leg.hotelId === h) demand.push({ s: ms(leg.starts_on), e: ms(leg.ends_on), a: p.capacity })
    }
    const supply = seed.contracts
      .filter((c) => c.hotelId === h && c.status === "signed")
      .map((c) => ({ s: ms(c.starts_on), e: ms(c.ends_on) + (mode ? DAY : 0), a: beds(c) }))
    if (!demand.length) continue
    const lo = Math.min(...demand.map((d) => d.s))
    const hi = Math.max(...demand.map((d) => d.e))
    for (let night = lo; night < hi; night += DAY) {
      const need = demand.filter((d) => night >= d.s && night < d.e).reduce((t, d) => t + d.a, 0)
      if (!need) continue
      const cov = supply.filter((s) => night >= s.s && night < s.e)
      if (!cov.length) continue
      const have = cov.reduce((t, s) => t + s.a, 0)
      if (need > have)
        shortByHotel.set(h, Math.max(shortByHotel.get(h) ?? 0, need - have))
    }
  }
  console.log(`  ${mode ? "inclusive" : "exclusive"} end:`, Object.fromEntries(shortByHotel))
}
