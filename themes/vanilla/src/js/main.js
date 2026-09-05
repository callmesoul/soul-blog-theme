import '../css/style.css'
import '@soul-blog/wc'
import { CATEGORIES, ARTICLES, ICONS } from './mock-data.js'
import { loadSiteConfig, applySiteConfig, getSiteConfig } from './site-config.js'

// =====================================================================
// 工具函数
// =====================================================================

function siteName () {
  const site = getSiteConfig().site || {}
  return site.name || 'CallMeSoul'
}

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
const searchPanel = document.querySelector('search-panel')
const searchResults = document.querySelector('search-results')

// 侧栏
if (sidebar) {
  const config = getSiteConfig()
  sidebar.categories = CATEGORIES
  sidebar.social = config.social
  sidebar.siteName = siteName()
  sidebar.icp = config.site.icp
  sidebar.addEventListener('navigate', e => {
    location.hash = '#cat=' + encodeURIComponent(e.detail.cat)
  })
}

// 文章列表
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

// 文章阅读器
if (viewer) {
  viewer.articles = ARTICLES
  viewer.icons = ICONS
  const catNames = {}
  CATEGORIES.forEach(c => { catNames[c.id] = c.name })
  viewer.catNames = catNames
  viewer.addEventListener('article-select', e => {
    const { id, cat } = e.detail
    location.replace(buildArticleHash(id, cat || resolveCat(getHashCat())))
    applyRoute()
  })
  viewer.addEventListener('viewer-close', () => {
    // 阅读器已关闭，同步 hash 移除 art 参数
    if (getHashArt()) {
      location.hash = '#cat=' + encodeURIComponent(resolveCat(getHashCat()))
    }
  })
}

// 登录页
const loginPanel = document.querySelector('login-panel')
if (loginPanel) {
  const remembered = localStorage.getItem('auth:remembered-username')
  if (remembered) {
    loginPanel.setAttribute('remembered-username', remembered)
  }
  loginPanel.addEventListener('login-submit', () => {
    setTimeout(() => { window.location.href = 'index.html' }, 600)
  })
}

// 搜索弹出层
if (searchPanel) {
  searchPanel.articles = ARTICLES
  searchPanel.addEventListener('search-select', e => {
    const { id, cat } = e.detail
    location.hash = buildArticleHash(id, cat || resolveCat(getHashCat()))
  })
}

// 搜索结果页
if (searchResults) {
  const catNames = {}
  CATEGORIES.forEach(c => { catNames[c.id] = c.name })
  searchResults.articles = ARTICLES
  searchResults.catNames = catNames
  searchResults.addEventListener('result-select', e => {
    const { id, cat } = e.detail
    location.href = 'index.html#' + buildArticleHash(id, cat)
  })
}

// =====================================================================
// 路由：hash 变化统一入口
// =====================================================================

function applyRoute () {
  const cat = resolveCat(getHashCat())
  const artId = getHashArt()
  const art = artId ? findArticle(artId) : null

  // 同步侧栏和列表目录
  if (sidebar) sidebar.setAttribute('active-cat', cat)
  if (articleList) {
    const catObj = catById(cat)
    articleList.catName = catObj ? catObj.name : '全部文章'
    articleList.setAttribute('active-cat', cat)
  }

  if (art && viewer) {
    viewer.article = art
    if (!viewer.classList.contains('is-open')) {
      // 卡片渲染在 article-list 的 Shadow DOM 中，需穿透查询
      const root = articleList?.shadowRoot || document
      const card = root.querySelector(`.article-card[data-id="${art.id}"]`)
      viewer.openWithFlip(card, siteName())
    }
    document.title = art.title + ' - ' + siteName()
  } else if (viewer && viewer.classList.contains('is-open')) {
    viewer.closeWithFlip()
    document.title = siteName() + ' - 首页'
  }
}

window.addEventListener('hashchange', applyRoute)

// =====================================================================
// 启动
// =====================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadSiteConfig()
  applySiteConfig()

  // 重新设置依赖 siteConfig 的属性
  if (sidebar) {
    const config = getSiteConfig()
    sidebar.social = config.social
    sidebar.siteName = siteName()
    sidebar.icp = config.site.icp
  }

  applyRoute()

  // 调试钩子
  if (/[?&]autoplay=1\b/.test(location.search) || /(^|#|&)autoplay=1\b/.test(location.hash)) {
    setTimeout(() => {
      const btn = document.querySelector('music-player')?.shadow?.querySelector('#play-btn')
      if (btn) btn.click()
    }, 200)
  }
  if (/[?&]vol=1\b/.test(location.search) || /(^|#|&)vol=1\b/.test(location.hash)) {
    setTimeout(() => {
      const btn = document.querySelector('music-player')?.shadow?.querySelector('.volume-btn')
      if (btn) btn.click()
    }, 200)
  }
})