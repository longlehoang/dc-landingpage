import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import type { DocumentGroup } from '@/components/fund/types'
import type { Locale } from './i18n'
import { getDocumentTaxonomy, getDocuments, getDocumentYears, STRAPI_TAG } from './strapi'

const TYPE_ORDER = ['FUND_INFORMATION_AND_GUIDELINES', 'FUND_PERFORMANCE', 'FUND_DISCLOSURE', 'FMC_DISCLOSURE', 'COMPANY_ANNOUNCEMENT', 'OTHERS']

/** Documents tab header data: available years and the labels of this fund. */
export async function getFundDocumentMeta(fundCode: string, locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  const [years, taxonomy] = await Promise.all([getDocumentYears(fundCode, locale), getDocumentTaxonomy(locale)])
  return {
    years,
    fundLabel: taxonomy.funds.find(f => f.value === fundCode)?.label ?? fundCode,
  }
}

/** A fund's documents of one year, grouped by (type, category) folder like the live "Tài liệu" tab. */
export async function getFundDocumentGroups(fundCode: string, year: number, locale: Locale): Promise<DocumentGroup[]> {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  const [docs, taxonomy] = await Promise.all([getDocuments(fundCode, year, locale), getDocumentTaxonomy(locale)])
  const categoryOrder = Object.keys(taxonomy.categories)
  const groups = new Map<string, DocumentGroup>()
  for (const d of docs) {
    if (!d.fileUrl) continue
    const type = d.type ?? 'OTHERS'
    const category = d.category ?? 'OTHERS'
    const key = `${type}:${category}`
    let group = groups.get(key)
    if (!group) {
      group = { key, type: taxonomy.types[type] ?? type, category: taxonomy.categories[category] ?? category, files: [] }
      groups.set(key, group)
    }
    const title = (locale === 'en' ? d.titleEn ?? d.titleVi : d.titleVi ?? d.titleEn) ?? d.fileUrl.split('/').pop() ?? ''
    group.files.push({ title, date: d.date, url: d.fileUrl })
  }
  const rank = (key: string) => {
    const [type, category] = key.split(':')
    const t = TYPE_ORDER.indexOf(type)
    const c = categoryOrder.indexOf(category)
    return (t < 0 ? TYPE_ORDER.length : t) * 1000 + (c < 0 ? 999 : c)
  }
  const sorted = [...groups.values()].sort((a, b) => rank(a.key) - rank(b.key))
  for (const g of sorted) g.files.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  return sorted
}
