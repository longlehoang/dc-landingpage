'use server'

import { hasLocale, ui } from '@/lib/i18n'

export interface ContactState {
  status: 'idle' | 'error' | 'sent'
  fieldErrors?: { name?: string; company?: string; email?: string }
  message?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Validates the contact form and stores it as a Strapi "Contact submission". */
export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const localeValue = String(formData.get('locale') ?? 'vi')
  const locale = hasLocale(localeValue) ? localeValue : 'vi'
  const t = ui[locale]

  // Honeypot: real users never fill this hidden field.
  if (String(formData.get('website') ?? '')) return { status: 'sent' }

  const field = (key: string, max: number) => String(formData.get(key) ?? '').trim().slice(0, max)
  const name = field('name', 120)
  const company = field('company', 160)
  const email = field('email', 254)
  const phone = field('phone', 40)
  const message = field('message', 2000)
  const sourcePage = field('sourcePage', 200)
  const optIn = formData.get('optIn') === 'on'

  const fieldErrors: ContactState['fieldErrors'] = {}
  if (!name) fieldErrors.name = t.nameRequired
  if (formData.get('companyRequired') && !company) fieldErrors.company = t.companyRequired
  if (!EMAIL_RE.test(email)) fieldErrors.email = t.emailInvalid
  if (Object.keys(fieldErrors).length) return { status: 'error', fieldErrors }

  const token = process.env.STRAPI_WRITE_TOKEN
  if (!token) {
    console.error('STRAPI_WRITE_TOKEN is not set; cannot store contact submissions.')
    return { status: 'error', message: t.submitFailed }
  }

  try {
    const res = await fetch(`${(process.env.STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '')}/api/contact-submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: { name, company, email, phone, message, optIn, sourceLocale: locale, sourcePage } }),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('Strapi rejected contact submission', res.status, await res.text())
      return { status: 'error', message: t.submitFailed }
    }
  } catch (err) {
    console.error('Could not reach Strapi', err)
    return { status: 'error', message: t.submitFailed }
  }

  return { status: 'sent' }
}
