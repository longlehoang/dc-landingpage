'use client'

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { formatDate, formatNumber, formatPercent } from '@/lib/format'
import type { Locale } from '@/lib/i18n'
import type { Point } from './types'

export type RangeKey = 'YTD' | '3M' | '1Y' | '3Y' | '5Y' | 'ALL'

export interface ChartSeries {
  name: string
  color: string
  kind?: 'line' | 'bar'
  /** Bars and lines on the right axis get their own scale (e.g. volume). */
  axis?: 'left' | 'right'
  points: Point[]
}

type ValueFormat = 'percent' | 'number' | 'decimal'

interface Props {
  series: ChartSeries[]
  ranges: RangeKey[]
  defaultRange: RangeKey
  /** Rebase cumulative-return series (in %) to 0 at the start of the selected range. */
  rebase?: boolean
  format: ValueFormat
  rightFormat?: ValueFormat
  locale: Locale
  labels: { zoom: string; ranges: Record<RangeKey, string>; from: string; to: string; chartLabel: string }
  height?: number
  legend?: boolean
}

const DAY = 86_400_000
const toTime = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`)

function rangeStart(range: RangeKey, end: string): string | null {
  if (range === 'ALL') return null
  const d = new Date(toTime(end))
  if (range === 'YTD') return `${d.getUTCFullYear()}-01-01`
  const months = { '3M': 3, '1Y': 12, '3Y': 36, '5Y': 60 }[range]
  d.setUTCMonth(d.getUTCMonth() - months)
  return d.toISOString().slice(0, 10)
}

/** Points of the range; lines keep the last point before the start as their base. */
function slicePoints(points: Point[], start: string | null, keepBase: boolean): Point[] {
  if (!start) return points
  let i = points.findIndex(p => p[0] >= start)
  if (i < 0) return []
  if (keepBase && i > 0) i -= 1
  return points.slice(i)
}

function niceTicks(min: number, max: number, count = 6): number[] {
  if (!isFinite(min) || !isFinite(max)) return [0]
  if (min === max) { min -= 1; max += 1 }
  const raw = (max - min) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) ?? raw
  const ticks: number[] = []
  for (let v = Math.floor(min / step) * step; v <= max + step * 0.001; v += step) ticks.push(Number(v.toFixed(10)))
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

function fmt(v: number, f: ValueFormat, locale: Locale, tick = false) {
  if (f === 'percent') return formatPercent(v, locale, tick ? (Math.abs(v) < 10 && v % 1 !== 0 ? 1 : 0) : 2)
  if (f === 'decimal') return formatNumber(v, locale, 2)
  return formatNumber(v, locale, 0)
}

/** Nearest index in a date-sorted series at or before `t`. */
function indexAt(points: Point[], t: number) {
  let lo = 0
  let hi = points.length - 1
  if (hi < 0 || toTime(points[0][0]) > t) return -1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (toTime(points[mid][0]) <= t) lo = mid
    else hi = mid - 1
  }
  return lo
}

/** Hand-rolled responsive SVG time-series chart (lines and bars, optional right axis, range pills). */
export default function TimeChart({ series, ranges, defaultRange, rebase, format, rightFormat = 'number', locale, labels, height = 360, legend = true }: Props) {
  const [range, setRange] = useState<RangeKey>(defaultRange)
  const [width, setWidth] = useState(960)
  const [hover, setHover] = useState<number | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width)
      if (w > 0) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const end = useMemo(() => series.reduce((m, s) => (s.points.length && s.points[s.points.length - 1][0] > m ? s.points[s.points.length - 1][0] : m), ''), [series])
  const start = end ? rangeStart(range, end) : null

  const visible = useMemo(
    () =>
      series.map(s => {
        const pts = slicePoints(s.points, start, s.kind !== 'bar')
        if (!rebase || s.kind === 'bar' || !pts.length) return { ...s, points: pts }
        const base = 1 + pts[0][1] / 100
        return { ...s, points: pts.map(([d, v]) => [d, ((1 + v / 100) / base - 1) * 100] as Point) }
      }),
    [series, start, rebase],
  )

  const all = visible.flatMap(s => s.points)
  if (!all.length) return null

  const hasRight = visible.some(s => s.axis === 'right' && s.points.length)
  const compact = width < 600
  const pad = { top: 16, bottom: 32, left: hasRight ? (compact ? 52 : 68) : 8, right: compact ? 52 : 72 }
  const plotW = Math.max(10, width - pad.left - pad.right)
  const plotH = height - pad.top - pad.bottom

  const tMin = Math.min(...visible.filter(s => s.points.length).map(s => toTime(s.points[0][0])))
  const tMax = toTime(end)
  const x = (t: number) => pad.left + (tMax === tMin ? plotW / 2 : ((t - tMin) / (tMax - tMin)) * plotW)

  const scaleFor = (axis: 'left' | 'right') => {
    const vals = visible.filter(s => (s.axis ?? 'left') === axis).flatMap(s => s.points.map(p => p[1]))
    const bars = visible.some(s => (s.axis ?? 'left') === axis && s.kind === 'bar')
    let min = Math.min(...vals, ...(bars ? [0] : []))
    let max = Math.max(...vals, ...(bars ? [0] : []))
    if (!vals.length) { min = 0; max = 1 }
    const ticks = niceTicks(min, max)
    const lo = ticks[0]
    const hi = ticks[ticks.length - 1]
    return { ticks, y: (v: number) => pad.top + plotH - ((v - lo) / (hi - lo || 1)) * plotH }
  }
  const left = scaleFor('left')
  const right = hasRight ? scaleFor('right') : null
  const leftAxisX = hasRight ? pad.left - 8 : width - pad.right + 8

  // x ticks: years for long spans, dates otherwise
  const span = tMax - tMin
  const xTicks: { t: number; label: string }[] = []
  if (span > 2 * 365 * DAY) {
    const y0 = new Date(tMin).getUTCFullYear() + 1
    const y1 = new Date(tMax).getUTCFullYear()
    const step = Math.max(1, Math.ceil((y1 - y0 + 1) / (compact ? 4 : 8)))
    for (let y = y0; y <= y1; y += step) xTicks.push({ t: Date.UTC(y, 0, 1), label: String(y) })
  } else {
    const n = compact ? 3 : 6
    for (let i = 0; i < n; i++) {
      const t = tMin + (span * i) / n
      xTicks.push({ t, label: formatDate(new Date(t).toISOString()) })
    }
  }

  const maxPoints = Math.max(50, Math.round(plotW))
  const linePath = (pts: Point[], y: (v: number) => number) => {
    const step = Math.max(1, Math.ceil(pts.length / maxPoints))
    let d = ''
    pts.forEach((p, i) => {
      if (i % step !== 0 && i !== pts.length - 1) return
      d += `${d ? 'L' : 'M'}${x(toTime(p[0])).toFixed(1)},${y(p[1]).toFixed(1)}`
    })
    return d
  }

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * width
    if (px < pad.left || px > pad.left + plotW) return setHover(null)
    setHover(tMin + ((px - pad.left) / plotW) * (tMax - tMin))
  }

  const hoverRows = hover === null ? [] : visible.map(s => ({ s, i: indexAt(s.points, hover) })).filter(r => r.i >= 0)
  const hoverDate = hoverRows.length ? hoverRows.map(r => r.s.points[r.i][0]).sort().pop()! : null
  const hoverX = hoverDate ? x(toTime(hoverDate)) : 0
  const firstDate = all.reduce((m, p) => (p[0] < m ? p[0] : m), all[0][0])

  return (
    <div className="fund-chart">
      <div className="fund-chart__toolbar">
        {ranges.length > 1 && (
          <div className="fund-chart__ranges" role="group" aria-label={labels.zoom}>
            <span className="fund-chart__zoom">{labels.zoom}</span>
            {ranges.map(r => (
              <button key={r} type="button" className="fund-chart__range" aria-pressed={r === range} onClick={() => setRange(r)}>
                {labels.ranges[r]}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="fund-chart__meta">
        {legend && (
          <ul className="fund-chart__legend">
            {series.map(s => (
              <li key={s.name}>
                {s.name}
                <span className={`fund-chart__swatch${s.kind === 'bar' ? ' fund-chart__swatch--bar' : ''}`} style={{ background: s.color }} aria-hidden="true" />
              </li>
            ))}
          </ul>
        )}
        <p className="fund-chart__span">
          {labels.from} {formatDate(firstDate)} {labels.to} {formatDate(end)}
        </p>
      </div>
      <div className="fund-chart__box" ref={boxRef}>
        <svg
          className="fund-chart__svg"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={`${labels.chartLabel}: ${labels.from} ${formatDate(firstDate)} ${labels.to} ${formatDate(end)}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {xTicks.map(tk => (
            <g key={tk.t}>
              <line className="fund-chart__grid" x1={x(tk.t)} x2={x(tk.t)} y1={pad.top} y2={pad.top + plotH} />
              <text className="fund-chart__tick" x={x(tk.t)} y={height - 8} textAnchor="middle">{tk.label}</text>
            </g>
          ))}
          {left.ticks.map(v => (
            <g key={`l${v}`}>
              {!hasRight && <line className="fund-chart__grid fund-chart__grid--h" x1={pad.left} x2={pad.left + plotW} y1={left.y(v)} y2={left.y(v)} />}
              <text className="fund-chart__tick" x={leftAxisX} y={left.y(v) + 4} textAnchor={hasRight ? 'end' : 'start'}>{fmt(v, format, locale, true)}</text>
            </g>
          ))}
          {right?.ticks.map(v => (
            <text key={`r${v}`} className="fund-chart__tick" x={width - pad.right + 8} y={right.y(v) + 4}>{fmt(v, rightFormat, locale, true)}</text>
          ))}
          {visible.map(s => {
            const y = s.axis === 'right' && right ? right.y : left.y
            if (s.kind === 'bar') {
              const step = Math.max(1, Math.ceil(s.points.length / (plotW / 3)))
              const bw = Math.max(1, Math.min(14, (plotW / Math.max(1, s.points.length / step)) * 0.6))
              const zero = y(0)
              return (
                <g key={s.name} fill={s.color} className="fund-chart__bars">
                  {s.points.filter((_, i) => i % step === 0).map(p => {
                    const top = y(p[1])
                    return <rect key={p[0]} x={x(toTime(p[0])) - bw / 2} y={Math.min(top, zero)} width={bw} height={Math.max(0.5, Math.abs(zero - top))} />
                  })}
                </g>
              )
            }
            return <path key={s.name} d={linePath(s.points, y)} fill="none" stroke={s.color} strokeWidth={1.75} strokeLinejoin="round" />
          })}
          {hoverDate && (
            <g className="fund-chart__hover">
              <line x1={hoverX} x2={hoverX} y1={pad.top} y2={pad.top + plotH} />
              {hoverRows.filter(r => r.s.kind !== 'bar').map(r => {
                const y = r.s.axis === 'right' && right ? right.y : left.y
                const p = r.s.points[r.i]
                return <circle key={r.s.name} cx={x(toTime(p[0]))} cy={y(p[1])} r={4} fill={r.s.color} />
              })}
            </g>
          )}
        </svg>
        {hoverDate && (
          <div
            className="fund-chart__tooltip"
            style={{ left: `${(hoverX / width) * 100}%`, transform: hoverX > width / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}
            aria-hidden="true"
          >
            <strong>{formatDate(hoverDate)}</strong>
            {hoverRows.map(r => (
              <span key={r.s.name}>
                <i style={{ background: r.s.color }} />
                {r.s.name}: {fmt(r.s.points[r.i][1], r.s.axis === 'right' ? rightFormat : format, locale)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
