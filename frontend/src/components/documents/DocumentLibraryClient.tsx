'use client'

import { useMemo, useRef, useState } from 'react'
import { DownloadIcon, PlusMinus } from '../Icons'
import type { LibraryDoc, LibrarySelection } from '@/lib/documents'
import { formatDate } from '@/lib/format'
import type { Locale } from '@/lib/i18n'
import FilterSelect, { type Option } from './FilterSelect'

export interface LibraryUi {
  fund: string
  type: string
  year: string
  allTypes: string
  allOption: string
  columns: string[]
  empty: string
  noMatch: string
  loading: string
  error: string
  download: string
}

interface Props {
  locale: Locale
  funds: Option[]
  /** Document types in display order. */
  types: Option[]
  /** Document sections (categories) in display order. */
  categories: Option[]
  ui: LibraryUi
  initial: LibrarySelection
}

interface Row {
  key: string
  type: string
  category: string
  docs: LibraryDoc[]
}

const ALL = ''

export default function DocumentLibraryClient({ locale, funds, types, categories, ui, initial }: Props) {
  const [data, setData] = useState(initial)
  const [type, setType] = useState(ALL)
  const [openRows, setOpenRows] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const request = useRef<AbortController | null>(null)

  const load = async (fund: string, year: number | null) => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setStatus('loading')
    try {
      const params = new URLSearchParams({ locale, fund })
      if (year !== null) params.set('year', String(year))
      const res = await fetch(`/api/documents?${params}`, { signal: controller.signal })
      if (!res.ok) throw new Error(String(res.status))
      setData((await res.json()) as LibrarySelection)
      setOpenRows(new Set())
      setStatus('idle')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatus('error')
    }
  }

  const rows = useMemo(() => {
    const typeRank = new Map(types.map((t, i) => [t.value, i]))
    const catRank = new Map(categories.map((c, i) => [c.value, i]))
    const groups = new Map<string, Row>()
    for (const doc of data.documents) {
      if (type !== ALL && doc.type !== type) continue
      const key = `${doc.type}|${doc.category}`
      let row = groups.get(key)
      if (!row) groups.set(key, (row = { key, type: doc.type, category: doc.category, docs: [] }))
      row.docs.push(doc)
    }
    const rank = (m: Map<string, number>, k: string) => m.get(k) ?? m.size
    return [...groups.values()].sort(
      (a, b) => rank(typeRank, a.type) - rank(typeRank, b.type) || rank(catRank, a.category) - rank(catRank, b.category),
    )
  }, [data.documents, type, types, categories])

  const label = (options: Option[], value: string) => options.find(o => o.value === value)?.label ?? value
  const fundLabel = label(funds, data.fund)
  const typeOptions = [{ value: ALL, label: ui.allOption }, ...types]
  const yearOptions = data.years.map(y => ({ value: String(y), label: String(y) }))
  const toggle = (key: string) =>
    setOpenRows(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div className="doc-lib">
      <div className="doc-lib__filters">
        <FilterSelect
          label={ui.fund}
          value={data.fund}
          options={funds}
          noMatch={ui.noMatch}
          onChange={fund => {
            setData(d => ({ ...d, fund }))
            load(fund, null)
          }}
        />
        <FilterSelect
          label={ui.type}
          value={type}
          options={typeOptions}
          noMatch={ui.noMatch}
          display={type === ALL ? ui.allTypes : undefined}
          onChange={setType}
        />
        <FilterSelect
          label={ui.year}
          value={data.year === null ? '' : String(data.year)}
          options={yearOptions}
          noMatch={ui.noMatch}
          disabled={!yearOptions.length}
          onChange={y => {
            setData(d => ({ ...d, year: Number(y) }))
            load(data.fund, Number(y))
          }}
        />
      </div>

      <div className="doc-lib__table" aria-busy={status === 'loading'}>
        <div className="doc-lib__head" aria-hidden="true">
          {ui.columns.map(c => <span key={c}>{c}</span>)}
        </div>
        <p className="sr-only" role="status">{status === 'loading' ? ui.loading : ''}</p>
        {status === 'error' && <p className="doc-lib__message" role="alert">{ui.error}</p>}
        {status !== 'error' && !rows.length && <p className="doc-lib__message">{status === 'loading' ? ui.loading : ui.empty}</p>}
        <ul className={`doc-lib__rows${status === 'loading' ? ' is-loading' : ''}`}>
          {rows.map(row => {
            const open = openRows.has(row.key)
            const panelId = `doc-panel-${row.key.replace(/[^A-Za-z0-9_-]/g, '-')}`
            return (
              <li key={row.key} className={`doc-row${open ? ' is-open' : ''}`}>
                <div className="doc-row__heading">
                  <button type="button" className="doc-row__button" aria-expanded={open} aria-controls={panelId} onClick={() => toggle(row.key)}>
                    <span className="doc-row__name">{label(categories, row.category)}</span>
                    <span className="doc-row__fund"><span className="doc-pill">{fundLabel}</span></span>
                    <span className="doc-row__cell doc-row__type">
                      <span className="doc-row__label">{ui.columns[2]}</span>
                      {label(types, row.type)}
                    </span>
                    <span className="doc-row__cell doc-row__year">
                      <span className="doc-row__label">{ui.columns[3]}</span>
                      {data.year}
                    </span>
                    <span className="doc-row__toggle"><PlusMinus open={open} /></span>
                  </button>
                </div>
                <div id={panelId} className="doc-row__panel" hidden={!open}>
                  {open && (
                    <ul className="doc-files">
                      {row.docs.map(doc => (
                        <li key={doc.id}>
                          {doc.url ? (
                            <a className="doc-file" href={doc.url} target="_blank" rel="noopener noreferrer">
                              <span className="doc-file__text">
                                <span className="doc-file__title">{doc.title}</span>
                                {doc.date && <span className="doc-file__date">{formatDate(doc.date)}</span>}
                              </span>
                              <span className="doc-file__icon" title={ui.download}><DownloadIcon /></span>
                            </a>
                          ) : (
                            <span className="doc-file doc-file--missing">
                              <span className="doc-file__text">
                                <span className="doc-file__title">{doc.title}</span>
                                {doc.date && <span className="doc-file__date">{formatDate(doc.date)}</span>}
                              </span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
