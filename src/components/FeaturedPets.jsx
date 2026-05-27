import { Link } from 'react-router-dom'
import { usePets } from '../hooks/usePets'
import { usePhotos } from '../hooks/usePhotos'
import { useAuth } from '../hooks/useAuth'
import { homeDeckItems } from '../utils/demoAssets'

const fallbackAvatar = homeDeckItems[0]?.url ?? ''

export default function FeaturedPets() {
  const { isAuthorized } = useAuth()
  const { pets } = usePets()
  const { photos } = usePhotos()

  if (!isAuthorized && pets.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center">
        <p className="opacity-70 text-sm">No pets yet. Sign in to see the family.</p>
      </div>
    )
  }

  const avatarFor = (pet) => {
    const p = photos.find(pp => (pp.catIds || []).includes(pet.id))
    return p?.microUrl ?? p?.imageUrl ?? fallbackAvatar
  }

  return (
    <div className="flex gap-6 overflow-x-auto px-1 py-3 snap-x">
      {pets.map(pet => (
        <Link key={pet.id} to={`/gallery?cat=${pet.id}`} className="group flex flex-col items-center gap-2 snap-start">
          <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-transparent transition group-hover:ring-[#E879B4]">
            <img src={avatarFor(pet)} alt={pet.name} className="h-full w-full object-cover transition group-hover:scale-110"/>
          </div>
          <span className="font-hand text-xl text-[#E879B4]">{pet.name}</span>
        </Link>
      ))}
    </div>
  )
}
