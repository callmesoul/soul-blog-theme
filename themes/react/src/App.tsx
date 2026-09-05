import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useSiteConfig } from './stores/site-config'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SearchPage from './pages/SearchPage'

function AppLayout() {
  const location = useLocation()
  const siteConfig = useSiteConfig()
  const isLogin = location.pathname === '/login'

  useEffect(() => {
    siteConfig.load().then(() => siteConfig.apply())
  }, [])

  return (
    <>
      <site-background image="/images/extracted/home/081a7f1fa54d497bc3afcaa85c41528c@2x.png"></site-background>

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </div>

      {!isLogin && <music-player></music-player>}
      <search-panel></search-panel>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}