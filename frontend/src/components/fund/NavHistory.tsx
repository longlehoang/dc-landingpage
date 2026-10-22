'use client'

import { useMemo, useState } from 'react'
import { formatDate, formatNumber, formatPercent } from '@/lib/format'
import type { Locale } from '@/lib/i18n'
import { ChevronLeft, TrendTriangle } from '../Icons'
import type { FundLabels } from './labels'
import type { Point } from './types'

interface Row { date: string; nav: number; change: number; changePct: number }

const PAGE = 30
const minusDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10)

/** "Lịch sử NAV" view of the overview tab: date range pickers and a NAV / change table. */
export default function NavHistory({ series, recent, locale, labels }: {
  /** Full daily NAV history [date, nav], oldest first. */
  series: Point[]
  /** Latest rows with the exact change figures from the fund data. */
  recent: Row[]
  locale: Locale
  labels: Pick<FundLabels, 'backToOverview' | 'navHistory' | 'from' | 'to' | 'date' | 'navPrice' | 'change' | 'noData' | 'showMore'>
}) {
  const rows = useMemo(() => {
    const exact = new Map(recent.map(r => [r.date, r]))
    const all: Row[] = series.map(([date, nav], i) => {
      const prev = i > 0 ? series[i - 1][1] : nav
      return exact.get(date) ?? { date, nav, change: nav - prev, changePct: prev ? ((nav - prev) / prev) * 100 : 0 }
    })
    for (const r of recent) if (!all.some(a => a.date === r.date)) all.push(r)
    return all.sort((a, b) => b.date.localeCompare(a.date))
  }, [series, recent])

  const last = rows[0]?.date ?? new Date().toISOString().slice(0, 10)
  const first = rows[rows.length - 1]?.date ?? last
  const [from, setFrom] = useState(() => minusDays(last, 7))
  const [to, setTo] = useState(last)
  const [limit, setLimit] = useState(PAGE)

  const shown = rows.filter(r => r.date >= from && r.date <= to)

  return (
    <section className="container fund-navhist" aria-labelledby="fund-navhist-title">
      <a className="fund-navhist__back" href="#overview">
        <ChevronLeft /> {labels.backToOverview}
      </a>
      <div className="fund-navhist__head">
        <h2 id="fund-navhist-title" className="fund-h2">{labels.navHistory}</h2>
        <label className="fund-field">
          <span>{labels.from}</span>
          <input type="date" value={from} min={first} max={to} onChange={e => { setFrom(e.target.value || first); setLimit(PAGE) }} />
        </label>
        <label className="fund-field">
          <span>{labels.to}</span>
          <input type="date" value={to} min={from} max={last} onChange={e => { setTo(e.target.value || last); setLimit(PAGE) }} />
        </label>
      </div>
      <div className="fund-table-wrap">
        <table className="fund-table fund-navhist__table">
          <thead>
            <tr>
              <th scope="col">{labels.date}</th>
              <th scope="col">{labels.navPrice}</th>
              <th scope="col">{labels.change}</th>
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, limit).map(r => {
              const up = r.change >= 0
              return (
                <tr key={r.date}>
                  <td>{formatDate(r.date)}</td>
                  <td>{formatNumber(r.nav, locale)} ₫</td>
                  <td>
                    <span className={up ? 'fund-up' : 'fund-down'}>{up ? '+' : ''}{formatNumber(r.change, locale)}</span>
                    <span className={`fund-badge ${up ? 'fund-badge--up' : 'fund-badge--down'}`}>
                      <TrendTriangle up={up} /> {formatPercent(Math.abs(r.changePct), locale)}
                    </span>
                  </td>
                </tr>
              )
            })}
            {!shown.length && (
              <tr><td colSpan={3} className="fund-table__empty">{labels.noData}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {shown.length > limit && (
        <button type="button" className="fund-more" onClick={() => setLimit(l => l + PAGE)}>{labels.showMore}</button>
      )}
    </section>
  )
}
