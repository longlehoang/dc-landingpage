'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { CloseIcon } from '../Icons'

/** The DragonX download dialog. Any link to `#dragonx` on the page opens it. */
export default function AppModal({ closeLabel, children }: { closeLabel: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.('a[href$="#dragonx"], button[data-dragonx]')
      if (!link) return
      e.preventDefault()
      ref.current?.showModal()
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <dialog
      ref={ref}
      className="app-modal"
      aria-label="DragonX"
      onClick={e => e.target === ref.current && ref.current?.close()}
    >
      <button type="button" className="app-modal__close" aria-label={closeLabel} onClick={() => ref.current?.close()}>
        <CloseIcon />
      </button>
      {children}
    </dialog>
  )
}
