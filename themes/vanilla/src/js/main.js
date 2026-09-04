import '../css/style.css'
import './components/index.js'
import { navigationItemsTemplate } from './components/site-sidebar.js'
import { articleCardTemplate } from './components/article-list.js'
import {
  articleParagraphsTemplate,
  commentItemTemplate,
  emojiItemsTemplate,
  recommendationItemTemplate,
  viewerMetaTemplate
} from './components/article-viewer.js'
import {
  playlistItemsTemplate,
  playlistPanelTemplate,
  volumePanelTemplate
} from './components/music-player.js'
import { passwordToggleTemplate } from './components/login-panel.js'
import { searchResultItemTemplate } from './components/search-panel.js'
import { CATEGORIES, ARTICLES, ICONS } from './mock-data.js'
import { loadSiteConfig, applySiteConfig, getSiteConfig } from './site-config.js'

/** 站点品牌名（读取运行时配置，用于 <title> 等文案拼接） */
function siteName () {
  const site = getSiteConfig().site || {}
  return site.name || 'CallMeSoul'
}

// =====================================================================
// 通用工具
// =====================================================================

/** 解析 mm:ss 时间字符串为秒数 */
function parseTime (str) {
  if (typeof str !== 'string') return 0
  const parts = str.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

/** 格式化秒数为 mm:ss / hh:mm:ss */
function formatTime (sec) {
  sec = Math.max(0, Math.floor(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const pad = n => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

/** 触发自定义事件 */
function emit (el, type, detail = {}) {
  el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }))
}

/** HTML 转义（模板字符串中拼接用户输入 / 搜索词时使用） */
function escapeHtml (value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]))
}

/** 持久化存储（localStorage 包装，异常时降级到内存） */
const store = (() => {
  let mem = {}
  try {
    const t = '__soul_blog_test__'
    localStorage.setItem(t, '1')
    localStorage.removeItem(t)
    return {
      get (key, fallback) {
        try {
          const v = localStorage.getItem(key)
          return v == null ? fallback : JSON.parse(v)
        } catch { return fallback }
      },
      set (key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
      }
    }
  } catch {
    return {
      get (key, fallback) { return key in mem ? mem[key] : fallback },
      set (key, val) { mem[key] = val }
    }
  }
})()

// =====================================================================
// 博客数据渲染：侧栏目录导航 / 首页文章列表 / 文章详情
// 数据源：src/js/mock-data.js
// =====================================================================

function catById (id) {
  return CATEGORIES.find(c => c.id === id) || null
}

function findArticle (id) {
  return ARTICLES.find(a => a.id === id) || null
}

// =====================================================================
// 站内模糊搜索：标题 / 摘要 / 目录名 / 正文 加权匹配
// =====================================================================

/** 计算 query 对单段文本的模糊匹配得分（整段 / 前缀 / 包含 / 子序列命中依次降权） */
function fuzzyScore (query, text) {
  const q = query.toLowerCase()
  const s = String(text || '').toLowerCase()
  if (!q || !s) return 0
  if (s === q) return 120
  if (s.startsWith(q)) return 100
  const idx = s.indexOf(q)
  if (idx >= 0) return 80 + Math.min(q.length, 10)
  // 子序列命中：连续命中权重更高
  let qi = 0
  let score = 0
  let streak = 0
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) {
      qi++
      streak++
      score += 1 + streak
    } else {
      streak = 0
    }
  }
  return qi < q.length ? 0 : score
}

/** 全量文章模糊搜索，按得分倒序；limit 用于弹出层截断展示条数 */
function searchArticles (rawQuery, limit) {
  const q = (rawQuery || '').trim()
  if (!q) return []
  const results = []
  for (const article of ARTICLES) {
    const cat = catById(article.cat)
    const catName = cat ? cat.name : article.cat
    const fields = [
      { text: article.title, w: 5 },
      { text: article.summary, w: 3 },
      { text: catName + ' ' + (cat ? cat.en : ''), w: 3 },
      { text: (article.paragraphs || []).join(' '), w: 1 }
    ]
    let best = 0
    let field = 'title'
    for (const item of fields) {
      const s = fuzzyScore(q, item.text) * item.w
      if (s > best) { best = s; field = item.field }
    }
    if (best > 0) results.push({ article, catName, score: best, field })
  }
  results.sort((a, b) => b.score - a.score)
  return limit ? results.slice(0, limit) : results
}

