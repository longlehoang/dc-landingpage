// Shapes of the Strapi 5 REST responses used by the site (flattened `data`).

export interface StrapiMedia {
  id: number
  url: string
  alternativeText: string | null
  width: number | null
  height: number | null
  mime: string
}

export interface StrapiLink {
  id: number
  label: string
  url: string
  openInNewTab: boolean | null
}

export interface LinkGroup {
  id: number
  title: string
  links: StrapiLink[]
}

export type HeadlineTone = 'light' | 'gold' | 'ivory'
export type FeatureIcon = 'award' | 'assets' | 'flag'

export interface GlobalContent {
  siteName: string
  logo: StrapiMedia | null
  favicon: StrapiMedia | null
  contactButtonLabel: string
  journeyTitle: string
  journeyPrimaryLinks: StrapiLink[]
  journeyOtherTitle: string | null
  journeySecondaryLinks: StrapiLink[]
  footerColumns: LinkGroup[]
  legalLinks: StrapiLink[]
  copyright: string | null
}

export interface HomepageContent {
  seo: { metaTitle: string; metaDescription: string | null } | null
  heroHeadline: { id: number; text: string; tone: HeadlineTone }[]
  heroAnimation: StrapiMedia | null
  aboutEyebrow: string | null
  aboutTitle: string
  aboutImage: StrapiMedia | null
  missionTitle: string | null
  missionText: string | null
  whyEyebrow: string | null
  features: { id: number; icon: FeatureIcon; text: string }[]
  contactEyebrow: string | null
  contactTitle: string
  contactImage: StrapiMedia | null
  contactNameLabel: string | null
  contactEmailLabel: string | null
  contactMessageLabel: string | null
  contactOptInLabel: string | null
  contactSubmitLabel: string | null
  contactConsent: string | null
  contactPolicyLink: StrapiLink | null
  contactSuccessMessage: string | null
}
