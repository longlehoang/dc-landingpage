'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Locale, UiStrings } from '@/lib/i18n'
import type { StrapiLink } from '@/lib/types'
import { ArrowUpRight, CloseIcon, MenuIcon } from './Icons'
import SmartLink from './SmartLink'

interface Props {
  locale: Locale
  ui: UiStrings
  siteName: string
  logoUrl?: string
  contactLabel: string
  journeyTitle: string
  primaryLinks: StrapiLink[]
  otherTitle: string | null
  secondaryLinks: StrapiLink[]
}

export default function Header(props: Props) {
  const { locale, ui, siteName, logoUrl, contactLabel } = props
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
      <div className="header__inner container">
        <Link href={`/${locale}`} className="header__logo" aria-label={`${siteName} – ${ui.home}`}>
          {logoUrl ? <Image src={logoUrl} alt={siteName} width={164} height={40} preload /> : siteName}
        </Link>

        <div className="header__actions">
          <nav className="header__lang" aria-label={ui.language}>
            {(['vi', 'en'] as const).map((l, i) => (
              <span key={l} className="header__lang-item">
                {i > 0 && <span aria-hidden="true">|</span>}
                {l === locale ? (
                  <span aria-current="true">{l.toUpperCase()}</span>
                ) : (
                  <Link href={`/${l}`} lang={l} hrefLang={l}>{l.toUpperCase()}</Link>
                )}
              </span>
            ))}
          </nav>
          <a href="#contact" className="btn btn--outline">{contactLabel}</a>
        </div>

        <button
          type="button"
          className="header__toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? ui.closeMenu : ui.openMenu}
          onClick={() => setOpen(o => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <div className="container">
          <h4 className="eyebrow eyebrow--gold">{props.journeyTitle}</h4>
          <ul className="mobile-menu__list">
            {props.primaryLinks.map(l => (
              <li key={l.id}>
                <SmartLink link={l} onClick={close}>
                  {l.label} <ArrowUpRight />
                </SmartLink>
              </li>
            ))}
          </ul>
          {props.otherTitle && <h4 className="eyebrow eyebrow--gold">{props.otherTitle}</h4>}
          <ul className="mobile-menu__list mobile-menu__list--small">
            {props.secondaryLinks.map(l => (
              <li key={l.id}><SmartLink link={l} onClick={close} /></li>
            ))}
          </ul>
          <div className="mobile-menu__lang">
            <Link href={locale === 'vi' ? '/en' : '/vi'} onClick={close}>
              {locale === 'vi' ? 'English' : 'Tiếng Việt'}
            </Link>
          </div>
          <a href="#contact" className="btn btn--solid btn--block" onClick={close}>{contactLabel}</a>
        </div>
      </div>
    </header>
  )
}
