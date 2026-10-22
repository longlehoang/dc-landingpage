import type { NextRequest } from 'next/server'
import { getFundDocumentGroups } from '@/lib/fund'
import { hasLocale } from '@/lib/i18n'

/**
 * `GET /api/fund-documents?fund=VFMVN30&year=2026&locale=vi`: one fund's documents of one year, grouped by folder.
 * Used by the Documents tab of the fund page when the visitor switches year.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const fund = params.get('fund') ?? ''
  const year = Number(params.get('year'))
  const locale = params.get('locale') ?? 'vi'
  if (!/^[A-Z0-9]{2,12}$/.test(fund) || !Number.isInteger(year) || year < 1990 || year > 2100 || !hasLocale(locale)) {
    return Response.json({ error: 'Invalid parameters' }, { status: 400 })
  }
  try {
    const groups = await getFundDocumentGroups(fund, year, locale)
    return Response.json({ groups }, { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } })
  } catch {
    return Response.json({ error: 'Upstream error' }, { status: 502 })
  }
}