/** 从 URL hash 解析当前目录：#cat=frontend / #cat=all / 无 hash */
function getHashCat () {
  const m = location.hash.match(/[#&]cat=([\w-]+)/)
  return m ? decodeURIComponent(m[1]) : 'all'
}

/** 从 URL hash 解析当前打开的文章：#cat=frontend&art=xxx → 'xxx'；未打开则为 null */
function getHashArt () {
  const m = location.hash.match(/[#&]art=([\w-]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

/** 归一化目录 id：未知目录一律回落到“首页/全部” */
function resolveCat (id) {
  return catById(id) ? id : 'all'
}

/** 拼装“打开指定文章”的 hash：保留列表目录参数，便于关闭阅读器后返回原列表 */
function buildArticleHash (artId, catId) {
  const cat = catId ? `cat=${catId}` : ''
  return '#' + (cat ? `${cat}&` : '') + `art=${artId}`
}

// ===== 列表/阅读器共享的模块级状态 =====
// 由 initBlogList 维护：渲染出的目录与“是否已渲染过首屏”
const ListState = { rendered: false, cat: null }
// 由 initViewer 维护：阅读器开合与正在阅读的文章
const ViewerState = { open: false, id: null }
let blogList = null // initBlogList 返回的渲染句柄

// ===== 左侧目录导航（首页 + mock 目录，三页共用） =====

/** 让滑动激活指示条对齐当前激活的导航项（高度 / 位移按条目实测值计算） */
function layoutNavHighlight (nav, activeCat) {
  if (!nav) return
  const created = !nav.querySelector(':scope > .nav-highlight')
  let hl = nav.querySelector(':scope > .nav-highlight')
  if (!hl) {
    hl = document.createElement('span')
    hl.className = 'nav-highlight'
    hl.setAttribute('aria-hidden', 'true')
    nav.insertBefore(hl, nav.firstChild)
  }
  const items = Array.from(nav.querySelectorAll(':scope > .nav-item'))
  const active = items.find(el => el.dataset.cat === activeCat) || items[0]
  if (!active) {
    hl.classList.remove('is-on')
    return
  }

  // 初次构建导航时静默落位，避免指示条从顶部“滑入”的突兀感；
  // 后续同步（切目录 / 开文章）则由 CSS transition 平滑滑动到新位置
  if (created) hl.classList.add('no-anim')
  hl.style.height = active.offsetHeight + 'px'
  hl.style.transform = 'translateY(' + active.offsetTop + 'px)'
  hl.classList.add('is-on')
  if (created) requestAnimationFrame(() => hl.classList.remove('no-anim'))
}

function initNav () {
  const nav = document.querySelector('.site-nav')
  if (!nav) return
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase()

  // 首页（含阅读器打开态）跟随 hash 中的目录；登录等其它页面高亮“首页”
  const activeCat = page === 'index.html' ? resolveCat(getHashCat()) : 'all'

  const items = [
    { cat: 'all', zh: '首页', en: 'Home', icon: ICONS.home, w: 21, h: 21 },
    ...CATEGORIES.map(c => ({ cat: c.id, zh: c.name, en: c.en, icon: c.icon, w: c.w, h: c.h }))
  ]
  nav.innerHTML = navigationItemsTemplate(items, activeCat)
  layoutNavHighlight(nav, activeCat)
}

/** 同步高亮与滑动指示条（hashchange 后调用，避免整体重绘导航） */
function syncNav (activeCat) {
  const nav = document.querySelector('.site-nav')
  if (!nav) return
  nav.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === activeCat)
  })
  layoutNavHighlight(nav, activeCat)
}

// ===== 首页 / 目录列表：滚动接近底部即自动续载 =====
function initBlogList () {
  const grid = document.getElementById('article-grid')
  if (!grid) return
  const area = document.querySelector('.article-area') || grid.closest('.article-area')
  const crumb = document.getElementById('crumb-current')
  if (!area) return

  const PAGE_SIZE = 6

  function cardHtml (a) {
    // 深链入口：保留当前列表目录 cat，关闭阅读器后能回到同一列表；左键点击由网格事件委托接管做 FLIP 展开
    const cat = resolveCat(getHashCat())
    return articleCardTemplate(a, { href: buildArticleHash(a.id, cat), icons: ICONS })
  }

  /** 当前目录按时间倒序的完整列表 */
  function currentList () {
    const catId = resolveCat(getHashCat())
    const cat = catById(catId)
    const src = cat ? ARTICLES.filter(a => a.cat === cat.id) : ARTICLES.slice()
    return src.sort((x, y) => y.date.localeCompare(x.date))
  }

  /** 底部加载状态条（也是滚动触发的哨兵元素） */
  const statusEl = area.querySelector('.list-status') || (() => {
    const el = document.createElement('div')
    el.className = 'list-status'
    el.dataset.state = 'ready'
    area.appendChild(el)
    return el
  })()

  const state = { full: [], shown: 0, loading: false, done: false }

  function setStatus (kind) {
    statusEl.dataset.state = kind
    if (kind === 'loading') {
      statusEl.innerHTML = '<span class="list-spinner"></span>正在加载更多…'
    } else if (kind === 'done') {
      statusEl.textContent = '已经到底啦 · 共 ' + state.full.length + ' 篇'
    } else if (kind === 'ready') {
      // 滚动加载模式下空闲不提示，哨兵保持可见以便持续续载
      statusEl.textContent = ''
    }
  }

  /** 重新渲染第一页（切目录 / 初始进入时调用） */
  function render () {
    // 阅读器打开时列表必须保持原样（关闭动画需依赖原卡片矩形），目录切换由路由在关闭后处理
    if (ViewerState.open && getHashArt()) return

    state.full = currentList()
    state.shown = 0
    state.loading = false
    state.done = false
    area.scrollTop = 0

    const catId = resolveCat(getHashCat())
    const cat = catById(catId)
    if (crumb) crumb.textContent = (cat ? cat.name : '全部文章') + ' · 共 ' + state.full.length + ' 篇'

    if (!state.full.length) {
      grid.innerHTML = '<div class="grid-empty">该目录下暂时没有文章，去其他目录逛逛吧～</div>'
      statusEl.dataset.state = 'hidden'
      syncNav(catId)
      ListState.rendered = true
      ListState.cat = catId
      return
    }

    grid.innerHTML = state.full.slice(0, PAGE_SIZE).map(cardHtml).join('')
    state.shown = Math.min(PAGE_SIZE, state.full.length)
    state.done = state.shown >= state.full.length
    setStatus(state.done ? 'done' : 'ready')
    syncNav(catId)
    ListState.rendered = true
    ListState.cat = catId
  }

  /** 追加下一页（模拟异步接口，短延迟避免加载状态一闪而过） */
  function loadMore () {
    if (state.loading || state.done) return
    const rest = state.full.slice(state.shown)
    if (!rest.length) { state.done = true; setStatus('done'); return }

    state.loading = true
    setStatus('loading')
    setTimeout(() => {
      grid.insertAdjacentHTML('beforeend', rest.slice(0, PAGE_SIZE).map(cardHtml).join(''))
      state.shown += Math.min(PAGE_SIZE, rest.length)
      state.loading = false
      if (state.shown >= state.full.length) {
        state.done = true
        setStatus('done')
      } else {
        setStatus('ready')
      }
    }, 250)
  }

  // 滚动到列表真正的最底部（哨兵元素进入可视区）时才触发下一页，
  // 不做提前预加载
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) loadMore() })
  }, { root: area, rootMargin: '0px' })
  io.observe(statusEl)

  // 列表渲染统一由路由（initViewer.applyRoute）触发，避免与阅读器开合相互干扰
  return { render }
}

// =====================================================================
// 文章阅读器（详情嵌入首页）
// ---------------------------------------------------------------------
// 点击文章卡片后，在右侧正文区以 Shared Element「卡片放大展开」动画弹出
// 完整阅读面板；URL 形如 #cat=<目录>&art=<文章id>，天然获得深链 / 前进 / 后退。
// =====================================================================

// 时间节奏（毫秒）——与 style.css 中的动画时长保持一致
const FLIP_OPEN_MS = 420
const FLIP_CLOSE_MS = 300
const CONTENT_REVEAL_MS = 240

/** 单条评论模板（与阅读器评论区委托结构一致，回复区默认隐藏） */
function commentItemHtml (c) {
  return commentItemTemplate(c, ICONS)
}

/** 推荐位模板（cat 决定点击后列表停留在哪个目录；阅读器内点击由事件委托接管原地切换） */
function recItemHtml (r, isLast, cat) {
  return recommendationItemTemplate(r, {
    href: buildArticleHash(r.id, cat),
    isLast
  })
}

// ===== 评论区（根作用域事件委托，切换文章只需重建 DOM） =====
const COMMENT_AVATARS = [ICONS.avatarB, ICONS.avatarA]

