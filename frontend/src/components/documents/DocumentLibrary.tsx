import type { BlockContext } from '../blocks/context'
import { loadLibrary, type LibrarySelection } from '@/lib/documents'
import { getDocumentTaxonomy } from '@/lib/strapi'
import type { DocumentLibraryBlock } from '@/lib/types'
import DocumentLibraryClient, { type LibraryUi } from './DocumentLibraryClient'

/** Order of the document types in the type filter and the table (as on the live regulatory site). */
const TYPE_ORDER = ['FUND_INFORMATION_AND_GUIDELINES', 'FUND_PERFORMANCE', 'FUND_DISCLOSURE', 'COMPANY_ANNOUNCEMENT', 'FMC_DISCLOSURE', 'OTHERS']

const fallbackTitle = { vi: 'Tài liệu & Báo cáo', en: 'Reports & documents' }

const str = (value: string | string[] | undefined, fallback: string) => (typeof value === 'string' && value ? value : fallback)

/** Fund document library: fund / type / year filters and one accordion row per document section. */
export default async function DocumentLibrary({ block, ctx, first }: { block: DocumentLibraryBlock; ctx: BlockContext; first: boolean }) {
  const { locale } = ctx
  const taxonomy = await getDocumentTaxonomy(locale)
  const funds = block.funds?.length ? block.funds : taxonomy.funds
  const defaultFund = funds.find(f => f.value === block.defaultFund)?.value ?? funds[0]?.value
  const initial: LibrarySelection = defaultFund
    ? await loadLibrary(defaultFund, null, locale)
    : { fund: '', years: [], year: null, documents: [] }

  const typeKeys = Object.keys(taxonomy.types)
  const rank = (k: string) => (TYPE_ORDER.includes(k) ? TYPE_ORDER.indexOf(k) : TYPE_ORDER.length)
  const types = [...typeKeys].sort((a, b) => rank(a) - rank(b)).map(value => ({ value, label: taxonomy.types[value] }))
  const categories = Object.entries(taxonomy.categories).map(([value, label]) => ({ value, label }))

  const en = locale === 'en'
  const columns = Array.isArray(taxonomy.ui.columns) ? taxonomy.ui.columns : []
  const allTypes = str(taxonomy.ui.allTypes, en ? 'Document type: All' : 'Loại tài liệu: Tất cả')
  const ui: LibraryUi = {
    fund: str(taxonomy.ui.fund, en ? 'Fund name' : 'Tên quỹ'),
    type: str(taxonomy.ui.type, en ? 'Document type' : 'Loại tài liệu'),
    year: str(taxonomy.ui.year, en ? 'Year' : 'Năm'),
    allTypes,
    allOption: allTypes.split(':').pop()!.trim(),
    columns: [0, 1, 2, 3].map(i => columns[i] ?? ['Tài liệu', 'Quỹ', 'Loại tài liệu', 'Năm'][i]),
    empty: str(taxonomy.ui.empty, en ? 'No documents found' : 'Không tìm thấy tài liệu nào'),
    noMatch: str(taxonomy.ui.noMatch, en ? 'No matched result' : 'Không có kết quả phù hợp'),
    loading: en ? 'Loading…' : 'Đang tải…',
    error: en ? 'Documents could not be loaded. Please try again.' : 'Không thể tải tài liệu. Vui lòng thử lại.',
    download: en ? 'Download' : 'Tải về',
  }

  const title = block.title ?? (first ? fallbackTitle[locale] : null)
  const headingId = `doc-library-${block.id}`

  return (
    <section id={block.anchor ?? undefined} className="doc-library" aria-labelledby={title ? headingId : undefined}>
      {first ? (
        <div className="page-hero page-hero--pageTitle doc-library__hero">
          <div className="container page-hero__body">
            <h1 id={headingId} className="page-hero__title">{title}</h1>
          </div>
        </div>
      ) : (
        title && <h2 id={headingId} className="sr-only">{title}</h2>
      )}
      <div className="container doc-library__body">
        <DocumentLibraryClient locale={locale} funds={funds} types={types} categories={categories} ui={ui} initial={initial} />
      </div>
    </section>
  )
}
