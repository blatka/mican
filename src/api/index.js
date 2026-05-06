const BASE = 'https://www.miclimateaction.org/wp-json/wp/v2'

async function get(path, params = {}) {
  const url = new URL(BASE + path)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

// Promise cache — keyed fetches are shared across mounts so navigating back is instant
const _pc = new Map()
function pcache(key, fn) {
  if (!_pc.has(key)) _pc.set(key, fn())
  return _pc.get(key)
}

// ── Sessions ──────────────────────────────────────────────────────────────
export function fetchSession(id) {
  return pcache(`session:${id}`, () => get(`/sessions/${id}`))
}

export function fetchSessions() {
  return pcache('sessions', async () => {
    const data = await get('/sessions', { per_page: 100 })
    return data
      .filter(s => s.acf?.session_time_start && (s.session_tracks?.length > 0 || s.acf?.session_type === 'break'))
      .sort((a, b) => {
        const da = a.acf.session_date ?? ''
        const db = b.acf.session_date ?? ''
        if (da !== db) return da.localeCompare(db)
        const ta = a.acf.session_time_start ?? ''
        const tb = b.acf.session_time_start ?? ''
        return ta.localeCompare(tb)
      })
  })
}

// ── People ────────────────────────────────────────────────────────────────
export function fetchPeople(ids) {
  if (!ids || ids.length === 0) return Promise.resolve([])
  const key = 'people:' + [...ids].sort().join(',')
  return pcache(key, () => get('/people', { include: ids.join(','), per_page: 100 }))
}

export async function fetchPerson(id) {
  return get(`/people/${id}`)
}

// ── Media ─────────────────────────────────────────────────────────────────
const mediaCache = {}

export async function fetchMediaUrl(id) {
  if (!id) return null
  if (mediaCache[id]) return mediaCache[id]
  try {
    const data = await get(`/media/${id}`, { _fields: 'id,source_url,media_details' })
    const url = data.media_details?.sizes?.medium?.source_url ?? data.source_url
    mediaCache[id] = url
    return url
  } catch {
    return null
  }
}

// Batch-fetch media URLs, returns { id: url } map
export async function fetchMediaUrls(ids) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return {}
  const uncached = unique.filter(id => !mediaCache[id])
  if (uncached.length > 0) {
    try {
      const data = await get('/media', {
        include: uncached.join(','),
        per_page: 100,
        _fields: 'id,source_url,media_details',
      })
      data.forEach(m => {
        mediaCache[m.id] = m.media_details?.sizes?.medium?.source_url ?? m.source_url
      })
    } catch {
      // partial failure — fall through, individual items will be null
    }
  }
  return Object.fromEntries(unique.map(id => [id, mediaCache[id] ?? null]))
}

// ── Session tracks ────────────────────────────────────────────────────────
export async function fetchSessionTracks() {
  return get('/session_tracks', { per_page: 100 })
}

// ── Sponsorships ──────────────────────────────────────────────────────────
export async function fetchSponsorships() {
  return get('/sponsorships', { per_page: 100 })
}

// ── Organizations ─────────────────────────────────────────────────────────
export function fetchOrganization(id) {
  return pcache(`org:${id}`, () => get(`/organizations/${id}`, { _fields: 'id,title,featured_media,meta' }))
}

export function fetchOrganizations(ids) {
  if (!ids || ids.length === 0) return Promise.resolve([])
  const key = 'orgs:' + [...ids].sort().join(',')
  return pcache(key, () => get('/organizations', {
    include: ids.join(','),
    per_page: 100,
    _fields: 'id,title,featured_media,meta',
  }))
}

// ── Sponsor Ads ───────────────────────────────────────────────────────────
export function fetchSponsorAds() {
  return pcache('sponsor-ads', () => get('/sponsor-ads', { per_page: 100 }))
}

export function fetchSponsorAd(id) {
  return pcache(`sponsor-ad:${id}`, () => get(`/sponsor-ads/${id}`))
}

// ── JetEngine Relations ───────────────────────────────────────────────────
// In local dev the Vite proxy rewrites /jet-rel → miclimateaction.org/wp-json/jet-rel,
// avoiding CORS origin-reflection issues when testing from localhost.
const BASE_REL = import.meta.env.DEV
  ? '/jet-rel'
  : 'https://www.miclimateaction.org/wp-json/jet-rel'

async function getRel(path) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(BASE_REL + path, { signal: controller.signal })
    if (!res.ok) throw new Error(`jet-rel ${res.status}: ${path}`)
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

// Relation 21: Organizations (parent) ↔ Sponsorships (children, many-to-many)
// Returns { [orgId]: [{ child_object_id: sponsorshipId }] }
export function fetchOrgSponsorshipRelations() {
  return pcache('org-sponsorship-rels', () => getRel('/21'))
}

// Children of org (sponsorships): GET /21/children/{orgId}
export async function fetchSponsorshipsByOrg(orgId) {
  return getRel(`/21/children/${orgId}`)
}

// Parents of sponsorship (orgs): GET /21/parents/{sponsorshipId}
export async function fetchOrgsBySponsorshipId(sponsorshipId) {
  return getRel(`/21/parents/${sponsorshipId}`)
}

// Relation 32: Sponsorships (parent) → Sponsor Ads (children, one-to-many)
// Returns { [sponsorshipId]: [{ child_object_id: adId }] }
export async function fetchSponsorAdRelations() {
  return getRel('/32')
}

// Flat map: orgId → sponsor ad object
// Built from the sponsor_id meta field on each ad — the canonical org→ad link
export async function fetchAdsByOrgId() {
  const ads = await fetchSponsorAds()
  const map = {}
  for (const ad of ads) {
    const orgId = Number(ad.meta?.sponsor_id)
    if (orgId && (!map[orgId] || ad.id < map[orgId].id)) map[orgId] = ad
  }
  return map
}

// All orgs linked to a sponsorship, with full org data
export async function fetchOrgsForSponsorship(sponsorshipId) {
  try {
    const parents = await fetchOrgsBySponsorshipId(sponsorshipId)
    if (!parents || parents.length === 0) return []
    const ids = parents.map(p => Number(p.parent_object_id)).filter(Boolean)
    return fetchOrganizations(ids)
  } catch {
    return []
  }
}
