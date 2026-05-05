import { TRACK_BY_ID, TRACKS } from '../constants/tracks.js'

export default function TrackBadge({ trackIds = [], trackSlug }) {
  let track = null
  if (trackSlug) {
    track = TRACKS[trackSlug]
  } else if (trackIds.length > 0) {
    track = TRACK_BY_ID[trackIds[0]]
  }
  if (!track) return null

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: track.bg,
      color: track.text,
      borderRadius: 20,
      padding: '3px 8px',
      fontSize: 10,
      fontWeight: 700,
      fontFamily: 'Montserrat, sans-serif',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: track.dot,
        flexShrink: 0,
      }} />
      {track.name}
    </span>
  )
}
