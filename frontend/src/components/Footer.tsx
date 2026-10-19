import Image from 'next/image'
import type { GlobalContent } from '@/lib/types'
import SmartLink from './SmartLink'

export default function Footer({ global, logoUrl }: { global: GlobalContent; logoUrl?: string }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          {logoUrl && <Image src={logoUrl} alt={global.siteName} width={164} height={40} className="footer__logo" />}
          {global.footerColumns.map(col => (
            <nav key={col.id} className="footer__col" aria-label={col.title}>
              <h3 className="footer__heading">{col.title}</h3>
              <ul>
                {col.links.map(l => (
                  <li key={l.id}><SmartLink link={l} /></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer__bottom">
          <ul className="footer__legal">
            {global.legalLinks.map(l => (
              <li key={l.id}><SmartLink link={l} /></li>
            ))}
          </ul>
          {global.copyright && <p className="footer__copy">{global.copyright}</p>}
        </div>
      </div>
    </footer>
  )
}
