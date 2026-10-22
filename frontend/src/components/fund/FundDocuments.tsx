'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { formatDate } from '@/lib/format'
import type { Locale } from '@/lib/i18n'
import { DownloadIcon, PlusMinus } from '../Icons'
import type { FundLabels } from './labels'
import type { DocumentGroup } from './types'

type Labels = Pick<FundLabels, 'fundDocuments' | 'docColumns' | 'year' | 'download' | 'expand' | 'loading' | 'noDocuments' | 'loadFailed' | 'showMore'>
type Entry = { status: 'error' } | { status: 'done'; groups: DocumentGroup[] }

const FILES_PAGE = 20

/** Documents tab: year selector and folder rows (category) that expand to their files. Loads when first shown. */
export default function FundDocuments({ fundCode, fundLabel, years, locale, labels }: {
  fundCode: string
  fundLabel: string
  years: number[]
  locale: Locale
  labels: Labels
}) {
  const rootRef = useRef<HTMLElement>(null)
  const [seen, setSeen] = useState(false)
  const [year, setYear] = useState(years[0])
  const [entries, setEntries] = useState<Record<number, Entry>>({})
  const [open, setOpen] = useState<Record<string, number>>({})

  // Only fetch once the tab panel is actually visible.
  useEffect(() => {
    const el = rootRef.current
    if (!el || seen) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setSeen(true) })
    io.observe(el)
    return () => io.disconnect()
  }, [seen])

  const entry = year !== undefined ? entries[year] : undefined
  useEffect(() => {
    if (!seen || year === undefined || entry) return
    const ctrl = new AbortController()
    const params = new URLSearchParams({ fund: fundCode, year: String(year), locale })
    fetch(`/api/fund-documents?${params}`, { signal: ctrl.signal })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { groups: DocumentGroup[] }) => setEntries(e => ({ ...e, [year]: { status: 'done', groups: data.groups } })))
      .catch(() => { if (!ctrl.signal.aborted) setEntries(e => ({ ...e, [year]: { status: 'error' } })) })
    return () => ctrl.abort()
  }, [seen, year, entry, fundCode, locale])

  const [colDoc, colFund, colType, colYear] = labels.docColumns

  return (
    <section ref={rootRef} className="container fund-section fund-docs" aria-labelledby="fund-docs-title">
      <div className="fund-docs__head">
        <h2 id="fund-docs-title" className="fund-h2">{labels.fundDocuments}</h2>
        {years.length > 0 && (
          <label className="fund-field fund-docs__year">
            <span>{labels.year}</span>
            <select value={year} onChange={e => { setYear(Number(e.target.value)); setOpen({}) }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="fund-table-wrap">
        <table className="fund-table fund-docs__table">
          <thead>
            <tr>
              <th scope="col">{colDoc}</th>
              <th scope="col">{colFund}</th>
              <th scope="col">{colType}</th>
              <th scope="col">{colYear}</th>
              <th scope="col"><span className="sr-only">{labels.expand}</span></th>
            </tr>
          </thead>
          <tbody aria-live="polite" aria-busy={!entry}>
            {(!years.length || (entry?.status === 'done' && !entry.groups.length)) && (
              <tr><td colSpan={5} className="fund-table__empty">{labels.noDocuments}</td></tr>
            )}
            {years.length > 0 && !entry && <tr><td colSpan={5} className="fund-table__empty">{labels.loading}</td></tr>}
            {entry?.status === 'error' && <tr><td colSpan={5} className="fund-table__empty">{labels.loadFailed}</td></tr>}
            {entry?.status === 'done' && entry.groups.map(g => {
              const shown = open[g.key]
              const panelId = `fund-docs-${g.key.replace(/[^A-Za-z0-9]/g, '-')}`
              return (
                <Fragment key={g.key}>
                  <tr className="fund-docs__row">
                    <th scope="row">{g.category}</th>
                    <td><span className="fund-chip">{fundLabel}</span></td>
                    <td className="fund-docs__type">{g.type}</td>
                    <td className="fund-docs__year-cell">{year}</td>
                    <td className="num">
                      <button
                        type="button"
                        className="fund-docs__toggle"
                        aria-expanded={!!shown}
                        aria-controls={panelId}
                        aria-label={`${labels.expand}: ${g.category} (${g.files.length})`}
                        onClick={() => setOpen(o => {
                          const next = { ...o }
                          if (next[g.key]) delete next[g.key]
                          else next[g.key] = FILES_PAGE
                          return next
                        })}
                      >
                        <PlusMinus open={!!shown} />
                      </button>
                    </td>
                  </tr>
                  {shown && (
                    <tr className="fund-docs__files-row">
                      <td colSpan={5} id={panelId}>
                        <ul className="fund-docs__files">
                          {g.files.slice(0, shown).map((f, i) => (
                            <li key={`${f.url}-${i}`}>
                              <a href={f.url} target="_blank" rel="noopener noreferrer" className="fund-docs__file">{f.title}</a>
                              <span className="fund-docs__date">{f.date ? formatDate(f.date) : ''}</span>
                              <a href={f.url} target="_blank" rel="noopener noreferrer" className="fund-docs__download" aria-label={`${labels.download}: ${f.title}`}>
                                <DownloadIcon />
                              </a>
                            </li>
                          ))}
                        </ul>
                        {g.files.length > shown && (
                          <button type="button" className="fund-more" onClick={() => setOpen(o => ({ ...o, [g.key]: shown + FILES_PAGE }))}>
                            {labels.showMore} ({g.files.length - shown})
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
