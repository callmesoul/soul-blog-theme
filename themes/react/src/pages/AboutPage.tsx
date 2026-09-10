import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useArticles } from '../stores/articles'
import { useSiteConfig } from '../stores/site-config'
import SiteSidebar from '../components/SiteSidebar'

export default function AboutPage() {
  const navigate = useNavigate()
  const articles = useArticles()
  const siteConfig = useSiteConfig()
  const aboutRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (aboutRef.current) (aboutRef.current as any).config = siteConfig.about
  }, [siteConfig.about])

  const handleNavigate = useCallback((cat: string, tag?: string) => {
    navigate('/' + (tag
      ? '#tag=' + encodeURIComponent(tag)
      : '#cat=' + encodeURIComponent(cat)))
  }, [navigate])

  return (
    <>
      <SiteSidebar
        categories={articles.categories}
        tags={articles.tags}
        social={siteConfig.social}
        siteName={siteConfig.siteName}
        icp={siteConfig.icp}
        activeCat="about"
        onNavigate={handleNavigate}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <about-page ref={aboutRef}></about-page>
      </div>
    </>
  )
}
