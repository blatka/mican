import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, Bookmark } from 'lucide-react'
import TrackBadge from './TrackBadge.jsx'
import { roomName } from '../constants/rooms.js'
import { formatTime } from '../utils/time.js'
import { decodeHtml } from '../utils/html.js'

export default function SessionCard({ session, isBookmarked, onBookmark }) {
  const navigate = useNavigate()
  const { id, title, acf = {}, session_tracks = [] } = session
  const timeLabel = acf.session_time_start
    ? `${formatTime(acf.session_time_start)} - ${formatTime(acf.session_time_end)}`
    : ''

  return (
    <div
      style={styles.card}
      onClick={() => navigate(`/session/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/session/${id}`)}
    >
      {/* Line 1: time + track badge */}
      <div style={styles.row}>
        <span style={styles.meta}>
          <Clock size={11} strokeWidth={2} stroke="#5A6272" style={{ flexShrink: 0 }} />
          {timeLabel}
        </span>
        <TrackBadge trackIds={session_tracks} />
      </div>

      {/* Line 2: title */}
      <div style={styles.title}>
        {decodeHtml(title.rendered)}
      </div>

      {/* Line 3: room + bookmark */}
      <div style={styles.row}>
        <span style={styles.meta}>
          {acf.room_location && (
            <>
              <MapPin size={11} strokeWidth={2} stroke="#5A6272" style={{ flexShrink: 0 }} />
              {roomName(acf.room_location)}
            </>
          )}
        </span>
        <button
          style={styles.bookmark}
          onClick={e => { e.stopPropagation(); onBookmark(id) }}
          aria-label={isBookmarked ? 'Remove from schedule' : 'Save to my schedule'}
        >
          <Bookmark
            size={16}
            strokeWidth={2}
            stroke={isBookmarked ? '#398032' : '#9CA3AF'}
            fill={isBookmarked ? '#398032' : 'none'}
          />
        </button>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#FFFFFF',
    borderRadius: 14,
    padding: '12px 14px',
    marginBottom: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'Montserrat, sans-serif',
    color: '#5A6272',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  title: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 14,
    color: '#0D1117',
    lineHeight: 1.35,
    margin: '5px 0',
  },
  bookmark: {
    padding: 2,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
}
