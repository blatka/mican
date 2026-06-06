// Keyed by session_tracks taxonomy slug
export const TRACKS = {
  'courage-of-our-convictions': {
    id: 112,
    name: 'Courage of Our Convictions',
    bg: '#EEF2FF',
    text: '#1E2B5F',
    dot: '#1E2B5F',
  },
  'practicing-courage': {
    id: 113,
    name: 'Practicing Courage',
    bg: '#ECFCE5',
    text: '#286325',
    dot: '#398032',
  },
  'powering-the-network': {
    id: 114,
    name: 'Powering the Network',
    bg: '#F5E8FF',
    text: '#5B0A52',
    dot: '#7C0770',
  },
  'art-poster-showcase': {
    id: 115,
    name: 'Art & Poster Showcase',
    bg: '#FFF4E0',
    text: '#8B5E04',
    dot: '#D97706',
  },
  'community-climate-action-fellowship': {
    id: 116,
    name: 'Community Climate Action Fellowship',
    bg: '#E0F7FA',
    text: '#0E6E88',
    dot: '#0891B2',
  },
  'collective-courage': {
    id: 140,
    name: 'Collective Courage',
    bg: '#FCFBE5',
    text: '#777009',
    dot: '#777009',
  },
  'after-actions': {
    id: 143,
    name: 'After Actions',
    bg: '#FFDFD6',
    text: '#965539',
    dot: '#965539',
  },
}

// Keyed by taxonomy ID for quick reverse lookup
export const TRACK_BY_ID = Object.fromEntries(
  Object.entries(TRACKS).map(([slug, t]) => [t.id, { slug, ...t }])
)
