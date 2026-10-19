import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { defaultLocale, type Locale } from './i18n'
import type { GlobalContent, HomepageContent, StrapiMedia } from './types'

export const STRAPI_URL = (process.env.STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '')

/** Cache tag shared by every Strapi read; the /api/revalidate webhook purges it. */
export const STRAPI_TAG = 'strapi'

const GLOBAL_POPULATE = {
  'populate[logo]': 'true',
  'populate[favicon]': 'true',
  'populate[journeyPrimaryLinks]': 'true',
  'populate[journeySecondaryLinks]': 'true',
  'populate[footerColumns][populate]': 'links',
  'populate[legalLinks]': 'true',
}

const HOMEPAGE_POPULATE = {
  'populate[seo]': 'true',
  'populate[heroHeadline]': 'true',
  'populate[heroAnimation]': 'true',
  'populate[aboutImage]': 'true',
  'populate[features]': 'true',
  'populate[contactImage]': 'true',
  'populate[contactPolicyLink]': 'true',
}

class StrapiError extends Error {
  constructor(public status: number, path: string) {
    super(`Strapi request failed (${status}): ${path}`)
  }
}

async function request<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = `${STRAPI_URL}/api/${path}?${new URLSearchParams(params)}`
  const headers: HeadersInit = {}
  if (process.env.STRAPI_READ_TOKEN) headers.Authorization = `Bearer ${process.env.STRAPI_READ_TOKEN}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new StrapiError(res.status, path)
  const json = (await res.json()) as { data: T }
  return json.data
}

/** Fetch a localized single type, falling back to the default locale when no translation exists. */
async function getSingleType<T>(path: string, locale: Locale, populate: Record<string, string>): Promise<T> {
  try {
    return await request<T>(path, { ...populate, locale })
  } catch (err) {
    if (err instanceof StrapiError && err.status === 404 && locale !== defaultLocale) {
      return request<T>(path, { ...populate, locale: defaultLocale })
    }
    throw err
  }
}

export async function getGlobal(locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  return getSingleType<GlobalContent>('global', locale, GLOBAL_POPULATE)
}

export async function getHomepage(locale: Locale) {
  'use cache'
  cacheTag(STRAPI_TAG)
  cacheLife('hours')
  return getSingleType<HomepageContent>('homepage', locale, HOMEPAGE_POPULATE)
}

/** Strapi returns relative upload URLs for the local provider; make them absolute. */
export function mediaUrl(media: StrapiMedia | null | undefined): string | undefined {
  if (!media?.url) return undefined
  return media.url.startsWith('http') ? media.url : `${STRAPI_URL}${media.url}`
}
