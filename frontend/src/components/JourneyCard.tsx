import type { StrapiLink } from '@/lib/types'
import { ArrowUpRight } from './Icons'
import SmartLink from './SmartLink'

interface Props {
  label: string
  title: string
  primaryLinks: StrapiLink[]
  otherTitle: string | null
  secondaryLinks: StrapiLink[]
}

/** Floating quick-links card pinned to the bottom-right on desktop. */
export default function JourneyCard({ label, title, primaryLinks, otherTitle, secondaryLinks }: Props) {
  return (
    <aside className="journey" aria-label={label}>
      <h4 className="journey__title">{title}</h4>
      <ul className="journey__list">
        {primaryLinks.map(l => (
          <li key={l.id}>
            <SmartLink link={l} className="journey__link">
              {l.label}
              <ArrowUpRight />
            </SmartLink>
          </li>
        ))}
      </ul>
      {secondaryLinks.length > 0 && (
        <>
          <hr className="journey__divider" />
          {otherTitle && <h4 className="journey__subtitle">{otherTitle}</h4>}
          <ul className="journey__list">
            {secondaryLinks.map(l => (
              <li key={l.id}>
                <SmartLink link={l} className="journey__link journey__link--small" />
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  )
}
