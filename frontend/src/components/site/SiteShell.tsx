import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import { ui } from '@/lib/i18n'
import { getGlobal, getSite, mediaUrl } from '@/lib/strapi'
import type { SiteKey } from '@/lib/types'
import { AppPromoContent } from '../blocks/content'
import AppModal from './AppModal'
import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'

const homes: Record<SiteKey, string> = { corporate: '/', individual: '/individual', institution: '/institution', regulatory: '/regulatory' }

/** Header, footer, DragonX dialog and Zalo button of one sub-site around the page content. */
export default async function SiteShell({ siteKey, locale, path, children }: { siteKey: SiteKey; locale: Locale; path: string; children: ReactNode }) {
  const [site, global] = await Promise.all([getSite(siteKey, locale), getGlobal(locale)])
  const t = ui[locale]
  const siteName = global.siteName

  return (
    <>
      {site && (
        <SiteHeader
          locale={locale}
          ui={t}
          path={path}
          homeHref={homes[siteKey]}
          siteName={siteName}
          label={site.label}
          logoUrl={mediaUrl(site.logo) ?? mediaUrl(global.logo)}
          nav={site.nav}
          cta={site.headerCta}
        />
      )}
      <main id="main">{children}</main>
      {site && <SiteFooter site={site} siteName={siteName} />}
      {site?.appModal && (
        <AppModal closeLabel={t.close}>
          <AppPromoContent data={site.appModal} variant="modal" />
        </AppModal>
      )}
      {site?.zaloUrl && (
        <a className="zalo-button" href={site.zaloUrl} target="_blank" rel="noopener noreferrer" aria-label="Zalo">
          Zalo
        </a>
      )}
    </>
  )
}
