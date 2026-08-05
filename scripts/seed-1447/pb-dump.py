"""Dump the date-bearing tables of the 1447 system's FINAL PocketBase data.

The live pb_data/data.db is post-ingestion, post-linkFixer — more
authoritative than the raw xlsx for dates: packages carry their real trip
windows, and contract_packages is the dated contract↔package junction.
Output: pb-1447.json beside this script (gitignored, regenerate at will).
"""

import json
import os
import sqlite3

DB = r"C:\Users\x7md\Documents\works\hajj-1447\light-housing-system\pocketbase\pb_data\data.db"
OUT = os.path.join(os.path.dirname(__file__), "pb-1447.json")

con = sqlite3.connect(DB)
cur = con.cursor()

day = lambda s: (s or "")[:10]

packages = [
    {"nusuk_id": pid, "name_en": name, "start": day(s), "end": day(e), "type": t}
    for pid, name, s, e, t in cur.execute(
        "select package_id, name_en, start_date, end_date, type from packages"
    )
]

contract_no = dict(cur.execute("select id, contract_id from housing_contracts"))
pkg_nusuk = dict(cur.execute("select id, package_id from packages"))

contract_packages = [
    {
        "contract_no": contract_no.get(c, c),
        "nusuk_id": pkg_nusuk.get(p, p),
        "start": day(s),
        "end": day(e),
        "capacity": cap,
        "city": city,
    }
    for c, p, s, e, cap, city in cur.execute(
        "select contract, package, package_start_date, package_end_date, package_capacity, city from contract_packages"
    )
]

starts = [p["start"] for p in packages if p["start"]]
ends = [p["end"] for p in packages if p["end"]]
out = {
    "envelope": {"starts_on": min(starts), "ends_on": max(ends)},
    "packages": packages,
    "contract_packages": contract_packages,
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(
    f"pb-1447.json: {len(packages)} packages, {len(contract_packages)} contract_packages, "
    f"envelope {out['envelope']['starts_on']} → {out['envelope']['ends_on']}"
)
