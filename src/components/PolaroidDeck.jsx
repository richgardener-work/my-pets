import { motion } from 'framer-motion'
import { homeDeckItems } from '../utils/demoAssets'

export default function PolaroidDeck() {
  return (
    <div className="relative h-[420px] w-full max-w-[420px]">
      {homeDeckItems.slice(0, 3).map((it, i) => (
        <motion.div
          key={i}
          drag
          dragElastic={0.2}
          dragConstraints={{ top: -40, bottom: 40, left: -40, right: 40 }}
          whileTap={{ scale: 1.03 }}
          initial={{ rotate: (i - 1) * 8, y: i * 12, opacity: 0 }}
          animate={{ rotate: (i - 1) * 8, y: i * 12, opacity: 1, transition: { delay: 0.15 + i * 0.1, type: 'spring', stiffness: 180, damping: 18 } }}
          className="absolute inset-0 m-auto flex h-[360px] w-[280px] cursor-grab flex-col rounded-md bg-light-cream p-3 shadow-2xl dark:bg-dark-card"
          style={{ zIndex: i + 1 }}
        >
          <img src={it.url} alt="" className="h-[260px] w-full rounded-sm object-cover"/>
          <div className="mt-2 flex-1 grid place-items-center">
            <span className="font-hand text-2xl text-[#E879B4]">{it.cat}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
