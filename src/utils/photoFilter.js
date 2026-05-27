export const UNTAGGED = '__untagged__'

export function filterPhotosByTag(photos, active) {
  if (active === UNTAGGED) {
    return photos.filter(p => !p.catIds || p.catIds.length === 0)
  }
  if (active) {
    return photos.filter(p => p.catIds?.includes(active))
  }
  return photos
}
