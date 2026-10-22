'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react'
import { NAV_HISTORY_HASH } from './labels'

const HASH_EVENT = 'fund:hash'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  window.addEventListener(HASH_EVENT, onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener(HASH_EVENT, onChange)
  }
}
const getHash = () => decodeURIComponent(window.location.hash.slice(1))
const getServerHash = () => ''

interface Props {
  label: string
  tabs: { key: string; label: string }[]
  panels: Record<string, ReactNode>
  /** Replaces the overview panel while the URL hash is `#overview-nav-history`. */
  navHistory?: ReactNode
}

/** Sticky tab bar whose active tab follows the URL hash (`#overview`, `#performance`, …). */
export default function FundTabs({ label, tabs, panels, navHistory }: Props) {
  const hash = useSyncExternalStore(subscribe, getHash, getServerHash)
  const rootRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const showNavHistory = hash === NAV_HISTORY_HASH && !!navHistory
  const active = showNavHistory ? 'overview' : tabs.some(t => t.key === hash) ? hash : tabs[0].key

  /** Brings the tab bar to its sticky position when the page is scrolled past it (or always, when `force`). */
  const scrollToTabs = useCallback((force: boolean, behavior: ScrollBehavior = 'smooth') => {
    const root = rootRef.current
    if (!root) return
    const bar = root.firstElementChild as HTMLElement | null
    const stickyTop = bar ? parseFloat(getComputedStyle(bar).top) || 0 : 0
    const top = root.getBoundingClientRect().top + window.scrollY - stickyTop
    if (force || window.scrollY > top) window.scrollTo({ top, behavior })
  }, [])

  const go = useCallback((key: string) => {
    history.replaceState(null, '', `#${key}`)
    window.dispatchEvent(new Event(HASH_EVENT))
    scrollToTabs(false)
  }, [scrollToTabs])

  // Deep link (e.g. /product/vn30#portfolio): show the tab bar right away.
  useEffect(() => {
    const key = getHash()
    if (key && (key === NAV_HISTORY_HASH || tabs.some(t => t.key === key))) scrollToTabs(true, 'instant')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // In-page links to a tab (e.g. "Lịch sử NAV › Bấm vào đây", "‹ Trở lại trang tổng quan") switch tabs instead of jumping.
  useEffect(() => {
    const keys = new Set([...tabs.map(t => t.key), NAV_HISTORY_HASH])
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href^="#"]')
      const key = a?.getAttribute('href')?.slice(1)
      if (!key || !keys.has(key)) return
      e.preventDefault()
      go(key)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [tabs, go])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex(t => t.key === active)
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null
    if (next === null) return
    e.preventDefault()
    const tab = tabs[(next + tabs.length) % tabs.length]
    go(tab.key)
    tabRefs.current[tab.key]?.focus()
  }

  return (
    <div className="fund-tabs" ref={rootRef}>
      <div className="fund-tabs__bar">
        <div className="container">
          <div className="fund-tabs__list" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
            {tabs.map(t => (
              <button
                key={t.key}
                ref={el => { tabRefs.current[t.key] = el }}
                type="button"
                role="tab"
                id={`fund-tab-${t.key}`}
                aria-selected={t.key === active}
                aria-controls={`fund-panel-${t.key}`}
                tabIndex={t.key === active ? 0 : -1}
                className="fund-tabs__tab"
                onClick={() => go(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {tabs.map(t => (
        <div
          key={t.key}
          role="tabpanel"
          id={`fund-panel-${t.key}`}
          aria-labelledby={`fund-tab-${t.key}`}
          hidden={t.key !== active}
          className="fund-tabs__panel"
        >
          {t.key === 'overview' && showNavHistory ? navHistory : panels[t.key]}
        </div>
      ))}
    </div>
  )
}
