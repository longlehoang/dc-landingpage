import { formatDate, formatNumber, formatPercent } from '@/lib/format'
import type { Locale } from '@/lib/i18n'
import type { FundContent } from '@/lib/types'
import Allocation from './Allocation'
import { fundLabels } from './labels'
import type { FundAllocation, Holding, PortfolioStats, StatPair } from './types'

const FUNDAMENTAL_KEYS = ['pe', 'pb', 'roe', 'divYld', 'numberOfHolding']
const RISK_KEYS = ['beta', 'standardDeviation', 'sharpeRatio']

function StatsTable({ title, keys, stats, fundLabel, benchmarkLabel, labels, locale }: {
  title: string
  keys: string[]
  stats: Record<string, StatPair> | undefined
  fundLabel: string
  benchmarkLabel: string
  labels: Record<string, string>
  locale: Locale
}) {
  const rows = keys.filter(k => typeof stats?.[k]?.fund === 'number')
  if (!rows.length) return null
  const val = (v: number | null | undefined, k: string) =>
    typeof v !== 'number' ? '–' : formatNumber(v, locale, k === 'numberOfHolding' ? 0 : 2)
  return (
    <div className="fund-table-wrap">
      <table className="fund-table fund-stats__table">
        <thead>
          <tr>
            <th scope="col">{title}</th>
            <th scope="col" className="num">{fundLabel}</th>
            <th scope="col" className="num">{benchmarkLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(k => (
            <tr key={k}>
              <th scope="row">{labels[k] ?? k}</th>
              <td className="num">{val(stats?.[k]?.fund, k)}</td>
              <td className="num">{val(stats?.[k]?.benchmark, k)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Portfolio tab: fundamental/risk statistics, allocation donut and top-10 holdings. */
export default function Portfolio({ fund, locale }: { fund: FundContent; locale: Locale }) {
  const t = fundLabels[locale]
  const stats = (fund.portfolioStats ?? null) as PortfolioStats | null
  const allocation = (fund.allocation ?? null) as FundAllocation | null
  const holdings = ((fund.topHoldings ?? []) as Holding[]).slice(0, 10)
  const isEtf = fund.fundType === 'ETF'
  const hasStats = !!stats && (stats.fundamental?.pe?.fund ?? 0) > 0
  const asOf = allocation?.custom?.asOfDate ?? stats?.asOfDate ?? null
  const asOfText = asOf ? `${t.asOf} ${formatDate(asOf)}` : null

  const views = allocation?.custom
    ? [{ key: 'custom', label: t.assetTypes, items: allocation.custom.items }]
    : [
        ...((allocation?.sectors?.length ?? 0) > 1 ? [{ key: 'sectors', label: t.sectors, items: allocation!.sectors! }] : []),
        ...(allocation?.assetTypes?.length ? [{ key: 'assetTypes', label: t.assetTypes, items: allocation.assetTypes }] : []),
      ]
  const totalWeight = holdings.reduce((s, h) => s + (h.weight ?? 0), 0)

  return (
    <>
      {hasStats && stats && (
        <section className="container fund-section" aria-labelledby="fund-stats-title">
          <header className="fund-section__head">
            <h2 id="fund-stats-title" className="fund-h2 fund-h2--center">{t.portfolioStats}</h2>
            {stats.asOfDate && <p className="fund-section__sub"><span>{t.asOf} {formatDate(stats.asOfDate)}</span></p>}
          </header>
          <div className="fund-stats">
            <StatsTable
              title={t.fundamentalRatios}
              keys={FUNDAMENTAL_KEYS}
              stats={stats.fundamental}
              fundLabel={stats.fundLabel ?? fund.ticker ?? fund.code}
              benchmarkLabel={stats.benchmarkLabel ?? 'VN Index'}
              labels={t.ratios}
              locale={locale}
            />
            <StatsTable
              title={t.riskRatios}
              keys={RISK_KEYS}
              stats={stats.risk}
              fundLabel={stats.fundLabel ?? fund.ticker ?? fund.code}
              benchmarkLabel={stats.benchmarkLabel ?? 'VN Index'}
              labels={t.ratios}
              locale={locale}
            />
          </div>
        </section>
      )}
      {views.length > 0 && (
        <section className="container fund-section" aria-labelledby="fund-alloc-title">
          <header className="fund-section__head">
            <h2 id="fund-alloc-title" className="fund-h2 fund-h2--center">{t.allocation}</h2>
            {asOfText && <p className="fund-section__sub"><span>{asOfText}</span></p>}
          </header>
          <Allocation views={views} locale={locale} groupLabel={t.allocation} />
        </section>
      )}
      {holdings.length > 0 && (
        <section className="container fund-section" aria-labelledby="fund-holdings-title">
          <header className="fund-section__head">
            <h2 id="fund-holdings-title" className="fund-h2 fund-h2--center">{t.topHoldings}</h2>
            {stats?.asOfDate && <p className="fund-section__sub"><span>{t.asOf} {formatDate(stats.asOfDate)}</span></p>}
          </header>
          <div className="fund-table-wrap">
            <table className="fund-table fund-holdings__table">
              <thead>
                <tr>
                  <th scope="col">{t.stock}</th>
                  {isEtf ? (
                    <>
                      <th scope="col" className="num">{t.shares}</th>
                      <th scope="col" className="num">{t.value}</th>
                    </>
                  ) : (
                    <th scope="col">{t.sector}</th>
                  )}
                  <th scope="col" className="num">{t.weight}</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <tr key={h.ticker}>
                    <th scope="row">{h.ticker}</th>
                    {isEtf ? (
                      <>
                        <td className="num">{typeof h.holdingVolume === 'number' ? formatNumber(h.holdingVolume, locale, 0) : '–'}</td>
                        <td className="num">{typeof h.marketValue === 'number' ? formatNumber(h.marketValue, locale, 0) : '–'}</td>
                      </>
                    ) : (
                      <td>{h.sector ?? '–'}</td>
                    )}
                    <td className="num">{formatPercent(h.weight, locale, 1)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{t.total}</th>
                  {isEtf ? <><td className="num">-</td><td className="num">-</td></> : <td />}
                  <td className="num">{formatPercent(totalWeight, locale, 1)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
