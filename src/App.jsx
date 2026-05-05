import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import TabBar from './components/TabBar.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ScheduleScreen from './screens/ScheduleScreen.jsx'
import SessionDetailScreen from './screens/SessionDetailScreen.jsx'
import VenueMapScreen from './screens/VenueMapScreen.jsx'
import SponsorsScreen from './screens/SponsorsScreen.jsx'
import SponsorDetailScreen from './screens/SponsorDetailScreen.jsx'
import SponsorAdPage from './screens/SponsorAdPage.jsx'

export default function App() {
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

function ShellWithTabs() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Outlet />
      </div>
      <TabBar />
    </div>
  )
}
