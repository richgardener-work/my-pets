import { useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { useAuth } from './hooks/useAuth'
import { useGames } from './hooks/useGames'
import { useMilestones } from './hooks/useMilestones'
import { markMilestoneSeen } from './utils/milestones'
import { useUploadModal, closeUploadModal } from './hooks/useUploadModal'
import Header from './components/Header'
import Footer from './components/Footer'
import RouteSpinner from './components/RouteSpinner'
import GiftModal from './components/GiftModal'
import UploadModal from './features/gallery/UploadModal'

const HomePage = lazy(() => import('./pages/HomePage'))
const GalleryPage = lazy(() => import('./pages/GalleryPage'))
const GamesPage = lazy(() => import('./pages/GamesPage'))
const GameScreen = lazy(() => import('./pages/GameScreen'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ShareScreen = lazy(() => import('./pages/ShareScreen'))
const ShareLinkScreen = lazy(() => import('./pages/ShareLinkScreen'))
function AppLayout({ theme, auth, games, milestones, authOpen, onAuthOpen, onAuthClose }) {
  const location = useLocation()
  const themeStr = theme.dark ? 'dark' : 'light'
  const upload = useUploadModal()
  const [giftMilestone, setGiftMilestone] = useState(null)

  return (
    <div className="relative flex flex-col text-light-text dark:text-dark-text" style={{ minHeight: '100dvh' }}>
      <Header
        theme={theme}
        auth={auth}
        milestones={milestones}
        onOpenGift={(m) => { markMilestoneSeen(m.id); setGiftMilestone(m) }}
        authOpen={authOpen}
        onAuthOpen={onAuthOpen}
        onAuthClose={onAuthClose}
      />
      <main className="flex-1 flex flex-col min-h-0">
        <Suspense fallback={<RouteSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage auth={auth} onAuthOpen={onAuthOpen} />} />
            <Route path="/gallery" element={<GalleryPage auth={auth} />} />
            <Route path="/games" element={<GamesPage auth={auth} games={games} />} />
            <Route path="/games/:sessionId" element={<GameScreen auth={auth} games={games} />} />
            <Route path="/share/:photoId/:difficulty" element={<ShareScreen />} />
            <Route path="/share/:shareId" element={<ShareLinkScreen />} />
            <Route path="/profile" element={<ProfilePage auth={auth} games={games} />} />
          </Routes>
        </Suspense>
      </main>
      <Footer theme={themeStr} />
      <UploadModal open={upload.open} onClose={closeUploadModal} />
      <GiftModal
        milestone={giftMilestone}
        onClose={() => setGiftMilestone(null)}
        theme={themeStr}
      />
    </div>
  )
}

export default function App() {
  const theme = useTheme()
  const auth = useAuth()
  const games = useGames(auth)
  const milestones = useMilestones(auth)
  const [authOpen, setAuthOpen] = useState(false)

  if (auth.loading) {
    return <RouteSpinner />
  }

  return (
    <BrowserRouter basename="/my-pets">
      <AppLayout
        theme={theme}
        auth={auth}
        games={games}
        milestones={milestones}
        authOpen={authOpen}
        onAuthOpen={() => setAuthOpen(true)}
        onAuthClose={() => setAuthOpen(false)}
      />
    </BrowserRouter>
  )
}
