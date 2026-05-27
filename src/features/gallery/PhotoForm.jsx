import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { Upload } from 'lucide-react'
import { usePets } from '../../hooks/usePets'
import PetTagBar from '../../components/PetTagBar'

const PhotoForm = forwardRef(function PhotoForm({ mode, initial, onSubmit }, ref) {
  const { pets: cats, addPet: addCat } = usePets()
  const isCreate = mode === 'create'

  const [file, setFile] = useState(initial.file ?? null)
  const [selectedCats, setSelectedCats] = useState(initial.catIds ?? [])
  const [note, setNote] = useState(initial.note ?? '')
  const [newCat, setNewCat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const pendingName = newCat.trim()

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (busy) return false
      if (isCreate && !file) { setError('Pick an image first'); return false }

      if (!isCreate) {
        const initialCatIds = initial.catIds ?? []
        const sameCatIds = selectedCats.length === initialCatIds.length
                         && selectedCats.every((id, i) => id === initialCatIds[i])
        const sameNote = note.trim() === (initial.note ?? '').trim()
        if (sameCatIds && sameNote && !pendingName) return true
      }

      setBusy(true)
      setError('')
      try {
        let catIds = [...selectedCats]
        if (pendingName) {
          const existing = cats.find(c => c.name.toLowerCase() === pendingName.toLowerCase())
          if (existing) {
            if (!catIds.includes(existing.id)) catIds.push(existing.id)
          } else {
            const id = await addCat(pendingName)
            catIds.push(id)
          }
        }
        await onSubmit({ file, catIds, note })
        return true
      } catch (e) {
        console.error(`${mode} failed`, e)
        setError(e?.message || (isCreate ? 'Upload failed.' : 'Save failed.'))
        return false
      } finally {
        setBusy(false)
      }
    },
  }), [busy, isCreate, file, selectedCats, note, pendingName, cats, addCat, onSubmit, mode, initial])

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {isCreate && (
        <label className="mt-6 block cursor-pointer">
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-current/15">
              <img src={previewUrl} alt="" className="block max-h-56 w-full object-cover"/>
              <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <span className="truncate opacity-80">{file.name}</span>
                <span className="opacity-60">Click to replace</span>
              </div>
            </div>
          ) : (
            <div className="grid place-items-center gap-2 rounded-xl border-2 border-dashed border-current/30 p-6 text-sm opacity-80 hover:opacity-100">
              <Upload size={24}/>
              <span>Click to choose an image</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)}/>
        </label>
      )}

      <div className={isCreate ? 'mt-5' : ''}>
        <PetTagBar
          cats={cats}
          selectedIds={selectedCats}
          onToggle={(id) => setSelectedCats(
            selectedCats.includes(id)
              ? selectedCats.filter(x => x !== id)
              : [...selectedCats, id]
          )}
          pendingNewName={newCat}
          onPendingNewNameChange={setNewCat}
          disabled={busy}
        />
      </div>

      <textarea
        value={note}
        disabled={busy}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Note (optional)"
        className="mt-4 w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50"
      />

      {error && (
        <p className="mt-3 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
})

export default PhotoForm
