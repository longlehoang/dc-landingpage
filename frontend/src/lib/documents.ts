import 'server-only'
import type { Locale } from './i18n'
import { getDocuments, getDocumentYears } from './strapi'

/** One file as the document library client needs it. */
export interface LibraryDoc {
  id: string
  type: string
  category: string
  title: string
  date: string | null
  url: string | null
}

/** Selection data for one fund (and year) of the document library. */
export interface LibrarySelection {
  fund: string
  years: number[]
  year: number | null
  documents: LibraryDoc[]
}

/** Fund option values are short codes such as `VFC`, `VFMVN30`, `OTHERS`. */
export const FUND_CODE = /^[A-Z0-9_]{1,32}$/

/**
 * Years that have documents for `fund`, the selected year (`year` when available, else the newest) and its files.
 * Built on the cached Strapi getters; shared by the server render and `/api/documents`.
 */
export async function loadLibrary(fund: string, year: number | null, locale: Locale): Promise<LibrarySelection> {
  const years = await getDocumentYears(fund, locale)
  const selected = year !== null && years.includes(year) ? year : (years[0] ?? null)
  const rows = selected === null ? [] : await getDocuments(fund, selected, locale)
  const documents: LibraryDoc[] = rows.map(d => ({
    id: d.docId,
    type: d.type ?? 'OTHERS',
    category: d.category ?? 'OTHERS',
    title: (locale === 'en' ? d.titleEn ?? d.titleVi : d.titleVi ?? d.titleEn) ?? '',
    date: d.date,
    url: d.fileUrl,
  }))
  return { fund, years, year: selected, documents }
}
