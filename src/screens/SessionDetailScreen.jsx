import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, MapPin, Bookmark, ChevronLeft, Heart } from 'lucide-react'
import TrackBadge from '../components/TrackBadge.jsx'
import { fetchSession, fetchPerson, fetchMediaUrls, fetchAdsByOrgId, fetchOrgsForSponsorship, fetchSponsorshipsByOrg } from '../api/index.js'
import { useBookmarks } from '../hooks/useBookmarks.js'
import { roomName } from '../constants/rooms.js'
import { formatTime } from '../utils/time.js'
import { decodeHtml } from '../utils/html.js'
import { TRACK_BY_ID } from '../constants/tracks.js'
import { SPONSORSHIP_TIERS } from '../constants/sponsors.js'

const NONPROFIT_TIER_ID = 8979

// Module-level store — survives navigation, cleared only on full page reload
const _cache = {}

function SpeakerCard({ person, photoUrl, track }) {
  const [expanded, setExpanded] = useState(false)
  const name = person.title?.rendered ?? ''
  const title = person.acf?.people_title ?? ''
  const org = person.acf?.people_organization ?? ''
  const bio = person.acf?.people_biography ?? ''
  const bioLink = person.acf?.people_bio_link

  const bioText = bio.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = bioText.split(' ').filter(Boolean)
  const preview = words.slice(0, 15).join(' ')
  const hasMore = words.length > 15

  return (
    <div style={styles.speakerCard}>
      <div style={styles.speakerLabel}>SPEAKER</div>
      <div style={styles.speakerRow}>
        <div style={{
          ...styles.avatar,
          background: track
            ? `linear-gradient(135deg, ${track.dot}, #1E2B5F)`
            : 'linear-gradient(135deg, #398032, #1E2B5F)',
          overflow: 'hidden',
        }}>
          {photoUrl
            ? <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.speakerName}>{name}</div>
          {title && <div style={styles.speakerTitle}>{title}</div>}
          {org && <div style={styles.speakerOrg}>{org}</div>}
        </div>
      </div>

      {bio && (
        <div>
          {bioLink?.url && (
            <a href={bioLink.url} target="_blank" rel="noopener noreferrer" style={styles.bioLink}>
              {bioLink.title || 'Learn More'} ›
            </a>
          )}
          <div style={styles.bio}>
            {expanded
              ? <span dangerouslySetInnerHTML={{ __html: bio }} />
              : <span>{preview}{hasMore ? '…' : ''}</span>
            }
          </div>
          {hasMore && (
            <button style={styles.bioToggle} onClick={() => setExpanded(e => !e)}>
              {expanded ? 'Show less ▲' : 'Read more ▼'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function SessionDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isBookmarked, toggle } = useBookmarks()

  const hit = _cache[id]
  const [session, setSession] = useState(hit?.session ?? null)
  const [speakers, setSpeakers] = useState(hit?.speakers ?? [])
  const [speakerPhotos, setSpeakerPhotos] = useState(hit?.speakerPhotos ?? {})
  const [ad, setAd] = useState(hit?.ad ?? null)
  const [adImageUrl, setAdImageUrl] = useState(hit?.adImageUrl ?? null)
  const [adOrgId, setAdOrgId] = useState(hit?.adOrgId ?? null)
  const [adDetailPage, setAdDetailPage] = useState(hit?.adDetailPage ?? false)
  const [nonprofits, setNonprofits] = useState(hit?.nonprofits ?? [])
  const [loading, setLoading] = useState(!hit)

  useEffect(() => {
    if (_cache[id]) return // already loaded for this session

    async function load() {
      try {
        // Phase 1: session + ads + nonprofit orgs in parallel (no bulk tier fetches)
        const [sessionData, adsByOrg, nonprofitOrgs] = await Promise.all([
          fetchSession(Number(id)),
          fetchAdsByOrgId(),
          fetchOrgsForSponsorship(NONPROFIT_TIER_ID),
        ])

        if (!sessionData) { setLoading(false); return }
        setSession(sessionData)

        // Phase 2: fetch speakers (need session data first)
        const speakerIds = sessionData.acf?.speaker ?? []
        const people = speakerIds.length > 0
          ? await Promise.all(speakerIds.map(pid => fetchPerson(pid)))
          : []
        setSpeakers(people)

        // Pick a random paid ad, then look up its tier with one targeted jet-rel call
        const paidAds = Object.entries(adsByOrg)
        let pickedAd = null
        let pickedAdOrgId = null
        let pickedAdDetailPage = false
        if (paidAds.length > 0) {
          const [orgIdStr, ad] = paidAds[Math.floor(Math.random() * paidAds.length)]
          pickedAd = ad
          pickedAdOrgId = Number(orgIdStr)
          try {
            const sponsorships = await fetchSponsorshipsByOrg(pickedAdOrgId)
            let bestWeight = -1
            for (const s of (sponsorships ?? [])) {
              const tier = SPONSORSHIP_TIERS[Number(s.child_object_id)]
              if (tier?.weight && tier.weight > bestWeight) {
                bestWeight = tier.weight
                pickedAdDetailPage = tier.detailPage ?? false
              }
            }
          } catch { /* use defaults */ }
        }

        // Pick 2 random nonprofits
        const shuffled = [...nonprofitOrgs].sort(() => Math.random() - 0.5)
        const pickedNonprofits = shuffled.slice(0, 2)

        // Phase 3: batch all media fetches at once
        const speakerPhotoIds = people
          .map(p => p.acf?.people_photos?.people_headshot)
          .filter(Boolean)
        const adImageId = pickedAd?.meta?.ad_image ? Number(pickedAd.meta.ad_image) : null
        const nonprofitMediaIds = pickedNonprofits.map(o => o.featured_media).filter(Boolean)

        const allMediaIds = [
          ...speakerPhotoIds,
          ...(adImageId ? [adImageId] : []),
          ...nonprofitMediaIds,
        ]
        const mediaMap = allMediaIds.length > 0 ? await fetchMediaUrls(allMediaIds) : {}

        const photos = {}
        speakerPhotoIds.forEach(pid => { photos[pid] = mediaMap[pid] ?? null })

        const resolvedNonprofits = pickedNonprofits.map(o => ({
          id: o.id,
          name: decodeHtml(o.title?.rendered),
          logoUrl: o.featured_media ? (mediaMap[o.featured_media] ?? null) : null,
          websiteUrl: o.meta?.organization_link ?? null,
        }))

        const resolvedAdImageUrl = adImageId ? (mediaMap[adImageId] ?? null) : null

        // Store everything in module cache before setting state
        _cache[id] = {
          session: sessionData,
          speakers: people,
          speakerPhotos: photos,
          ad: pickedAd,
          adImageUrl: resolvedAdImageUrl,
          adOrgId: pickedAdOrgId,
          adDetailPage: pickedAdDetailPage,
          nonprofits: resolvedNonprofits,
        }

        setSpeakerPhotos(photos)
        if (pickedAd) {
          setAd(pickedAd)
          setAdOrgId(pickedAdOrgId)
          setAdDetailPage(pickedAdDetailPage)
          setAdImageUrl(resolvedAdImageUrl)
        }
        setNonprofits(resolvedNonprofits)

      } catch (e) {
        console.warn('SessionDetail load failed:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="screen-header" style={{ padding: '16px' }} />
      <div className="screen"><div className="spinner-wrap"><div className="spinner" /></div></div>
    </div>
  )

  if (!session) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="screen-header">
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} strokeWidth={2.5} /> Schedule
        </button>
      </div>
      <div style={styles.notFound}>Session not found.</div>
    </div>
  )

  const { title, acf = {}, session_tracks = [] } = session
  const timeLabel = acf.session_time_start
    ? `${formatTime(acf.session_time_start)} - ${formatTime(acf.session_time_end)}`
    : ''
  const track = TRACK_BY_ID[session_tracks[0]]
  const bookmarked = isBookmarked(session.id)
  const cleanTitle = decodeHtml(title.rendered)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sticky header */}
      <div className="screen-header" style={{ paddingBottom: 12 }}>
        <div style={{ padding: '0 16px' }}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={16} strokeWidth={2.5} stroke="#398032" />
            <span>Schedule</span>
          </button>
        </div>
        <div style={{ padding: '10px 16px 0' }}>
          <div style={styles.metaRow}>
            <span style={styles.metaText}>
              <Clock size={12} strokeWidth={2} stroke="#5A6272" />
              {timeLabel}
            </span>
            <TrackBadge trackIds={session_tracks} />
          </div>
          <div style={styles.detailTitle}>{cleanTitle}</div>
          <div style={styles.metaRow}>
            <span style={styles.metaText}>
              {acf.room_location && (
                <>
                  <MapPin size={12} strokeWidth={2} stroke="#5A6272" />
                  {roomName(acf.room_location)}
                </>
              )}
            </span>
            <button
              style={styles.bookmarkBtn}
              onClick={() => toggle(session.id)}
              aria-label={bookmarked ? 'Remove from schedule' : 'Save to my schedule'}
            >
              <Bookmark
                size={18}
                strokeWidth={2}
                stroke={bookmarked ? '#398032' : '#9CA3AF'}
                fill={bookmarked ? '#398032' : 'none'}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="screen" style={{ padding: '20px 16px 0' }}>
        {acf.description && (
          <p
            style={styles.description}
            dangerouslySetInnerHTML={{ __html: acf.description }}
          />
        )}

        {/* Speakers */}
        {speakers.map(person => {
          const photoId = person.acf?.people_photos?.people_headshot
          const photoUrl = photoId ? speakerPhotos[photoId] : null
          return (
            <SpeakerCard key={person.id} person={person} photoUrl={photoUrl} track={track} />
          )
        })}

        {/* Featured sponsor ad */}
        {ad && (
          <>
            <div style={styles.divider} />
            <div
              style={styles.adCard}
              onClick={() => adDetailPage && adOrgId ? navigate(`/sponsor-detail/${adOrgId}`) : navigate(`/sponsor-ad/${ad.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && (adDetailPage && adOrgId ? navigate(`/sponsor-detail/${adOrgId}`) : navigate(`/sponsor-ad/${ad.id}`))}
            >
              <div style={styles.adHeader}>
                <span style={styles.adLabel}>FEATURED SPONSOR</span>
              </div>
              <div style={styles.adBody}>
                {adImageUrl && (
                  <img src={adImageUrl} alt="" style={styles.adLogo} />
                )}
                <div style={styles.adName}>{ad.meta?.ad_headline}</div>
                {ad.meta?.ad_text_1 && (
                  <div style={styles.adText}>
                    {ad.meta.ad_text_1.slice(0, 120)}{ad.meta.ad_text_1.length > 120 ? '...' : ''}
                  </div>
                )}
                {ad.meta?.ad_cta_label && (
                  <button style={styles.adCta}>{ad.meta.ad_cta_label}</button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Nonprofit partners */}
        {nonprofits.length > 0 && (
          <>
            <div style={styles.divider} />
            <div style={styles.sectionLabel}>NONPROFIT PARTNERS</div>
            {nonprofits.map(org => (
              <div
                key={org.id}
                style={styles.nonprofitRow}
                onClick={() => org.websiteUrl && window.open(org.websiteUrl, '_blank', 'noopener,noreferrer')}
                role={org.websiteUrl ? 'button' : undefined}
                tabIndex={org.websiteUrl ? 0 : undefined}
                onKeyDown={e => e.key === 'Enter' && org.websiteUrl && window.open(org.websiteUrl, '_blank', 'noopener,noreferrer')}
              >
                <div style={styles.nonprofitLogo}>
                  {org.logoUrl
                    ? <img src={org.logoUrl} alt={org.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <Heart size={18} fill="#EBF5E9" stroke="#D4EDD0" strokeWidth={1.5} />
                  }
                </div>
                <div style={styles.nonprofitName}>{org.name}</div>
                {org.websiteUrl && (
                  <span style={styles.nonprofitCta}>Visit ›</span>
                )}
              </div>
            ))}
          </>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

const styles = {
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    color: '#398032',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 14,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 0',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'Montserrat, sans-serif',
    color: '#5A6272',
  },
  detailTitle: {
    fontFamily: "'Block Berthold', serif",
    fontSize: 22,
    color: '#001133',
    lineHeight: 1.15,
    marginBottom: 8,
  },
  bookmarkBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  description: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 14,
    color: '#5A6272',
    lineHeight: 1.7,
    marginBottom: 24,
  },
  speakerCard: {
    background: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid #EAECF0',
    padding: 16,
    marginBottom: 16,
  },
  speakerLabel: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#9CA3AF',
    letterSpacing: '0.06em',
    marginBottom: 12,
  },
  speakerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerName: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 15,
    color: '#0D1117',
    marginBottom: 2,
  },
  speakerTitle: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    fontWeight: 600,
    color: '#398032',
    marginBottom: 1,
  },
  speakerOrg: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    color: '#5A6272',
  },
  bioLink: {
    display: 'inline-block',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    fontWeight: 700,
    color: '#398032',
    textDecoration: 'none',
    marginBottom: 6,
  },
  bio: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 13,
    color: '#5A6272',
    lineHeight: 1.6,
  },
  bioToggle: {
    background: 'none',
    border: 'none',
    padding: '6px 0 0',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    fontWeight: 700,
    color: '#398032',
    cursor: 'pointer',
    display: 'block',
  },
  divider: {
    borderTop: '1px solid #EAECF0',
    margin: '8px 0 16px',
  },
  sectionLabel: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 10,
  },
  adCard: {
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #EAECF0',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    marginBottom: 8,
  },
  adHeader: {
    background: '#F9F9F9',
    padding: '14px 16px 17px',
    textAlign: 'center',
  },
  adLabel: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#9CA3AF',
    letterSpacing: '0.08em',
  },
  adBody: {
    padding: '12px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  adLogo: {
    height: 44,
    maxWidth: '100%',
    objectFit: 'contain',
    borderRadius: 6,
  },
  adName: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 14,
    color: '#0D1117',
    textAlign: 'center',
  },
  adText: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    color: '#5A6272',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  adCta: {
    background: '#398032',
    color: '#FFFFFF',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 12,
    textTransform: 'uppercase',
    borderRadius: 8,
    padding: '8px 20px',
    border: 'none',
    cursor: 'pointer',
    marginTop: 4,
  },
  nonprofitRow: {
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #EAECF0',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  nonprofitLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    background: '#FFFFFF',
    border: '1px solid #EAECF0',
    padding: 3,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nonprofitName: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 13,
    color: '#001133',
    flex: 1,
    minWidth: 0,
  },
  nonprofitCta: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 13,
    color: '#398032',
    flexShrink: 0,
  },
  notFound: {
    padding: 24,
    fontFamily: 'Montserrat, sans-serif',
    color: '#9CA3AF',
  },
}
