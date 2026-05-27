import { useEffect, useRef, useState } from 'react'

export default function CountUp({ value, duration = 800, className = '', suffix = '' }) {
  const [shown, setShown] = useState(value)
  const tRef = useRef(null)

  useEffect(() => {
    const from = shown
    const to = value
    const t0 = performance.now()
    cancelAnimationFrame(tRef.current)
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(from + (to - from) * eased))
      if (p < 1) tRef.current = requestAnimationFrame(tick)
    }
    tRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(tRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return <span className={className}>{shown}{suffix}</span>
}
