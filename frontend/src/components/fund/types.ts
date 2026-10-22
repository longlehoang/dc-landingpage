// Shapes of the JSON fields of a Strapi `fund` that are typed `unknown` in lib/types.ts.

export interface AllocationItem { name: string; weight: number }

export interface FundAllocation {
  sectors?: AllocationItem[]
  assetTypes?: AllocationItem[]
  /** Pension funds: CMS-managed allocation with its own date. */
  custom?: { asOfDate?: string; items: AllocationItem[] }
}

export interface Holding {
  ticker: string
  sector?: string | null
  industry?: string | null
  exchange?: string | null
  weight: number
  marketValue?: number | null
  holdingVolume?: number | null
}

export interface StatPair { fund?: number | null; benchmark?: number | null }

export interface PortfolioStats {
  asOfDate?: string
  fundLabel?: string
  benchmarkLabel?: string
  fundamental?: Record<string, StatPair>
  risk?: Record<string, StatPair>
}

interface PeriodValues { current?: number | null; last?: number | null; difference?: number | null }

export interface FundPricing {
  ticker?: string
  indexName?: string
  remarks?: Record<string, { vi?: string; en?: string }>
  latestClose?: {
    closePrice?: number
    dailyPriceChange?: number
    dailyPriceChangePercentage?: number
    date?: string
    deltaChangeWithNav?: number
    deltaChangeWithNavPercentage?: number
    yearToDateChange?: number
    yearToDateChangePercentage?: number
  }
  avgVolume30d?: number | null
  creationRedemption?: {
    date: string
    navDate?: string | null
    lastDate?: string | null
    lastNavDate?: string | null
    rows: Record<string, PeriodValues>
  } | null
  series?: {
    /** [date, nav, closePrice, volume] */
    chart?: [string, number | null, number | null, number | null][]
    /** [date, premium, premiumPct] */
    premium?: [string, number | null, number | null][]
    /** [date, issuedShares, creationUnits, redemptionUnits] */
    primary?: [string, number | null, number | null, number | null][]
  }
}

/** One chart point: ISO date + value. */
export type Point = [string, number]

export interface DocumentFile { title: string; date: string | null; url: string }
export interface DocumentGroup { key: string; category: string; type: string; files: DocumentFile[] }
