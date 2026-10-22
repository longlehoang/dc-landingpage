import { formatDate, formatNumber, formatPercent } from '@/lib/format'
import type { Locale } from '@/lib/i18n'
import type { FundContent } from '@/lib/types'
import { fundLabels } from './labels'
import { thinSeries } from './series'
import TimeChart, { type RangeKey } from './TimeChart'
import type { Point } from './types'

export const FUND_COLOR = '#00bf6f'
export const BENCHMARK_COLOR = '#ff671b'
const TABLE_PERIODS = ['3M', '1Y', '3Y']

/** "Thông tin / Tại ngày …" hover/focus tooltip next to a row label. */
export function InfoTip({ text, label }: { text: string; label: string }) {
  return (
    <span className="fund-tip" tabIndex={0} aria-label={`${label}: ${text}`}>
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6.2 6.2a1.8 1.8 0 1 1 2.6 1.6c-.5.3-.8.6-.8 1.2v.4M8 11.4v.2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <span className="fund-tip__bubble" role="tooltip"><strong>{label}</strong>{text}</span>
    </span>
  )
}

const pct = (v: number | null | undefined, locale: Locale) => (v === null || v === undefined ? 'N/A' : formatPercent(v, locale))

/** Performance tab: cumulative return table and the NAV vs benchmark line chart. */
export default function Performance({ fund, locale }: { fund: FundContent; locale: Locale }) {
  const t = fundLabels[locale]
  const fundName = fund.ticker ?? fund.code
  const perf = new Map((fund.performance ?? []).map(p => [p.period, p]))
  const showTable = fund.fundType !== 'PENSION' && !!fund.latestNav
  const lastBenchmark = fund.benchmarkHistory?.at(-1)
  const benchmarkNav = lastBenchmark?.value ?? null
  const benchmarkDate = lastBenchmark?.date ?? fund.benchmarkLatest?.navDate ?? null

  const navSeries = thinSeries((fund.navHistory ?? []).map((p): Point => [p.date, p.cumReturnPct]))
  const benchmarkSeries = fund.benchmarkHidden ? [] : thinSeries((fund.benchmarkHistory ?? []).map((p): Point => [p.date, p.cumReturnPct]))
  const ranges: RangeKey[] = ['YTD', '3M', '1Y', '3Y', '5Y', 'ALL']

  return (
    <>
      {showTable && (
        <section className="container fund-section" aria-labelledby="fund-perf-title">
          <header className="fund-section__head">
            <h2 id="fund-perf-title" className="fund-h2 fund-h2--center">{t.cumulativeReturns}</h2>
            <p className="fund-section__sub">
              <span>{t.currency}</span>
              {fund.inceptionDate && <span>{t.inception}: {formatDate(fund.inceptionDate)}</span>}
            </p>
          </header>
          <div className="fund-table-wrap">
            <table className="fund-table fund-perf__table">
              <thead>
                <tr>
                  <td />
                  <th scope="col" className="num">{t.navPrice}</th>
                  {TABLE_PERIODS.map(p => <th key={p} scope="col" className="num">{t.periods[p]}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">
                    {fundName}
                    {fund.latestNav?.navDate && <InfoTip label={t.info} text={`${t.asOf} ${formatDate(fund.latestNav.navDate)}`} />}
                  </th>
                  <td className="num">{fund.latestNav ? formatNumber(fund.latestNav.nav, locale) : '–'}</td>
                  {TABLE_PERIODS.map(p => <td key={p} className="num">{pct(perf.get(p)?.fund, locale)}</td>)}
                </tr>
                {fund.benchmarkName && (
                  <tr>
                    <th scope="row">
                      {fund.benchmarkName}
                      {benchmarkDate && !fund.benchmarkHidden && <InfoTip label={t.info} text={`${t.asOf} ${formatDate(benchmarkDate)}`} />}
                    </th>
                    <td className="num">{benchmarkNav !== null && !fund.benchmarkHidden ? formatNumber(benchmarkNav, locale) : 'N/A'}</td>
                    {TABLE_PERIODS.map(p => (
                      <td key={p} className="num">{fund.benchmarkHidden ? 'N/A' : pct(perf.get(p)?.benchmark, locale)}</td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {fund.performanceRemark && <p className="fund-remark">{fund.performanceRemark}</p>}
        </section>
      )}
      {navSeries.length > 1 && (
        <section className="fund-band" aria-labelledby="fund-chart-title">
          <div className="container fund-section">
            <h2 id="fund-chart-title" className="fund-h2 fund-h2--center">{t.historicalPerformance}</h2>
            <TimeChart
              series={[
                { name: fundName, color: FUND_COLOR, points: navSeries },
                ...(benchmarkSeries.length && fund.benchmarkName ? [{ name: fund.benchmarkName, color: BENCHMARK_COLOR, points: benchmarkSeries }] : []),
              ]}
              ranges={ranges}
              defaultRange="ALL"
              rebase
              format="percent"
              locale={locale}
              labels={{ zoom: t.zoom, ranges: t.ranges, from: t.rangeFrom, to: t.rangeTo, chartLabel: t.chartLabel }}
            />
          </div>
        </section>
      )}
    </>
  )
}
