/**
 * The i18n message inventory (docs/i18n-plan.md §1) — runs the four ast-grep
 * rules and folds their matches into the catalog draft the extraction codemod
 * will start from.
 *
 *   node scripts/i18n/inventory.mjs   →  scripts/i18n/inventory.json
 *
 * Output: distinct message texts with occurrence counts, kinds, and the files
 * they live in. Template matches keep their `${…}` sites verbatim — each one
 * is an ICU-parameter candidate; a trailing report lists messages containing
 * digits-producing calls (arNum) as plural candidates.
 */
import { execFileSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..", "..")

const raw = execFileSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "ast-grep", "scan", "-c", "scripts/i18n/sgconfig.yml", "--json", "src"],
  { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, shell: process.platform === "win32" },
)
const matches = JSON.parse(raw)

const messages = new Map()
for (const m of matches) {
  const text = m.text.replace(/\s+/g, " ").trim()
  if (!text) continue
  const entry = messages.get(text) ?? { text, count: 0, kinds: new Set(), files: new Set() }
  entry.count++
  entry.kinds.add(m.ruleId.replace("i18n-", ""))
  entry.files.add(m.file.replace(/\\/g, "/"))
  messages.set(text, entry)
}

const list = [...messages.values()]
  .map((e) => ({ text: e.text, count: e.count, kinds: [...e.kinds], files: [...e.files] }))
  .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, "ar"))

const byRule = {}
for (const m of matches) byRule[m.ruleId] = (byRule[m.ruleId] ?? 0) + 1

const pluralCandidates = list.filter((e) => /\$\{\s*arNum\(|\$\{\s*n\(/.test(e.text)).length
const withParams = list.filter((e) => e.text.includes("${")).length

const out = {
  generatedFrom: "ast-grep scan -c scripts/i18n/sgconfig.yml (see docs/i18n-plan.md §1)",
  totals: {
    matches: matches.length,
    distinctMessages: list.length,
    withParams,
    pluralCandidates,
    byRule,
  },
  messages: list,
}
writeFileSync(path.join(HERE, "inventory.json"), JSON.stringify(out, null, 2), "utf8")
console.log(
  `matches=${matches.length} distinct=${list.length} withParams=${withParams} pluralCandidates=${pluralCandidates}`,
)
console.log("byRule:", JSON.stringify(byRule))
console.log("wrote scripts/i18n/inventory.json")
