import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { defaultLocale, type Locale } from './i18n'
import type {
  ArticleContent,
  ArticleSummary,
  Audience,
  DocumentTaxonomy,
  FundContent,
  FundDocument,
  FundSummary,
  GlobalContent,
  HomepageContent,
  PageContent,
  SiteContent,
  SiteKey,
  StrapiMedia,
} from './types'

export const STRAPI_URL = (process.env.STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '')

/** Cache tag shared by every Strapi read; the /api/revalidate webhook purges it. */
export const STRAPI_TAG = 'strapi'

/** Nested populate/filter description, serialised to Strapi's bracket query syntax. */
export type Query = { [key: string]: Query | Query[] | string | number | boolean | string[] }

export function toParams(query: Query, prefix = '', out: [string, string][] = []): [string, string][] {
  for (const [key, value] of Object.entries(query)) {
    const name = prefix ? `${prefix}[${key}]` : key
    if (Array.isArray(value)) {
      value.forEach((v, i) => (typeof v === 'object' ? toParams(v, `${name}[${i}]`, out) : out.push([`${name}[${i}]`, String(v)])))
    } else if (typeof value === 'object') {
      toParams(value, name, out)
    } else {
      out.push([name, String(value)])
    }
  }
  return out
}

const GLOBAL_POPULATE = {
  'populate[logo]': 'true',
  'populate[favicon]': 'true',
  'populate[journeyPrimaryLinks]': 'true',
  'populate[journeySecondaryLinks]': 'true',
  'populate[footerColumns][populate]': 'links',
  'populate[legalLinks]': 'true',
}

const HOMEPAGE_POPULATE = {
  'populate[seo]': 'true',
  'populate[heroHeadline]': 'true',
  'populate[heroAnimation]': 'true',
  'populate[aboutImage]': 'true',
  'populate[features]': 'true',
  'populate[contactImage]': 'true',
  'populate[contactPolicyLink]': 'true',
}

/** Populate for each dynamic-zone block; media and nested components must be listed explicitly. */
const BLOCKS_POPULATE: Query = {
  on: {
    'blocks.hero': {
      populate: {
        titleParts: true, image: true, mobileImage: true, animation: true, mobileAnimation: true, cta: true, contacts: true,
        slides: { populate: ['image', 'cta'] },
      },
    },
    'blocks.rich-text': { populate: ['image'] },
    'blocks.cards': { populate: { items: { populate: ['image', 'link'] } } },
    'blocks.features': { populate: { items: { populate: ['icon'] } } },
    'blocks.stats': { populate: ['items'] },
    'blocks.testimonials': { populate: { items: { populate: ['image'] } } },
    'blocks.fund-cards': { populate: { funds: { populate: ['icon'] } } },
    'blocks.app-promo': { populate: ['image', 'qr', 'moreLink'] },
    'blocks.news-feed': { populate: '*' },
    'blocks.news-index': { populate: '*' },
    'blocks.timeline': { populate: { items: { populate: ['image'] } } },
    'blocks.team': { populate: { groups: { populate: { people: { populate: ['image'] } } } } },
    'blocks.contact-form': { populate: ['image'] },
    'blocks.faq': { populate: { groups: { populate: ['items'] } } },
    'blocks.document-library': { populate: '*' },
    'blocks.anchor-nav': { populate: ['links'] },
    'blocks.video-carousel': { populate: ['slides'] },
  },
}

const SITE_POPULATE: Query = {
  logo: true, footerLogo: true, appStoreBadge: true, playStoreBadge: true,
  nav: { populate: { groups: { populate: ['links'] } } },
  headerCta: true,
  footerColumns: { populate: ['links'] },
  socialLinks: true,
  legalLinks: true,
  appModal: { populate: ['image', 'qr', 'moreLink'] },
}

const FUND_POPULATE: Query = {
  heroDownloads: true, keyFacts: true, fees: true, seo: true,
  managers: { populate: ['photo', 'stats'] },
  sections: BLOCKS_POPULATE,
}

const FUND_SUMMARY_FIELDS = [
  'slug', 'audience', 'code', 'fundCode', 'fundType', 'category', 'displayName', 'name', 'tagline', 'latestNav', 'hasProductPage',
]

const ARTICLE_SUMMARY_FIELDS = ['slug', 'title', 'category', 'date', 'author', 'excerpt', 'featuredPriority']

class StrapiError extends Error {
  constructor(public status: number, path: string) {
    super(`Strapi request failed (${status}): ${path}`)
  }
}

