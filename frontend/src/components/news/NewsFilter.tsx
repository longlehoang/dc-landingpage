'use client'

import { useState, type ReactNode } from 'react'
import { ALL_CATEGORIES } from '@/lib/news'

interface Props {
  label: string
  pills: { value: string; label: string }[]
  /** Featured article id per filter value. */
  featuredIds: Record<string, string>
  /** Pre-rendered featured cards by article id. */
  featured: Record<string, ReactNode>
  cards: { id: string; category: string | null; node: ReactNode }[]
  emptyText: string
}

/** Category pills that filter the pre-rendered news cards without a reload. */
export default function NewsFilter({ label, pills, featuredIds, featured, cards, emptyText }: Props) {
  const [active, setActive] = useState(ALL_CATEGORIES)
  const featuredId = featuredIds[active]
  const visible = cards.filter(c => c.id !== featuredId && (active === ALL_CATEGORIES || c.category === active))

  return (
    <>
      <div className="news-index__filters" role="group" aria-label={label}>
        {pills.map(p => (
          <button
            key={p.value}
            type="button"
            className="news-pill news-pill--filter"
            aria-pressed={p.value === active}
            onClick={() => setActive(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="news-index__results">
        {featuredId ? featured[featuredId] : <p className="news-index__empty">{emptyText}</p>}
        {visible.length > 0 && (
          <div className="news-index__grid">
            {visible.map(c => <div key={c.id} className="news-index__item">{c.node}</div>)}
          </div>
        )}
      </div>
    </>
  )
}
