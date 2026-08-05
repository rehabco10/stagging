/** Inspect the 3 fresh Downloads xlsx files: sheets, headers, row counts, key values. */
const path = require("path")
const PROJECT = path.resolve(__dirname, "../../../../hajj-1447/light-housing-system")
const XLSX = require(require.resolve("xlsx", { paths: [PROJECT] }))

const FILES = [
  "C:/Users/x7md/Downloads/حجوزات الحجاج3-5.xlsx",
  "C:/Users/x7md/Downloads/شركة اثراء الخير لخدمات الحجاج(تسكين).xlsx",
  "C:/Users/x7md/Downloads/رحلة الحاج لشركة اثراء الخير لخدمات الحجاج.xlsx",
]

for (const file of FILES) {
  console.log(`\n===== ${path.basename(file)} =====`)
  const wb = XLSX.readFile(file)
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null })
    console.log(`-- sheet "${name}": ${rows.length} rows`)
    if (!rows.length) continue
    console.log("   cols:", JSON.stringify(Object.keys(rows[0])))
    // one sample row, truncated values
    const sample = {}
    for (const [k, v] of Object.entries(rows[0])) sample[k] = String(v).slice(0, 28)
    console.log("   row0:", JSON.stringify(sample))
  }
}
