export default function MeshGradient({ className = '' }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute animate-mesh-breathe rounded-full blur-3xl motion-reduce:animate-none"
        style={{
          width: '60%', height: '60%', left: '-10%', top: '-20%',
          background: 'radial-gradient(circle, #C77DFF 0%, transparent 60%)',
          opacity: 0.35,
        }}
      />
      <div
        className="absolute animate-mesh-breathe rounded-full blur-3xl motion-reduce:animate-none"
        style={{
          width: '50%', height: '50%', right: '-5%', top: '20%',
          background: 'radial-gradient(circle, #5C1F8B 0%, transparent 60%)',
          opacity: 0.4,
          animationDelay: '-6s',
        }}
      />
      <div
        className="absolute animate-mesh-breathe rounded-full blur-3xl motion-reduce:animate-none"
        style={{
          width: '55%', height: '55%', left: '25%', bottom: '-20%',
          background: 'radial-gradient(circle, #3D1A5C 0%, transparent 60%)',
          opacity: 0.5,
          animationDelay: '-12s',
        }}
      />
    </div>
  )
}
