import { formatDate, formatNumber, formatPercent } from '@/lib/format'
import type { Locale } from '@/lib/i18n'
import type { FundContent } from '@/lib/types'
import { fundLabels } from './labels'
import { BENCHMARK_COLOR, FUND_COLOR, InfoTip } from './Performance'
import { thinSeries } from './series'
import TimeChart, { type RangeKey } from './TimeChart'
import type { FundPricing, Point } from './types'

const signed = (v: number, locale: Locale, digits = 2) => `${v > 0 ? '+' : ''}${formatNumber(v, locale, digits)}`
const signedPct = (v: number, locale: Locale) => `${v > 0 ? '+' : ''}${formatPercent(v, locale)}`
const num = (v: number | null | undefined, locale: Locale) => (v === null || v === undefined ? '–' : formatNumber(v, locale))

function points<T extends unknown[]>(rows: T[] | undefined, col: number): Point[] {
  return (rows ?? []).flatMap(r => (typeof r[col] === 'number' ? [[r[0] as string, r[col] as number] as Point] : []))
}

/** ETF "Tình hình giao dịch" tab: NAV vs market price, trading charts and the creation/redemption table. */
export default function Pricing({ fund, pricing, locale }: { fund: FundContent; pricing: FundPricing; locale: Locale }) {
  const t = fundLabels[locale]
  const ticker = pricing.ticker ?? fund.ticker ?? fund.code
  const nav = fund.latestNav
  const close = pricing.latestClose ?? {}
  const chart = pricing.series?.chart
  const lastVolume = chart?.findLast(r => typeof r[3] === 'number')?.[3] ?? null
  const chartLabels = { zoom: t.zoom, ranges: t.ranges, from: t.rangeFrom, to: t.rangeTo, chartLabel: t.tradingInfo }
  const ranges: RangeKey[] = ['3M', '1Y', '3Y', '5Y', 'ALL']
  const chartRows = thinSeries(chart ?? [])
  const navPoints = points(chartRows, 1)
  const pricePoints = points(chartRows, 2)
  const volumePoints = points(chartRows, 3)
  const premiumPoints = points(thinSeries(pricing.series?.premium ?? []), 2)
  // Outstanding units are reported as 0 while the fund is suspended for rebalancing; skip those days.
  const issuedPoints = points(thinSeries(pricing.series?.primary ?? []), 1).filter(p => p[1] > 0)
  const cr = pricing.creationRedemption
  const remark = (key: string) => pricing.remarks?.[key]?.[locale]

  const crRows: { key: string; label: string; sub?: boolean; group?: boolean }[] = [
    { key: 'additionalLots', label: t.creationRows.additionalLots },
    { key: 'buybackLots', label: t.creationRows.buybackLots },
    { key: 'issuedShare', label: t.creationRows.issuedShare },
    { key: 'closingPrice', label: t.creationRows.closingPrice },
    { key: 'nav', label: t.creationRows.nav, group: true },
    { key: 'navAssetValue', label: t.creationRows.navAssetValue, sub: true },
    { key: 'navAssetPerLot', label: t.creationRows.navAssetPerLot, sub: true },
    { key: 'navPerShare', label: t.creationRows.navPerShare, sub: true },
    { key: 'benchMarkIndex', label: t.creationRows.benchMarkIndex },
  ]

  return (
    <>
      <section className="container fund-section" aria-labelledby="fund-market-title">
        <header className="fund-section__head">
          <h2 id="fund-market-title" className="fund-h2 fund-h2--center">{t.navMarketPrice}</h2>
          <p className="fund-section__sub"><span>{t.secondaryTrading}</span></p>
        </header>
        <div className="fund-table-wrap">
          <table className="fund-table fund-market__table">
            <thead>
              <tr>
                <td />
                <th scope="col" className="num">{t.navPriceCol}</th>
                <th scope="col" className="num">{t.avgVolume}</th>
                <th scope="col" className="num">{t.dailyChange}</th>
                <th scope="col" className="num">{t.ytdChange}</th>
                <th scope="col" className="num">{t.premiumDiscount}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="rowgroup" rowSpan={2}>{ticker}</th>
                <td className="num">
                  {num(nav?.nav, locale)}
                  {nav?.navDate && <InfoTip label={t.info} text={`${t.asOf} ${formatDate(nav.navDate)}`} />}
                </td>
                <td className="num">{num(pricing.avgVolume30d, locale)}</td>
                <td className="num">{nav?.change !== undefined && nav.changePct !== undefined ? `${formatNumber(nav.change, locale)} / ${signedPct(nav.changePct, locale)}` : '–'}</td>
                <td className="num">{typeof nav?.ytd === 'number' ? formatPercent(nav.ytd, locale) : '–'}</td>
                <td className="num">{num(close.deltaChangeWithNav, locale)}</td>
              </tr>
              <tr>
                <td className="num">
                  {num(close.closePrice, locale)}
                  {close.date && <InfoTip label={t.info} text={`${t.asOf} ${formatDate(close.date)}`} />}
                </td>
                <td className="num">{num(lastVolume, locale)}</td>
                <td className="num">
                  {close.dailyPriceChange !== undefined && close.dailyPriceChangePercentage !== undefined
                    ? `${formatNumber(close.dailyPriceChange, locale)} / ${signedPct(close.dailyPriceChangePercentage, locale)}`
                    : '–'}
                </td>
                <td className="num">{close.yearToDateChangePercentage !== undefined ? formatPercent(close.yearToDateChangePercentage, locale) : '–'}</td>
                <td className="num">{close.deltaChangeWithNavPercentage !== undefined ? formatPercent(close.deltaChangeWithNavPercentage, locale) : '–'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="fund-band" aria-labelledby="fund-trading-title">
        <div className="container fund-section">
          <h2 id="fund-trading-title" className="fund-h2 fund-h2--center">{t.tradingInfo}</h2>
          {navPoints.length > 1 && (
            <div className="fund-chart-block">
              <h3 className="fund-h3"><span className="fund-h3__eyebrow">{t.secondaryTrading}</span>{t.nav} / {t.price}</h3>
              <TimeChart
                series={[
                  { name: t.nav, color: FUND_COLOR, points: navPoints },
                  { name: t.price, color: BENCHMARK_COLOR, points: pricePoints },
                  { name: t.volume, color: '#d1d9d7', kind: 'bar', axis: 'right', points: volumePoints },
                ]}
                ranges={ranges}
                defaultRange="3M"
                format="number"
                rightFormat="number"
                locale={locale}
                labels={chartLabels}
              />
            </div>
          )}
          {premiumPoints.length > 1 && (
            <div className="fund-chart-block">
              <h3 className="fund-h3"><span className="fund-h3__eyebrow">{t.secondaryTrading}</span>{t.premiumDiscount}</h3>
              <TimeChart
                series={[{ name: t.premiumDiscount, color: '#5fd6a0', kind: 'bar', points: premiumPoints }]}
                ranges={ranges}
                defaultRange="3M"
                format="percent"
                locale={locale}
                labels={chartLabels}
                height={300}
              />
            </div>
          )}
          {issuedPoints.length > 1 && (
            <div className="fund-chart-block">
              <h3 className="fund-h3"><span className="fund-h3__eyebrow">{t.primaryTrading}</span>{t.outstandingUnits}</h3>
              <TimeChart
                series={[{ name: t.outstandingUnits, color: '#ff8043', points: issuedPoints }]}
                ranges={ranges}
                defaultRange="3M"
                format="number"
                locale={locale}
                labels={chartLabels}
                height={300}
              />
            </div>
          )}
          {cr && (
            <div className="fund-chart-block">
              <h3 className="fund-h3"><span className="fund-h3__eyebrow">{t.primaryTrading}</span>{t.exchangeTrading}</h3>
              <p className="fund-section__sub fund-section__sub--left"><span>{t.date}: {formatDate(cr.date)}</span></p>
              <div className="fund-table-wrap">
                <table className="fund-table fund-cr__table">
                  <thead>
                    <tr>
                      <th scope="col">{t.criteria}</th>
                      <th scope="col" className="num">{t.thisPeriod} {cr.date}</th>
                      <th scope="col" className="num">{t.lastPeriod} {cr.lastDate ?? ''}</th>
                      <th scope="col" className="num">{t.difference}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crRows.map(r => {
                      const v = cr.rows[r.key]
                      return (
                        <tr key={r.key} className={r.sub ? 'fund-cr__sub' : undefined}>
                          <th scope="row">{r.label}</th>
                          <td className="num">{r.group ? '' : num(v?.current, locale)}</td>
                          <td className="num">{r.group ? '' : num(v?.last, locale)}</td>
                          <td className="num">{r.group || v?.difference === undefined || v.difference === null ? '' : signed(v.difference, locale)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {cr.navDate && remark('firstExchangeTradingRemark') && <p className="fund-remark">{remark('firstExchangeTradingRemark')} {cr.navDate}</p>}
              {cr.lastNavDate && remark('secondExchangeTradingRemark') && <p className="fund-remark">{remark('secondExchangeTradingRemark')} {cr.lastNavDate}</p>}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
