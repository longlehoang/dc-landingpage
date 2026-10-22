'use client'

import { useActionState, type ReactNode } from 'react'
import { submitContact, type ContactState } from '@/app/actions'
import type { Locale, UiStrings } from '@/lib/i18n'

interface Props {
  locale: Locale
  ui: UiStrings
  /** Path (without locale) of the page the form is on; stored with the lead. */
  sourcePage: string
  nameLabel: string
  emailLabel: string
  /** Optional fields: a field is shown only when it has a label. */
  companyLabel?: string | null
  phoneLabel?: string | null
  messageLabel?: string | null
  optInLabel: string | null
  submitLabel: string
  consent: ReactNode
  successMessage: string
}

const initialState: ContactState = { status: 'idle' }

export default function ContactForm(props: Props) {
  const [state, formAction, pending] = useActionState(submitContact, initialState)
  const errors = state.fieldErrors ?? {}

  if (state.status === 'sent') {
    return <p className="contact__success" role="status">{props.successMessage}</p>
  }

  return (
    <form className="contact__form" action={formAction} noValidate>
      <input type="hidden" name="locale" value={props.locale} />
      <input type="hidden" name="sourcePage" value={props.sourcePage} />
      {props.companyLabel && <input type="hidden" name="companyRequired" value="1" />}
      <div className="sr-only" aria-hidden="true">
        <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <label className="field">
        <span className="sr-only">{props.nameLabel}</span>
        <input name="name" type="text" placeholder={props.nameLabel} autoComplete="name" required
          aria-invalid={!!errors.name} aria-describedby={errors.name ? 'err-name' : undefined} />
        {errors.name && <span id="err-name" className="field__error">{errors.name}</span>}
      </label>
      {props.companyLabel && (
        <label className="field">
          <span className="sr-only">{props.companyLabel}</span>
          <input name="company" type="text" placeholder={props.companyLabel} autoComplete="organization" required
            aria-invalid={!!errors.company} aria-describedby={errors.company ? 'err-company' : undefined} />
          {errors.company && <span id="err-company" className="field__error">{errors.company}</span>}
        </label>
      )}
      <label className="field">
        <span className="sr-only">{props.emailLabel}</span>
        <input name="email" type="email" placeholder={props.emailLabel} autoComplete="email" required
          aria-invalid={!!errors.email} aria-describedby={errors.email ? 'err-email' : undefined} />
        {errors.email && <span id="err-email" className="field__error">{errors.email}</span>}
      </label>
      {props.phoneLabel && (
        <label className="field">
          <span className="sr-only">{props.phoneLabel}</span>
          <input name="phone" type="tel" placeholder={props.phoneLabel} autoComplete="tel" />
        </label>
      )}
      {props.messageLabel && (
        <label className="field">
          <span className="sr-only">{props.messageLabel}</span>
          <textarea name="message" rows={3} placeholder={props.messageLabel} />
        </label>
      )}

      {props.optInLabel && (
        <label className="checkbox">
          <input type="checkbox" name="optIn" />
          <span>{props.optInLabel}</span>
        </label>
      )}

      {state.message && <p className="field__error" role="alert">{state.message}</p>}

      <button type="submit" className="btn btn--solid btn--block btn--lg" disabled={pending}>
        {pending ? props.ui.sending : props.submitLabel}
      </button>

      {props.consent}
    </form>
  )
}
