import Image from 'next/image'
import Link from 'next/link'
import type { BlockContext } from '../blocks/context'
import { formatLongDate } from '@/lib/format'
import { localizeHref, type Locale } from '@/lib/i18n'
import { ALL_CATEGORIES as ALL, byFeatured, newsLabels, newsPath, newsSite } from '@/lib/news'
import { getArticles, mediaUrl } from '@/lib/strapi'
import type { ArticleCategory, ArticleSummary, NewsIndexBlock } from '@/lib/types'
import ArticleCard from './ArticleCard'
import { categoryLabel, categoryOrder } from './categories'
import NewsFilter from './NewsFilter'

/** Large card: image on the left, accent-green panel with category, title, excerpt and byline. */
function FeaturedCard({ article, locale, href }: { article: ArticleSummary; locale: Locale; href: string }) {
  const cover = mediaUrl(article.cover)
  const category = categoryLabel(article.category, locale)
  const excerpt = article.excerpt?.trim()
  return (
    <article className="news-featured">
      <Link href={href} className="news-featured__link">
        <div className="news-featured__media">
          {cover && <Image src={cover} alt={article.cover?.alternativeText || article.title} fill sizes="(min-width: 1024px) 34vw, 100vw" preload />}
        </div>
        <div className="news-featured__panel">
          {category && <p className="news-pill news-pill--dark">{category}</p>}
          <h2 className="news-featured__title">{article.title}</h2>
          {excerpt && <p className="news-featured__excerpt">{excerpt}</p>}
          <p className="news-featured__meta">{article.author ?? 'Dragon Capital'} | {formatLongDate(article.date, locale)}</p>
        </div>
      </Link>
    </article>
  )
}

/** "Tin tức & Sự kiện" list: category pills, a featured card and a grid of every other article (client-side filter). */
export default async function NewsIndex({ block, ctx }: { block: NewsIndexBlock; ctx: BlockContext }) {
  const { locale } = ctx
  const site = newsSite(ctx.site)
  const articles = await getArticles(locale)
  const labels = newsLabels[locale]

  if (!articles.length) {
    return (
      <section id={block.anchor ?? undefined} className="news-index section">
        <p className="container news-index__empty">{block.emptyText ?? labels.empty}</p>
      </section>
    )
  }

  const categories = categoryOrder.filter(c => articles.some(a => a.category === c))
  const filters: string[] = [ALL, ...categories]
  // The featured article of each filter: highest priority, then newest.
  const ranked = [...articles].sort(byFeatured)
  const featuredIds: Record<string, string> = {}
  for (const f of filters) {
    const top = ranked.find(a => f === ALL || a.category === f)
    if (top) featuredIds[f] = top.documentId
  }
  const featuredArticles = [...new Set(Object.values(featuredIds))].map(id => articles.find(a => a.documentId === id)!)

  return (
    <section id={block.anchor ?? undefined} className="news-index">
      <div className="container">
        <NewsFilter
          label={labels.filterLabel}
          pills={filters.map(f => ({ value: f, label: f === ALL ? block.allLabel : categoryLabel(f as ArticleCategory, locale)! }))}
          featuredIds={featuredIds}
          featured={Object.fromEntries(featuredArticles.map(a => [
            a.documentId,
            <FeaturedCard key={a.documentId} article={a} locale={locale} href={localizeHref(newsPath(site, a.slug), locale)} />,
          ]))}
          cards={articles.map(a => ({
            id: a.documentId,
            category: a.category,
            node: <ArticleCard article={a} locale={locale} basePath={`${site}/news-and-insights`} />,
          }))}
          emptyText={block.emptyText ?? labels.empty}
        />
      </div>
    </section>
  )
}
