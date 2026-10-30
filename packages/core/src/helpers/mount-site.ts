// =====================================================================
// 站点装配运行时
//
// 把原先写在 themes/hexo/src/main.js 的装配逻辑收敛到这里：
//   读 <script id="site-data"> → 归一化 → 装配组件 → 接管 hash 路由。
//
// 主题壳（Hexo / Hugo / 任意 SSG）只需在页面里放好挂载点并调用 mountSite()，
// 不需要再写任何装配代码。
// =====================================================================
import type { Article } from '../types/article'
import type { Category } from '../types/category'
import type { RawArticle, SiteData } from '../types/site-data'
import { buildArticle, resolveSiteData } from './build-site-data'

/** 站点数据脚本节点的 id */
export const SITE_DATA_ID = 'site-data'

/** mountSite 可调选项 */
export interface MountSiteOptions {
  /** 站点数据脚本节点 id，默认 `site-data` */
  dataId?: string
  /** 根节点；默认 document */
  root?: ParentNode
  /**
   * 是否接管 hash 路由（#cat= / #tag= / #art=）。
   * 仅首页需要；独立页面（归档 / 文章 / 关于）保持默认即可，
   * 其内部会从 URL 判断是否启用。
   */
  router?: boolean
}

/** 读取并归一化页面内联的站点数据 */
export function readSiteData (dataId = SITE_DATA_ID, root: ParentNode = document): SiteData | null {
  const el = root.querySelector(`#${dataId}`)
  if (!el || !el.textContent) return null

  try {
    return resolveSiteData(JSON.parse(el.textContent))
  } catch {
    return null
  }
}

/** 读取 hash 中的某个键 */
function hashValue (key: string): string | null {
  const matched = location.hash.match(new RegExp(`[#&]${key}=([^&]+)`))
  return matched ? decodeURIComponent(matched[1]) : null
}

/**
 * 把站点数据装配到当前页面已存在的 Web Components 上。
 * 只处理页面上真实存在的元素，因此首页 / 归档 / 文章 / 关于 / 友链共用同一份实现。
 */
