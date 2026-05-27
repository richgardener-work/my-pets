const PATH = 'M 20 45 Q 20 35 28 35 Q 36 35 36 45 Q 36 52 30 55 Q 24 55 22 52 Q 20 50 20 45 Z M 10 30 Q 10 23 15 23 Q 20 23 20 30 Q 20 34 16 35 Q 12 34 10 30 Z M 22 20 Q 22 14 27 14 Q 32 14 32 20 Q 32 25 28 26 Q 24 25 22 20 Z M 34 22 Q 34 16 38 16 Q 42 16 42 22 Q 42 26 38 27 Q 35 26 34 22 Z'

export default function FloatingPaws({ count = 3 }) {
  const paws = Array.from({ length: count }, (_, i) => ({
    top: 10 + i * 28,
    left: 8 + (i % 2) * 74,
    delay: i * 2,
    size: 48 + (i % 2) * 18,
  }))
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {paws.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 52 60"
          className="absolute animate-paw-float motion-reduce:animate-none"
          style={{
            top: `${p.top}%`, left: `${p.left}%`,
            width: p.size, height: p.size,
            animationDelay: `${p.delay}s`,
            color: 'currentColor',
          }}
        >
          <path d={PATH} fill="currentColor" opacity="0.8" />
        </svg>
      ))}
    </div>
  )
}
