import Image from 'next/image'
import Link from 'next/link'
import Markdown from '../Markdown'
import { ArrowRight, DownloadIcon } from '../Icons'
import { formatLongDate } from '@/lib/format'
import { localizeHref, type Locale } from '@/lib/i18n'
import { newsLabels, newsPath } from '@/lib/news'
import { getArticles, mediaUrl } from '@/lib/strapi'
import type { ArticleContent, Audience } from '@/lib/types'
import ArticleCard from './ArticleCard'
import { categoryLabel } from './categories'
import ShareButtons from './ShareButtons'

/** Article detail: dark hero band with title and share buttons, overlapping cover, body, attachments, related news. */
export default async function ArticlePage({ article, site, locale }: { article: ArticleContent; site: Audience; locale: Locale }) {
  const labels = newsLabels[locale]
  const cover = mediaUrl(article.cover)
  const category = categoryLabel(article.category, locale)
  const author = article.author ?? 'Dragon Capital'
  const related = (await getArticles(locale)).filter(a => a.slug !== article.slug).slice(0, 3)
  const attachments = (article.attachments ?? []).filter(a => a.url)

  return (
    <>
      <article className={`article${cover ? '' : ' article--no-cover'}`}>
        <header className="article__hero">
          <div className="container">
            {category && <p className="news-pill news-pill--solid">{category}</p>}
            <h1 className="article__title">{article.title}</h1>
            <div className="article__lead">
              <div className="article__meta">
                <p className="article__author">
                  <span className="article__avatar" aria-hidden="true">{author.charAt(0)}</span>
                  {author}
                </p>
                <dl className="article__facts">
                  <div>
                    <dt>{labels.publish}</dt>
                    <dd><time dateTime={article.date}>{formatLongDate(article.date, locale)}</time></dd>
                  </div>
                  <div className="article-share">
                    <dt>{labels.share}</dt>
                    <dd><ShareButtons title={article.title} labels={labels} /></dd>
                  </div>
                </dl>
              </div>
              {cover && (
                <div className="article__cover">
                  <Image
                    src={cover}
                    alt={article.cover?.alternativeText || article.title}
                    width={article.cover?.width ?? 1200}
                    height={article.cover?.height ?? 675}
                    sizes="(min-width: 1024px) 860px, 100vw"
                    preload
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="container article__content">
          <div className="article__main">
            <Markdown locale={locale} className="article__body">{article.body}</Markdown>
            {attachments.length > 0 && (
              <section className="article__attachments" aria-labelledby="article-attachments">
                <h2 id="article-attachments" className="article__attachments-title">{labels.attachments}</h2>
                <ul>
                  {attachments.map(a => (
                    <li key={a.id}>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="article__attachment">
                        <span>{a.label}</span>
                        <DownloadIcon />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="news-related section" aria-labelledby="news-related-title">
          <div className="container">
            <div className="news-related__head">
              <div className="section-head">
                <p className="eyebrow">{labels.relatedEyebrow}</p>
                <h2 id="news-related-title" className="section-head__title news-related__title">{labels.relatedTitle}</h2>
              </div>
              <Link href={localizeHref(newsPath(site), locale)} className="news-more">
                {labels.viewMore}
                <span className="news-more__icon"><ArrowRight /></span>
              </Link>
            </div>
            <div className="news-related__list">
              {related.map(a => <ArticleCard key={a.documentId} article={a} locale={locale} basePath={`${site}/news-and-insights`} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
