import { NextResponse, type NextRequest } from 'next/server'
import { defaultLocale, locales } from '@/lib/i18n'

/** Sends locale-less URLs (e.g. `/`) to the default Vietnamese site, matching dragoncapital.com.vn/vi/. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasLocale = locales.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (hasLocale) return

  request.nextUrl.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // Skip Next internals, API routes and files with an extension.
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
