import Image from 'next/image'
import type { Locale } from '@/lib/i18n'
import { mediaUrl } from '@/lib/strapi'
import type { FundContent } from '@/lib/types'
import Markdown from '../Markdown'
import { ArrowRight } from '../Icons'
import { fundLabels, NAV_HISTORY_HASH } from './labels'

/** Overview tab: objective, strategy, managers (left) and the key facts card (right). */
export default function Overview({ fund, locale, hasNavHistory }: { fund: FundContent; locale: Locale; hasNavHistory: boolean }) {
  const t = fundLabels[locale]
  return (
    <div className="container fund-section fund-overview">
      <div className="fund-overview__main">
        {fund.objective && (
          <section className="fund-overview__block">
            <h2 className="fund-h2">{fund.objectiveTitle}</h2>
            <Markdown locale={locale} className="fund-prose">{fund.objective}</Markdown>
          </section>
        )}
        {fund.strategy && (
          <section className="fund-overview__block">
            <h2 className="fund-h2">{fund.strategyTitle}</h2>
            <Markdown locale={locale} className="fund-prose">{fund.strategy}</Markdown>
          </section>
        )}
        {fund.managers?.length > 0 && (
          <section className="fund-overview__block">
            {fund.managersTitle && <h2 className="fund-h2">{fund.managersTitle}</h2>}
            <ul className="fund-managers">
              {fund.managers.map(m => {
                const photo = mediaUrl(m.photo)
                return (
                  <li key={m.id} className="fund-manager">
                    {photo
                      ? <Image className="fund-manager__photo" src={photo} alt={m.photo?.alternativeText ?? m.name} width={48} height={48} />
                      : <span className="fund-manager__photo" aria-hidden="true" />}
                    <div>
                      <p className="fund-manager__name">{m.name}</p>
                      {m.role && <p className="fund-manager__role">{m.role}</p>}
                      {m.stats?.length > 0 && (
                        <dl className="fund-manager__stats">
                          {m.stats.map(s => (
                            <div key={s.id}>
                              <dt>{s.label}</dt>
                              <dd>{s.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
      <aside className="fund-facts" aria-labelledby="fund-facts-title">
        <h2 id="fund-facts-title" className="fund-facts__title">{fund.keyFactsTitle ?? t.tabs.overview}</h2>
        <dl className="fund-facts__list">
          {fund.keyFacts.map(k => (
            <div key={k.id} className="fund-facts__row">
              <dt>{k.label}</dt>
              <dd>{(k.value ?? '').split('\n').map((line, i) => <span key={i}>{line}</span>)}</dd>
            </div>
          ))}
          {hasNavHistory && (
            <div className="fund-facts__row">
              <dt>{t.navHistory}</dt>
              <dd>
                <a className="fund-facts__link" href={`#${NAV_HISTORY_HASH}`}>
                  {t.navHistoryButton} <ArrowRight />
                </a>
              </dd>
            </div>
          )}
        </dl>
      </aside>
    </div>
  )
}
