import type { NextRequest } from 'next/server'
import { FUND_CODE, loadLibrary } from '@/lib/documents'
import { hasLocale } from '@/lib/i18n'

/**
 * Document library data for the client filters.
 * `GET /api/documents?locale=vi&fund=VFC[&year=2026]` → `{ fund, years, year, documents }`
 * (`year` falls back to the newest year that has documents for the fund).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const locale = params.get('locale') ?? ''
  const fund = params.get('fund') ?? ''
  const yearParam = params.get('year')

  if (!hasLocale(locale)) return Response.json({ error: 'Invalid locale' }, { status: 400 })
  if (!FUND_CODE.test(fund)) return Response.json({ error: 'Invalid fund' }, { status: 400 })
  let year: number | null = null
  if (yearParam) {
    if (!/^\d{4}$/.test(yearParam)) return Response.json({ error: 'Invalid year' }, { status: 400 })
    year = Number(yearParam)
  }

  try {
    const data = await loadLibrary(fund, year, locale)
    return Response.json(data, { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' } })
  } catch (err) {
    console.error('[api/documents]', err)
    return Response.json({ error: 'Documents are unavailable' }, { status: 502 })
  }
}
