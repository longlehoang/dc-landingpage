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

export type HeadlineTone = 'light' | 'gold' | 'ivory' | 'green'
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

// ---------- Sub-sites (individual, institution, regulatory, corporate) ----------

export type SiteKey = 'corporate' | 'individual' | 'institution' | 'regulatory'
export type Audience = 'individual' | 'institution'

export interface Seo {
  metaTitle: string
  metaDescription: string | null
}

export interface NavGroup {
  id: number
  title: string | null
  links: StrapiLink[]
}

export interface NavItem {
  id: number
  label: string
  url: string | null
  panelTitle: string | null
  groups: NavGroup[]
}

export interface SocialLink {
  id: number
  network: 'linkedin' | 'facebook' | 'youtube' | 'zalo' | 'x'
  url: string
}

export interface KeyValue {
  id: number
  label: string
  value: string | null
}

export interface ContactItem {
  id: number
  label: string
  value: string
  url: string | null
}

export interface StatItem {
  id: number
  label: string
  value: string
}

interface BlockBase<C extends string> {
  __component: C
  id: number
  anchor?: string | null
}

export interface AppPromoFields {
  eyebrow: string | null
  title: string
  text: string | null
  buttonLabel: string | null
  image: StrapiMedia | null
  qr: StrapiMedia | null
  appStoreUrl: string | null
  playStoreUrl: string | null
  moreText: string | null
  moreLink: StrapiLink | null
}

export interface SiteContent {
  key: SiteKey
  label: string | null
  logo: StrapiMedia | null
  footerLogo: StrapiMedia | null
  nav: NavItem[]
  headerCta: StrapiLink | null
  footerColumns: LinkGroup[]
  socialLinks: SocialLink[]
  appTitle: string | null
  appStoreUrl: string | null
  playStoreUrl: string | null
  appStoreBadge: StrapiMedia | null
  playStoreBadge: StrapiMedia | null
  legalLinks: StrapiLink[]
  copyright: string | null
  zaloUrl: string | null
  appModal: (AppPromoFields & { id: number }) | null
}

export type HeroBlock = BlockBase<'blocks.hero'> & {
  variant: 'banner' | 'pageTitle' | 'pageTitleLight' | 'plain' | 'carousel'
  eyebrow: string | null
  title: string
  titleParts: { id: number; text: string; tone: HeadlineTone }[]
  subtitle: string | null
  image: StrapiMedia | null
  mobileImage: StrapiMedia | null
  animation: StrapiMedia | null
  mobileAnimation: StrapiMedia | null
  cta: StrapiLink | null
  contacts: ContactItem[]
  slides: { id: number; title: string; subtitle: string | null; paginationLabel: string | null; image: StrapiMedia | null; cta: StrapiLink | null }[]
}

export type RichTextBlock = BlockBase<'blocks.rich-text'> & {
  eyebrow: string | null
  title: string | null
  subtitle: string | null
  body: string | null
  image: StrapiMedia | null
  imagePosition: 'left' | 'right'
  narrow: boolean | null
}

export interface CardItem {
  id: number
  tag: string | null
  title: string | null
  subtitle: string | null
  text: string | null
  image: StrapiMedia | null
  link: StrapiLink | null
}

export type CardsBlock = BlockBase<'blocks.cards'> & {
  variant: 'grid' | 'solutions' | 'accordion' | 'offices' | 'logos' | 'benefits' | 'ctaBanner'
  eyebrow: string | null
  title: string | null
  titleHighlight: string | null
  subtitle: string | null
  items: CardItem[]
}

export type FeaturesBlock = BlockBase<'blocks.features'> & {
  title: string | null
  items: { id: number; icon: StrapiMedia | null; text: string }[]
}

export type StatsBlock = BlockBase<'blocks.stats'> & { title: string | null; items: StatItem[] }

export type TestimonialsBlock = BlockBase<'blocks.testimonials'> & {
  eyebrow: string | null
  title: string | null
  items: { id: number; quote: string; name: string; image: StrapiMedia | null }[]
}

export type ReturnPeriod = '1M' | '3M' | 'ytd' | '1Y' | '3Y' | '5Y' | '12M'

export interface FundCardItem {
  id: number
  fundSlug: string
  tag: string | null
  title: string | null
  subtitle: string | null
  text: string | null
  icon: StrapiMedia | null
  returnPeriod: ReturnPeriod | null
}

export type FundCardsBlock = BlockBase<'blocks.fund-cards'> & {
  eyebrow: string | null
  title: string | null
  subtitle: string | null
  funds: FundCardItem[]
}

export type AppPromoBlock = BlockBase<'blocks.app-promo'> & AppPromoFields

export type ArticleCategory = 'CAT1' | 'CAT2' | 'CAT3' | 'CAT4' | 'CAT5'

export type NewsFeedBlock = BlockBase<'blocks.news-feed'> & {
  eyebrow: string | null
  title: string | null
  moreLabel: string | null
  moreUrl: string | null
  category: ArticleCategory | null
  count: number | null
}

export type NewsIndexBlock = BlockBase<'blocks.news-index'> & { allLabel: string; emptyText: string | null }

export type TimelineBlock = BlockBase<'blocks.timeline'> & {
  title: string | null
  subtitle: string | null
  items: { id: number; year: string; title: string; text: string | null; image: StrapiMedia | null }[]
}

