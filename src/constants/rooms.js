export const ROOM_NAMES = {
  big_ten_abc: 'Big Ten ABC',
  lincoln: 'Lincoln',
  red_cedar_ab: 'Red Cedar AB',
  '103ab_105ab': '103AB - 105AB',
  willy: 'Willy',
  nook_106: 'Nook 106',
  beal: 'Beal',
  garden: 'Garden',
  atrium: 'Atrium',
}

export function roomName(slug) {
  if (!slug) return ''
  return ROOM_NAMES[slug] ?? slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