function commentFormatNow () {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function commentSyncCount (root) {
  const list = root.querySelector(':scope .comment-list')
  const total = root.querySelector(':scope .comment-total')
  if (!list || !total) return
  total.textContent = `共 ${list.querySelectorAll(':scope > .comment-item').length} 条评论`
}

function commentNewItem (text, name) {
  const template = document.createElement('template')
  template.innerHTML = commentItemTemplate({
    avatar: COMMENT_AVATARS[0],
    likes: 0,
    name,
    text,
    time: commentFormatNow()
  }, ICONS).trim()
  return template.content.firstElementChild
}

/** 读取元素视口矩形（宽高为 0 视为不可测量） */
function rectOf (el) {
  if (!el || !el.getBoundingClientRect) return null
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 ? r : null
}

/** 矩形是否与视口相交（深链打开时卡片可能在视口外，不适用 FLIP） */
function inViewportRect (r) {
  return !!r &&
    r.right > 0 && r.left < window.innerWidth &&
    r.bottom > 0 && r.top < window.innerHeight
}

/** 视口矩形 → 阅读器局部坐标（阅读器是正文列内的覆盖层，其原点 ≠ 视口原点） */
function toLocalRect (r, base) {
  if (!r) return null
  return { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height }
}

/** 把“布局尺寸为 layout 的元素”变换到目标局部矩形（transform-origin: top left） */
function tfTo (layout, target) {
  return `translate(${target.left}px, ${target.top}px) scale(${target.width / layout.width}, ${target.height / layout.height})`
}

function initViewer () {
  const viewer = document.getElementById('article-viewer')
  if (!viewer) return

  viewer.classList.add('article-viewer') // 覆盖层定位样式（.article-viewer）
  const backdrop = viewer.querySelector('.viewer-backdrop')
  const ghost = viewer.querySelector('.viewer-ghost')
  const panel = viewer.querySelector('.viewer-panel')
  const panelBody = viewer.querySelector('.viewer-body')
  const main = viewer.querySelector('.viewer-main')
  const aside = viewer.querySelector('.viewer-aside')
  const closeBtn = viewer.querySelector('.viewer-close')

  // ---- 文章切换中的渲染队列（避免快速连点时竞态） ----
  let swapBusy = false
  // 开合“代际”：每次打开/关闭都会递增；旧动画回调发现代际过期后直接放弃，
  // 防止收拢动画的延迟收尾把新打开的面板误关掉
  let viewerGen = 0
  // 连续点击“推荐文章”时的排队切换：动画进行中先记下目标，播完自动续切
  let swapPendingId = null

  /** 把一篇文章渲染进阅读器（标题/元信息/头图/正文/评论/推荐） */
  function renderArticle (art) {
    main.querySelector('.viewer-title').textContent = art.title

    // 元信息：浏览 / 评论 / 日期（沿用卡片同款图标）
    const meta = main.querySelector('.viewer-meta')
    meta.innerHTML = viewerMetaTemplate(art, ICONS)

    const cover = main.querySelector('.viewer-cover')
    cover.src = art.cover
    cover.alt = art.title

    // 正文段落
    main.querySelector('.article-content').innerHTML = articleParagraphsTemplate(art.paragraphs)

    // 评论区
    const comments = art.comments || []
    const list = main.querySelector('.comment-list')
    list.innerHTML = comments.length
      ? comments.map(commentItemHtml).join('')
      : '<p class="comment-empty">还没有评论，来抢沙发吧～</p>'
    commentSyncCount(viewer)

    // 右侧推荐：同目录优先，最多 6 条
    const rec = aside.querySelector('.recommend-list')
    const others = ARTICLES.filter(a => a.id !== art.id)
    const same = others.filter(a => a.cat === art.cat)
    const rest = others.filter(a => a.cat !== art.cat)
    const recs = [...same, ...rest].slice(0, 6)
    // 推荐点击后列表停留在用户当前目录（关闭时回到原列表）
    const listCat = resolveCat(getHashCat())
    rec.innerHTML = recs.length
      ? recs.map((r, i) => recItemHtml(r, i === recs.length - 1, listCat)).join('')
      : '<p class="viewer-rec-empty">暂无推荐</p>'

    // 顶部语境：目录名（面包屑末级）
    const cat = catById(art.cat)
    viewer.querySelector('.viewer-cat-name').textContent = cat ? cat.name : art.cat

    main.scrollTop = 0
    aside.scrollTop = 0
  }

  // ===== 评论区委托交互（绑定在阅读器根，切换文章无需重复绑定） =====
  viewer.addEventListener('click', e => {
    const target = e.target

    // 点击遮罩空白处关闭阅读器
    if (target === backdrop) {
      closeViaRoute()
      return
    }

    // 点赞 / 回复开关
    const like = target.closest('[data-act="like"]')
    if (like && viewer.contains(like)) {
      const c = like.querySelector('.like-count')
      const n = (+c.textContent || 0) + 1
      c.textContent = n
      like.classList.add('liked')
      return
    }
    const replyBtn = target.closest('[data-act="reply"]')
    if (replyBtn && viewer.contains(replyBtn)) {
      const item = replyBtn.closest('.comment-item')
      const rf = item && item.querySelector('.reply-form')
      if (rf) {
        rf.hidden = !rf.hidden
        if (!rf.hidden) {
          const ta = rf.querySelector('textarea')
          ta && ta.focus()
        }
      }
      return
    }
    if (target.closest('.reply-cancel')) {
      const rf = target.closest('.reply-form')
      if (rf) rf.hidden = true
      return
    }
    if (target.closest('.reply-submit')) {
      const rf = target.closest('.reply-form')
      const item = target.closest('.comment-item')
      if (!rf || !item) return
      const ta = rf.querySelector('textarea')
      const v = (ta.value || '').trim()
      if (!v) { ta.focus(); return }
      const reply = commentNewItem(v, '我')
      reply.classList.add('is-reply')
      const body = reply.querySelector('.comment-text .comment-body')
      if (body) body.textContent = v
      item.querySelector('.reply-list').appendChild(reply)
      rf.hidden = true
      ta.value = ''
      return
    }

    // 发表评论
    const submit = target.closest('#comment-form button[type="submit"]')
    if (submit) {
      e.preventDefault()
      const form = submit.closest('#comment-form')
      const ta = form.querySelector('textarea')
      const text = (ta.value || '').trim()
      if (!text) { ta.focus(); return }
      const list = form.parentElement.querySelector('.comment-list')
      const emptyHint = list.querySelector('.comment-empty')
      if (emptyHint) emptyHint.remove() // 首条评论顶掉“暂无评论”
      list.appendChild(commentNewItem(text, '我'))
      ta.value = ''
      form.querySelector('button[type="submit"]').disabled = true
      form.querySelector('button[type="submit"]').classList.remove('is-active')
      commentSyncCount(viewer)
      const last = list.lastElementChild
      last && last.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // 推荐原地切换（replace 不产生新历史条目，返回键直接回到列表）
    const rec = target.closest('.recommend-item')
    if (rec && viewer.contains(rec)) {
      const id = rec.dataset.id
      if (!id || id === ViewerState.id) return
      e.preventDefault()
      location.replace(buildArticleHash(id, resolveCat(getHashCat())))
      applyRoute() // 某些环境下 replace 不触发 hashchange，手动路由保证切换
    }
  })

  // 评论输入联动提交按钮状态
  viewer.addEventListener('input', e => {
    if (e.target.matches('#comment-form textarea')) {
      const submit = viewer.querySelector('#comment-form button[type="submit"]')
      const hasText = !!e.target.value.trim()
      submit.disabled = !hasText
      submit.classList.toggle('is-active', hasText)
    }
  })

  // 表情面板（全局单例，点击外部收起）
  const emojiBtn = viewer.querySelector('[data-act="emoji"]')
  const emojiPanel = document.createElement('div')
  emojiPanel.className = 'emoji-panel'
  emojiPanel.innerHTML = emojiItemsTemplate(['😀', '😂', '😉', '😍', '👍', '🎉', '🤔', '😢', '🔥', '✨', '❤️', '🙌'])
  document.body.appendChild(emojiPanel)
  emojiPanel.addEventListener('click', e => {
    if (!e.target.classList.contains('emoji-item')) return
    const ta = viewer.querySelector('#comment-form textarea')
    if (ta) {
      ta.value += e.target.textContent
      ta.focus()
      ta.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  document.addEventListener('click', e => {
    if (!emojiPanel.classList.contains('open')) return
    if (emojiPanel.contains(e.target) || (emojiBtn && emojiBtn.contains(e.target))) return
    emojiPanel.classList.remove('open')
  })
  emojiBtn && emojiBtn.addEventListener('click', e => {
    e.stopPropagation()
    const r = emojiBtn.getBoundingClientRect()
    emojiPanel.style.left = r.left + 'px'
    emojiPanel.style.bottom = (window.innerHeight - r.top + 6) + 'px'
    emojiPanel.classList.toggle('open')
  })

  // 关闭按钮 / Esc（都回到“仅目录”的 hash，由路由执行收拢动画）
  const closeViaRoute = () => {
    location.hash = '#cat=' + resolveCat(getHashCat())
  }
  closeBtn.addEventListener('click', closeViaRoute)
  document.addEventListener('keydown', e => {
    if (!ViewerState.open || e.key !== 'Escape') return
    const tag = (e.target && e.target.tagName) || ''
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    closeViaRoute()
  })

  // ===== 文章卡片左键点击 → 记录原点并写 hash（由 applyRoute 开启动画） =====
  const grid = document.getElementById('article-grid')
  if (grid) {
    grid.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return // 新标签/新窗口交给浏览器
      const card = e.target.closest('.article-card')
      if (!card || !card.dataset.id) return
      e.preventDefault()
      location.hash = buildArticleHash(card.dataset.id, resolveCat(getHashCat()))
    })
  }

  // =================================================================
  // 开 / 合 / 切换 三态
  // =================================================================
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // 内容可见性：动画进行时面板内容隐藏在遮罩下，展开到位的瞬间淡入上浮
  function maskContent () {
    panelBody.classList.add('viewer-mask')
    panelBody.classList.remove('viewer-in')
  }
  function revealContent () {
    panelBody.classList.remove('viewer-mask')
    panelBody.classList.add('viewer-in')
    setTimeout(() => panelBody.classList.remove('viewer-in'), CONTENT_REVEAL_MS + 80)
  }

  /** 封面克隆显隐（同时归零残留的 transform/尺寸/动画） */
  function ghostShow () {
    ghost.style.display = 'block'
  }
  function ghostReset () {
    ghost.style.display = 'none'
    ghost.style.transform = ''
    ghost.style.width = ''
    ghost.style.height = ''
    ghost.style.left = ''
    ghost.style.top = ''
    ghost.style.boxShadow = ''
    ghost.style.borderRadius = ''
    if (ghost.getAnimations) ghost.getAnimations().forEach(a => a.cancel())
  }

  /** 面板本体复位为最终布局（清除动画残留） */
  function panelReset () {
    panel.style.transition = ''
    panel.style.transform = ''
    panel.style.transformOrigin = ''
    panel.style.opacity = ''
    panel.classList.add('viewer-open')
  }

  /** 从文章卡片弹出阅读器（Shared Element：封面克隆 + 面板放大，内容延迟淡入） */
  function openViewer (art) {
    viewerGen++
    swapPendingId = null
    ViewerState.open = true
    ViewerState.id = art.id

    viewer.hidden = false
    ghostReset()                             // 清掉可能的收拢动画残留
    renderArticle(art)                       // 以最终布局渲染（内容暂被 mask 隐藏）
    document.title = art.title + ' - ' + siteName()
    syncNav(art.cat)

    // 布局就绪后再测量，做一次 FLIP 定位
    requestAnimationFrame(() => {
      const gen = viewerGen
      const vBase = viewer.getBoundingClientRect()
      const card = document.querySelector('.article-card[data-id="' + art.id + '"]')
      const cardVp = rectOf(card)
      const thumbVp = card ? rectOf(card.querySelector('.card-thumb')) : null
      const cardLocal = toLocalRect(cardVp, vBase)
      const thumbLocal = toLocalRect(thumbVp, vBase) || cardLocal
      const coverEl = main.querySelector('.viewer-cover')
      const coverLocal = toLocalRect(rectOf(coverEl), vBase)

      panelReset()
      backdrop.classList.add('viewer-in')
      maskContent()
      closeBtn.focus({ preventScroll: true })

      // 无有效原点（深链直达/卡片在视口外）或系统要求减少动效：直接淡入内容
      if (reduceMotion || !viewer.animate || !inViewportRect(cardVp) || !coverLocal) {
        panel.classList.remove('is-anim')
        revealContent()
        return
      }

      // 动画期间用实底替代 backdrop-filter，避免逐帧重采样掉帧
      panel.classList.add('is-anim')
      // ---- 面板：从卡片矩形放大到最终矩形 ----
      // 先在“无过渡”状态下落位到卡片起始位置并强制回流，随后开启过渡放大，
      // 否则起始变换会被当作一次 transition 反向播放
      const P = { left: 0, top: 0, width: vBase.width, height: vBase.height }
      panel.style.transformOrigin = 'top left'
      panel.style.transition = 'none'
      panel.style.transform = tfTo(P, cardLocal)
      void panel.offsetWidth
      panel.style.transition = `transform ${FLIP_OPEN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
      panel.style.transform = ''

      // ---- 封面克隆：从卡片缩略图“飞”向正文封面 ----
      ghostShow()
      ghost.style.left = '0'
      ghost.style.top = '0'
      ghost.style.transformOrigin = 'top left'
      ghost.style.width = thumbLocal.width + 'px'
      ghost.style.height = thumbLocal.height + 'px'
      ghost.src = coverEl.src
      const fromTf = tfTo(thumbLocal, thumbLocal)
      const toTf = tfTo(thumbLocal, coverLocal)
      ghost.style.transform = fromTf
      const fly = ghost.animate(
        [
          { transform: fromTf },
          { transform: toTf }
        ],
        {
          duration: FLIP_OPEN_MS + 80,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both'
        }
      )

      // 面板基本放大完成后淡入真实内容，克隆封面随即淡出接力
      // （若期间阅读器已被关闭/代际变更，则放弃这两个收尾，交由关合流程处理）
      setTimeout(() => {
        if (gen !== viewerGen) return
        revealContent()
      }, Math.round(FLIP_OPEN_MS * 0.8))
      const cleanTimers = []
      const finishOpen = () => {
        if (gen !== viewerGen) return
        clearTimeout(cleanTimers[0])
        if (fly && fly.cancel) fly.cancel()
        ghostReset()
        panel.classList.remove('is-anim')
        panelReset()
      }
      cleanTimers[0] = setTimeout(finishOpen, FLIP_OPEN_MS + 160)
    })
  }

  /** 内容快速淡出后原地切换文章（推荐点击 / 历史前后篇）；动画中再次触发则排队续切 */
  function switchArticle (art) {
    const nextId = art.id
    if (nextId === ViewerState.id && !swapBusy) return
    if (swapBusy) {
      swapPendingId = nextId
      return
    }
    startSwap(art)
  }

  function startSwap (art) {
    const nextId = art.id
    const gen = viewerGen
    swapBusy = true
    main.classList.add('viewer-swap-out')
    aside.classList.add('viewer-swap-out')
    setTimeout(() => {
      // 期间阅读器被关闭/打开新文章则放弃本次换页
      if (gen !== viewerGen) {
        main.classList.remove('viewer-swap-out')
        aside.classList.remove('viewer-swap-out')
        swapBusy = false
        swapPendingId = null
        return
      }
      renderArticle(art)
      ViewerState.id = nextId
      syncNav(art.cat)
      document.title = art.title + ' - ' + siteName()
      main.classList.remove('viewer-swap-out')
      aside.classList.remove('viewer-swap-out')
      requestAnimationFrame(() => {
        main.classList.add('viewer-swap-in')
        aside.classList.add('viewer-swap-in')
        setTimeout(() => {
          main.classList.remove('viewer-swap-in')
          aside.classList.remove('viewer-swap-in')
          swapBusy = false
          // 播放期间又有新的目标，继续切换
          const pid = swapPendingId
          swapPendingId = null
          if (pid && pid !== ViewerState.id) {
            const target = findArticle(pid)
            if (target) startSwap(target)
          }
        }, CONTENT_REVEAL_MS)
      })
    }, 160)
  }

  /** 从阅读器收回：内容淡出 → 面板反向 FLIP 收拢回原卡片；收拢完成后再回调（如按新目录重建列表） */
  function closeViewer (onDone) {
    const gen = ++viewerGen
    swapPendingId = null
    const artId = ViewerState.id
    ViewerState.open = false
    ViewerState.id = null

    const card = document.querySelector('.article-card[data-id="' + artId + '"]')
    const cardVp = rectOf(card)

    const finish = () => {
      if (gen !== viewerGen) return // 已被新的打开/关闭抢占，放弃本次收尾
      viewer.hidden = true
      panel.style.transition = ''
      panel.style.transform = ''
      panel.style.transformOrigin = ''
      panel.style.opacity = ''
      panel.classList.remove('viewer-open', 'is-anim')
      backdrop.classList.remove('viewer-in')
      maskContent()
      ghostReset()
      document.title = siteName() + ' - 首页'
      syncNav(resolveCat(getHashCat()))
      if (card && card.focus) card.focus({ preventScroll: true })
      if (onDone) onDone()
    }

    if (reduceMotion || !inViewportRect(cardVp) || !viewer.animate) {
      backdrop.classList.remove('viewer-in')
      finish()
      return
    }

    // 1) 内容淡出，随后面板反向收拢
    maskContent()
    setTimeout(() => {
      if (gen !== viewerGen) return
      const vBase = viewer.getBoundingClientRect()
      const cardLocal = toLocalRect(cardVp, vBase)
      const coverEl = main.querySelector('.viewer-cover')
      const coverLocal = toLocalRect(rectOf(coverEl), vBase)
      if (!cardLocal) { finish(); return }

      const P = { left: 0, top: 0, width: vBase.width, height: vBase.height }
      panel.classList.add('is-anim')
      panel.style.transformOrigin = 'top left'
      // 面板先收拢到卡片矩形，到达后（延迟 FLIP_CLOSE_MS）自身淡出，
      // 避免不透明面板停在卡片上方、finish 突隐造成“暗块→卡片”截断闪
      panel.style.transition =
        `transform ${FLIP_CLOSE_MS}ms cubic-bezier(0.45, 0, 0.55, 1), opacity 110ms ease ${FLIP_CLOSE_MS}ms`
      panel.style.transform = tfTo(P, cardLocal)
      panel.style.opacity = '0'

      // 封面克隆从正文封面缩回卡片缩略图，收拢动画更有“归位感”
      const thumbVp = card ? rectOf(card.querySelector('.card-thumb')) : null
      const thumbLocal = toLocalRect(thumbVp, vBase) || cardLocal
      if (coverLocal && coverEl.src) {
        ghostShow()
        ghost.style.left = '0'
        ghost.style.top = '0'
        ghost.style.transformOrigin = 'top left'
        ghost.style.width = coverLocal.width + 'px'
        ghost.style.height = coverLocal.height + 'px'
        ghost.src = coverEl.src
        const fromTf = tfTo(coverLocal, coverLocal)
        const toTf = tfTo(coverLocal, thumbLocal)
        ghost.style.transform = fromTf
        // 克隆以 fill:'both' 保持收拢末帧，交由 finish 的 ghostReset 统一取消，
        // 避免中途 cancel 使封面弹回原位、造成“详情快速缩放”的闪烁
        const flyBack = ghost.animate(
          [{ transform: fromTf }, { transform: toTf }],
          { duration: FLIP_CLOSE_MS, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'both' }
        )
        // 收拢完成时把克隆 inline 态落到“缩略图位置/尺寸”，与真实卡片缩略图逐像素对齐，
        // 停驻窗口内取消动画也不回弹，finish 隐藏时无缝交接
        setTimeout(() => {
          if (gen !== viewerGen) return // 期间已抢占（重新开合），放弃落位，交由新流程处理
          if (flyBack && flyBack.cancel) flyBack.cancel()
          ghost.style.width = thumbLocal.width + 'px'
          ghost.style.height = thumbLocal.height + 'px'
          ghost.style.transform = `translate(${thumbLocal.left}px, ${thumbLocal.top}px)`
          // 去掉飞行层的投影/圆角，停驻时与真实缩略图完全同形，避免“浮层”残影
          ghost.style.boxShadow = 'none'
          ghost.style.borderRadius = '0'
        }, FLIP_CLOSE_MS)
      }
      backdrop.classList.remove('viewer-in')
      setTimeout(finish, FLIP_CLOSE_MS + 110)
    }, 130)
  }

  // =================================================================
  // 路由：hash 变化统一入口
  // =================================================================
  function ensureList () {
    const cat = resolveCat(getHashCat())
    const needRender = !ListState.rendered || ListState.cat !== cat
    if (needRender && blogList && blogList.render) {
      blogList.render()
    }
  }

  function applyRoute () {
    const cat = resolveCat(getHashCat())
    const artId = getHashArt()
    const art = artId ? findArticle(artId) : null

    if (art) {
      // 打开 / 切换文章
      ensureList() // 深链首屏：先把当前目录列表铺好（供关闭动画使用），阅读中则跳过（render 内部守卫）
      if (!ViewerState.open) {
        openViewer(art)
      } else if (ViewerState.id !== art.id) {
        switchArticle(art)
      }
    } else {
      if (ViewerState.open) {
        // 先播完收拢动画（目标卡片仍须留在 DOM），收拢后再按新目录重建列表
        closeViewer(() => ensureList())
      } else {
        ensureList()
      }
    }
  }

  window.addEventListener('hashchange', applyRoute)
  applyRoute()
}

// 社交图标 hover/提示 已由 style.css 的 .social-icon 规则接管（纯 CSS 实现）

// =====================================================================
// 音乐播放器
// ---------------------------------------------------------------------
// 增强：播放列表 / 上一首-下一首 / 模式切换 / 进度条拖动 / 音量持久化
// =====================================================================

const PLAY_MODES = ['loop', 'single', 'shuffle'] // 循环 / 单曲 / 随机
// 本地真实音频（public/audio/ 下的免费示例音乐 SoundHelix，允许自由使用）。
// src 指向可播放的本地 MP3；曲目时长不再写死，由播放器读取音频元数据后自动填充。
const DEFAULT_TRACKS = [
  { title: 'SoundHelix Song 1', artist: 'SoundHelix', src: '/audio/SoundHelix-Song-1.mp3' },
  { title: 'SoundHelix Song 2', artist: 'SoundHelix', src: '/audio/SoundHelix-Song-2.mp3' },
  { title: 'SoundHelix Song 3', artist: 'SoundHelix', src: '/audio/SoundHelix-Song-3.mp3' },
  { title: 'SoundHelix Song 4', artist: 'SoundHelix', src: '/audio/SoundHelix-Song-4.mp3' },
  { title: 'SoundHelix Song 5', artist: 'SoundHelix', src: '/audio/SoundHelix-Song-5.mp3' }
]

function initPlayer () {
  const player = document.querySelector('.music-player')
  if (!player) return

  // ===== 解析按钮 =====
  // 用 data-act 区分功能；播放列表面板按钮用 viewBox 17 17 区分
  const prevBtn = player.querySelector('.player-btn[data-act="prev"]')
  const playBtn = player.querySelector('#play-btn')
  const nextBtn = player.querySelector('.player-btn[data-act="next"]')
  // 播放列表按钮：SVG 是 0 0 17 17
  const listBtn = Array.from(player.querySelectorAll('.player-btn')).find(b => {
    const svg = b.querySelector('svg')
    return svg && (svg.getAttribute('viewBox') || '') === '0 0 17 17'
  })
  // 播放模式按钮：按 .mode-toggle 类定位（不再依赖 viewBox 猜测）
  const modeBtn = player.querySelector('.player-btn.mode-toggle')

  // ===== 状态 =====
  const state = {
    tracks: DEFAULT_TRACKS,
    index: 0,
    isPlaying: false,
    current: 0,         // 当前秒数
    volume: 0.5,        // 0..1
    mode: store.get('player:mode', 'loop'),
    lastVolume: 0.5,
  }
  const savedVol = store.get('player:volume', null)
  if (typeof savedVol === 'number') state.volume = savedVol

  // ===== 真实音频引擎 =====
  // 播放器驱动一个隐藏的 HTMLAudioElement 播放本地 MP3；UI 的时间/进度/结束全部取自音频真实状态
  const audio = new Audio()
  audio.preload = 'metadata'
  audio.volume = state.volume
  audio.src = state.tracks[0].src

  // ===== 进度条 =====
  const trackEl = player.querySelector('.progress-track')
  const fillEl = player.querySelector('.progress-fill')
  const thumbEl = player.querySelector('.progress-thumb')
  const curEl = player.querySelector('.time-current')
  const durEl = player.querySelector('.time-duration')
  const titleEl = player.querySelector('.track-title')
  const artistEl = player.querySelector('.track-artist')

  // 注入 title/artist 容器（若 HTML 中没有），并把 <p> 改造
  if (titleEl && artistEl) {
    // ok
  } else {
    const p = player.querySelector('p')
    if (p && !p.dataset.enhanced) {
      p.dataset.enhanced = '1'
      p.innerHTML = '<span class="track-title"></span><span style="color:#5D5A59;margin:0 6px;">·</span><span class="track-artist"></span>'
    }
  }

  const titleDom = player.querySelector('.track-title')
  const artistDom = player.querySelector('.track-artist')

  function updateInfo () {
    const t = state.tracks[state.index]
    if (titleDom) titleDom.textContent = t.title
    if (artistDom) artistDom.textContent = t.artist
    if (durEl) durEl.textContent = (t.duration && isFinite(t.duration)) ? formatTime(t.duration) : '00:00'
    if (curEl) curEl.textContent = formatTime(state.current)
    updateProgress()
  }

  function updateProgress () {
    const t = state.tracks[state.index]
    const pct = t.duration > 0 ? Math.min(100, (state.current / t.duration) * 100) : 0
    if (fillEl) fillEl.style.width = pct + '%'
    if (thumbEl) thumbEl.style.left = pct + '%'
    if (curEl) curEl.textContent = formatTime(state.current)
  }

  function setPlayIcon (playing) {
    if (!playBtn) return
    playBtn.classList.toggle('is-playing', !!playing)
  }

  function setPlaying (playing) {
    state.isPlaying = playing
    setPlayIcon(playing)
  }

  function nextIndex () {
    if (state.mode === 'shuffle') {
      if (state.tracks.length <= 1) return 0
      let i
      do { i = Math.floor(Math.random() * state.tracks.length) } while (i === state.index)
      return i
    }
    return (state.index + 1) % state.tracks.length
  }

  function prevIndex () {
    if (state.mode === 'shuffle') {
      return nextIndex()
    }
    return (state.index - 1 + state.tracks.length) % state.tracks.length
  }

  function loadTrack (i, autoplay) {
    state.index = (i + state.tracks.length) % state.tracks.length
    const t = state.tracks[state.index]
    state.current = 0
    audio.src = t.src
    updateInfo()
    if (autoplay) play()
  }

  // 真实播放/暂停。浏览器自动播放策略要求首次播放必须来自用户手势，
  // 本播放器的所有入口（播放键/列表点击/空格键）都是点击事件，满足要求。
  function play () {
    const p = audio.play()
    if (p && p.catch) p.catch(() => { /* 被浏览器策略拒绝时保持暂停，不抛错 */ })
  }

  function pause () { audio.pause() }

  function toggle () { audio.paused ? play() : pause() }

  function next () {
    loadTrack(nextIndex(), true)
    renderList()
  }

  function prev () {
    // 进度 > 3s 视为重播当前（真实音频也回到 0:00）
    if (state.current > 3) {
      state.current = 0
      audio.currentTime = 0
      updateProgress()
      return
    }
    loadTrack(prevIndex(), true)
    renderList()
  }

  function cycleMode () {
    const i = PLAY_MODES.indexOf(state.mode)
    state.mode = PLAY_MODES[(i + 1) % PLAY_MODES.length]
    store.set('player:mode', state.mode)
    renderMode()
    // 切换时给图标一个回弹动画（移除后重放）
    if (modeBtn) {
      modeBtn.classList.remove('is-switch')
      void modeBtn.offsetWidth
      modeBtn.classList.add('is-switch')
    }
  }

  function renderMode () {
    if (!modeBtn) return
    const m = state.mode
    const label = m === 'loop' ? '列表循环' : m === 'single' ? '单曲循环' : '随机播放'
    modeBtn.dataset.mode = m
    modeBtn.title = label
    modeBtn.setAttribute('aria-label', label)
    // 当前模式常显高亮（is-mode-active 样式见 style.css）
    modeBtn.classList.add('is-mode-active')
    const svg = modeBtn.querySelector('svg')
    if (!svg) return
    svg.innerHTML = ''
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('width', '17')
    svg.setAttribute('height', '17')
    const add = d => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      p.setAttribute('d', d)
      svg.appendChild(p)
    }
    if (m === 'shuffle') {
      // 随机播放：交叉双箭头（Feather shuffle 线稿）
      ;['M16 3h5v5', 'M4 20L21 3', 'M21 16v5h-5', 'M15 15l6 6', 'M4 4l5 5'].forEach(add)
    } else if (m === 'single') {
      // 单曲循环：圆环回绕箭头 + 数字 1
      ;['m17 2 4 4-4 4', 'M3 11v-1a4 4 0 0 1 4-4h14', 'm7 22-4-4 4-4', 'M21 13v1a4 4 0 0 1-4 4H3', 'M11 10h1v4'].forEach(add)
    } else {
      // 列表循环：双向回绕箭头
      ;['m17 2 4 4-4 4', 'M3 11v-1a4 4 0 0 1 4-4h14', 'm7 22-4-4 4-4', 'M21 13v1a4 4 0 0 1-4 4H3'].forEach(add)
    }
  }

  // ===== 进度条交互 =====
  if (trackEl) {
    let dragging = false
    function seekFromEvent (e) {
      const rect = trackEl.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      const ratio = Math.max(0, Math.min(1, x / rect.width))
      const t = state.tracks[state.index]
      const sec = ratio * (t.duration || 0)
      state.current = sec
      audio.currentTime = sec
      updateProgress()
    }
    trackEl.addEventListener('mousedown', e => {
      dragging = true
      trackEl.classList.add('is-dragging')
      seekFromEvent(e)
      e.preventDefault()
    })
    document.addEventListener('mousemove', e => { if (dragging) seekFromEvent(e) })
    document.addEventListener('mouseup', () => { if (dragging) { dragging = false; trackEl.classList.remove('is-dragging') } })
    trackEl.addEventListener('touchstart', e => { dragging = true; trackEl.classList.add('is-dragging'); seekFromEvent(e) }, { passive: true })
    document.addEventListener('touchmove', e => { if (dragging) seekFromEvent(e) }, { passive: true })
    document.addEventListener('touchend', () => { if (dragging) { dragging = false; trackEl.classList.remove('is-dragging') } })

    // hover 显示 thumb
    trackEl.addEventListener('mouseenter', () => { if (thumbEl) thumbEl.style.opacity = '1' })
    trackEl.addEventListener('mouseleave', () => { if (thumbEl && !dragging) thumbEl.style.opacity = '' })
  }

  // ===== 音量控制：点击弹出可拖动滑块 + 百分比 =====
  const volumeBtn = player.querySelector('.volume-btn')
  let volumePanel = null
  let volFill = null
  let volThumb = null
  let volPct = null

  function setVolume (v, persist = true) {
    state.volume = Math.max(0, Math.min(1, v))
    audio.volume = state.volume
    if (state.volume > 0) state.lastVolume = state.volume
    updateVolumeUI()
    if (persist) store.set('player:volume', state.volume)
  }

  function updateVolumeUI () {
    const pct = Math.round(state.volume * 100)
    // 音量按钮图标：静音时显示 mute 图标
    if (volumeBtn) {
      const muted = state.volume === 0
      volumeBtn.classList.toggle('is-muted', muted)
    }
    if (volFill) volFill.style.width = pct + '%'
    if (volThumb) volThumb.style.left = pct + '%'
    if (volPct) volPct.textContent = pct + '%'
  }

  function ensureVolumePanel () {
    if (volumePanel) return volumePanel
    volumePanel = document.createElement('div')
    volumePanel.className = 'volume-panel'
    volumePanel.innerHTML = volumePanelTemplate()
    document.body.appendChild(volumePanel)
    volFill = volumePanel.querySelector('.volume-slider-fill')
    volThumb = volumePanel.querySelector('.volume-slider-thumb')
    volPct = volumePanel.querySelector('.volume-pct')

    // 拖动逻辑
    const slider = volumePanel.querySelector('.volume-slider-track')
    let dragging = false
    function seekFromEvent (e) {
      const rect = slider.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      const ratio = Math.max(0, Math.min(1, x / rect.width))
      setVolume(ratio)
    }
    slider.addEventListener('mousedown', e => {
      dragging = true
      volumePanel.classList.add('is-dragging')
      seekFromEvent(e)
      e.preventDefault()
    })
    document.addEventListener('mousemove', e => { if (dragging) seekFromEvent(e) })
    document.addEventListener('mouseup', () => {
      if (dragging) { dragging = false; volumePanel.classList.remove('is-dragging') }
    })
    slider.addEventListener('touchstart', e => { dragging = true; volumePanel.classList.add('is-dragging'); seekFromEvent(e) }, { passive: true })
    document.addEventListener('touchmove', e => { if (dragging) seekFromEvent(e) }, { passive: true })
    document.addEventListener('touchend', () => { if (dragging) { dragging = false; volumePanel.classList.remove('is-dragging') } })

    // 点击面板外关闭
    document.addEventListener('click', e => {
      if (!volumePanel.classList.contains('open')) return
      if (volumePanel.contains(e.target) || volumeBtn.contains(e.target)) return
      volumePanel.classList.remove('open')
    })
    return volumePanel
  }

  function toggleVolumePanel () {
    const panel = ensureVolumePanel()
    updateVolumeUI()
    // 定位：出现在音量按钮正上方
    if (volumeBtn) {
      const r = volumeBtn.getBoundingClientRect()
      const pw = panel.offsetWidth || 200
      panel.style.left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left + r.width / 2 - pw / 2)) + 'px'
      panel.style.bottom = (window.innerHeight - r.top + 8) + 'px'
    }
    panel.classList.toggle('open')
  }

  if (volumeBtn) {
    volumeBtn.addEventListener('click', e => { e.stopPropagation(); toggleVolumePanel() })
    // 点击音量按钮 = 也支持直接静音/恢复（双击场景）——保留：单次点击只弹出面板
  }
  updateVolumeUI()

  // ===== 真实播放事件 =====
  // 播放/暂停事件同步按钮图标
  audio.addEventListener('play', () => setPlaying(true))
  audio.addEventListener('pause', () => setPlaying(false))
  // 播放进度：直接用 audio 的真实 currentTime 驱动进度条，不再模拟计时
  audio.addEventListener('timeupdate', () => {
    state.current = audio.currentTime
    updateProgress()
  })
  // 元数据就绪：写入真实总时长（决定进度条范围与结束位置）
  audio.addEventListener('durationchange', () => {
    const t = state.tracks[state.index]
    if (audio.duration && isFinite(audio.duration)) t.duration = audio.duration
    updateInfo()
  })
  // 一首自然放完：单曲循环则重播，否则按模式切下一首
  audio.addEventListener('ended', () => {
    if (state.mode === 'single') {
      audio.currentTime = 0
      play()
    } else {
      loadTrack(nextIndex(), true)
      renderList()
    }
  })
  // 资源加载失败（例如文件缺失）：停止高亮，避免状态卡在“播放中”
  audio.addEventListener('error', () => setPlaying(false))

  // ===== 播放列表面板 =====
  let listPanel = null
  function ensureListPanel () {
    if (listPanel) return listPanel
    listPanel = document.createElement('div')
    listPanel.className = 'playlist-panel'
    listPanel.innerHTML = playlistPanelTemplate(state.tracks.length)
    document.body.appendChild(listPanel)
    // 关闭：点击面板外
    document.addEventListener('click', e => {
      if (!listPanel.classList.contains('open')) return
      if (listPanel.contains(e.target) || listBtn.contains(e.target)) return
      listPanel.classList.remove('open')
    })
    return listPanel
  }
  function renderList () {
    if (!listPanel) return
    const body = listPanel.querySelector('.playlist-body')
    body.innerHTML = playlistItemsTemplate(state.tracks, state.index, formatTime)
    body.querySelectorAll('.playlist-item').forEach(el => {
      el.addEventListener('click', () => {
        const i = +el.dataset.index
        loadTrack(i, true)
        renderList()
      })
    })
  }
  function toggleList () {
    const panel = ensureListPanel()
    renderList()
    panel.classList.toggle('open')
  }

  // ===== 绑定按钮 =====
  if (prevBtn) prevBtn.addEventListener('click', prev)
  if (playBtn) playBtn.addEventListener('click', toggle)
  if (nextBtn) nextBtn.addEventListener('click', next)
  if (modeBtn) {
    modeBtn.addEventListener('click', cycleMode)
    renderMode()
  }
  if (listBtn) {
    // 把按钮上的静态计数（如 HTML 里的 18）同步为真实曲目数量
    const cntSpan = listBtn.querySelector('span')
    if (cntSpan && /^\d+$/.test(cntSpan.textContent)) cntSpan.textContent = state.tracks.length
    listBtn.addEventListener('click', e => { e.stopPropagation(); toggleList() })
  }

  // 数字键 ← → 空格（不与 input 冲突）
  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || ''
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (e.code === 'Space') { e.preventDefault(); toggle() }
    else if (e.code === 'ArrowLeft') { prev() }
    else if (e.code === 'ArrowRight') { next() }
  })

  // 初始化
  updateInfo()
  setPlaying(false)

  // 后台预读全部曲目时长（preload=metadata 只取文件头，不下载整曲），
  // 让播放列表与总时长在打开面板时就能显示真实数值
  ;(function prefillDurations () {
    state.tracks.forEach((t, i) => {
      const probe = new Audio(t.src)
      probe.preload = 'metadata'
      probe.addEventListener('durationchange', () => {
        if (probe.duration && isFinite(probe.duration)) {
          t.duration = probe.duration
          if (i === state.index) updateInfo()
          if (listPanel) renderList()
        }
      })
    })
  })()

  // 暴露给调试
  player._playerState = state
}

// =====================================================================
// 文章卡片 hover：完全交给 CSS
// 评论功能：已并入文章阅读器（initViewer 内的根作用域事件委托）
// =====================================================================

// =====================================================================
// 登录页
// =====================================================================

function initLogin () {
  const form = document.getElementById('login-form')
  if (!form) return

  const username = form.querySelector('input[type="text"]')
  const password = form.querySelector('input[type="password"]')
  const remember = form.querySelector('input[type="checkbox"]')
  const loginBtn = form.querySelector('button[type="submit"]')
  const registerBtn = form.querySelector('button[data-act="register"]')

  // 自定义复选框：checkbox 隐藏后保留可访问性，切换由 <label> 原生激活
  // 触发 input 的 click/change（仅一次），此处仅同步视觉 + 持久化偏好；
  // 注意不能在 label 的 click 里再手动取反，否则与原生激活叠加成“点一下等于没点”。
  if (remember) {
    const wrap = remember.closest('.checkbox-wrap') || remember.parentElement
    remember.style.position = 'absolute'
    remember.style.opacity = '0'
    remember.style.width = '1px'
    remember.style.height = '1px'
    // 恢复上次的勾选偏好（默认勾选）
    remember.checked = store.get('auth:remember-login', true) !== false
    function syncCheck () {
      const box = wrap.querySelector('.checkbox-box')
      if (box) box.dataset.checked = remember.checked ? '1' : '0'
      store.set('auth:remember-login', remember.checked)
    }
    remember.addEventListener('change', syncCheck)
    syncCheck()
  }

  // 密码可见切换：注入小图标
  if (password) {
    const row = password.closest('div')
    const toggle = document.createElement('span')
    toggle.className = 'pwd-toggle'
    toggle.title = '显示/隐藏密码'
    toggle.innerHTML = passwordToggleTemplate()
    toggle.addEventListener('click', () => {
      password.type = password.type === 'password' ? 'text' : 'password'
      toggle.classList.toggle('show', password.type === 'text')
    })
    row.appendChild(toggle)
  }

  // 提交
  form.addEventListener('submit', e => {
    e.preventDefault()
    if (!username.value.trim() || !password.value.trim()) {
      flashError(form, '请填写用户名和密码')
      return
    }
    if (password.value.length < 4) {
      flashError(form, '密码长度至少 4 位')
      return
    }
    // 模拟登录成功：记忆用户名，跳转到首页
    if (remember && remember.checked) {
      store.set('auth:remembered-username', username.value.trim())
    }
    store.set('auth:last-user', username.value.trim())
    if (loginBtn) {
      loginBtn.disabled = true
      loginBtn.textContent = '登录中…'
    }
    setTimeout(() => {
      window.location.href = 'index.html'
    }, 600)
  })

  // 注册：仅做提示（无后端）
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      flashError(form, '注册功能即将上线，敬请期待', 2400)
    })
  }

  // 忘记密码
  const forgot = form.querySelector('a[href="#"]')
  if (forgot && forgot.textContent.includes('忘记')) {
    forgot.addEventListener('click', e => {
      e.preventDefault()
      flashError(form, '请联系管理员重置密码', 2400)
    })
  }

  // 自动填充上次记住的用户名（仅当“自动登录”偏好为开启时）
  const remembered = store.get('auth:remembered-username', null)
  if (remember && remember.checked && remembered && username && !username.value) {
    username.value = remembered
  }

  function flashError (host, msg, ms = 1800) {
    let tip = host.querySelector('.form-tip')
    if (!tip) {
      tip = document.createElement('p')
      tip.className = 'form-tip'
      host.appendChild(tip)
    }
    tip.textContent = msg
    tip.classList.add('show')
    clearTimeout(tip._t)
    tip._t = setTimeout(() => tip.classList.remove('show'), ms)
  }
}

// =====================================================================
// 搜索弹出层（Ctrl+Shift+F）：站内模糊搜索 + 键盘导航
// =====================================================================
function initSearch () {
  const panel = document.querySelector('.search-panel')
  if (!panel) return

  const backdrop = panel.querySelector('[data-search-backdrop]')
  const input = panel.querySelector('.search-input')
  const list = panel.querySelector('[data-search-results]')

  let results = []
  let active = 0

  function render () {
    const q = input.value.trim()
    if (!q) {
      list.innerHTML = '<div class="search-empty">输入关键词，模糊搜索文章 / 目录 / 正文内容</div>'
      return
    }
    if (!results.length) {
      list.innerHTML = '<div class="search-empty">没有找到与「' + escapeHtml(q) + '」相关的内容</div>'
      return
    }
    list.innerHTML = results.map(r => searchResultItemTemplate(r, q)).join('')
    syncActive()
  }

  function syncActive () {
    const items = Array.from(list.querySelectorAll('.search-result'))
    items.forEach((el, i) => el.classList.toggle('active', i === active))
    const cur = items[active]
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' })
  }

  function open () {
    panel.classList.add('is-open')
    input.value = ''
    results = []
    active = 0
    render()
    requestAnimationFrame(() => input.focus())
  }

  function close () {
    panel.classList.remove('is-open')
    input.value = ''
    results = []
    active = 0
  }

  function openResult (r) {
    close()
    location.hash = buildArticleHash(r.article.id, r.article.cat)
  }

  input.addEventListener('input', () => {
    results = searchArticles(input.value, 12)
    active = 0
    render()
  })

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { close(); return }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!results.length) return
      e.preventDefault()
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length
      syncActive()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const r = results[active]
      if (r) {
        openResult(r)
      } else {
        const v = input.value.trim()
        close()
        if (v) location.href = 'search.html?q=' + encodeURIComponent(v)
      }
    }
  })

  list.addEventListener('click', e => {
    const item = e.target.closest('.search-result')
    if (!item || !item.dataset.id) return
    close()
    location.hash = buildArticleHash(item.dataset.id, item.dataset.cat)
  })

  // 鼠标悬停同步高亮项，键鼠混用体验一致
  list.addEventListener('mousemove', e => {
    const item = e.target.closest('.search-result')
    if (!item) return
    const items = Array.from(list.querySelectorAll('.search-result'))
    const i = items.indexOf(item)
    if (i >= 0 && i !== active) { active = i; syncActive() }
  })

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) close()
  })

  // 全局快捷键：Ctrl/Cmd + Shift + F
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
      e.preventDefault()
      open()
    }
  })

  // 页面内的搜索入口按钮（article-list 头部胶囊）
  document.addEventListener('click', e => {
    if (e.target.closest('[data-act="search"]')) open()
  })
}

// =====================================================================
// 搜索结果页：读取 ?q= 并渲染匹配文章卡片
// =====================================================================
function initSearchResults () {
  const root = document.querySelector('.results-root')
  if (!root) return
  const grid = root.querySelector('[data-results-grid]')
  const count = root.querySelector('[data-results-count]')
  const input = root.querySelector('.results-input')
  const form = root.querySelector('[data-results-form]')

  function cardHref (art) {
    return 'index.html#cat=' + encodeURIComponent(art.cat) + '&art=' + encodeURIComponent(art.id)
  }

  function render () {
    const q = input ? input.value.trim() : ''
    const list = q ? searchArticles(q) : []
    count.textContent = q
      ? `与「${q}」相关的文章 · 共 ${list.length} 篇`
      : '输入关键词开始搜索'
    if (!list.length) {
      grid.innerHTML = q
        ? '<div class="grid-empty">没有找到与「' + escapeHtml(q) + '」相关的内容，换个关键词试试吧～</div>'
        : '<div class="grid-empty">输入关键词，模糊搜索文章 / 目录 / 正文内容</div>'
      return
    }
    grid.innerHTML = list.map(r => articleCardTemplate(r.article, {
      href: cardHref(r.article),
      icons: ICONS
    })).join('')
  }

  if (input) {
    input.value = new URLSearchParams(location.search).get('q') || ''
    form && form.addEventListener('submit', e => {
      e.preventDefault()
      const v = input.value.trim()
      history.replaceState(null, '', location.pathname + (v ? '?q=' + encodeURIComponent(v) : ''))
      render()
    })
    input.addEventListener('input', () => {
      const v = input.value.trim()
      history.replaceState(null, '', location.pathname + (v ? '?q=' + encodeURIComponent(v) : ''))
      render()
    })
  }

  render()
}

// =====================================================================
// 启动
// =====================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // 站点配置（logo/主题色/社交/备案）先落地，随后再渲染页面内容
  await loadSiteConfig()
  applySiteConfig()
  initNav()
  blogList = initBlogList()
  initPlayer()
  initLogin()
  initViewer() // 阅读器与 hash 路由：依赖上方已初始化的列表渲染句柄
  initSearch() // 站内搜索弹出层（Ctrl+Shift+F）
  initSearchResults() // 搜索结果页（search.html?q=）
  // 调试钩子：?autoplay=1 自动播放；?vol=1 自动打开音量面板
  if (/[?&]autoplay=1\b/.test(location.search) || /(^|#|&)autoplay=1\b/.test(location.hash)) {
    setTimeout(() => {
      const btn = document.querySelector('.music-player #play-btn')
      if (btn) btn.click()
    }, 200)
  }
  if (/[?&]vol=1\b/.test(location.search) || /(^|#|&)vol=1\b/.test(location.hash)) {
    setTimeout(() => {
      const btn = document.querySelector('.music-player .volume-btn')
      if (btn) btn.click()
    }, 200)
  }
})
