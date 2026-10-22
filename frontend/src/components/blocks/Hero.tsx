import Image from 'next/image'
import { mediaUrl } from '@/lib/strapi'
import type { HeroBlock } from '@/lib/types'
import HeroAnimation from '../HeroAnimation'
import SmartLink from '../SmartLink'
import type { BlockContext } from './context'
import { Carousel } from './interactive'

function Title({ block, as: Tag = 'h1' }: { block: HeroBlock; as?: 'h1' | 'h2' }) {
  if (!block.titleParts.length) return <Tag className="page-hero__title">{block.title}</Tag>
  return (
    <Tag className="page-hero__title">
      {block.titleParts.map((part, i) => (
        // The CMS stores the coloured runs without the spaces between them.
        <span key={part.id} className={`tone--${part.tone}`}>{i > 0 && !/^\s/.test(part.text) ? ' ' : ''}{part.text}</span>
      ))}
    </Tag>
  )
}

export default function Hero({ block, ctx, first }: { block: HeroBlock; ctx: BlockContext; first: boolean }) {
  const image = mediaUrl(block.image)
  const animation = mediaUrl(block.animation)
  const mobileAnimation = mediaUrl(block.mobileAnimation)
  const Heading = first ? 'h1' : 'h2'

  if (block.variant === 'carousel' && block.slides.length) {
    return (
      <section id={block.anchor ?? undefined} className="page-hero page-hero--carousel">
        <Carousel label={block.title} prevLabel={ctx.ui.previous} nextLabel={ctx.ui.next} controls="bottom" className="page-hero__slides">
          {block.slides.map((slide, i) => {
            const src = mediaUrl(slide.image)
            const SlideTitle = i === 0 ? Heading : 'h2'
            return (
              <div key={slide.id} className="page-hero__slide">
                {src && <Image src={src} alt="" fill sizes="100vw" className="page-hero__slide-image" preload={first && i === 0} />}
                <div className="container page-hero__slide-body">
                  {slide.paginationLabel && <p className="page-hero__index">{String(i + 1).padStart(2, '0')} · {slide.paginationLabel}</p>}
                  <SlideTitle className="page-hero__title">{slide.title}</SlideTitle>
                  {slide.subtitle && <p className="page-hero__subtitle">{slide.subtitle}</p>}
                  {slide.cta && <SmartLink link={slide.cta} className="btn btn--pill" />}
                </div>
              </div>
            )
          })}
        </Carousel>
      </section>
    )
  }

  if (block.variant === 'banner') {
    return (
      <section id={block.anchor ?? undefined} className="page-hero page-hero--banner">
        <div className="page-hero__media">
          {animation ? (
            <>
              <HeroAnimation src={animation} className={`page-hero__animation${mobileAnimation ? ' page-hero__animation--desktop' : ''}`} />
              {mobileAnimation && <HeroAnimation src={mobileAnimation} className="page-hero__animation page-hero__animation--mobile" />}
            </>
          ) : (
            image && <Image src={image} alt={block.image?.alternativeText ?? ''} fill sizes="(min-width: 1024px) 50vw, 100vw" preload={first} />
          )}
        </div>
        <div className="container page-hero__body">
          {block.eyebrow && <p className="eyebrow eyebrow--light">{block.eyebrow}</p>}
          <Title block={block} as={Heading} />
          {block.subtitle && <p className="page-hero__subtitle">{block.subtitle}</p>}
          {block.cta && <SmartLink link={block.cta} className="btn btn--pill" />}
        </div>
      </section>
    )
  }

  // pageTitle (dark band), pageTitleLight (grey band), plain (heading on white)
  const bgImage = block.variant === 'pageTitle' && image
  return (
    <section id={block.anchor ?? undefined} className={`page-hero page-hero--${block.variant}${bgImage ? ' page-hero--image' : ''}`}>
      {bgImage && <Image src={image} alt="" fill sizes="100vw" className="page-hero__bg" preload={first} />}
      <div className="container page-hero__body">
        {block.eyebrow && <p className="eyebrow">{block.eyebrow}</p>}
        <Title block={block} as={Heading} />
        {block.subtitle && <p className="page-hero__subtitle">{block.subtitle}</p>}
        {block.contacts.length > 0 && (
          <dl className="page-hero__contacts">
            {block.contacts.map(c => (
              <div key={c.id}>
                <dt>{c.label}</dt>
                <dd>{c.url ? <a href={c.url}>{c.value}</a> : c.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {block.cta && <SmartLink link={block.cta} className="btn btn--pill" />}
      </div>
    </section>
  )
}
