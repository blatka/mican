import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useOutlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import TabBar from './components/TabBar.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ScheduleScreen from './screens/ScheduleScreen.jsx'
import SessionDetailScreen from './screens/SessionDetailScreen.jsx'
import VenueMapScreen from './screens/VenueMapScreen.jsx'
import SponsorsScreen from './screens/SponsorsScreen.jsx'
import SponsorDetailScreen from './screens/SponsorDetailScreen.jsx'
import SponsorAdPage from './screens/SponsorAdPage.jsx'

// ── Font size context ─────────────────────────────────────────────────────
const SCALES = [1, 1.15, 1.3]
const FS_KEY = 'mican_font_size'

const FontSizeContext = createContext(null)
export function useFontSize() { return useContext(FontSizeContext) }

function FontSizeProvider({ children }) {
  const [idx, setIdx] = useState(() => {
    const s = localStorage.getItem(FS_KEY)
    return s !== null ? Math.min(Number(s), SCALES.length - 1) : 0
  })
  function set(i) {
    localStorage.setItem(FS_KEY, i)
    setIdx(i)
  }
  return (
    <FontSizeContext.Provider value={{ idx, set, count: SCALES.length }}>
      {children}
    </FontSizeContext.Provider>
  )
}

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <FontSizeProvider>
      <AppInner />
    </FontSizeProvider>
  )
}

function AppInner() {
  const { idx } = useFontSize()
  useEffect(() => {
    document.body.style.zoom = SCALES[idx]
  }, [idx])

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'https://www.miclimateaction.org') return
      if (event.data === 'reload') window.location.reload()
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ShellWithTabs />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/schedule" element={<ScheduleScreen />} />
          <Route path="/map" element={<VenueMapScreen />} />
          <Route path="/sponsors" element={<SponsorsScreen />} />
          <Route path="/session/:id" element={<SessionDetailScreen />} />
          <Route path="/sponsor-detail/:sponsorshipId" element={<SponsorDetailScreen />} />
          <Route path="/sponsor-ad/:adId" element={<SponsorAdPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function FontSizeControl() {
  const { idx, set, count } = useFontSize()
  return (
    <div style={fsStyles.wrap}>
      <button style={fsStyles.btnSmall} onClick={() => set(Math.max(0, idx - 1))} aria-label="Decrease text size">A</button>
      <div style={fsStyles.steps}>
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            style={{ ...fsStyles.step, background: i === idx ? '#398032' : '#D1D5DB' }}
            onClick={() => set(i)}
            aria-label={`Text size ${i + 1}`}
          />
        ))}
      </div>
      <button style={fsStyles.btnLarge} onClick={() => set(Math.min(count - 1, idx + 1))} aria-label="Increase text size">A</button>
    </div>
  )
}

const fsStyles = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '8px 0',
    borderTop: '1px solid #EAECF0',
    background: '#FFFFFF',
  },
  btnSmall: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
    fontSize: 12, color: '#9CA3AF', padding: '4px 6px', lineHeight: 1,
  },
  btnLarge: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
    fontSize: 20, color: '#9CA3AF', padding: '4px 6px', lineHeight: 1,
  },
  steps: { display: 'flex', alignItems: 'center', gap: 5 },
  step: { width: 22, height: 4, borderRadius: 2, border: 'none', cursor: 'pointer', padding: 0 },
}

// Captures the outlet at mount time so the exiting element shows the old route, not the new one
function FrozenOutlet() {
  const [outlet] = useState(useOutlet())
  return outlet
}

// ── Page transition helpers ───────────────────────────────────────────────
const TAB_PATHS = ['/', '/schedule', '/map', '/sponsors']

function navDirection(from, to) {
  const fromTab = TAB_PATHS.includes(from)
  const toTab = TAB_PATHS.includes(to)
  if (fromTab && toTab) return 'fade'
  if (fromTab && !toTab) return 'forward'
  return 'back'
}

const pageVariants = {
  initial: dir => {
    if (dir === 'fade') return { opacity: 0 }
    return { x: dir === 'forward' ? '100%' : '-100%' }
  },
  animate: { x: 0, opacity: 1 },
  exit: dir => {
    if (dir === 'fade') return { opacity: 0 }
    return { x: dir === 'forward' ? '-100%' : '100%' }
  },
}

const pageTransition = { duration: 0.32, ease: [0.42, 0, 0.58, 1] }

function ShellWithTabs() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const prevPath = useRef(location.pathname)
  const dirRef = useRef('fade')

  if (prevPath.current !== location.pathname) {
    dirRef.current = navDirection(prevPath.current, location.pathname)
    prevPath.current = location.pathname
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence initial={false} custom={dirRef.current}>
          <motion.div
            key={location.pathname}
            custom={dirRef.current}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <FrozenOutlet />
          </motion.div>
        </AnimatePresence>
      </div>
      {isHome && <FontSizeControl />}
      <TabBar />
    </div>
  )
}
