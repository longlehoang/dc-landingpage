import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { localizeHref, type Locale } from '@/lib/i18n'
import { STRAPI_URL } from '@/lib/strapi'

/** Renders CMS markdown (Strapi richtext). Raw HTML is not rendered. */
export default function Markdown({ children, locale, className }: { children: string | null | undefined; locale: Locale; className?: string }) {
  if (!children) return null
  return (
    <div className={className ? `prose ${className}` : 'prose'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url, key) => {
          // Uploaded images are stored as relative `/uploads/...` paths.
          if (key === 'src' && url.startsWith('/uploads/')) return `${STRAPI_URL}${url}`
          if (/^(javascript|data|vbscript):/i.test(url)) return ''
          return url
        }}
        components={{
          a: ({ href = '', children: text }) => {
            const external = /^https?:\/\//.test(href)
            return (
              <a href={localizeHref(href, locale)} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {text}
              </a>
            )
          },
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
