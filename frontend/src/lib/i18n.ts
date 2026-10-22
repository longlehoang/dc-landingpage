export const locales = ['vi', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'vi'

export const hasLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value)

/** Prefixes an in-app CMS path (stored without locale, e.g. `/individual/faq`) with the locale. */
export function localizeHref(url: string, locale: Locale): string {
  if (!url.startsWith('/') || hasLocale(url.split('/')[1] ?? '')) return url
  return `/${locale}${url === '/' ? '' : url}`
}

// UI strings that are not editorial content and therefore not managed in Strapi.
export const ui = {
  vi: {
    skipToContent: 'Chuyển đến nội dung chính',
    home: 'Trang chủ',
    language: 'Ngôn ngữ',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    quickLinks: 'Lối tắt',
    sending: 'Đang gửi…',
    nameRequired: 'Vui lòng nhập tên.',
    emailInvalid: 'Vui lòng nhập email hợp lệ.',
    submitFailed: 'Không thể gửi lúc này. Vui lòng thử lại sau.',
    companyRequired: 'Vui lòng nhập tên công ty.',
    close: 'Đóng',
    previous: 'Trước',
    next: 'Tiếp',
    readBio: 'Xem tiểu sử',
    notFoundTitle: 'Không tìm thấy trang',
  },
  en: {
    skipToContent: 'Skip to main content',
    home: 'Home',
    language: 'Language',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    quickLinks: 'Quick links',
    sending: 'Sending…',
    nameRequired: 'Please enter your name.',
    emailInvalid: 'Please enter a valid email.',
    submitFailed: 'We could not send your message. Please try again later.',
    companyRequired: 'Please enter your company.',
    close: 'Close',
    previous: 'Previous',
    next: 'Next',
    readBio: 'Read biography',
    notFoundTitle: 'Page not found',
  },
} satisfies Record<Locale, Record<string, string>>

export type UiStrings = (typeof ui)[Locale]
