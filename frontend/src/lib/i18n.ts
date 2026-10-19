export const locales = ['vi', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'vi'

export const hasLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value)

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
  },
} satisfies Record<Locale, Record<string, string>>

export type UiStrings = (typeof ui)[Locale]
