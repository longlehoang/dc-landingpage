import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, locales, ui } from '@/lib/i18n'
import { getGlobal, getHomepage, mediaUrl } from '@/lib/strapi'
import '../globals.css'
import '../../styles/sites.css'
import '../../styles/fund.css'
import '../../styles/news.css'
import '../../styles/documents.css'

const manrope = Manrope({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-manrope',
  display: 'swap',
})

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}
  const [global, page] = await Promise.all([getGlobal(locale), getHomepage(locale)])
  const favicon = mediaUrl(global.favicon)
  return {
    title: page.seo?.metaTitle ?? global.siteName,
    description: page.seo?.metaDescription ?? undefined,
    icons: favicon ? { icon: favicon } : undefined,
    alternates: { languages: Object.fromEntries(locales.map(l => [l, `/${l}`])) },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()

  return (
    <html lang={locale} className={manrope.variable}>
      <body>
        <a href="#main" className="skip-link">{ui[locale].skipToContent}</a>
        {children}
      </body>
    </html>
  )
}
