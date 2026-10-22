'use client'

import Image from 'next/image'
import { useRef, useState, type ReactNode } from 'react'
import { CloseIcon, SocialIcon } from '../Icons'

interface Person {
  id: number
  name: string
  role: string | null
  image: string | null
  linkedinUrl: string | null
  bio: ReactNode
}

/** Leadership cards; a card with a bio opens it in a dialog. */
export default function TeamGrid({ people, closeLabel, readBioLabel }: { people: Person[]; closeLabel: string; readBioLabel: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [current, setCurrent] = useState<Person | null>(null)

  const open = (p: Person) => {
    setCurrent(p)
    dialog.current?.showModal()
  }

  return (
    <>
      <ul className="team__grid">
        {people.map(p => (
          <li key={p.id} className="person">
            <button type="button" className="person__card" onClick={() => p.bio && open(p)} disabled={!p.bio} aria-label={p.bio ? `${readBioLabel}: ${p.name}` : undefined}>
              {p.image && <Image className="person__photo" src={p.image} alt={p.name} width={400} height={480} sizes="(min-width: 1024px) 22vw, 45vw" />}
              <span className="person__name">{p.name}</span>
              {p.role && <span className="person__role">{p.role}</span>}
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dialog} className="bio-dialog" onClose={() => setCurrent(null)} onClick={e => e.target === dialog.current && dialog.current?.close()}>
        <button type="button" className="app-modal__close" aria-label={closeLabel} onClick={() => dialog.current?.close()}>
          <CloseIcon />
        </button>
        {current && (
          <div className="bio-dialog__body">
            <div className="bio-dialog__aside">
              {current.image && <Image className="bio-dialog__photo" src={current.image} alt={current.name} width={320} height={384} />}
              {current.linkedinUrl && (
                <a className="bio-dialog__linkedin" href={current.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <SocialIcon network="linkedin" />
                </a>
              )}
            </div>
            <div>
              <h2 className="bio-dialog__name">{current.name}</h2>
              {current.role && <p className="bio-dialog__role">{current.role}</p>}
              {current.bio}
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
