import Image from 'next/image'
import { mediaUrl } from '@/lib/strapi'
import type { SiteContent } from '@/lib/types'
import { SocialIcon } from '../Icons'
import SmartLink from '../SmartLink'

export default function SiteFooter({ site, siteName }: { site: SiteContent; siteName: string }) {
  const logo = mediaUrl(site.footerLogo) ?? mediaUrl(site.logo)
  const appStoreBadge = mediaUrl(site.appStoreBadge)
  const playStoreBadge = mediaUrl(site.playStoreBadge)
  const hasApps = site.appTitle && (site.appStoreUrl || site.playStoreUrl)

  return (
    <footer className="site-footer">
      {hasApps && (
        <div className="site-footer__apps">
          <div className="container site-footer__apps-inner">
            <p className="site-footer__apps-title">{site.appTitle}</p>
            <div className="site-footer__badges">
              {site.appStoreUrl && (
                <a href={site.appStoreUrl} target="_blank" rel="noopener noreferrer" aria-label="App Store">
                  {appStoreBadge ? <Image src={appStoreBadge} alt="App Store" width={135} height={40} unoptimized /> : 'App Store'}
                </a>
              )}
              {site.playStoreUrl && (
                <a href={site.playStoreUrl} target="_blank" rel="noopener noreferrer" aria-label="Google Play">
                  {playStoreBadge ? <Image src={playStoreBadge} alt="Google Play" width={135} height={40} unoptimized /> : 'Google Play'}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div className="site-footer__top">
          {logo && <Image src={logo} alt={siteName} width={166} height={40} className="site-footer__logo" unoptimized />}
          <div className="site-footer__cols">
            {site.footerColumns.map(col => (
              <nav key={col.id} className="site-footer__col" aria-label={col.title}>
                <h3 className="site-footer__heading">{col.title}</h3>
                <ul>
                  {col.links.map(l => <li key={l.id}><SmartLink link={l} /></li>)}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="site-footer__bottom">
          {site.socialLinks.length > 0 && (
            <ul className="site-footer__social">
              {site.socialLinks.map(s => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.network}>
                    <SocialIcon network={s.network} />
                  </a>
                </li>
              ))}
            </ul>
          )}
          <ul className="site-footer__legal">
            {site.legalLinks.map(l => <li key={l.id}><SmartLink link={l} /></li>)}
          </ul>
          {site.copyright && <p className="site-footer__copy">{site.copyright}</p>}
        </div>
      </div>
    </footer>
  )
}