export interface TeamMember {
  id: number
  name: string
  role: string | null
  image: StrapiMedia | null
  bio: string | null
  linkedinUrl: string | null
}

export type TeamBlock = BlockBase<'blocks.team'> & {
  title: string | null
  subtitle: string | null
  quote: string | null
  groups: { id: number; name: string; people: TeamMember[] }[]
}

export type ContactFormBlock = BlockBase<'blocks.contact-form'> & {
  variant: 'panel' | 'centered'
  eyebrow: string | null
  title: string
  image: StrapiMedia | null
  imagePosition: 'left' | 'right'
  nameLabel: string | null
  companyLabel: string | null
  emailLabel: string | null
  phoneLabel: string | null
  messageLabel: string | null
  optInLabel: string | null
  submitLabel: string | null
  disclaimer: string | null
  successMessage: string | null
}

export type FaqBlock = BlockBase<'blocks.faq'> & {
  title: string | null
  groups: { id: number; name: string | null; items: { id: number; question: string; answer: string | null }[] }[]
}

export type DocumentLibraryBlock = BlockBase<'blocks.document-library'> & {
  title: string | null
  defaultFund: string | null
  funds: { value: string; label: string }[] | null
}

export type AnchorNavBlock = BlockBase<'blocks.anchor-nav'> & { links: StrapiLink[] }

export type VideoCarouselBlock = BlockBase<'blocks.video-carousel'> & {
  slides: { id: number; videoUrl: string; eyebrow: string | null; title: string | null; text: string | null }[]
}

export type Block =
  | HeroBlock | RichTextBlock | CardsBlock | FeaturesBlock | StatsBlock | TestimonialsBlock | FundCardsBlock
  | AppPromoBlock | NewsFeedBlock | NewsIndexBlock | TimelineBlock | TeamBlock | ContactFormBlock | FaqBlock
  | DocumentLibraryBlock | AnchorNavBlock | VideoCarouselBlock

export interface PageContent {
  documentId: string
  title: string
  path: string
  site: SiteKey
  seo: Seo | null
  sections: Block[]
}

export interface ArticleSummary {
  documentId: string
  slug: string
  title: string
  category: ArticleCategory | null
  date: string
  author: string | null
  excerpt: string | null
  cover: StrapiMedia | null
  featuredPriority: number | null
}

export interface ArticleContent extends ArticleSummary {
  body: string | null
  attachments: StrapiLink[]
  seo: Seo | null
}

export interface NavPoint { date: string; nav: number; cumReturnPct: number }
export interface BenchmarkPoint { date: string; value: number; cumReturnPct: number }

export interface FundNavSnapshot {
  navDate: string
  nav: number
  totalNav?: number
  change?: number
  changePct?: number
  [period: string]: number | string | undefined
}

export interface FundContent {
  documentId: string
  slug: string
  audience: Audience
  code: string
  ticker: string | null
  fundCode: string | null
  fundReportCode: string | null
  fundType: 'EQUITY' | 'BOND' | 'BALANCE' | 'ETF' | 'PENSION' | null
  hasProductPage: boolean
  displayOrder: number | null
  inceptionDate: string | null
  asOfDate: string | null
  category: string | null
  displayName: string
  name: string | null
  tagline: string | null
  ctaLabel: string | null
  ctaAction: 'dragonx' | 'contact'
  heroDownloads: StrapiLink[]
  heroStats: { label: string; asOf: string | null; value: string; trend?: 'up' | 'down' | null }[] | null
  objectiveTitle: string | null
  objective: string | null
  strategyTitle: string | null
  strategy: string | null
  keyFactsTitle: string | null
  keyFacts: KeyValue[]
  fees: KeyValue[]
  managersTitle: string | null
  managers: { id: number; name: string; role: string | null; photo: StrapiMedia | null; stats: StatItem[] }[]
  benchmarkName: string | null
  benchmarkHidden: boolean | null
  performanceRemark: string | null
  latestNav: FundNavSnapshot | null
  benchmarkLatest: FundNavSnapshot | null
  performance: { period: string; fund: number | null; benchmark: number | null }[] | null
  expenseRatio12M: { value: number; periodEnd?: string } | null
  trackingError: unknown
  navHistory: NavPoint[] | null
  benchmarkHistory: BenchmarkPoint[] | null
  navHistoryRecent: { date: string; nav: number; change: number; changePct: number; totalNav?: number }[] | null
  allocation: unknown
  topHoldings: unknown
  portfolioStats: unknown
  pricing: unknown
  minimumInvestment: string | null
  seo: Seo | null
  sections: Block[]
}

/** Fund fields needed by cards and menus (no heavy series). */
export type FundSummary = Pick<
  FundContent,
  'documentId' | 'slug' | 'audience' | 'code' | 'fundCode' | 'fundType' | 'category' | 'displayName' | 'name' | 'tagline' | 'latestNav' | 'hasProductPage'
>

export interface FundDocument {
  docId: string
  fundCode: string
  type: string | null
  category: string | null
  year: number | null
  titleVi: string | null
  titleEn: string | null
  date: string | null
  fileUrl: string | null
  inVi: boolean
  inEn: boolean
  displayOrder: number | null
}

export interface DocumentTaxonomy {
  funds: { value: string; label: string }[]
  types: Record<string, string>
  categories: Record<string, string>
  ui: Record<string, string | string[]>
}
