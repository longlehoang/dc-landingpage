import Image from 'next/image'
import { mediaUrl } from '@/lib/strapi'
import type { HomepageContent } from '@/lib/types'
import HeroAnimation from './HeroAnimation'
import { AssetsIcon, AwardIcon, FlagIcon } from './Icons'
import Reveal from './Reveal'

export function Hero({ page }: { page: HomepageContent }) {
  const animation = mediaUrl(page.heroAnimation)
  return (
    <section className="hero" aria-labelledby="hero-title">
      {animation && <HeroAnimation src={animation} />}
      <div className="hero__content container">
        <h1 id="hero-title" className="hero__title">
          {page.heroHeadline.map(part => (
            <span key={part.id} className={`hero__title--${part.tone}`}>{part.text}</span>
          ))}
        </h1>
      </div>
    </section>
  )
}

export function About({ page }: { page: HomepageContent }) {
  const image = page.aboutImage
  const src = mediaUrl(image)
  return (
    <Reveal className="about section" aria-labelledby="about-title">
      <div className="container about__grid">
        <div className="about__body">
          {page.aboutEyebrow && <p className="eyebrow">{page.aboutEyebrow}</p>}
          <h2 id="about-title" className="display">{page.aboutTitle}</h2>
          {src && (
            <Image
              className="about__image"
              src={src}
              alt={image?.alternativeText ?? page.aboutTitle}
              width={image?.width ?? 1200}
              height={image?.height ?? 800}
              sizes="(min-width: 1024px) 42vw, 100vw"
            />
          )}
          {page.missionTitle && <h3 className="about__mission-title">{page.missionTitle}</h3>}
          {page.missionText && <p className="about__mission">{page.missionText}</p>}
        </div>
      </div>
    </Reveal>
  )
}

const featureIcons = { award: AwardIcon, assets: AssetsIcon, flag: FlagIcon }

export function WhyUs({ page }: { page: HomepageContent }) {
  return (
    <Reveal className="why section" aria-labelledby="why-title">
      <div className="container why__grid">
        <h2 id="why-title" className="eyebrow eyebrow--dark why__eyebrow">{page.whyEyebrow}</h2>
        {page.features.map(item => {
          const Icon = featureIcons[item.icon] ?? AwardIcon
          return (
            <div key={item.id} className="why__item">
              <span className="why__icon"><Icon /></span>
              <p className="why__text">{item.text}</p>
            </div>
          )
        })}
      </div>
    </Reveal>
  )
}
