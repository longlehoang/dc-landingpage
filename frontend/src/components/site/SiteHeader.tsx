'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { localizeHref, type Locale, type UiStrings } from '@/lib/i18n'
import type { NavItem, StrapiLink } from '@/lib/types'
import { ChevronDown, CloseIcon, MenuIcon } from '../Icons'
import SmartLink from '../SmartLink'

interface Props {
  locale: Locale
  ui: UiStrings
  /** Current path without locale, e.g. `individual/about`; used by the language switch. */
  path: string
  homeHref: string
  siteName: string
  label: string | null
  logoUrl?: string
  nav: NavItem[]
  cta: StrapiLink | null
}

/** Header shared by the individual, institution, regulatory and corporate sub-sites. */
export default function SiteHeader({ locale, ui, path, homeHref, siteName, label, logoUrl, nav, cta }: Props) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  useEffect(() => {
    if (panel === null && !open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setPanel(null)
      setOpen(false)
    }
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setPanel(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
    }
  }, [panel, open])

  const close = () => {
    setOpen(false)
    setPanel(null)
  }
  const altPath = (l: Locale) => `/${l}${path ? `/${path}` : ''}`

  return (
    <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
      <div className="site-header__top">
        <div className="container site-header__top-inner">
          <nav className="site-header__lang" aria-label={ui.language}>
            {(['en', 'vi'] as const).map((l, i) => (
              <span key={l}>
                {i > 0 && <span aria-hidden="true"> | </span>}
                {l === locale ? (
                  <span aria-current="true">{l === 'vi' ? 'VN' : 'EN'}</span>
                ) : (
                  <Link href={altPath(l)} lang={l} hrefLang={l}>{l === 'vi' ? 'VN' : 'EN'}</Link>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="container site-header__bar">
        <Link href={localizeHref(homeHref, locale)} className="site-header__brand" aria-label={`${siteName} – ${ui.home}`}>
          {logoUrl ? <Image src={logoUrl} alt={siteName} width={166} height={40} preload unoptimized /> : siteName}
          {label && <span className="site-header__label">{label}</span>}
        </Link>

        <nav ref={navRef} className="site-nav" aria-label={siteName}>
          <ul className="site-nav__list">
            {nav.map((item, i) => {
              const hasPanel = item.groups.length > 0
              return (
                <li key={item.id} className="site-nav__item">
                  {hasPanel ? (
                    <button
                      type="button"
                      className="site-nav__link"
                      aria-expanded={panel === i}
                      aria-controls={`nav-panel-${item.id}`}
                      onClick={() => setPanel(p => (p === i ? null : i))}
                    >
                      {item.label} <ChevronDown />
                    </button>
                  ) : (
                    <SmartLink className="site-nav__link" link={{ label: item.label, url: item.url ?? '#', openInNewTab: false }} />
                  )}
                  {hasPanel && (
                    <div id={`nav-panel-${item.id}`} className="site-nav__panel" hidden={panel !== i}>
                      <div className="container site-nav__panel-inner">
                        {item.panelTitle && <p className="site-nav__panel-title">{item.panelTitle}</p>}
                        <div className="site-nav__groups">
                          {item.groups.map(group => (
                            <div key={group.id} className="site-nav__group">
                              {group.title && <p className="site-nav__group-title">{group.title}</p>}
                              <ul>
                                {group.links.map(l => (
                                  <li key={l.id}><SmartLink link={l} onClick={close} /></li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {cta && <SmartLink link={cta} className="site-header__cta" />}

        <button
          type="button"
          className="header__toggle"
          aria-expanded={open}
          aria-controls="site-mobile-menu"
          aria-label={open ? ui.closeMenu : ui.openMenu}
          onClick={() => setOpen(o => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div id="site-mobile-menu" className="mobile-menu" hidden={!open}>
        <div className="container">
          {nav.map(item => (
            <div key={item.id} className="mobile-menu__section">
              {item.groups.length > 0 ? (
                <details>
                  <summary>{item.label} <ChevronDown /></summary>
                  {item.groups.map(group => (
                    <div key={group.id}>
                      {group.title && <p className="eyebrow eyebrow--gold">{group.title}</p>}
                      <ul className="mobile-menu__list mobile-menu__list--small">
                        {group.links.map(l => <li key={l.id}><SmartLink link={l} onClick={close} /></li>)}
                      </ul>
                    </div>
                  ))}
                </details>
              ) : (
                <SmartLink className="mobile-menu__top-link" link={{ label: item.label, url: item.url ?? '#', openInNewTab: false }} onClick={close} />
              )}
            </div>
          ))}
          <div className="mobile-menu__lang">
            <Link href={altPath(locale === 'vi' ? 'en' : 'vi')} onClick={close}>
              {locale === 'vi' ? 'English' : 'Tiếng Việt'}
            </Link>
          </div>
          {cta && <SmartLink link={cta} className="btn btn--solid btn--block" onClick={close} />}
        </div>
      </div>
    </header>
  )
}
