import type { Locale } from '@/lib/i18n'
import type { ArticleCategory } from '@/lib/types'

// Category codes used by the live CMS (custom label `c.New_Category`); EN labels as on the live site.
const labels: Record<ArticleCategory, Record<Locale, string>> = {
  CAT1: { vi: 'Thông báo', en: 'Investor Announcement' },
  CAT2: { vi: 'Cập nhật thị trường', en: 'Market Updates' },
  CAT3: { vi: 'Sự kiện', en: 'Event' },
  CAT4: { vi: 'Tin tức & Báo chí', en: 'News & Press' },
  CAT5: { vi: 'Kiến thức đầu tư', en: 'Education' },
}

/** Order of the filter pills on the news page. */
export const categoryOrder: ArticleCategory[] = ['CAT4', 'CAT1', 'CAT3', 'CAT5', 'CAT2']

export function categoryLabel(category: ArticleCategory | null, locale: Locale) {
  return category ? labels[category][locale] : null
}
