import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Arabic locale, Latin digits (`-u-nu-latn`).
 *
 * Plain `ar-SA` renders Arabic-Indic numerals (٧٬٠٠٠). Nusuk Hajj, the ministry
 * forms and every export in `ocr/` use Latin digits, so numbers here have to
 * match what the operator will type into the platform and read back off it.
 */
const NUM = new Intl.NumberFormat("ar-SA-u-nu-latn", { useGrouping: true })
const SAR = new Intl.NumberFormat("ar-SA-u-nu-latn", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const arNum = (n: number) => NUM.format(n)
export const sar = (n: number) => SAR.format(n)
