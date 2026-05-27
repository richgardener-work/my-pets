export default function Logo({ theme = 'light', size = 32, glow = false }) {
  const gradId = `cozy-curl-${theme}`
  const filterId = `cozy-glow-${theme}`
  const stops = theme === 'dark'
    ? [['0%', '#C77DFF'], ['100%', '#E0A7C8']]
    : [['0%', '#E879B4'], ['100%', '#C9A0DC']]
  const eyeStroke = theme === 'dark' ? '#0A0414' : '#FDF5ED'

  const Shape = (
    <>
      <path d="M 20 62 Q 20 38 48 38 Q 80 38 80 62 Q 80 80 48 80 Q 30 80 25 72 Q 22 68 22 62 Z" fill={`url(#${gradId})`} />
      <path d="M 30 42 L 28 30 L 40 40 Z" fill={`url(#${gradId})`} />
      <path d="M 42 38 L 44 28 L 52 38 Z" fill={`url(#${gradId})`} />
      <path d="M 78 60 Q 92 55 88 42 Q 85 35 80 38" stroke={`url(#${gradId})`} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M 36 56 Q 40 58 44 56" stroke={eyeStroke} strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  )

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="My Pets logo"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          {stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
        {glow && (
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        )}
      </defs>
      {glow && (
        <g filter={`url(#${filterId})`} opacity="0.55">
          {Shape}
        </g>
      )}
      <g>{Shape}</g>
    </svg>
  )
}
