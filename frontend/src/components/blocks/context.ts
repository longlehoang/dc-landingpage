import type { Locale, UiStrings } from '@/lib/i18n'
import type { SiteKey } from '@/lib/types'

/** What every block may need besides its own data. */
export interface BlockContext {
  locale: Locale
  ui: UiStrings
  site: SiteKey
  /** Current path without locale, e.g. `individual/about`. */
  path: string
}
