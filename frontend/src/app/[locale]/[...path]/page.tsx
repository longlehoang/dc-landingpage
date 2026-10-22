import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Blocks from '@/components/blocks/Blocks'
import type { BlockContext } from '@/components/blocks/context'
import FundPage from '@/components/fund/FundPage'
import ArticlePage from '@/components/news/ArticlePage'
import SiteShell from '@/components/site/SiteShell'
import { hasLocale, locales, ui, type Locale } from '@/lib/i18n'
import { getArticle, getArticles, getFund, getFundSummaries, getPage, getPagePaths } from '@/lib/strapi'
import type { Audience, SiteKey } from '@/lib/types'

// The whole page (even its header) is chosen by the URL, so there is no meaningful instant shell.
// Every known path is prerendered via generateStaticParams; navigations may block on the RSC payload.
export const instant = false

const audiences: Audience[] = ['individual', 'institution']
const isAudience = (s: string | undefined): s is Audience => audiences.includes(s as Audience)

/**
 * `/<site>/product/<slug>` → Fund, `/<site>/news-and-insights/<slug>` → Article, anything else → Page by path.
 */
async function resolve(segments: string[], locale: Locale) {
  const [first, kind, slug] = segments
  if (segments.length === 3 && isAudience(first) && kind === 'product') {
    const fund = await getFund(first, slug, locale)
    return fund?.hasProductPage ? ({ type: 'fund', site: first, fund } as const) : null
  }
  if (segments.length === 3 && isAudience(first) && kind === 'news-and-insights') {
    const article = await getArticle(slug, locale)
    return article ? ({ type: 'article', site: first, article } as const) : null
  }
  const page = await getPage(segments.join('/'), locale)
  return page ? ({ type: 'page', site: page.site, page } as const) : null
}

export async function generateStaticParams() {
  const [paths, funds, articles] = await Promise.all([getPagePaths(), getFundSummaries('vi'), getArticles('vi')])
  return [
    ...paths.map(p => ({ path: p.split('/') })),
    ...funds.filter(f => f.hasProductPage).map(f => ({ path: [f.audience, 'product', f.slug] })),
    ...audiences.flatMap(site => articles.map(a => ({ path: [site, 'news-and-insights', a.slug] }))),
  ]
}

export async function generateMetadata({ params }: PageProps<'/[locale]/[...path]'>): Promise<Metadata> {
  const { locale, path } = await params
  if (!hasLocale(locale)) return {}
  const found = await resolve(path, locale)
  if (!found) return {}
  const entity = found.type === 'fund' ? found.fund : found.type === 'article' ? found.article : found.page
  const fallbackTitle = found.type === 'fund' ? found.fund.displayName : found.type === 'article' ? found.article.title : found.page.title
  const joined = path.join('/')
  return {
    title: entity.seo?.metaTitle ?? `${fallbackTitle} | Dragon Capital`,
    description: entity.seo?.metaDescription ?? (found.type === 'article' ? found.article.excerpt ?? undefined : undefined),
    alternates: { languages: Object.fromEntries(locales.map(l => [l, `/${l}/${joined}`])) },
  }
}

export default async function CmsRoute({ params }: PageProps<'/[locale]/[...path]'>) {
  const { locale, path } = await params
  if (!hasLocale(locale)) notFound()
  const found = await resolve(path, locale)
  if (!found) notFound()

  const site: SiteKey = found.site
  const ctx: BlockContext = { locale, ui: ui[locale], site, path: path.join('/') }

  return (
    <SiteShell siteKey={site} locale={locale} path={ctx.path}>
      {found.type === 'page' && <Blocks blocks={found.page.sections} ctx={ctx} />}
      {found.type === 'fund' && <FundPage fund={found.fund} ctx={ctx} />}
      {found.type === 'article' && <ArticlePage article={found.article} site={found.site} locale={locale} />}
    </SiteShell>
  )
}
