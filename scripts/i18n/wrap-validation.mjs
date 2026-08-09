/**
 * Converts every Arabic template literal in lib/validation.ts to an
 * `M("template with {p}", { p: expr })` call — the message-bridge form.
 * Interpolations are lifted to named params: a bare identifier keeps its
 * name; anything else becomes p0, p1… The Arabic output is byte-identical
 * because M's default formatter substitutes straight back.
 *
 * Also emits the distinct keys so en/validation.json can be filled.
 */
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/lib/validation.ts")
let src = await readFile(FILE, "utf8")

const AR = /[؀-ۿ]/
const keys = new Set()

/** Scan a template literal starting at `start` (the backtick). */
function scanTemplate(s, start) {
  let i = start + 1
  const parts = [] // {text} | {expr}
  let text = ""
  while (i < s.length) {
    const ch = s[i]
    if (ch === "`") return { end: i, parts: [...parts, { text }] }
    if (ch === "$" && s[i + 1] === "{") {
      parts.push({ text })
      text = ""
      let depth = 1
      let j = i + 2
      while (j < s.length && depth > 0) {
        if (s[j] === "{") depth++
        else if (s[j] === "}") depth--
        if (depth > 0) j++
      }
      parts.push({ expr: s.slice(i + 2, j) })
      i = j + 1
      continue
    }
    if (ch === "\\") {
      text += s[i] + s[i + 1]
      i += 2
      continue
    }
    text += ch
    i++
  }
  return null
}

let out = ""
let i = 0
let converted = 0
while (i < src.length) {
  const ch = src[i]
  if (ch === "`") {
    const tpl = scanTemplate(src, i)
    if (tpl) {
      const raw = src.slice(i, tpl.end + 1)
      if (AR.test(raw) && tpl.parts.some((p) => p.expr !== undefined)) {
        // Build key + params
        let key = ""
        const params = []
        const used = new Set()
        for (const p of tpl.parts) {
          if (p.expr === undefined) key += p.text ?? ""
          else {
            let name = /^[A-Za-z_][A-Za-z0-9_]*$/.test(p.expr.trim()) ? p.expr.trim() : `p${params.length}`
            while (used.has(name)) name = `${name}_`
            used.add(name)
            key += `{${name}}`
            params.push(`${name}: ${p.expr.trim()}`)
          }
        }
        keys.add(key)
        out += `M(${JSON.stringify(key)}, { ${params.join(", ")} })`
        converted++
        i = tpl.end + 1
        continue
      } else if (AR.test(raw)) {
        // Static Arabic template (no interpolation) — plain M() with the text.
        const key = tpl.parts.map((p) => p.text ?? "").join("")
        keys.add(key)
        out += `M(${JSON.stringify(key)})`
        converted++
        i = tpl.end + 1
        continue
      }
      out += raw
      i = tpl.end + 1
      continue
    }
  }
  out += ch
  i++
}

await writeFile(FILE, out, "utf8")
console.log(`converted ${converted} templates, ${keys.size} distinct keys`)
await writeFile(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "validation-keys.json"),
  JSON.stringify([...keys].sort(), null, 2),
  "utf8",
)
console.log("keys written to scripts/i18n/validation-keys.json")
