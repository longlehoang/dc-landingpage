import DocumentLibrary from '../documents/DocumentLibrary'
import NewsFeed from '../news/NewsFeed'
import NewsIndex from '../news/NewsIndex'
import type { Block } from '@/lib/types'
import ContactBlock from './ContactBlock'
import { AppPromo, Cards, Faq, Features, RichText, Stats, Testimonials, Timeline, VideoCarousel } from './content'
import type { BlockContext } from './context'
import FundCards from './FundCards'
import Hero from './Hero'
import { AnchorNav } from './interactive'
import Team from './Team'

function BlockView({ block, ctx, first }: { block: Block; ctx: BlockContext; first: boolean }) {
  switch (block.__component) {
    case 'blocks.hero': return <Hero block={block} ctx={ctx} first={first} />
    case 'blocks.rich-text': return <RichText block={block} ctx={ctx} />
    case 'blocks.cards': return <Cards block={block} ctx={ctx} />
    case 'blocks.features': return <Features block={block} />
    case 'blocks.stats': return <Stats block={block} />
    case 'blocks.testimonials': return <Testimonials block={block} ctx={ctx} />
    case 'blocks.fund-cards': return <FundCards block={block} ctx={ctx} />
    case 'blocks.app-promo': return <AppPromo block={block} />
    case 'blocks.news-feed': return <NewsFeed block={block} ctx={ctx} />
    case 'blocks.news-index': return <NewsIndex block={block} ctx={ctx} />
    case 'blocks.timeline': return <Timeline block={block} ctx={ctx} />
    case 'blocks.team': return <Team block={block} ctx={ctx} />
    case 'blocks.contact-form': return <ContactBlock block={block} ctx={ctx} />
    case 'blocks.faq': return <Faq block={block} ctx={ctx} first={first} />
    case 'blocks.document-library': return <DocumentLibrary block={block} ctx={ctx} first={first} />
    case 'blocks.anchor-nav': return <AnchorNav links={block.links} />
    case 'blocks.video-carousel': return <VideoCarousel block={block} ctx={ctx} />
    default: return null
  }
}

/** Renders a page's dynamic-zone sections in order. The first block owns the page's <h1>. */
export default function Blocks({ blocks, ctx }: { blocks: Block[]; ctx: BlockContext }) {
  return blocks.map((block, i) => <BlockView key={`${block.__component}-${block.id}`} block={block} ctx={ctx} first={i === 0} />)
}
