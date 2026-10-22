import { mediaUrl } from '@/lib/strapi'
import type { TeamBlock } from '@/lib/types'
import Markdown from '../Markdown'
import type { BlockContext } from './context'
import { Tabs } from './interactive'
import TeamGrid from './TeamGrid'

export default function Team({ block, ctx }: { block: TeamBlock; ctx: BlockContext }) {
  const groups = block.groups.map(g => ({
    key: g.id,
    label: g.name,
    content: (
      <TeamGrid
        closeLabel={ctx.ui.close}
        readBioLabel={ctx.ui.readBio}
        people={g.people.map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
          image: mediaUrl(p.image) ?? null,
          linkedinUrl: p.linkedinUrl,
          bio: p.bio ? <Markdown locale={ctx.locale}>{p.bio}</Markdown> : null,
        }))}
      />
    ),
  }))

  return (
    <section id={block.anchor ?? undefined} className="team section">
      <div className="container">
        <div className="team__head">
          <div className="section-head">
            {block.title && <h2 className="section-head__title">{block.title}</h2>}
            {block.subtitle && <p className="section-head__subtitle">{block.subtitle}</p>}
          </div>
          {block.quote && <p className="team__quote">{block.quote}</p>}
        </div>
        {groups.length > 1 ? <Tabs tabs={groups} className="team__tabs" label={block.title ?? undefined} /> : groups[0]?.content}
      </div>
    </section>
  )
}
