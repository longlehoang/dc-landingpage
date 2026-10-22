import Image from 'next/image'
import Link from 'next/link'
import { localizeHref, type Locale } from '@/lib/i18n'
import { formatLongDate } from '@/lib/format'
import { mediaUrl } from '@/lib/strapi'
import type { ArticleSummary } from '@/lib/types'
import { categoryLabel } from './categories'

/** Thumbnail, category chip, title and "author | date"; links to the article. */
export default function ArticleCard({ article, locale, basePath }: { article: ArticleSummary; locale: Locale; basePath: string }) {
  const cover = mediaUrl(article.cover)
  const category = categoryLabel(article.category, locale)
  return (
    <article className="article-card">
      <Link href={localizeHref(`/${basePath}/${article.slug}`, locale)} className="article-card__link">
        <div className="article-card__media">
          {cover && <Image src={cover} alt={article.cover?.alternativeText || article.title} fill sizes="(min-width: 1024px) 30vw, 100vw" />}
        </div>
        {category && <p className="article-card__category">{category}</p>}
        <h3 className="article-card__title">{article.title}</h3>
        <p className="article-card__meta">{article.author ?? 'Dragon Capital'} | {formatLongDate(article.date, locale)}</p>
      </Link>
    </article>
  )
}
