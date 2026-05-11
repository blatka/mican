import { useEffect, useState, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import SessionCard from '../components/SessionCard.jsx'
import SponsorAdCard from '../components/SponsorAdCard.jsx'
import TrackBadge from '../components/TrackBadge.jsx'
import { fetchSessions, fetchAdsByOrgId, fetchMediaUrl, fetchOrganization, fetchSponsorshipsByOrg, pickAd } from '../api/index.js'
import { useBookmarks } from '../hooks/useBookmarks.js'
import { TRACK_BY_ID, TRACKS } from '../constants/tracks.js'
import { SPONSORSHIP_TIERS } from '../constants/sponsors.js'
import { formatTime, formatDate } from '../utils/time.js'
import { decodeHtml } from '../utils/html.js'
import { Bookmark } from 'lucide-react'

const MAIN_TABS = ['All', 'By Track', 'By Time', 'My Schedule']

function BreakCard({ session }) {
  const title = decodeHtml(session.title?.rendered ?? 'Break').toUpperCase()
  const { acf = {} } = session
  const timeLabel = acf.session_time_start
    ? `${formatTime(acf.session_time_start)}${acf.session_time_end ? ` – ${formatTime(acf.session_time_end)}` : ''}`
    : null
  return (
    <div style={styles.breakCard}>
      {timeLabel && <span style={styles.breakTime}>{timeLabel}</span>}
      <span style={styles.breakText}>{title}</span>
    </div>
  )
}

function DayHeader({ label }) {
  return (
    <div style={styles.dayHeader}>
      <span style={styles.dayHeaderText}>{label}</span>
    </div>
  )
}

export default function ScheduleScreen() {
  const location = useLocation()
  const initialTab = location.state?.initialFilter ?? 'All'

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [activeTrack, setActiveTrack] = useState(null)
  const [featuredAd, setFeaturedAd] = useState(null)
  const { isBookmarked, toggle } = useBookmarks()

  useEffect(() => {
    // Sessions load first — spinner clears as soon as they arrive
    async function loadSessions() {
      try {
        const data = await fetchSessions()
        setSessions(data)
      } catch (e) {
        console.warn('ScheduleScreen sessions load failed:', e)
      } finally {
        setLoading(false)
      }
    }

    // Ad loads independently — no jet-rel, won't block the session list
    async function loadAd() {
      try {
        const adsByOrg = await fetchAdsByOrgId()
        const entries = Object.entries(adsByOrg).filter(([, ads]) => ads.length > 0)
        if (entries.length === 0) return

        const [orgIdStr, ads] = entries[Math.floor(Math.random() * entries.length)]
        const ad = ads[Math.floor(Math.random() * ads.length)]

        const orgId = Number(orgIdStr)

        // Logo and tier label are optional — failures must not prevent the ad from showing
        let logoUrl = null
        let tierLabel = 'Featured'
        let detailPage = false
        try {
          const [org, sponsorships] = await Promise.all([
            fetchOrganization(orgId),
            fetchSponsorshipsByOrg(orgId),
          ])
          logoUrl = org?.featured_media ? await fetchMediaUrl(org.featured_media) : null
          for (const s of (sponsorships ?? [])) {
            const tier = SPONSORSHIP_TIERS[Number(s.child_object_id)]
            if (tier?.weight) {
              tierLabel = tier.label
              detailPage = tier.detailPage ?? false
              break
            }
          }
        } catch {
          // continue with defaults
        }

        setFeaturedAd({ ad, logoUrl, tierLabel, orgId, detailPage })
      } catch (e) {
        console.warn('ScheduleScreen ad load failed:', e)
      }
    }

    loadSessions()
    loadAd()
  }, [])

  // All tracks present in the fetched sessions
  const tracksInData = useMemo(() => {
    const ids = new Set(sessions.flatMap(s => s.session_tracks ?? []))
    return [...ids].map(id => TRACK_BY_ID[id]).filter(Boolean)
  }, [sessions])

  // Sessions filtered by active tab/track
  const filtered = useMemo(() => {
    if (activeTab === 'My Schedule') return sessions.filter(s => isBookmarked(s.id))
    if (activeTab === 'By Track' && activeTrack) {
      const track = TRACKS[activeTrack]
      return sessions.filter(s => s.session_tracks?.includes(track?.id))
    }
    return sessions
  }, [sessions, activeTab, activeTrack, isBookmarked])

  // Grouped by date → start time for "By Time" view
  const byTime = useMemo(() => {
    if (activeTab !== 'By Time') return null
    const dateMap = {}
    filtered.forEach(s => {
      const dateKey = s.acf?.session_date ?? ''
      if (!dateMap[dateKey]) dateMap[dateKey] = {}
      const timeKey = formatTime(s.acf?.session_time_start)
      if (!dateMap[dateKey][timeKey]) dateMap[dateKey][timeKey] = []
      dateMap[dateKey][timeKey].push(s)
    })
    return Object.keys(dateMap).sort().map(dateKey => ({
      dateKey,
      dateLabel: formatDate(dateKey),
      timeGroups: Object.entries(dateMap[dateKey]),
    }))
  }, [activeTab, filtered])

  // Inject day headers and ads into the flat session list
  function buildAllList() {
    const items = []
    let lastDate = null
    let sessionCount = 0
    filtered.forEach(s => {
      const date = s.acf?.session_date ?? ''
      if (date !== lastDate) {
        items.push({ type: 'date', date })
        lastDate = date
      }
      items.push({ type: 'session', session: s })
      if (s.acf?.session_type !== 'break') {
        sessionCount++
        if (sessionCount % 3 === 0 && featuredAd) {
          items.push({ type: 'ad', ...featuredAd })
        }
      }
    })
    return items
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sticky header */}
      <div className="screen-header">
        <div style={styles.headerInner}>
          <span style={styles.headerTitle}>Schedule</span>
        </div>
        {/* Main filter tabs */}
        <div style={styles.tabRow}>
          {MAIN_TABS.map(tab => (
            <button
              key={tab}
              style={{
                ...styles.tab,
                color: activeTab === tab ? '#398032' : '#5A6272',
                borderBottom: activeTab === tab ? '2.5px solid #398032' : '2.5px solid transparent',
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Track pills (shown only in By Track mode) */}
        {activeTab === 'By Track' && tracksInData.length > 0 && (
          <div style={styles.pillRow}>
            {tracksInData.map(track => (
              <button
                key={track.slug}
                style={{
                  ...styles.pill,
                  background: activeTrack === track.slug ? track.bg : '#FFFFFF',
                  border: activeTrack === track.slug
                    ? `1.5px solid ${track.dot}`
                    : '1.5px solid #EAECF0',
                  color: activeTrack === track.slug ? track.text : '#5A6272',
                }}
                onClick={() => setActiveTrack(prev => prev === track.slug ? null : track.slug)}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: track.dot, flexShrink: 0 }} />
                {track.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable list */}
      <div className="screen" style={{ padding: '12px 16px 0' }}>
        {loading && (
          <div className="spinner-wrap"><div className="spinner" /></div>
        )}

        {!loading && filtered.length === 0 && activeTab === 'My Schedule' && (
          <div style={styles.empty}>
            <Bookmark size={40} strokeWidth={1.5} stroke="#9CA3AF" />
            <div style={styles.emptyTitle}>No saved sessions yet</div>
            <div style={styles.emptyHint}>Tap the bookmark icon on any session to save it here</div>
          </div>
        )}

        {!loading && activeTab === 'By Time' && byTime?.map(({ dateKey, dateLabel, timeGroups }) => (
          <div key={dateKey}>
            <DayHeader label={dateLabel} />
            {timeGroups.map(([time, group]) => (
              <div key={time} style={{ marginBottom: 4 }}>
                <div style={styles.timeHeading}>{time}</div>
                {group.map(s =>
                  s.acf?.session_type === 'break' ? (
                    <BreakCard key={s.id} session={s} />
                  ) : (
                    <SessionCard
                      key={s.id}
                      session={s}
                      isBookmarked={isBookmarked(s.id)}
                      onBookmark={toggle}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        ))}

        {!loading && activeTab !== 'By Time' && buildAllList().map((item, i) =>
          item.type === 'date' ? (
            <DayHeader key={`date-${item.date}`} label={formatDate(item.date)} />
          ) : item.type === 'ad' ? (
            <SponsorAdCard key={`ad-${i}`} ad={item.ad} logoUrl={item.logoUrl} tierLabel={item.tierLabel} orgId={item.orgId} detailPage={item.detailPage} />
          ) : item.session.acf?.session_type === 'break' ? (
            <BreakCard key={item.session.id} session={item.session} />
          ) : (
            <SessionCard
              key={item.session.id}
              session={item.session}
              isBookmarked={isBookmarked(item.session.id)}
              onBookmark={toggle}
            />
          )
        )}

        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}

const styles = {
  headerInner: {
    padding: '12px 16px 8px',
  },
  headerTitle: {
    fontFamily: "'Block Berthold', serif",
    fontSize: 22,
    color: '#001133',
  },
  tabRow: {
    display: 'flex',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    paddingLeft: 16,
    gap: 0,
  },
  tab: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 14,
    padding: '8px 14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  pillRow: {
    display: 'flex',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    gap: 8,
    padding: '10px 16px',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 12,
    borderRadius: 20,
    padding: '6px 12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  timeHeading: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 6,
    marginTop: 8,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    paddingTop: 60,
  },
  emptyTitle: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 15,
    color: '#5A6272',
  },
  emptyHint: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 1.5,
  },
  dayHeader: {
    textAlign: 'center',
    padding: '14px 0 8px',
  },
  dayHeaderText: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 15,
    color: '#001133',
    letterSpacing: '0.01em',
  },
  breakCard: {
    background: '#F8FCF8',
    borderRadius: 14,
    border: '1px solid #EAECF0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    padding: '8px 14px',
    marginBottom: 6,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  breakTime: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 600,
    fontSize: 11,
    color: '#9CA3AF',
    letterSpacing: '0.03em',
  },
  breakText: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 12,
    color: '#5A6272',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
}
