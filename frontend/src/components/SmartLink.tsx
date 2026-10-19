import Link from 'next/link'
import type { ComponentProps } from 'react'
import type { StrapiLink } from '@/lib/types'

type Props = Omit<ComponentProps<'a'>, 'href'> & { link: StrapiLink }

/** Renders a CMS link: next/link for in-app paths, a plain anchor for absolute URLs. */
export default function SmartLink({ link, children, ...rest }: Props) {
  const external = /^https?:\/\//.test(link.url)
  const target = link.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  const content = children ?? link.label
  if (external || link.url.startsWith('#')) {
    return <a href={link.url} {...target} {...rest}>{content}</a>
  }
  return <Link href={link.url} {...target} {...rest}>{content}</Link>
}
