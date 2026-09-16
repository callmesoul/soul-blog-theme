import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useSiteConfig } from './stores/site-config'
import { useArticles } from './stores/articles'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SearchPage from './pages/SearchPage'
import ArchivesPage from './pages/ArchivesPage'
import AboutPage from './pages/AboutPage'
import FriendsPage from './pages/FriendsPage'

function AppLayout() {
  const location = useLocation()
  const siteConfig = useSiteConfig()
  const articles = useArticles()
  const isLogin = location.pathname === '/login'

  useEffect(() => {
    siteConfig.load().then(() => siteConfig.apply())
  }, [])

  // 按当前路由设置页面 <title>（阅读器打开文章时会由组件自行覆盖）
  useEffect(() => {
    const site = siteConfig.siteName || 'CallMeSoul'
    const p = location.pathname
    if (p === '/login') {
      document.title = `登录 - ${site}`
    } else if (p === '/archives') {
      document.title = `归档 - ${site}`
    } else if (p === '/about') {
      document.title = `关于我 - ${site}`
    } else if (p === '/friends') {
      document.title = `友链 - ${site}`
    } else if (p === '/search') {
      document.title = `搜索 - ${site}`
    } else {
      document.title = `${site} - 首页`
    }
  }, [location.pathname, siteConfig.siteName])

  useEffect(() => {
    const searchPanel = document.querySelector('search-panel') as any
    if (searchPanel) {
      searchPanel.articles = articles.articles
      const handler = (e: any) => {
        const { id, cat } = e.detail
        window.location.hash = articles.buildArticleHash(id, cat || articles.resolveCat('all'))
      }
      searchPanel.addEventListener('search-select', handler)
      return () => searchPanel.removeEventListener('search-select', handler)
    }
  }, [articles.articles])

  return (
    <>
      <site-background image="/images/extracted/home/081a7f1fa54d497bc3afcaa85c41528c@2x.png"></site-background>

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/archives" element={<ArchivesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/friends" element={<FriendsPage />} />
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
