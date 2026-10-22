'use client'

import { useState } from 'react'
import { formatPercent } from '@/lib/format'
import type { Locale } from '@/lib/i18n'
import type { AllocationItem } from './types'

/** Donut colours sampled from the live site, in order. */
export const ALLOCATION_COLORS = [
  '#00bf6f', '#173f35', '#014abd', '#ff671b', '#ffcb19', '#8455ff', '#ff0037', '#00816d', '#97999b',
  '#51c884', '#3a5a51', '#4f63c6', '#ff8043', '#ffa534', '#ffb75d', '#d1d9d7', '#ccf2e2', '#505d68',
]
const CHUNK = 5

function Donut({ items, label }: { items: AllocationItem[]; label: string }) {
  const r = 80
  const c = 2 * Math.PI * r
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0) || 1
  const lengths = items.map(it => (Math.max(0, it.weight) / total) * c)
  const offsets = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0))
  return (
    <svg className="fund-donut" viewBox="0 0 200 200" role="img" aria-label={label}>
      <circle cx="100" cy="100" r={r} fill="none" stroke="var(--line)" strokeWidth="14" />
      {items.map((it, i) => {
        const len = lengths[i]
        return (
          <circle
            key={it.name}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]}
            strokeWidth="14"
            strokeDasharray={`${Math.max(0, len - 1)} ${c}`}
            strokeDashoffset={-offsets[i]}
            transform="rotate(-90 100 100)"
          >
            <title>{`${it.name}: ${it.weight}%`}</title>
          </circle>
        )
      })}
    </svg>
  )
}

/** "Phân bổ tài sản": Ngành | Loại tài sản toggle, donut and paged legend table. */
export default function Allocation({ views, locale, groupLabel, percentLabel }: {
  views: { key: string; label: string; items: AllocationItem[] }[]
  locale: Locale
  groupLabel: string
  percentLabel?: string
}) {
  const [viewKey, setViewKey] = useState(views[0]?.key)
  const [page, setPage] = useState(0)
  const view = views.find(v => v.key === viewKey) ?? views[0]
  if (!view) return null
  const pages = Math.max(1, Math.ceil(view.items.length / CHUNK))
  const current = Math.min(page, pages - 1)
  const rows = view.items.map((it, i) => ({ ...it, color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] })).slice(current * CHUNK, current * CHUNK + CHUNK)

  return (
    <div className="fund-alloc">
      <div className="fund-toggle" role="group" aria-label={groupLabel}>
        {views.map(v => (
          <button
            key={v.key}
            type="button"
            className="fund-toggle__btn"
            aria-pressed={v.key === view.key}
            onClick={() => { setViewKey(v.key); setPage(0) }}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="fund-alloc__body">
        <Donut items={view.items} label={view.label} />
        <div className="fund-alloc__legend">
          <table className="fund-table fund-alloc__table">
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">●</span></th>
                <th scope="col">{view.label}</th>
                <th scope="col" className="num">{percentLabel ?? '%'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(it => (
                <tr key={it.name}>
                  <td><span className="fund-dot" style={{ background: it.color }} /></td>
                  <td>{it.name}</td>
                  <td className="num">{formatPercent(it.weight, locale, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pages > 1 && (
            <div className="fund-dots">
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} type="button" aria-label={`${i + 1} / ${pages}`} aria-current={i === current} onClick={() => setPage(i)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
