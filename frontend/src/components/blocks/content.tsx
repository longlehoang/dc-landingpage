import Image from 'next/image'
import { mediaUrl } from '@/lib/strapi'
import type {
  AppPromoFields,
  CardItem,
  CardsBlock,
  FaqBlock,
  FeaturesBlock,
  RichTextBlock,
  StatsBlock,
  TestimonialsBlock,
  TimelineBlock,
  VideoCarouselBlock,
} from '@/lib/types'
import { ArrowRight } from '../Icons'
import Markdown from '../Markdown'
import Reveal from '../Reveal'
import SmartLink from '../SmartLink'
import type { BlockContext } from './context'
import { Accordion, Carousel, Tabs } from './interactive'

/** Title where one phrase is highlighted in accent green. */
function Highlighted({ text, highlight }: { text: string; highlight: string | null }) {
  const at = highlight ? text.indexOf(highlight) : -1
  if (!highlight || at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <span className="tone--green">{highlight}</span>
      {text.slice(at + highlight.length)}
    </>
  )
}

function SectionHead({ eyebrow, title, highlight = null, subtitle, light = false }: {
  eyebrow?: string | null
  title?: string | null
  highlight?: string | null
  subtitle?: string | null
  light?: boolean
}) {
  if (!eyebrow && !title && !subtitle) return null
  return (
    <div className={`section-head${light ? ' section-head--light' : ''}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {title && <h2 className="section-head__title"><Highlighted text={title} highlight={highlight} /></h2>}
      {subtitle && <p className="section-head__subtitle">{subtitle}</p>}
    </div>
  )
}

export function RichText({ block, ctx }: { block: RichTextBlock; ctx: BlockContext }) {
  const image = mediaUrl(block.image)
  return (
    <Reveal id={block.anchor ?? undefined} className={`rich-text section${image ? ` rich-text--media rich-text--${block.imagePosition}` : ''}`}>
      <div className={`container rich-text__grid${block.narrow ? ' rich-text__grid--narrow' : ''}`}>
        {image && (
          <Image
            className="rich-text__image"
            src={image}
            alt={block.image?.alternativeText ?? ''}
            width={block.image?.width ?? 1200}
            height={block.image?.height ?? 800}
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
        )}
        <div className="rich-text__body">
          {block.eyebrow && <p className="eyebrow">{block.eyebrow}</p>}
          {block.title && <h2 className="display rich-text__title">{block.title}</h2>}
          {block.subtitle && <h3 className="rich-text__subtitle">{block.subtitle}</h3>}
          <Markdown locale={ctx.locale}>{block.body}</Markdown>
        </div>
      </div>
    </Reveal>
  )
}

function CardImage({ item, sizes, className }: { item: CardItem; sizes: string; className: string }) {
  const src = mediaUrl(item.image)
  if (!src) return null
  return (
    <Image
      className={className}
      src={src}
      alt={item.image?.alternativeText ?? item.title ?? ''}
      width={item.image?.width ?? 800}
      height={item.image?.height ?? 600}
      sizes={sizes}
    />
  )
}

export function Cards({ block, ctx }: { block: CardsBlock; ctx: BlockContext }) {
  const id = block.anchor ?? undefined
  const head = <SectionHead eyebrow={block.eyebrow} title={block.title} highlight={block.titleHighlight} subtitle={block.subtitle} />

  switch (block.variant) {
    case 'ctaBanner': {
      const link = block.items.find(i => i.link)?.link
      return (
        <section id={id} className="cta-banner">
          <div className="container cta-banner__inner">
            <div>
              {block.title && <h2 className="cta-banner__title">{block.title}</h2>}
              {block.subtitle && <p className="cta-banner__subtitle">{block.subtitle}</p>}
            </div>
            {link && <SmartLink link={link} className="btn btn--pill btn--light" />}
          </div>
        </section>
      )
    }

    case 'accordion':
      return (
        <Reveal id={id} className="cards-accordion section">
          <div className="container cards-accordion__grid">
            {head}
            <Accordion
              defaultOpen={0}
              className="cards-accordion__list"
              items={block.items.map(item => ({
                key: item.id,
                title: item.title,
                content: (
                  <div className="cards-accordion__panel">
                    <Markdown locale={ctx.locale}>{item.text}</Markdown>
                    <CardImage item={item} sizes="(min-width: 1024px) 40vw, 100vw" className="cards-accordion__image" />
                  </div>
                ),
              }))}
            />
          </div>
        </Reveal>
      )

    case 'offices':
      return (
        <Reveal id={id} className="offices section">
          <div className="container">
            {head}
            <Carousel label={block.title ?? ''} prevLabel={ctx.ui.previous} nextLabel={ctx.ui.next} className="offices__carousel">
              {block.items.map(item => (
                <article key={item.id} className="office-card">
                  <CardImage item={item} sizes="(min-width: 1024px) 30vw, 85vw" className="office-card__image" />
                  <h3 className="office-card__city">{item.title}</h3>
                  {item.subtitle && <p className="office-card__type">{item.subtitle}</p>}
                  {item.text && <p className="office-card__address">{item.text}</p>}
                </article>
              ))}
            </Carousel>
          </div>
        </Reveal>
      )

    case 'logos':
      return (
        <section id={id} className="logos section">
          <div className="container">
            {head}
            <ul className="logos__list">
              {block.items.map(item => {
                const src = mediaUrl(item.image)
                return src ? (
                  <li key={item.id}>
                    <Image src={src} alt={item.image?.alternativeText ?? item.title ?? ''} width={item.image?.width ?? 200} height={item.image?.height ?? 80} />
                  </li>
                ) : null
              })}
            </ul>
          </div>
        </section>
      )

    case 'benefits':
      return (
        <Reveal id={id} className="benefits section">
          <div className="container">
            {head}
            <Carousel label={block.title ?? ''} prevLabel={ctx.ui.previous} nextLabel={ctx.ui.next} className="benefits__carousel">
              {block.items.map(item => (
                <article key={item.id} className="benefit-card">
                  <CardImage item={item} sizes="(min-width: 1024px) 30vw, 85vw" className="benefit-card__image" />
                  <div className="benefit-card__body">
                    <h3>{item.title}</h3>
                    <Markdown locale={ctx.locale}>{item.text}</Markdown>
                  </div>
                </article>
              ))}
            </Carousel>
          </div>
        </Reveal>
      )

    case 'solutions':
      return (
        <Reveal id={id} className="solutions section">
          <div className="container solutions__grid">
            {head}
            <div className="solutions__list">
              {block.items.map(item => {
                const body = (
                  <>
                    {item.tag && <span className="pill">{item.tag}</span>}
                    <h3 className="solution-card__title">{item.title}</h3>
                    <Markdown locale={ctx.locale} className="solution-card__text">{item.text}</Markdown>
                    <span className="solution-card__arrow"><ArrowRight /></span>
                  </>
                )
                return item.link ? (
                  <SmartLink key={item.id} link={item.link} className="solution-card">{body}</SmartLink>
                ) : (
                  <div key={item.id} className="solution-card">{body}</div>
                )
              })}
            </div>
          </div>
        </Reveal>
      )

    default:
      return (
        <Reveal id={id} className="card-grid section">
          <div className="container">
            {head}
            <div className="card-grid__list">
              {block.items.map(item => (
                <article key={item.id} className="card">
                  <CardImage item={item} sizes="(min-width: 1024px) 30vw, 100vw" className="card__image" />
                  {item.tag && <span className="pill">{item.tag}</span>}
                  {item.title && <h3 className="card__title">{item.title}</h3>}
                  {item.subtitle && <p className="card__subtitle">{item.subtitle}</p>}
                  <Markdown locale={ctx.locale}>{item.text}</Markdown>
                  {item.link && <SmartLink link={item.link} className="card__link" />}
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      )
  }
}

export function Features({ block }: { block: FeaturesBlock }) {
  return (
    <Reveal id={block.anchor ?? undefined} className="why section">
      <div className="container why__grid">
        {block.title && <h2 className="eyebrow eyebrow--dark why__eyebrow">{block.title}</h2>}
        {block.items.map(item => {
          const icon = mediaUrl(item.icon)
          return (
            <div key={item.id} className="why__item">
              {icon && <Image className="why__icon" src={icon} alt="" width={40} height={40} unoptimized />}
              <p className="why__text">{item.text}</p>
            </div>
          )
        })}
      </div>
    </Reveal>
  )
}

export function Stats({ block }: { block: StatsBlock }) {
  return (
    <Reveal id={block.anchor ?? undefined} className="stats section">
      <div className="container stats__grid">
        {block.title && <h2 className="eyebrow eyebrow--dark stats__title">{block.title}</h2>}
        <dl className="stats__list">
          {block.items.map(item => (
            <div key={item.id} className="stats__item">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Reveal>
  )
}

export function Testimonials({ block, ctx }: { block: TestimonialsBlock; ctx: BlockContext }) {
  return (
    <section id={block.anchor ?? undefined} className="testimonials section">
      <div className="container">
        <SectionHead eyebrow={block.eyebrow} title={block.title} />
      </div>
      <Carousel label={block.title ?? ''} prevLabel={ctx.ui.previous} nextLabel={ctx.ui.next} className="testimonials__carousel" controls="bottom">
        {block.items.flatMap((item, i) => {
          const src = mediaUrl(item.image)
          return [
            <figure key={`q${item.id}`} className={`testimonial testimonial--${i % 2 ? 'green' : 'dark'}`}>
              <span className="testimonial__mark" aria-hidden="true">“</span>
              <blockquote>{item.quote}</blockquote>
              <figcaption>{item.name}</figcaption>
            </figure>,
            src ? (
              <div key={`p${item.id}`} className="testimonial testimonial--photo">
                <Image src={src} alt={item.image?.alternativeText ?? item.name} fill sizes="(min-width: 1024px) 28vw, 85vw" />
              </div>
            ) : null,
          ]
        })}
      </Carousel>
    </section>
  )
}

/** DragonX download content; used inline (block) and inside the header modal. */
export function AppPromoContent({ data, variant }: { data: AppPromoFields; variant: 'section' | 'modal' }) {
  const image = mediaUrl(data.image)
  const qr = mediaUrl(data.qr)
  return (
    <div className={`app-promo app-promo--${variant}`}>
      <div className="app-promo__body">
        {data.eyebrow && <p className="eyebrow">{data.eyebrow}</p>}
        <h2 className="app-promo__title">{data.title}</h2>
        {data.text && <p className="app-promo__text">{data.text}</p>}
        <div className="app-promo__actions">
          {variant === 'section' && data.buttonLabel ? (
            <button type="button" data-dragonx className="btn btn--pill">{data.buttonLabel}</button>
          ) : (
            <>
              {data.appStoreUrl && <a className="btn btn--outline" href={data.appStoreUrl} target="_blank" rel="noopener noreferrer">App Store</a>}
              {data.playStoreUrl && <a className="btn btn--outline" href={data.playStoreUrl} target="_blank" rel="noopener noreferrer">Google Play</a>}
            </>
          )}
        </div>
        {variant === 'modal' && data.moreLink && (
          <p className="app-promo__more">
            {data.moreText} <SmartLink link={data.moreLink} />
          </p>
        )}
      </div>
      {variant === 'modal' && qr && <Image className="app-promo__qr" src={qr} alt="QR DragonX" width={160} height={160} unoptimized />}
      {variant === 'section' && image && (
        <Image className="app-promo__image" src={image} alt={data.image?.alternativeText ?? ''} width={data.image?.width ?? 800} height={data.image?.height ?? 600} sizes="(min-width: 1024px) 50vw, 100vw" />
      )}
    </div>
  )
}

export function AppPromo({ block }: { block: AppPromoFields & { anchor?: string | null } }) {
  return (
    <Reveal id={block.anchor ?? undefined} className="app-promo-section section">
      <div className="container">
        <AppPromoContent data={block} variant="section" />
      </div>
    </Reveal>
  )
}

export function Timeline({ block, ctx }: { block: TimelineBlock; ctx: BlockContext }) {
  return (
    <section id={block.anchor ?? undefined} className="timeline section">
      <div className="container">
        <SectionHead title={block.title} subtitle={block.subtitle} light />
        <Carousel label={block.title ?? ''} prevLabel={ctx.ui.previous} nextLabel={ctx.ui.next} className="timeline__carousel">
          {block.items.map(item => {
            const src = mediaUrl(item.image)
            return (
              <article key={item.id} className="milestone">
                <p className="milestone__year">{item.year}</p>
                {src && <Image className="milestone__image" src={src} alt={item.image?.alternativeText ?? ''} width={item.image?.width ?? 600} height={item.image?.height ?? 400} sizes="(min-width: 1024px) 30vw, 85vw" />}
                <h3 className="milestone__title">{item.title}</h3>
                {item.text && <p className="milestone__text">{item.text}</p>}
              </article>
            )
          })}
        </Carousel>
      </div>
    </section>
  )
}

export function Faq({ block, ctx, first }: { block: FaqBlock; ctx: BlockContext; first: boolean }) {
  const Heading = first ? 'h1' : 'h2'
  const list = (items: FaqBlock['groups'][number]['items']) => (
    <Accordion
      className="faq__list"
      items={items.map(item => ({ key: item.id, title: item.question, content: <Markdown locale={ctx.locale}>{item.answer}</Markdown> }))}
    />
  )
  const groups = block.groups.filter(g => g.items.length)
  return (
    <section id={block.anchor ?? undefined} className="faq section">
      <div className="container faq__inner">
        {block.title && <Heading className="faq__title">{block.title}</Heading>}
        {groups.length > 1 ? (
          <Tabs
            className="faq__tabs"
            label={block.title ?? undefined}
            tabs={groups.map(g => ({
              key: g.id,
              label: g.name ?? '',
              content: (
                <>
                  <h2 className="faq__group-title">{g.name}</h2>
                  {list(g.items)}
                </>
              ),
            }))}
          />
        ) : (
          groups[0] && list(groups[0].items)
        )}
      </div>
    </section>
  )
}

export function VideoCarousel({ block, ctx }: { block: VideoCarouselBlock; ctx: BlockContext }) {
  return (
    <section id={block.anchor ?? undefined} className="video-carousel section">
      <div className="container">
        <Carousel label="Video" prevLabel={ctx.ui.previous} nextLabel={ctx.ui.next} controls="bottom" className="video-carousel__track">
          {block.slides.map(slide => (
            <div key={slide.id} className="video-slide">
              <div className="video-slide__frame">
                <iframe
                  src={slide.videoUrl}
                  title={slide.title ?? 'Video'}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="video-slide__body">
                {slide.eyebrow && <p className="eyebrow">{slide.eyebrow}</p>}
                {slide.title && <h2 className="section-head__title">{slide.title}</h2>}
                <Markdown locale={ctx.locale}>{slide.text}</Markdown>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  )
}
