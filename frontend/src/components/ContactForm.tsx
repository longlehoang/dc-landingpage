'use client'

import { useActionState } from 'react'
import { submitContact, type ContactState } from '@/app/actions'
import type { Locale, UiStrings } from '@/lib/i18n'
import type { StrapiLink } from '@/lib/types'

interface Props {
  locale: Locale
  ui: UiStrings
  nameLabel: string
  emailLabel: string
  messageLabel: string
  optInLabel: string | null
  submitLabel: string
  consent: string | null
  policyLink: StrapiLink | null
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
      <div className="sr-only" aria-hidden="true">
        <label>Company <input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <label className="field">
        <span className="sr-only">{props.nameLabel}</span>
        <input name="name" type="text" placeholder={props.nameLabel} autoComplete="given-name" required
          aria-invalid={!!errors.name} aria-describedby={errors.name ? 'err-name' : undefined} />
        {errors.name && <span id="err-name" className="field__error">{errors.name}</span>}
      </label>
      <label className="field">
        <span className="sr-only">{props.emailLabel}</span>
        <input name="email" type="email" placeholder={props.emailLabel} autoComplete="email" required
          aria-invalid={!!errors.email} aria-describedby={errors.email ? 'err-email' : undefined} />
        {errors.email && <span id="err-email" className="field__error">{errors.email}</span>}
      </label>
      <label className="field">
        <span className="sr-only">{props.messageLabel}</span>
        <textarea name="message" rows={3} placeholder={props.messageLabel} />
      </label>

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

      {props.consent && (
        <p className="contact__consent">
          {props.consent}{' '}
          {props.policyLink && <a href={props.policyLink.url}>{props.policyLink.label}</a>}.*
        </p>
      )}
    </form>
  )
}
