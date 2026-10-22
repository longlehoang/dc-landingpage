import Image from 'next/image'
import Link from 'next/link'
import { localizeHref } from '@/lib/i18n'
import { formatPercent } from '@/lib/format'
import { getFundSummaries, mediaUrl } from '@/lib/strapi'
import type { FundCardsBlock } from '@/lib/types'
import { ArrowRight, TrendTriangle } from '../Icons'
import type { BlockContext } from './context'

const periodLabels = {
  vi: { '1M': '1 tháng', '3M': '3 tháng', ytd: 'Từ đầu năm', '1Y': '1 năm', '3Y': '3 năm', '5Y': '5 năm', '12M': '12 tháng' },
  en: { '1M': '1 Month', '3M': '3 Months', ytd: 'YTD', '1Y': '1 Year', '3Y': '3 Years', '5Y': '5 Years', '12M': '12 Months' },
} as const

/** Fund solution cards; the return figure comes from the fund's latest NAV snapshot. */
export default async function FundCards({ block, ctx }: { block: FundCardsBlock; ctx: BlockContext }) {
  const summaries = await getFundSummaries(ctx.locale)
  const audience = ctx.site === 'institution' ? 'institution' : 'individual'

  return (
    <section id={block.anchor ?? undefined} className="fund-cards section">
      <div className="container fund-cards__grid">
        <div className="section-head section-head--light">
          {block.eyebrow && <p className="eyebrow">{block.eyebrow}</p>}
          {block.title && <h2 className="section-head__title">{block.title}</h2>}
          {block.subtitle && <p className="section-head__subtitle">{block.subtitle}</p>}
        </div>
        <ul className="fund-cards__list">
          {block.funds.map(card => {
            const fund =
              summaries.find(f => f.slug === card.fundSlug && f.audience === audience) ??
              summaries.find(f => f.slug === card.fundSlug)
            const period = card.returnPeriod
            const value = period && fund?.latestNav ? (fund.latestNav[period] as number | undefined) : undefined
            const icon = mediaUrl(card.icon)
            const href = fund?.hasProductPage ? localizeHref(`/${fund.audience}/product/${fund.slug}`, ctx.locale) : null
            const body = (
              <>
                {icon && <Image className="fund-card__icon" src={icon} alt="" width={48} height={48} unoptimized />}
                {(card.tag ?? fund?.category) && <span className="pill">{card.tag ?? fund?.category}</span>}
                <h3 className="fund-card__name">{card.title ?? fund?.displayName}</h3>
                {card.subtitle && <p className="fund-card__subtitle">{card.subtitle}</p>}
                {(card.text ?? fund?.tagline) && <p className="fund-card__text">{card.text ?? fund?.tagline}</p>}
                {period && value != null && (
                  <div className="fund-card__return">
                    <span className="fund-card__period">{periodLabels[ctx.locale][period]}</span>
                    <span className="fund-card__value">
                      <TrendTriangle up={value >= 0} />
                      {formatPercent(value, ctx.locale)}
                    </span>
                  </div>
                )}
                {href && <span className="fund-card__arrow"><ArrowRight /></span>}
              </>
            )
            return (
              <li key={card.id}>
                {href ? <Link href={href} className="fund-card">{body}</Link> : <div className="fund-card">{body}</div>}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
