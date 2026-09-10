// =====================================================================
// @soul-blog/hexo — 客户端入口
// 由 Hexo 主题在 layout 中嵌入 <script id="site-data"> 提供数据，
// 此文件负责读取数据并装配到 Web Components 上。
// =====================================================================
import '@soul-blog/wc'
import './style.css'

// =====================================================================
// 读取 Hexo 嵌入的数据
// =====================================================================
function getSiteData () {
  const el = document.getElementById('site-data')
  if (!el) return null
  try {
    return JSON.parse(el.textContent)
  } catch { return null }
}

const data = getSiteData()
const ARTICLES = data?.articles || []
const CATEGORIES = data?.categories || []
const ICONS = data?.icons || {}
const siteName = data?.siteName || 'CallMeSoul'
const icp = data?.icp || ''
const social = data?.social || []
const archiveUrl = data?.archiveUrl || ''
const aboutUrl = data?.aboutUrl || ''
const homeUrl = data?.homeUrl || '/'

// =====================================================================
// 工具函数
// =====================================================================
function catById (id) {
  return CATEGORIES.find(c => c.id === id) || null
}
function findArticle (id) {
  return ARTICLES.find(a => a.id === id) || null
}
function getHashCat () {
  const m = location.hash.match(/[#&]cat=([\w-]+)/)
  return m ? decodeURIComponent(m[1]) : 'all'
}
function getHashArt () {
  const m = location.hash.match(/[#&]art=([\w-]+)/)
  return m ? decodeURIComponent(m[1]) : null
}
function getHashTag () {
  const m = location.hash.match(/[#&]tag=([^&]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}
function collectTags () {
  const map = {}
  ARTICLES.forEach(a => {
    if (a.tags) {
      a.tags.forEach(t => { map[t] = (map[t] || 0) + 1 })
    }
  })
  return Object.keys(map).sort().map(name => ({ name, count: map[name] }))
}
function resolveCat (id) {
  return catById(id) ? id : 'all'
}
function buildArticleHash (artId, catId) {
  const cat = catId ? `cat=${catId}` : ''
  return '#' + (cat ? `${cat}&` : '') + `art=${artId}`
}

// =====================================================================
// 组件数据装配
// =====================================================================
const sidebar = document.querySelector('site-sidebar')
const articleList = document.querySelector('article-list')
const viewer = document.querySelector('article-viewer')
const searchPanel = document.querySelector('search-panel')
const searchResults = document.querySelector('search-results')
const aboutPage = document.querySelector('about-page')

if (sidebar) {
  sidebar.categories = CATEGORIES.map(c => ({
    ...c,
    count: c.count != null
      ? c.count
      : (data?.articles || []).filter(a => String(a.cat ?? '').toLowerCase() === String(c.id ?? '').toLowerCase()).length
  }))
  sidebar.social = social
  sidebar.siteName = siteName
  sidebar.icp = icp
  sidebar.tags = data?.tags && data.tags.length ? data.tags : collectTags()
  sidebar.archiveUrl = archiveUrl
  sidebar.aboutUrl = aboutUrl
  sidebar.addEventListener('navigate', e => {
    const hash = e.detail.tag
      ? '#tag=' + encodeURIComponent(e.detail.tag)
      : '#cat=' + encodeURIComponent(e.detail.cat)
    if (articleList) {
      // 首页 SPA 视图：直接切 hash 即可
      location.hash = hash
    } else {
      // 独立页面（归档 / 文章 / 通用页）：回到首页应用筛选
      location.href = homeUrl + hash
    }
  })
}

if (aboutPage) {
  aboutPage.config = data?.about || {}
}

if (articleList) {
  articleList.articles = ARTICLES
  articleList.icons = ICONS
  articleList.addEventListener('tag-select', e => {
    const tag = e.detail.tag
    location.hash = '#tag=' + encodeURIComponent(tag)
  })
  articleList.addEventListener('article-select', e => {
    const { id, cat } = e.detail
    if (cat) {
      // 空状态"看看其他分类"按钮
      location.hash = '#cat=' + encodeURIComponent(cat)
    } else {
      const art = findArticle(id)
      if (art) {
        location.hash = buildArticleHash(art.id, resolveCat(getHashCat()))
      }
    }
  })
}

if (viewer) {
  viewer.articles = ARTICLES
  viewer.icons = ICONS
  viewer.addEventListener('article-select', e => {
    const { id, cat } = e.detail
    location.replace(buildArticleHash(id, cat || resolveCat(getHashCat())))
    applyRoute()
  })
  viewer.addEventListener('viewer-close', () => {
    if (getHashArt()) {
      location.hash = '#cat=' + encodeURIComponent(resolveCat(getHashCat()))
    }
  })
}

if (searchPanel) {
  searchPanel.articles = ARTICLES
  searchPanel.addEventListener('search-select', e => {
    const { id, cat } = e.detail
    location.hash = buildArticleHash(id, cat || resolveCat(getHashCat()))
  })
}

if (searchResults) {
  const catNames = {}
  CATEGORIES.forEach(c => { catNames[c.id] = c.name })
  searchResults.articles = ARTICLES
  searchResults.catNames = catNames
  searchResults.addEventListener('result-select', e => {
    const { id, cat } = e.detail
    location.href = '/' + buildArticleHash(id, cat)
  })
}

// =====================================================================
// 路由
// =====================================================================
function applyRoute () {
  // 仅首页 SPA（含 article-list）需要 hash 路由。SSR 页面（文章 / 归档）没有
  // article-list，直接跳过——否则这里会在 DOMContentLoaded 时把 post.ejs 已用
  // viewer.openWithFlip() 打开的文章阅读器误关闭，并把标题改回「首页」。
  if (!articleList) return

  const cat = resolveCat(getHashCat())
  const tag = getHashTag()
  const artId = getHashArt()
  const art = artId ? findArticle(artId) : null

  if (sidebar && articleList) {
    sidebar.setAttribute('active-cat', cat)
    sidebar.setAttribute('active-tag', tag)
  }
  if (articleList) {
    articleList.setAttribute('active-cat', cat)
    articleList.setAttribute('active-tag', tag)
  }

  if (art && viewer) {
    viewer.article = art
    if (!viewer.classList.contains('is-open')) {
      const root = articleList?.shadowRoot || document
      const card = root.querySelector(`.article-card[data-id="${art.id}"]`)
      viewer.openWithFlip(card, siteName)
    }
    document.title = art.title + ' - ' + siteName
  } else if (viewer && viewer.classList.contains('is-open')) {
    viewer.closeWithFlip()
    document.title = siteName + ' - 首页'
  }
}

window.addEventListener('hashchange', applyRoute)
document.addEventListener('DOMContentLoaded', applyRoute)
