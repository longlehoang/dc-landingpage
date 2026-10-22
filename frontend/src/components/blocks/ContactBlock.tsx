import Image from 'next/image'
import { mediaUrl } from '@/lib/strapi'
import type { ContactFormBlock } from '@/lib/types'
import Markdown from '../Markdown'
import ContactForm from '../ContactForm'
import type { BlockContext } from './context'

/** Lead form section ("Liên Hệ Ngay"): image + dark panel, or a centered form on a light band. */
export default function ContactBlock({ block, ctx }: { block: ContactFormBlock; ctx: BlockContext }) {
  const image = mediaUrl(block.image)
  const centered = block.variant === 'centered'
  return (
    <section
      id={block.anchor ?? 'contact'}
      className={`contact contact--${block.variant}${block.imagePosition === 'right' ? ' contact--image-right' : ''}`}
      aria-labelledby={`contact-title-${block.id}`}
    >
      {!centered && (
        <div className="contact__media">
          {image && <Image src={image} alt={block.image?.alternativeText ?? ''} fill sizes="(min-width: 1024px) 62vw, 100vw" />}
        </div>
      )}
      <div className="contact__panel">
        {block.eyebrow && <p className={`eyebrow${centered ? '' : ' eyebrow--light'}`}>{block.eyebrow}</p>}
        <h2 id={`contact-title-${block.id}`} className="contact__title">{block.title}</h2>
        <ContactForm
          locale={ctx.locale}
          ui={ctx.ui}
          sourcePage={`/${ctx.path}`}
          nameLabel={block.nameLabel ?? 'Name'}
          companyLabel={block.companyLabel}
          emailLabel={block.emailLabel ?? 'Email'}
          phoneLabel={block.phoneLabel}
          messageLabel={block.messageLabel}
          optInLabel={block.optInLabel}
          submitLabel={block.submitLabel ?? 'Submit'}
          consent={block.disclaimer ? <Markdown locale={ctx.locale} className="contact__consent">{block.disclaimer}</Markdown> : null}
          successMessage={block.successMessage ?? '✓'}
        />
      </div>
    </section>
  )
}
