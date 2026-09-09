import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useArticles } from '../stores/articles'
import { useSiteConfig } from '../stores/site-config'
import SiteSidebar from '../components/SiteSidebar'
import ArchiveList from '../components/ArchiveList'

export default function ArchivesPage() {
  const articles = useArticles()
  const siteConfig = useSiteConfig()
  const navigate = useNavigate()

  // 侧栏分类/标签点击：回到首页应用对应筛选
  const handleNavigate = useCallback((cat: string, tag?: string) => {
    if (tag) {
      navigate('/#tag=' + encodeURIComponent(tag))
    } else {
      navigate('/#cat=' + encodeURIComponent(cat))
    }
  }, [navigate])

  // 归档行点击：跳回首页并打开对应文章阅读器
  const handleArticleSelect = useCallback((id: string) => {
    const art = articles.findArticle(id)
    if (art) {
      navigate('/' + articles.buildArticleHash(art.id, art.cat))
    }
  }, [articles])

  return (
    <>
      <SiteSidebar
        categories={articles.categories}
        tags={articles.tags}
        social={siteConfig.social}
        siteName={siteConfig.siteName}
        icp={siteConfig.icp}
        activeCat="archives"
        onNavigate={handleNavigate}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ArchiveList
          articles={articles.articles}
          catNames={articles.catNames}
          onArticleSelect={handleArticleSelect}
        />
      </div>
    </>
  )
}