export async function request<T>(path: string, params: Record<string, string> | [string, string][]): Promise<{ data: T; meta?: { pagination?: { total: number } } }> {
  const url = `${STRAPI_URL}/api/${path}?${new URLSearchParams(params)}`
  const headers: HeadersInit = {}
  if (process.env.STRAPI_READ_TOKEN) headers.Authorization = `Bearer ${process.env.STRAPI_READ_TOKEN}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new StrapiError(res.status, path)
  return res.json()
}

/** Fetch a localized single type, falling back to the default locale when no translation exists. */
async function getSingleType<T>(path: string, locale: Locale, populate: Record<string, string>): Promise<T> {
  try {
    return (await request<T>(path, { ...populate, locale })).data
  } catch (err) {
    if (err instanceof StrapiError && err.status === 404 && locale !== defaultLocale) {
      return (await request<T>(path, { ...populate, locale: defaultLocale })).data
    }
    throw err
  }
}

/** First entry of a localized collection matching `filters`, falling back to the default locale. */
export async function findOne<T>(path: string, locale: Locale, query: Query): Promise<T | null> {
  for (const l of locale === defaultLocale ? [locale] : [locale, defaultLocale]) {
    const { data } = await request<T[]>(path, toParams({ ...query, locale: l, 'pagination[pageSize]': 1 }))
    if (data[0]) return data[0]
  }
  return null
}

/** Every entry of a collection, paging through Strapi's max page size. */
export async function findAll<T>(path: string, query: Query, pageSize = 100): Promise<T[]> {
  const items: T[] = []
  for (let page = 1; ; page++) {
    const { data, meta } = await request<T[]>(path, toParams({ ...query, pagination: { page, pageSize } }))
    items.push(...data)
    if (items.length >= (meta?.pagination?.total ?? 0) || data.length === 0) return items
  }
}

export async function getGlobal(locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  return getSingleType<GlobalContent>('global', locale, GLOBAL_POPULATE)
}

export async function getHomepage(locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  return getSingleType<HomepageContent>('homepage', locale, HOMEPAGE_POPULATE)
}

export async function getSite(key: SiteKey, locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  return findOne<SiteContent>('sites', locale, { filters: { key: { $eq: key } }, populate: SITE_POPULATE })
}

export async function getPage(path: string, locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  return findOne<PageContent>('pages', locale, { filters: { path: { $eq: path } }, populate: { seo: true, sections: BLOCKS_POPULATE } })
}

/** Paths of every CMS page (default locale; translations share the path). */
export async function getPagePaths() {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  const pages = await findAll<{ path: string }>('pages', { fields: ['path'], locale: defaultLocale })
  return pages.map(p => p.path)
}

export async function getFund(audience: Audience, slug: string, locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  return findOne<FundContent>('funds', locale, {
    filters: { audience: { $eq: audience }, slug: { $eq: slug } },
    populate: FUND_POPULATE,
  })
}

export async function getFundSummaries(locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  const query = { fields: FUND_SUMMARY_FIELDS, sort: ['displayOrder:asc'] }
  const funds = await findAll<FundSummary>('funds', { ...query, locale })
  return funds.length || locale === defaultLocale ? funds : findAll<FundSummary>('funds', { ...query, locale: defaultLocale })
}

export async function getArticles(locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  const query = { fields: ARTICLE_SUMMARY_FIELDS, populate: { cover: true }, sort: ['date:desc'] }
  const articles = await findAll<ArticleSummary>('articles', { ...query, locale })
  return articles.length || locale === defaultLocale ? articles : findAll<ArticleSummary>('articles', { ...query, locale: defaultLocale })
}

export async function getArticle(slug: string, locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  return findOne<ArticleContent>('articles', locale, {
    filters: { slug: { $eq: slug } },
    populate: { cover: true, attachments: true, seo: true },
  })
}

export async function getDocumentTaxonomy(locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  const doc = await getSingleType<{ labels: DocumentTaxonomy }>('document-taxonomy', locale, {})
  return doc.labels
}

/** Years (newest first) that have at least one document for a fund in the given locale. */
export async function getDocumentYears(fundCode: string, locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  const rows = await findAll<{ year: number }>(
    'fund-documents',
    { fields: ['year'], filters: { fundCode: { $eq: fundCode }, [locale === 'en' ? 'inEn' : 'inVi']: { $eq: true } } },
    1000,
  )
  return [...new Set(rows.map(r => r.year))].sort((a, b) => b - a)
}

export async function getDocuments(fundCode: string, year: number, locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  return findAll<FundDocument>(
    'fund-documents',
    {
      filters: { fundCode: { $eq: fundCode }, year: { $eq: year }, [locale === 'en' ? 'inEn' : 'inVi']: { $eq: true } },
      sort: ['displayOrder:asc', 'date:desc'],
    },
    1000,
  )
}

/** Strapi returns relative upload URLs for the local provider; make them absolute. */
export function mediaUrl(media: StrapiMedia | null | undefined): string | undefined {
  if (!media?.url) return undefined
  return media.url.startsWith('http') ? media.url : `${STRAPI_URL}${media.url}`
}
