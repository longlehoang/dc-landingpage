'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown } from '../Icons'

export interface Option {
  value: string
  label: string
}

interface Props {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  noMatch: string
  /** Text shown in the closed field; defaults to the selected option's label. */
  display?: string
  disabled?: boolean
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

/** Underlined type-ahead dropdown (ARIA combobox + listbox), keyboard operable. */
export default function FilterSelect({ label, value, options, onChange, noMatch, display, disabled }: Props) {
  const id = useId()
  const listId = `${id}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const selected = options.find(o => o.value === value)
  const shown = display ?? selected?.label ?? ''
  const matches = query ? options.filter(o => fold(o.label).includes(fold(query))) : options

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const openList = () => {
    if (disabled) return
    setQuery('')
    setActive(Math.max(0, options.findIndex(o => o.value === value)))
    setOpen(true)
  }

  const choose = (option: Option | undefined) => {
    setOpen(false)
    setQuery('')
    if (option && option.value !== value) onChange(option.value)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return openList()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive(i => (matches.length ? (i + step + matches.length) % matches.length : 0))
    } else if (e.key === 'Enter') {
      if (open) {
        e.preventDefault()
        choose(matches[active])
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
        setQuery('')
      }
    } else if (e.key === 'Tab') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={rootRef} className={`doc-select${open ? ' is-open' : ''}`}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        className="doc-select__input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={open ? query : shown}
        placeholder={open ? shown : undefined}
        onChange={e => {
          setQuery(e.target.value)
          setActive(0)
          if (!open) setOpen(true)
        }}
        onClick={() => (open ? undefined : openList())}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        className="doc-select__toggle"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <ChevronDown />
      </button>
      <ul ref={listRef} id={listId} role="listbox" aria-label={label} className="doc-select__list" hidden={!open}>
        {matches.map((o, i) => (
          <li
            key={o.value}
            id={`${id}-opt-${i}`}
            data-index={i}
            role="option"
            aria-selected={o.value === value}
            className={`doc-select__option${i === active ? ' is-active' : ''}`}
            onPointerDown={e => e.preventDefault()}
            onClick={() => choose(o)}
            onPointerMove={() => setActive(i)}
          >
            {o.label}
          </li>
        ))}
        {!matches.length && <li className="doc-select__empty" role="presentation">{noMatch}</li>}
      </ul>
    </div>
  )
}
