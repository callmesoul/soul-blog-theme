import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useArticles } from '../stores/articles'
import { useSiteConfig } from '../stores/site-config'
import SiteSidebar from '../components/SiteSidebar'
import SearchResults from '../components/SearchResults'

export default function SearchPage() {
  const articles = useArticles()
  const siteConfig = useSiteConfig()
  const navigate = useNavigate()

  const handleResultSelect = useCallback((id: string, cat: string) => {
    navigate('/' + articles.buildArticleHash(id, cat))
  }, [navigate])

  return (
    <>
      <SiteSidebar
        categories={articles.categories}
        social={siteConfig.social}
        siteName={siteConfig.siteName}
        icp={siteConfig.icp}
        activeCat="all"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <SearchResults
          articles={articles.articles}
          catNames={articles.catNames}
          onResultSelect={handleResultSelect}
        />
      </div>
    </>
  )
}