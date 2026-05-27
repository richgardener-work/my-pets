import { AnimatePresence, motion } from 'framer-motion'
import { X, Copy, Check, Gift } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useModalScrollLock } from '../hooks/useModalScrollLock'
import { giftCode } from '../utils/giftCode'

const TG = import.meta.env.VITE_TELEGRAM_URL || 'https://t.me/'

function TelegramIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.533.26l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121L8.48 13.04l-2.95-.924c-.64-.203-.658-.64.135-.954l11.514-4.436c.538-.196 1.006.128.832.89z"/>
    </svg>
  )
}

export default function GiftModal({ milestone, onClose, theme }) {
  const open = !!milestone
  const text = milestone?.text ?? ''
  const code = giftCode(milestone?.stars)

  useModalScrollLock(open)
  const [copied, setCopied] = useState(false)

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!open) return
    setCopied(false)
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const tgHref = `${TG}?text=${encodeURIComponent(`My Pets gift code: ${code}`)}`

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — code stays visible to type manually
    }
  }

  const isDark = theme === 'dark'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-[rgba(10,4,20,0.6)] backdrop-blur-md" />

          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? false : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-[400px] max-w-full rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: isDark ? 'rgba(26,8,40,0.92)' : '#FFFBF5',
              border: isDark ? '1px solid rgba(199,125,255,0.18)' : '1px solid rgba(232,121,180,0.25)',
              color: isDark ? '#F5EEF8' : '#2D1B28',
            }}
          >
            <div className="px-8 pt-7 pb-6">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 grid h-7 w-7 place-items-center rounded-full opacity-50 hover:opacity-100 transition"
              >
                <X size={16} />
              </button>

              <h2 className="flex items-center justify-center gap-3 text-[#E879B4]" style={{ fontFamily: 'Caveat, cursive', fontWeight: 700, fontSize: '30px' }}>
                You have a
                <motion.span
                  className="inline-flex text-[#E879B4]"
                  animate={{ rotate: [0, -14, 14, -9, 9, -4, 4, 0] }}
                  transition={{ duration: 0.65, repeat: Infinity, repeatDelay: 2.5 }}
                >
                  <Gift size={28} strokeWidth={2} />
                </motion.span>
              </h2>

              <p
                className="font-hand mt-4 text-[17px] leading-relaxed whitespace-pre-line"
                style={{ opacity: 0.88 }}
              >
                {text}
              </p>

              <div
                className="mt-6 h-px w-full"
                style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(45,27,40,0.08)' }}
              />

              <p className="mt-3 text-xs opacity-40 leading-snug">
                Send me this code to claim your gift
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-base font-bold tracking-widest text-[#E879B4]">
                  {code}
                </span>
                <button
                  onClick={copyCode}
                  aria-label="Copy code"
                  className="grid h-7 w-7 place-items-center rounded-full transition"
                  style={{ opacity: copied ? 1 : 0.5 }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>

                <a
                  href={tgHref}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto flex items-center gap-1.5 rounded-full bg-morph px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 transition"
                  style={{ boxShadow: '0 8px 18px rgba(232,121,180,0.35)' }}
                >
                  <TelegramIcon size={14} />
                  Send
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
