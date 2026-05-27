export async function readFileMetadata(file) {
  const [hash, dims] = await Promise.all([
    sha256Hex(file).catch(() => null),
    readDimensions(file).catch(() => ({ width: 0, height: 0 })),
  ])
  return {
    contentHash: hash ? `sha256:${hash}` : '',
    aspectRatio: dims.width && dims.height ? dims.width / dims.height : 1,
    originalFilename: file.name,
    mimeType: file.type || 'application/octet-stream',
  }
}

async function sha256Hex(file) {
  if (!globalThis.crypto?.subtle?.digest) return null
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function readDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    const done = (result) => { URL.revokeObjectURL(url); resolve(result) }
    img.onload = () => done({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => done({ width: 0, height: 0 })
    img.src = url
  })
}

