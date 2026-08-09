/**
 * Wraps the remaining hardcoded Arabic in `t("…")` calls, using the Arabic
 * string itself as the key (docs/i18n-plan.md §1).
 *
 *   node scripts/i18n/wrap-arabic.mjs src/features/panels/panels.tsx …
 *
 * Why natural-language keys for this half of the catalog: the shared
 * vocabulary (units, tiers, statuses, nav, page chrome) is reused in many
 * places and earns structured keys — `units.seats` says what it is. The rest
 * is one-off page copy, several hundred strings of it, and inventing a key
 * per sentence buys nothing while risking a wrong key silently rendering the
 * wrong sentence. With the source string as the key, Arabic needs no catalog
 * entry at all (i18next falls back to the key), so the Arabic UI is identical
 * by construction and only `en/ui.json` carries entries.
 *
 * Handles the two shapes that cover the bulk of what is left:
 *   attribute:  label="السعة (حاج)"   ->  label={t("السعة (حاج)")}
 *   JSX text:   <span>باقة جديدة</span> -> <span>{t("باقة جديدة")}</span>
 *
 * Template literals and interpolated sentences are left alone — those need a
 * human to decide the ICU parameters.
 */
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const AR = /[؀-ۿ]/
const files = process.argv.slice(2)
if (!files.length) {
  console.error("usage: node scripts/i18n/wrap-arabic.mjs <files…>")
  process.exit(1)
}

/** Attributes whose value is user-visible copy. */
const ATTRS = ["label", "placeholder", "hint", "title", "description", "aria-label", "finishLabel", "emptyLabel", "boundLabel", "sub"]

const found = new Set()

for (const file of files) {
  const abs = path.resolve(file)
  let text = await readFile(abs, "utf8")
  const before = text

  // attribute="…arabic…"  ->  attribute={t("…")}
  for (const attr of ATTRS) {
    text = text.replaceAll(new RegExp(`(\\s${attr}=)"([^"\\n]*[\\u0600-\\u06FF][^"\\n]*)"`, "g"), (_m, lead, value) => {
      found.add(value)
      return `${lead}{t(${JSON.stringify(value)})}`
    })
  }

  // >…arabic…<  (a whole JSX text child, no braces or tags inside)
  text = text.replaceAll(/>(\s*)([^<>{}\n]*[؀-ۿ][^<>{}]*?)(\s*)</g, (m, pre, value, post) => {
    const v = value.trim()
    // Skip anything that is not plain prose: entities, stray punctuation only.
    if (!AR.test(v) || v.length < 2) return m
    found.add(v)
    return `>${pre}{t(${JSON.stringify(v)})}${post}<`
  })

  if (text !== before) {
    await writeFile(abs, text, "utf8")
    console.log(`patched ${path.relative(process.cwd(), abs)}`)
  }
}

console.log(`\n${found.size} distinct strings wrapped. Add these to src/locales/en/ui.json:\n`)
console.log(JSON.stringify(Object.fromEntries([...found].sort().map((s) => [s, ""])), null, 2))
