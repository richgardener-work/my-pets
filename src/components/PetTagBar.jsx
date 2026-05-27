import { useState } from 'react'

export default function PetTagBar({
  cats = [],
  selectedIds = [],
  onToggle,
  pendingNewName = '',
  onPendingNewNameChange,
  disabled = false,
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%)',
        }}
      >
        {cats.map(cat => {
          const on = selectedIds.includes(cat.id)
          return (
            <button
              key={cat.id}
              type="button"
              disabled={disabled}
              aria-pressed={on}
              onClick={() => onToggle?.(cat.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
                on ? 'bg-morph text-white' : 'opacity-70'
              }`}
              style={on ? {} : { border: '1px solid currentColor' }}
            >
              {cat.name}
            </button>
          )
        })}
      </div>
      <div className="shrink-0">
        {expanded ? (
          <input
            autoFocus
            aria-label="New pet name"
            disabled={disabled}
            value={pendingNewName}
            onChange={(e) => onPendingNewNameChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); setExpanded(false) }
              else if (e.key === 'Escape') { onPendingNewNameChange?.(''); setExpanded(false) }
            }}
            onBlur={() => setExpanded(false)}
            placeholder="name"
            className="w-24 rounded-full border border-dashed border-[#E879B4] bg-transparent px-3 py-1 outline-none disabled:opacity-50"
            style={{ fontSize: '16px' }}
          />
        ) : (
          <button
            type="button"
            disabled={disabled}
            aria-expanded={expanded}
            onClick={() => setExpanded(true)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              pendingNewName
                ? 'bg-morph text-white'
                : 'border border-dashed border-[#E879B4] opacity-80 hover:opacity-100'
            }`}
          >
            {pendingNewName || '+ new'}
          </button>
        )}
      </div>
    </div>
  )
}
