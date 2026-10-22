import type { ReactNode } from 'react'
import { getFundDocumentMeta } from '@/lib/fund'
import type { FundContent } from '@/lib/types'
import Blocks from '../blocks/Blocks'
import type { BlockContext } from '../blocks/context'
import FundDocuments from './FundDocuments'
import FundHero from './FundHero'
import FundTabs from './FundTabs'
import { fundLabels } from './labels'
import NavHistory from './NavHistory'
import Overview from './Overview'
import Performance from './Performance'
import Portfolio from './Portfolio'
import Pricing from './Pricing'
import type { FundPricing, Point } from './types'

const round2 = (v: number) => Math.round(v * 100) / 100

async function documentMeta(fundCode: string | null, locale: BlockContext['locale']) {
  if (!fundCode) return { years: [], fundLabel: '' }
  try {
    return await getFundDocumentMeta(fundCode, locale)
  } catch {
    return { years: [], fundLabel: fundCode }
  }
}

/** Fund product page: hero, sticky tabs (overview, performance, [pricing], portfolio, documents), then CMS sections. */
export default async function FundPage({ fund, ctx }: { fund: FundContent; ctx: BlockContext }) {
  const { locale } = ctx
  const t = fundLabels[locale]
  const pricing = (fund.pricing ?? null) as FundPricing | null
  // The document collection uses the regulatory fund codes (VF1, VFC, VFMVN30…), i.e. `fund.fundCode`.
  const docs = await documentMeta(fund.fundCode, locale)
  const contact = fund.sections?.find(s => s.__component === 'blocks.contact-form')
  const contactAnchor = contact?.anchor ?? 'contact'

  const navSeries: Point[] = (fund.navHistory ?? []).map(p => [p.date, round2(p.nav)])
  const hasNavHistory = navSeries.length > 0 || (fund.navHistoryRecent?.length ?? 0) > 0

  const tabs: { key: string; label: string }[] = [
    { key: 'overview', label: t.tabs.overview },
    { key: 'performance', label: t.tabs.performance },
    ...(pricing ? [{ key: 'pricing', label: t.tabs.pricing }] : []),
    { key: 'portfolio', label: t.tabs.portfolio },
    { key: 'documents', label: t.tabs.documents },
  ]

  const panels: Record<string, ReactNode> = {
    overview: <Overview fund={fund} locale={locale} hasNavHistory={hasNavHistory} />,
    performance: <Performance fund={fund} locale={locale} />,
    pricing: pricing ? <Pricing fund={fund} pricing={pricing} locale={locale} /> : null,
    portfolio: <Portfolio fund={fund} locale={locale} />,
    documents: fund.fundCode ? (
      <FundDocuments
        fundCode={fund.fundCode}
        fundLabel={docs.fundLabel}
        years={docs.years}
        locale={locale}
        labels={{
          fundDocuments: t.fundDocuments, docColumns: t.docColumns, year: t.year, download: t.download, expand: t.expand,
          loading: t.loading, noDocuments: t.noDocuments, loadFailed: t.loadFailed, showMore: t.showMore,
        }}
      />
    ) : null,
  }

  const navHistory = hasNavHistory ? (
    <NavHistory
      series={navSeries}
      recent={(fund.navHistoryRecent ?? []).map(r => ({ date: r.date, nav: r.nav, change: r.change, changePct: r.changePct }))}
      locale={locale}
      labels={{
        backToOverview: t.backToOverview, navHistory: t.navHistory, from: t.from, to: t.to, date: t.date,
        navPrice: t.navPrice, change: t.change, noData: t.noData, showMore: t.showMore,
      }}
    />
  ) : undefined

  return (
    <article className="fund-page">
      <FundHero fund={fund} locale={locale} contactAnchor={contactAnchor} />
      <FundTabs label={t.tabsLabel} tabs={tabs} panels={panels} navHistory={navHistory} />
      {fund.sections?.length > 0 && <Blocks blocks={fund.sections} ctx={ctx} />}
    </article>
  )
}
