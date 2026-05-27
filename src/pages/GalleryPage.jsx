import { useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import PhotoGrid from '../features/gallery/PhotoGrid'
import PetFilterTabs from '../components/PetFilterTabs'
import PhotoViewModal from '../features/gallery/PhotoViewModal'
import { usePets } from '../hooks/usePets'
import { usePhotos } from '../hooks/usePhotos'
import { usePrefetchPhotos } from '../hooks/usePrefetchPhotos'
import { filterPhotosByTag } from '../utils/photoFilter'
import { openUploadModal } from '../hooks/useUploadModal'

export default function GalleryPage() {
  const [params, setParams] = useSearchParams()
  const active = params.get('cat') || null
  const { pets, addPet, removePet } = usePets()
  const { photos, deletePhoto, pendingUploads, retryUpload, cancelPendingUpload } = usePhotos()
  usePrefetchPhotos(photos)
  const [view, setView] = useState(null)

  const filtered = useMemo(() => filterPhotosByTag(photos, active), [photos, active])
  const viewPhoto = view ? (photos.find(p => p.id === view.id) ?? view) : null

  const setActive = (id) => {
    if (id) params.set('cat', id); else params.delete('cat')
    setParams(params, { replace: true })
  }

  const handleRemovePet = useCallback(async (id) => {
    await removePet(id)
    if (params.get('cat') === id) {
      params.delete('cat')
      setParams(params, { replace: true })
    }
  }, [removePet, params, setParams])

  return (
    <div className="w-full mx-auto max-w-6xl px-6 pt-6 pb-0 sm:pt-14">
      <header className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="min-w-0 flex-[7]">
          <div className="text-xs uppercase tracking-[0.2em] opacity-60">Our shared album</div>
          <h1 className="mt-2 font-display font-wonky text-5xl">
            Gallery <span className="font-hand-accent text-[0.6em] text-[#E879B4]">ours</span>
          </h1>
          <p className="mt-2 text-sm opacity-70">Every day we kept.</p>
        </div>
        <div className="flex flex-[3] flex-col items-stretch gap-2">
          <button
            onClick={openUploadModal}
            className="bg-morph inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5"
            style={{ boxShadow: '0 8px 18px rgba(232,121,180,0.35)' }}
            aria-label="Add photo"
          >
            <Plus size={16} /> Add photo
          </button>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${photos.length ? (filtered.length / photos.length) * 100 : 0}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 22 }}
                className="bg-morph h-full rounded-full"
              />
            </div>
            <span className="shrink-0 text-xs opacity-50">{filtered.length} / {photos.length}</span>
          </div>
        </div>
      </header>

      <div className="mt-8">
        <PetFilterTabs cats={pets} activeId={active} onChange={setActive} onAddCat={addPet} onRemoveCat={handleRemovePet}/>
      </div>

      <div className="mt-8">
        <PhotoGrid
          photos={filtered}
          onOpen={setView}
          onDelete={deletePhoto}
          pendingUploads={pendingUploads}
          onRetry={retryUpload}
          onCancel={cancelPendingUpload}
        />
      </div>

      <PhotoViewModal open={!!view} photo={viewPhoto} onClose={() => setView(null)}/>
    </div>
  )
}
