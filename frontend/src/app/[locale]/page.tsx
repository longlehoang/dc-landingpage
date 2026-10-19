import Image from 'next/image'
import { notFound } from 'next/navigation'
import ContactForm from '@/components/ContactForm'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import JourneyCard from '@/components/JourneyCard'
import Reveal from '@/components/Reveal'
import { About, Hero, WhyUs } from '@/components/sections'
import { hasLocale, ui } from '@/lib/i18n'
import { getGlobal, getHomepage, mediaUrl } from '@/lib/strapi'

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()

  const [global, page] = await Promise.all([getGlobal(locale), getHomepage(locale)])
  const t = ui[locale]
  const logoUrl = mediaUrl(global.logo)
  const contactImage = page.contactImage
  const contactImageUrl = mediaUrl(contactImage)

  return (
    <>
      <Header
        locale={locale}
        ui={t}
        siteName={global.siteName}
        logoUrl={logoUrl}
        contactLabel={global.contactButtonLabel}
        journeyTitle={global.journeyTitle}
        primaryLinks={global.journeyPrimaryLinks}
        otherTitle={global.journeyOtherTitle}
        secondaryLinks={global.journeySecondaryLinks}
      />

      <main id="main">
        <Hero page={page} />
        <About page={page} />
        <WhyUs page={page} />

        <Reveal id="contact" className="contact" aria-labelledby="contact-title">
          <div className="contact__media">
            {contactImageUrl && (
              <Image
                src={contactImageUrl}
                alt={contactImage?.alternativeText ?? ''}
                fill
                sizes="(min-width: 1024px) 62vw, 100vw"
              />
            )}
          </div>
          <div className="contact__panel">
            {page.contactEyebrow && <p className="eyebrow eyebrow--light">{page.contactEyebrow}</p>}
            <h2 id="contact-title" className="contact__title">{page.contactTitle}</h2>
            <ContactForm
              locale={locale}
              ui={t}
              nameLabel={page.contactNameLabel ?? 'Name'}
              emailLabel={page.contactEmailLabel ?? 'Email'}
              messageLabel={page.contactMessageLabel ?? 'Message'}
              optInLabel={page.contactOptInLabel}
              submitLabel={page.contactSubmitLabel ?? 'Submit'}
              consent={page.contactConsent}
              policyLink={page.contactPolicyLink}
              successMessage={page.contactSuccessMessage ?? '✓'}
            />
          </div>
        </Reveal>
      </main>

      <Footer global={global} logoUrl={logoUrl} />

      <JourneyCard
        label={t.quickLinks}
        title={global.journeyTitle}
        primaryLinks={global.journeyPrimaryLinks}
        otherTitle={global.journeyOtherTitle}
        secondaryLinks={global.journeySecondaryLinks}
      />
    </>
  )
}
