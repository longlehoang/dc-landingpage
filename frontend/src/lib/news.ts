import type { Locale } from './i18n'
import type { ArticleSummary, Audience, SiteKey } from './types'

/** News UI strings that are not editorial content (labels as on the live site). */
export const newsLabels = {
  vi: {
    publish: 'Ngày',
    share: 'Chia sẻ',
    copyLink: 'Sao chép liên kết',
    copied: 'Đã sao chép liên kết',
    shareOn: 'Chia sẻ lên',
    attachments: 'Tài liệu đính kèm',
    relatedEyebrow: 'Tin tức & Sự kiện',
    relatedTitle: 'Tin tức khác',
    viewMore: 'Xem thêm',
    filterLabel: 'Lọc theo chuyên mục',
    empty: 'Chưa có bài viết nào.',
  },
  en: {
    publish: 'Publish',
    share: 'Share',
    copyLink: 'Copy link',
    copied: 'Link copied',
    shareOn: 'Share on',
    attachments: 'Attachments',
    relatedEyebrow: 'News & Insight',
    relatedTitle: 'Related Articles',
    viewMore: 'View more',
    filterLabel: 'Filter by category',
    empty: 'No articles yet.',
  },
} satisfies Record<Locale, Record<string, string>>

/** Filter value of the "All" pill. */
export const ALL_CATEGORIES = 'all'

/** Sub-site whose news section an article link should stay in. */
export function newsSite(site: SiteKey): Audience {
  return site === 'institution' ? 'institution' : 'individual'
}

/** In-app path (without locale) of the news list or of one article. */
export function newsPath(site: Audience, slug?: string) {
  return slug ? `/${site}/news-and-insights/${slug}` : `/${site}/news-and-insights`
}

/** Featured order: `featuredPriority` 1 is the top slot (as on the live site), unranked articles last, then newest. */
export function byFeatured(a: ArticleSummary, b: ArticleSummary) {
  const pa = a.featuredPriority ?? Infinity
  const pb = b.featuredPriority ?? Infinity
  if (pa !== pb) return pa - pb
  return b.date.localeCompare(a.date)
}
