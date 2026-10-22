import type { Locale } from './i18n'

const intl = (locale: Locale) => (locale === 'vi' ? 'vi-VN' : 'en-GB')

/** 6.19 → "6,19%" (vi) / "6.19%" (en). */
export function formatPercent(value: number, locale: Locale, digits = 2) {
  return `${value.toLocaleString(intl(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
}

export function formatNumber(value: number, locale: Locale, digits = 2) {
  return value.toLocaleString(intl(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** ISO date → "18/10/2026". */
export function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

/** ISO date → "18 Tháng 9, 2026" (vi) / "18 September 2026" (en), as on the live news cards. */
export function formatLongDate(iso: string, locale: Locale) {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  if (locale === 'vi') return `${date.getUTCDate()} Tháng ${date.getUTCMonth() + 1}, ${date.getUTCFullYear()}`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}
