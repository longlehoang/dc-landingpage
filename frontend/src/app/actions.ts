'use server'

import { hasLocale, ui } from '@/lib/i18n'

export interface ContactState {
  status: 'idle' | 'error' | 'sent'
  fieldErrors?: { name?: string; email?: string }
  message?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Validates the contact form and stores it as a Strapi "Contact submission". */
export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const localeValue = String(formData.get('locale') ?? 'vi')
  const locale = hasLocale(localeValue) ? localeValue : 'vi'
  const t = ui[locale]

  // Honeypot: real users never fill this hidden field.
  if (String(formData.get('company') ?? '')) return { status: 'sent' }

  const name = String(formData.get('name') ?? '').trim().slice(0, 120)
  const email = String(formData.get('email') ?? '').trim().slice(0, 254)
  const message = String(formData.get('message') ?? '').trim().slice(0, 2000)
  const optIn = formData.get('optIn') === 'on'

  const fieldErrors: ContactState['fieldErrors'] = {}
  if (!name) fieldErrors.name = t.nameRequired
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
      body: JSON.stringify({ data: { name, email, message, optIn, sourceLocale: locale } }),
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
