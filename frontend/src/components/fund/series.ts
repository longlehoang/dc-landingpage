const DAY = 86_400_000
const RANGE_MONTHS = [3, 12, 36, 60]

/**
 * Shrinks a long daily series for the page payload: keeps every point of the last ~13 months, every
 * `step`-th point before that, and the exact base point of each chart range (YTD, 3M, 1Y, 3Y, 5Y) so
 * rebased returns stay exact.
 */
export function thinSeries<T extends [string, ...unknown[]]>(rows: T[], step = 5, dailyDays = 400): T[] {
  if (rows.length < 600) return rows
  const last = rows[rows.length - 1][0]
  const end = Date.parse(`${last}T00:00:00Z`)
  const cutoff = new Date(end - dailyDays * DAY).toISOString().slice(0, 10)
  const starts = [
    `${last.slice(0, 4)}-01-01`,
    ...RANGE_MONTHS.map(m => {
      const d = new Date(end)
      d.setUTCMonth(d.getUTCMonth() - m)
      return d.toISOString().slice(0, 10)
    }),
  ]
  const keep = new Set<number>()
  for (const s of starts) {
    const i = rows.findIndex(r => r[0] >= s)
    if (i > 0) keep.add(i - 1)
    if (i >= 0) keep.add(i)
  }
  return rows.filter((r, i) => i === 0 || r[0] >= cutoff || i % step === 0 || keep.has(i))
}
