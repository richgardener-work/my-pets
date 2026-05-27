import { useEffect, useRef, useState } from 'react'
import MeshGradient from './decor/MeshGradient'
import PaperNoise from './decor/PaperNoise'
import { useTheme } from '../hooks/useTheme'
import { desktopVideos, mobileVideos, pickRandom } from '../utils/heroVideos'

export default function HeroVideo() {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  const { dark } = useTheme()

  const [desktopSrc] = useState(() => pickRandom(desktopVideos))
  const [mobileSrc]  = useState(() => pickRandom(mobileVideos))

  const [src, setSrc] = useState(() => {
    const portrait = window.matchMedia?.('(orientation: portrait)').matches ?? false
    return (portrait && mobileSrc) ? mobileSrc : desktopSrc
  })

  useEffect(() => {
    if (!mobileSrc) return
    const mq = window.matchMedia('(orientation: portrait)')
    const handler = (e) => setSrc(e.matches ? mobileSrc : desktopSrc)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [desktopSrc, mobileSrc])

  const handleCanPlay = () => {
    const v = ref.current
    if (!v) return
    v.play().catch(() => setFailed(true))
  }

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const onVis = () => document.hidden ? v.pause() : v.play().catch(() => {})
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  if (failed || !src) {
    return (
      <div className="absolute inset-0">
        <MeshGradient />
      </div>
    )
  }

  return (
    <>
      <video
        key={src}
        ref={ref}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onCanPlay={handleCanPlay}
        onError={() => setFailed(true)}
        className="ken-burns absolute inset-0 h-full w-full object-cover"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: dark
            ? [
                'linear-gradient(to bottom, rgba(10,4,20,0.85) 0%, transparent 18%, transparent 72%, rgba(10,4,20,0.95) 100%)',
                'radial-gradient(ellipse at center, rgba(10,4,20,0.35) 0%, rgba(10,4,20,0.72) 100%)',
                'linear-gradient(135deg, rgba(232,121,180,0.22), rgba(199,125,255,0.26))',
                'rgba(10,4,20,0.15)',
              ].join(',')
            : [
                'linear-gradient(to bottom, rgba(253,245,237,0.75) 0%, transparent 20%, transparent 74%, rgba(253,245,237,0.98) 100%)',
                'radial-gradient(ellipse at center, rgba(10,4,20,0.35) 0%, rgba(10,4,20,0.72) 100%)',
                'linear-gradient(135deg, rgba(232,121,180,0.22), rgba(199,125,255,0.26))',
                'rgba(10,4,20,0.15)',
              ].join(','),
          transform: 'translateZ(0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
      />

      <PaperNoise opacity={0.1} blend="overlay" />
    </>
  )
}
