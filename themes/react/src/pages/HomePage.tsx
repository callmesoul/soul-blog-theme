import { useEffect, useRef, useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useArticles } from '../stores/articles'
import { useSiteConfig } from '../stores/site-config'
import SiteSidebar from '../components/SiteSidebar'
import ArticleList from '../components/ArticleList'
import ArticleViewer, { type ArticleViewerHandle } from '../components/ArticleViewer'

function getHashCat(): string {
  const m = location.hash.match(/[#&]cat=([\w-]+)/)
  return m ? decodeURIComponent(m[1]) : 'all'
}

function getHashArt(): string | null {
  const m = location.hash.match(/[#&]art=([\w-]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

function getHashTag(): string {
  const m = location.hash.match(/[#&]tag=([^&]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

export default function HomePage() {
  const articles = useArticles()
  const siteConfig = useSiteConfig()
  const [searchParams, setSearchParams] = useSearchParams()
  const viewerRef = useRef<ArticleViewerHandle>(null)

  const [currentCat, setCurrentCat] = useState(getHashCat())
  const [currentArtId, setCurrentArtId] = useState<string | null>(getHashArt())
  const [currentTag, setCurrentTag] = useState(getHashTag())
  const isClosingByUser = useRef(false)

  // 同步 hash
  useEffect(() => {
    const onHashChange = () => {
      setCurrentCat(getHashCat())
      setCurrentArtId(getHashArt())
      const tag = getHashTag()
      setCurrentTag(tag)
      articles.setActiveTag(tag)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // 监听 currentArtId 变化，打开/关闭阅读器
  useEffect(() => {
    if (currentArtId && viewerRef.current) {
      isClosingByUser.current = false
      const art = articles.findArticle(currentArtId)
      if (art) {
        // 直接设置 article 到 Web Component 上
        const viewerEl = document.querySelector('article-viewer') as any
        if (viewerEl) {
          viewerEl.article = art
          viewerEl.catNames = articles.catNames
        }
        const root = document.querySelector('article-list')?.shadowRoot || document
        const card = root.querySelector(`.article-card[data-id="${currentArtId}"]`)
        viewerRef.current.openWithFlip(card as HTMLElement, siteConfig.siteName || 'CallMeSoul')
      }
    } else if (!currentArtId && viewerRef.current && !isClosingByUser.current) {
      viewerRef.current.closeWithFlip()
    }
  }, [currentArtId])

  // 首页展示 Vercount 访问统计徽标（离开首页时移除）
  useEffect(() => {
    document.body.classList.add('home-show-stat')
    return () => document.body.classList.remove('home-show-stat')
  }, [])

  const handleNavigate = useCallback((cat: string, tag?: string) => {
    if (tag) {
      window.location.hash = '#tag=' + encodeURIComponent(tag)
    } else {
      window.location.hash = '#cat=' + encodeURIComponent(cat)
    }
  }, [])

  const handleArticleSelect = useCallback((id: string) => {
    const art = articles.findArticle(id)
    if (art) {
      window.location.hash = articles.buildArticleHash(id, articles.resolveCat(currentCat))
    }
  }, [currentCat])

  const handleViewerArticleSelect = useCallback((id: string, cat: string) => {
    window.location.replace(articles.buildArticleHash(id, cat || articles.resolveCat(currentCat)))
    // 手动触发 hashchange 处理
    setCurrentCat(getHashCat())
    setCurrentArtId(getHashArt())
  }, [currentCat])

  const handleTagSelect = useCallback((tag: string) => {
    window.location.hash = '#tag=' + encodeURIComponent(tag)
  }, [])

  const handleViewerClose = useCallback(() => {
    isClosingByUser.current = true
    // 仅当 URL 仍带 art（用户点 ×/Esc/遮罩主动关闭）才回落为分类列表，
    // 避免关闭动画结束后组件补发的 viewer-close 把 tag/分类导航 hash 二次改写
    if (getHashArt()) {
      window.location.hash = '#cat=' + encodeURIComponent(articles.resolveCat(currentCat))
    }
    // 阅读器已真正关闭：还原路由标题，避免残留文章标题
    document.title = (siteConfig.siteName || 'CallMeSoul') + ' - 首页'
  }, [currentCat, siteConfig.siteName])

  const currentArticle = currentArtId ? (articles.findArticle(currentArtId) ?? null) : null

  return (
    <>
      <SiteSidebar
        categories={articles.categories}
        tags={articles.tags}
        social={siteConfig.social}
        siteName={siteConfig.siteName}
        icp={siteConfig.icp}
        activeCat={currentCat}
        activeTag={currentTag}
        onNavigate={handleNavigate}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
		        <ArticleList
		          articles={articles.articles}
		          icons={articles.icons}
		          activeCat={currentCat}
		          activeTag={currentTag}
		          onArticleSelect={handleArticleSelect}
		          onTagSelect={handleTagSelect}
		        />

	        <ArticleViewer
	          ref={viewerRef}
	          article={currentArticle}
	          articles={articles.articles}
	          icons={articles.icons}
	          onArticleSelect={handleViewerArticleSelect}
	          onTagSelect={handleTagSelect}
          onViewerClose={handleViewerClose}
        />
      </div>
    </>
  )
}
