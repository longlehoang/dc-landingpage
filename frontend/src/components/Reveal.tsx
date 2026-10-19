'use client'

import { useEffect, useRef, type ComponentProps } from 'react'

/** A <section> that fades up once it scrolls into view. */
export default function Reveal({ className = '', ...props }: ComponentProps<'section'>) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return <section ref={ref} className={`reveal ${className}`} {...props} />
}
