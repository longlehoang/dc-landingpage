'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { ComponentProps } from 'react'
import { defaultLocale, hasLocale, localizeHref } from '@/lib/i18n'
import type { StrapiLink } from '@/lib/types'

type Props = Omit<ComponentProps<'a'>, 'href'> & { link: Pick<StrapiLink, 'label' | 'url' | 'openInNewTab'> }

/** Renders a CMS link: next/link for in-app paths, a plain anchor for absolute URLs. */
export default function SmartLink({ link, children, ...rest }: Props) {
  const params = useParams<{ locale?: string }>()
  const locale = params?.locale && hasLocale(params.locale) ? params.locale : defaultLocale
  const href = localizeHref(link.url, locale)
  const target = link.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  const content = children ?? link.label
  if (href.startsWith('/')) {
    return <Link href={href} {...target} {...rest}>{content}</Link>
  }
  return <a href={href} {...target} {...rest}>{content}</a>
}
