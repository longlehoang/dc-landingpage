'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, PlusMinus } from '../Icons'

/** Horizontal scroll-snap carousel with prev/next buttons that disable at the ends. */
export function Carousel({
  children,
  className = '',
  label,
  prevLabel,
  nextLabel,
  controls = 'top',
}: {
  children: ReactNode
  className?: string
  label: string
  prevLabel: string
  nextLabel: string
  controls?: 'top' | 'bottom' | 'none'
}) {
  const track = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const el = track.current
    if (!el) return
    const update = () => setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const step = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const item = el.firstElementChild as HTMLElement | null
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: dir * ((item?.offsetWidth ?? el.clientWidth) + gap), behavior: 'smooth' })
  }

  const buttons = controls !== 'none' && !(edges.start && edges.end) && (
    <div className={`carousel__controls carousel__controls--${controls}`}>
      <button type="button" className="carousel__btn" aria-label={prevLabel} disabled={edges.start} onClick={() => step(-1)}>
        <ChevronLeft />
      </button>
      <button type="button" className="carousel__btn" aria-label={nextLabel} disabled={edges.end} onClick={() => step(1)}>
        <ChevronRight />
      </button>
    </div>
  )

  return (
    <div className={`carousel ${className}`} role="region" aria-roledescription="carousel" aria-label={label}>
      {controls === 'top' && buttons}
      <div ref={track} className="carousel__track" tabIndex={0}>
        {children}
      </div>
      {controls === 'bottom' && buttons}
    </div>
  )
}

/** Disclosure list: one row open at a time (or none). */
export function Accordion({
  items,
  defaultOpen = null,
  className = '',
}: {
  items: { key: string | number; title: ReactNode; content: ReactNode }[]
  defaultOpen?: number | null
  className?: string
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen)
  const id = useId()
  return (
    <div className={`accordion ${className}`}>
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.key} className={`accordion__item${isOpen ? ' is-open' : ''}`}>
            <h3 className="accordion__heading">
              <button
                type="button"
                className="accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={`${id}-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{item.title}</span>
                <PlusMinus open={isOpen} />
              </button>
            </h3>
            <div id={`${id}-${i}`} className="accordion__panel" role="region" hidden={!isOpen}>
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Pill tabs; panels stay mounted (hidden) so their content is in the HTML for SEO. */
export function Tabs({
  tabs,
  className = '',
  label,
}: {
  tabs: { key: string | number; label: string; content: ReactNode }[]
  className?: string
  label?: string
}) {
  const [active, setActive] = useState(0)
  const id = useId()
  return (
    <div className={`tabs ${className}`}>
      <div className="tabs__list" role="tablist" aria-label={label}>
        {tabs.map((t, i) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            className="tabs__tab"
            onClick={() => setActive(i)}
            onKeyDown={e => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
              const next = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length
              setActive(next)
              document.getElementById(`${id}-tab-${next}`)?.focus()
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.key} id={`${id}-panel-${i}`} role="tabpanel" aria-labelledby={`${id}-tab-${i}`} hidden={active !== i} className="tabs__panel">
          {t.content}
        </div>
      ))}
    </div>
  )
}

/** Sticky in-page navigation that highlights the section in view. */
export function AnchorNav({ links }: { links: { id: number; label: string; url: string }[] }) {
  const [active, setActive] = useState(links[0]?.url ?? '')
  useEffect(() => {
    const targets = links.map(l => document.querySelector(l.url)).filter(Boolean) as Element[]
    const io = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(`#${visible.target.id}`)
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    targets.forEach(t => io.observe(t))
    return () => io.disconnect()
  }, [links])
  return (
    <nav className="anchor-nav">
      <ul className="container anchor-nav__list">
        {links.map(l => (
          <li key={l.id}>
            <a href={l.url} aria-current={active === l.url ? 'true' : undefined}>{l.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