export function mountSite (options: MountSiteOptions = {}): SiteData | null {
  const root = options.root || document
  const data = readSiteData(options.dataId, root)
  if (!data) return null

  const articles = data.articles || []
  const categories = data.categories || []
  const icons = data.icons || {}
  const siteName = data.siteName || 'CallMeSoul'

  const catById = (id: string): Category | null => categories.find(c => c.id === id) || null
  const findArticle = (id: string): Article | null => articles.find(a => a.id === id) || null
  const resolveCat = (id: string | null): string => (id && catById(id) ? id : 'all')

  const collectTags = (): Array<{ name: string; count: number }> => {
    const map: Record<string, number> = {}
    articles.forEach(a => {
      (a.tags || []).forEach(t => { map[t] = (map[t] || 0) + 1 })
    })
    return Object.keys(map).sort().map(name => ({ name, count: map[name] }))
  }

  const buildArticleHash = (artId: string, catId?: string): string => {
    const cat = catId ? `cat=${encodeURIComponent(catId)}` : ''
    return '#' + (cat ? `${cat}&` : '') + `art=${encodeURIComponent(artId)}`
  }

  const sidebar = root.querySelector('site-sidebar') as any
  const articleList = root.querySelector('article-list') as any
  const viewer = root.querySelector('article-viewer') as any
  const searchPanel = root.querySelector('search-panel') as any
  const searchResults = root.querySelector('search-results') as any
  const aboutPage = root.querySelector('about-page') as any
  const friendsPage = root.querySelector('friends-page') as any

  // ---- 侧栏 ----
  if (sidebar) {
    sidebar.categories = categories.map(c => ({
      ...c,
      count: c.count != null
        ? c.count
        : articles.filter(a => String(a.cat ?? '').toLowerCase() === String(c.id ?? '').toLowerCase()).length
    }))
    sidebar.social = data.social
    sidebar.siteName = siteName
    sidebar.icp = data.icp
    sidebar.tags = data.tags && data.tags.length ? data.tags : collectTags()
    sidebar.archiveUrl = data.archiveUrl
    sidebar.aboutUrl = data.aboutUrl
    sidebar.friendsUrl = data.friendsUrl
    sidebar.addEventListener('navigate', (e: CustomEvent) => {
      const hash = e.detail.tag
        ? '#tag=' + encodeURIComponent(e.detail.tag)
        : '#cat=' + encodeURIComponent(e.detail.cat)
      if (articleList) {
        location.hash = hash
      } else {
        location.href = data.homeUrl + hash
      }
    })
  }

  // ---- 独立页面 ----
  if (aboutPage) aboutPage.config = data.about || {}
  if (friendsPage) friendsPage.config = data.friends || {}

  // ---- 首页列表 ----
  if (articleList) {
    // icons 必须先于 articles：卡片首次渲染就会拼图标 img
    articleList.icons = icons
    articleList.articles = articles
    articleList.addEventListener('tag-select', (e: CustomEvent) => {
      location.hash = '#tag=' + encodeURIComponent(e.detail.tag)
    })
    articleList.addEventListener('article-select', (e: CustomEvent) => {
      const { id, cat } = e.detail
      if (cat) {
        location.hash = '#cat=' + encodeURIComponent(cat)
      } else {
        const art = findArticle(id)
        if (art) location.hash = buildArticleHash(art.id, resolveCat(hashValue('cat')))
      }
    })
  }

  // ---- 阅读器 ----
  if (viewer) {
    viewer.icons = icons
    viewer.articles = articles
    if (data.giscus) viewer.giscusConfig = data.giscus
    viewer.addEventListener('article-select', (e: CustomEvent) => {
      const { id, cat } = e.detail
      location.replace(buildArticleHash(id, cat || resolveCat(hashValue('cat'))))
      applyRoute()
    })
    viewer.addEventListener('viewer-close', () => {
      if (hashValue('art')) location.hash = '#cat=' + encodeURIComponent(resolveCat(hashValue('cat')))
    })
  }

  // ---- 归档页 ----
  const archiveList = root.querySelector('archive-list') as any
  if (archiveList) {
    const catNames: Record<string, string> = {}
    categories.forEach(c => { catNames[c.id] = c.name })
    archiveList.catNames = catNames
    archiveList.articles = articles
    archiveList.addEventListener('article-select', (e: CustomEvent) => {
      const art = findArticle(e.detail?.id)
      if (!art || !viewer) return
      viewer.article = art
      viewer.openWithFlip(null, siteName)
    })
  }

  // ---- 搜索 ----
  if (searchPanel) {    searchPanel.articles = articles
    searchPanel.addEventListener('search-select', (e: CustomEvent) => {
      const { id, cat } = e.detail
      location.hash = buildArticleHash(id, cat || resolveCat(hashValue('cat')))
    })
  }

  if (searchResults) {
    const catNames: Record<string, string> = {}
    categories.forEach(c => { catNames[c.id] = c.name })
    searchResults.articles = articles
    searchResults.catNames = catNames
    searchResults.addEventListener('result-select', (e: CustomEvent) => {
      const { id, cat } = e.detail
      location.href = '/' + buildArticleHash(id, cat)
    })
  }

  // ---- 路由 ----
  // 仅首页 SPA（含 article-list）需要 hash 路由。SSR 页面（文章 / 归档）没有
  // article-list，直接跳过——否则这里会在 DOMContentLoaded 时把文章页已打开的
  // 阅读器误关闭，并把标题改回「首页」。
  function applyRoute (): void {
    if (!articleList) return

    const cat = resolveCat(hashValue('cat'))
    const tag = hashValue('tag') || ''
    const artId = hashValue('art')
    const art = artId ? findArticle(artId) : null

    if (sidebar) {
      sidebar.setAttribute('active-cat', cat)
      sidebar.setAttribute('active-tag', tag)
    }
    articleList.setAttribute('active-cat', cat)
    articleList.setAttribute('active-tag', tag)

    if (art && viewer) {
      viewer.article = art
      if (!viewer.classList.contains('is-open')) {
        const shadowRoot = articleList.shadowRoot || document
        const card = shadowRoot.querySelector(`.article-card[data-id="${art.id}"]`)
        viewer.openWithFlip(card, siteName)
      }
      document.title = art.title + ' - ' + siteName
    } else if (viewer && viewer.classList.contains('is-open')) {
      viewer.closeWithFlip()
      document.title = siteName + ' - 首页'
    }
  }

  if (options.router !== false) {
    window.addEventListener('hashchange', applyRoute)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyRoute)
    } else {
      applyRoute()
    }
  }

  // ---- 文章页：由模板输出 <script id="article-data"> 时直接打开阅读器 ----
  const articleEl = root.querySelector('#article-data')
  if (articleEl && viewer) {
    const openArticle = (): void => {
      let raw: RawArticle | null = null
      try {
        raw = JSON.parse(articleEl.textContent || '{}')
      } catch {
        raw = null
      }
      if (!raw || (!raw.path && !raw.title)) return
      viewer.article = buildArticle(raw)
      viewer.openWithFlip(null, siteName)
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', openArticle)
    } else {
      openArticle()
    }
  }

  return data
}
