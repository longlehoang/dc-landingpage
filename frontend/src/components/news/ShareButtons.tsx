'use client'

import { useState } from 'react'
import { SocialIcon } from '../Icons'

const networks = [
  { key: 'linkedin', name: 'LinkedIn', url: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  { key: 'facebook', name: 'Facebook', url: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  { key: 'x', name: 'X', url: (u: string, t: string) => `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
] as const

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 14a4.5 4.5 0 0 0 6.36 0l3.18-3.18a4.5 4.5 0 0 0-6.36-6.36L11.6 6.04M14 10a4.5 4.5 0 0 0-6.36 0l-3.18 3.18a4.5 4.5 0 0 0 6.36 6.36l1.58-1.58"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      />
    </svg>
  )
}

/** Copy-link, LinkedIn, Facebook and X share buttons for the current page. */
export default function ShareButtons({ title, labels }: { title: string; labels: { copyLink: string; copied: string; shareOn: string } }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt(labels.copyLink, window.location.href)
    }
  }

  const open = (make: (u: string, t: string) => string) => {
    const url = make(encodeURIComponent(window.location.href), encodeURIComponent(title))
    window.open(url, '_blank', 'noopener,noreferrer,width=640,height=560')
  }

  return (
    <div className="article-share__buttons">
      <button type="button" className="article-share__btn" onClick={copy} aria-label={labels.copyLink} title={labels.copyLink}>
        <LinkIcon />
      </button>
      {networks.map(n => (
        <button
          key={n.key}
          type="button"
          className="article-share__btn"
          onClick={() => open(n.url)}
          aria-label={`${labels.shareOn} ${n.name}`}
          title={`${labels.shareOn} ${n.name}`}
        >
          <SocialIcon network={n.key} />
        </button>
      ))}
      <span className="article-share__status" role="status">{copied ? labels.copied : ''}</span>
    </div>
  )
}
