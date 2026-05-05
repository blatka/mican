import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Calendar, MapPin, Heart } from 'lucide-react'

const TABS = [
  { path: '/',          label: 'Home',     Icon: Home },
  { path: '/schedule',  label: 'Schedule', Icon: Calendar },
  { path: '/map',       label: 'Map',      Icon: MapPin },
  { path: '/sponsors',  label: 'Sponsors', Icon: Heart },
]

export default function TabBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={styles.bar}>
      {TABS.map(({ path, label, Icon }) => {
        const active = pathname === path || (path !== '/' && pathname.startsWith(path))
        const isHeart = label === 'Sponsors'
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={styles.tab}
            aria-label={label}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 1.8}
              stroke={active ? '#398032' : '#9CA3AF'}
              fill={active && isHeart ? '#398032' : 'none'}
            />
            <span style={{ ...styles.label, color: active ? '#398032' : '#9CA3AF' }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

const styles = {
  bar: {
    display: 'flex',
    background: '#FFFFFF',
    borderTop: '1px solid #EAECF0',
    paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
    flexShrink: 0,
    zIndex: 20,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    paddingTop: 10,
    paddingBottom: 4,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  label: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.01em',
  },
}
