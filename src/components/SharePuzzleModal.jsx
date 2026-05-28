import { AnimatePresence, motion } from 'framer-motion'
import { X, Copy, Check, Share2, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useModalScrollLock } from '../hooks/useModalScrollLock'
import { createShareDoc } from '../utils/createShare'
import { useTheme } from '../hooks/useTheme'

const MAX_LENGTH = 200

const STEPS = [
  { label: '5m',  ms: 5 * 60 * 1000 },
  { label: '1h',  ms: 60 * 60 * 1000 },
  { label: '2h',  ms: 2 * 60 * 60 * 1000 },
  { label: '6h',  ms: 6 * 60 * 60 * 1000 },
  { label: '12h', ms: 12 * 60 * 60 * 1000 },
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
  { label: '48h', ms: 48 * 60 * 60 * 1000 },
  { label: '72h', ms: 72 * 60 * 60 * 1000 },
  { label: '∞',   ms: null },
]

const DEFAULT_STEP = 5 // 24h

export default function SharePuzzleModal({ open, onClose, photoId, difficulty, senderUid }) {
  const { dark } = useTheme()
  const [message, setMessage] = useState('')
  const [stepIndex, setStepIndex] = useState(DEFAULT_STEP)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorBtn, setErrorBtn] = useState(null)
  const [cachedLink, setCachedLink] = useState(null)

  useModalScrollLock(open)

  useEffect(() => {
    if (!open) return
    setMessage('')
    setStepIndex(DEFAULT_STEP)
    setCopied(false)
    setLoading(false)
    setErrorBtn(null)
    setCachedLink(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const isDark = dark
  const currentStep = STEPS[stepIndex]

  function stepUp() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
    setCachedLink(null)
  }
  function stepDown() {
    setStepIndex((i) => Math.max(i - 1, 0))
    setCachedLink(null)
  }

  async function resolveUrl() {
    if (cachedLink?.message === message && cachedLink?.stepIndex === stepIndex) return cachedLink.url
    const { url } = await createShareDoc({ message, photoId, difficulty, senderUid, ttlMs: currentStep.ms })
    setCachedLink({ message, stepIndex, url })
    return url
  }

  async function handleCopy() {
    if (!message || loading) return
    setLoading(true)
    try {
      const url = await resolveUrl()
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setErrorBtn('copy')
      setTimeout(() => setErrorBtn(null), 2000)
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    if (!message || loading) return
    setLoading(true)
    try {
      const url = await resolveUrl()
      if (navigator.share) {
        await navigator.share({ title: 'Play this pet puzzle!', url })
      } else {
        await navigator.clipboard.writeText(url)
      }
      onClose()
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setErrorBtn('share')
        setTimeout(() => setErrorBtn(null), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

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

              <h2
                className="text-center text-[#E879B4]"
                style={{ fontFamily: 'Caveat, cursive', fontWeight: 700, fontSize: '28px' }}
              >
                Share Puzzle
              </h2>

              <textarea
                placeholder="Write a short message to your friend..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
                rows={4}
                className="mt-4 w-full resize-none rounded-xl border px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E879B4]/40"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(45,27,40,0.04)',
                  border: isDark ? '1px solid rgba(199,125,255,0.2)' : '1px solid rgba(232,121,180,0.3)',
                  color: 'inherit',
                }}
              />

              {/* Row 1: "Expires in" label + char counter */}
              <div className="mt-1 flex items-center justify-between text-xs opacity-40">
                <span className="select-none">Expires in</span>
                <span>{message.length} / {MAX_LENGTH}</span>
              </div>

              {/* Row 2: stepper + action buttons */}
              <div className="mt-1.5 flex items-center">
                {/* Duration stepper */}
                <div
                  className="flex items-center rounded-full overflow-hidden"
                  style={{ border: isDark ? '1px solid rgba(199,125,255,0.25)' : '1px solid rgba(232,121,180,0.35)' }}
                >
                  <button
                    onClick={stepDown}
                    disabled={stepIndex === 0}
                    aria-label="Decrease expiry"
                    className="grid h-7 w-6 place-items-center transition opacity-60 hover:enabled:opacity-100 disabled:opacity-20"
                  >
                    <ChevronDown size={13} />
                  </button>

                  <span
                    className="min-w-[2.6rem] text-center text-xs font-semibold select-none"
                    style={{ color: '#E879B4' }}
                  >
                    {currentStep.label}
                  </span>

                  <button
                    onClick={stepUp}
                    disabled={stepIndex === STEPS.length - 1}
                    aria-label="Increase expiry"
                    className="grid h-7 w-6 place-items-center transition opacity-60 hover:enabled:opacity-100 disabled:opacity-20"
                  >
                    <ChevronUp size={13} />
                  </button>
                </div>

                {/* Action buttons */}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!message || loading}
                    aria-label={copied ? 'Copied' : 'Copy link'}
                    className="grid h-7 w-7 place-items-center rounded-full transition disabled:cursor-not-allowed"
                    style={{ opacity: copied ? 1 : (!message || loading) ? 0.3 : 0.5 }}
                  >
                    {loading && errorBtn !== 'share' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : errorBtn === 'copy' ? (
                      <X size={14} />
                    ) : copied ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>

                  <button
                    onClick={handleShare}
                    disabled={!message || loading}
                    aria-label="Share"
                    className="flex items-center gap-1.5 rounded-full bg-morph px-4 py-1.5 text-sm font-medium text-white transition hover:enabled:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ boxShadow: '0 8px 18px rgba(232,121,180,0.35)' }}
                  >
                    {loading && errorBtn !== 'copy' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : errorBtn === 'share' ? (
                      <><X size={14} /> Error</>
                    ) : (
                      <><Share2 size={14} /> Share</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
