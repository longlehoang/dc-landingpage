'use client'

import { useEffect, useRef } from 'react'

/** Plays the hero Lottie animation (uploaded to Strapi) once, or shows its last frame for reduced motion. */
export default function HeroAnimation({ src, className = 'hero__animation' }: { src: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let destroyed = false
    let anim: { destroy: () => void } | undefined
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    import('lottie-web/build/player/lottie_light').then(({ default: lottie }) => {
      if (destroyed || !ref.current) return
      const a = lottie.loadAnimation({
        container: ref.current,
        renderer: 'svg',
        loop: false,
        autoplay: !reduceMotion,
        path: src,
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
      })
      if (reduceMotion) a.addEventListener('DOMLoaded', () => a.goToAndStop(a.totalFrames - 1, true))
      anim = a
    })

    return () => {
      destroyed = true
      anim?.destroy()
    }
  }, [src])

  return <div ref={ref} className={className} aria-hidden="true" />
}
