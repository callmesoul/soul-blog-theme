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
const searchResults = document.querySelector('search-results')

if (sidebar) {
  sidebar.categories = CATEGORIES
  sidebar.social = social
  sidebar.siteName = siteName
  sidebar.icp = icp
  sidebar.addEventListener('navigate', e => {
    location.hash = '#cat=' + encodeURIComponent(e.detail.cat)
  })
}

if (articleList) {
  articleList.articles = ARTICLES
  articleList.icons = ICONS
  articleList.addEventListener('article-select', e => {
    const art = findArticle(e.detail.id)
    if (art) {
      location.hash = buildArticleHash(art.id, resolveCat(getHashCat()))
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
  const cat = resolveCat(getHashCat())
  const artId = getHashArt()
  const art = artId ? findArticle(artId) : null

  if (sidebar) sidebar.setAttribute('active-cat', cat)
  if (articleList) articleList.setAttribute('active-cat', cat)

  if (art && viewer) {
    viewer.article = art
    if (!viewer.classList.contains('is-open')) {
      const card = document.querySelector(`.article-card[data-id="${art.id}"]`)
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