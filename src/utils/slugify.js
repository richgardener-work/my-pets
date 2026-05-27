const RU = {
  а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'e', ж:'zh', з:'z', и:'i',
  й:'y', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t',
  у:'u', ф:'f', х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'sch', ъ:'', ы:'y', ь:'',
  э:'e', ю:'yu', я:'ya',
}

export function slugify(input) {
  if (!input) return ''
  const lower = String(input).toLowerCase().trim()
  const transliterated = Array.from(lower).map((ch) => RU[ch] ?? ch).join('')
  return transliterated
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'cat'
}

export async function findAvailableSlug(base, exists) {
  const baseSlug = slugify(base)
  if (!(await exists(baseSlug))) return baseSlug
  for (let i = 2; i < 1000; i++) {
    const candidate = `${baseSlug}-${i}`
    if (!(await exists(candidate))) return candidate
  }
  throw new Error(`Cannot find free slug for "${base}"`)
}
