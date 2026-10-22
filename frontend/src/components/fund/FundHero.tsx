import type { Locale } from '@/lib/i18n'
import type { FundContent } from '@/lib/types'
import { ArrowRight, TrendTriangle } from '../Icons'
import { fundLabels } from './labels'

/** Dark green product hero: category pill, ticker title, name, tagline, CTA, prospectus link and 4 stat columns. */
export default function FundHero({ fund, locale, contactAnchor }: { fund: FundContent; locale: Locale; contactAnchor: string }) {
  const t = fundLabels[locale]
  const stats = fund.heroStats ?? []
  return (
    <section className="fund-hero" aria-labelledby="fund-title">
      <div className="fund-hero__shapes" aria-hidden="true">
        <svg className="fund-hero__corner" viewBox="0 0 80 90" preserveAspectRatio="none"><path d="M0 0h80L0 90z" /></svg>
        <svg className="fund-hero__wedge" viewBox="0 0 200 600" preserveAspectRatio="none"><path d="M200 0C130 150 70 350 45 600h155z" /></svg>
      </div>
      <div className="container fund-hero__inner">
        <div className="fund-hero__top">
          <div className="fund-hero__intro">
            {fund.category && <span className="pill fund-hero__pill">{fund.category}</span>}
            <h1 id="fund-title" className="fund-hero__title">{fund.displayName}</h1>
            {fund.name && <p className="fund-hero__name">{fund.name}</p>}
            {fund.tagline && <p className="fund-hero__tagline">{fund.tagline}</p>}
            {fund.ctaLabel && (
              fund.ctaAction === 'dragonx'
                ? <button type="button" data-dragonx className="btn btn--pill fund-hero__cta">{fund.ctaLabel}</button>
                : <a href={`#${contactAnchor}`} className="btn btn--pill fund-hero__cta">{fund.ctaLabel}</a>
            )}
          </div>
          {fund.heroDownloads?.length > 0 && (
            <ul className="fund-hero__downloads">
              {fund.heroDownloads.map(d => (
                <li key={d.id}>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="fund-hero__download">
                    {d.label || t.prospectus}
                    <span className="fund-hero__download-icon"><ArrowRight /></span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {stats.length > 0 && (
          <dl className="fund-hero__stats">
            {stats.map((s, i) => (
              <div key={i} className="fund-hero__stat">
                <dt>
                  <span className="fund-hero__stat-label">{s.label}</span>
                  {s.asOf && <span className="fund-hero__stat-asof">{s.asOf}</span>}
                </dt>
                <dd className="fund-hero__stat-value">
                  {s.trend && <TrendTriangle up={s.trend === 'up'} />}
                  {s.value || '—'}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}
