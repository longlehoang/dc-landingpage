import SmartLink from '../SmartLink'
import type { BlockContext } from '../blocks/context'
import { getArticles } from '@/lib/strapi'
import type { NewsFeedBlock } from '@/lib/types'
import ArticleCard from './ArticleCard'

/** "Tin tức" strip: the latest articles (optionally one category) and a "Xem thêm" link. */
export default async function NewsFeed({ block, ctx }: { block: NewsFeedBlock; ctx: BlockContext }) {
  const all = await getArticles(ctx.locale)
  const articles = all.filter(a => !block.category || a.category === block.category).slice(0, block.count ?? 3)
  const site = ctx.site === 'institution' ? 'institution' : 'individual'
  if (!articles.length) return null
  return (
    <section id={block.anchor ?? undefined} className="news-feed section">
      <div className="container">
        <div className="news-feed__head">
          <div className="section-head">
            {block.eyebrow && <p className="eyebrow">{block.eyebrow}</p>}
            {block.title && <h2 className="section-head__title">{block.title}</h2>}
          </div>
          {block.moreUrl && block.moreLabel && (
            <SmartLink link={{ label: block.moreLabel, url: block.moreUrl, openInNewTab: false }} className="btn btn--outline" />
          )}
        </div>
        <div className="news-feed__list">
          {articles.map(a => <ArticleCard key={a.documentId} article={a} locale={ctx.locale} basePath={`${site}/news-and-insights`} />)}
        </div>
      </div>
    </section>
  )
}
