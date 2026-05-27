import { app } from './firebase'

let _cache

export async function loadStorage() {
  if (_cache) return _cache
  const mod = await import('firebase/storage')
  _cache = {
    storage: mod.getStorage(app),
    ref: mod.ref,
    uploadBytes: mod.uploadBytes,
    getDownloadURL: mod.getDownloadURL,
    deleteObject: mod.deleteObject,
  }
  return _cache
}
