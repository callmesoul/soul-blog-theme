import { WcBase } from '../helpers/wc-base'
import { escapeHtml } from '../helpers/escape-html'
import type { Article } from '../types'

/**
 * 文章列表组件
 *
 * 属性（JS property）：
 *   articles  — Article[] 完整文章列表（用于分页）
 *   activeCat — 当前活动目录 id
 *   icons     — 图标路径映射 { eye, comment, calendar, home }
 *   catName   — 当前目录名称
 *   totalCount — 列表总数
 *
 * 事件：
 *   article-select — 点击卡片时触发，detail 为 { id: string }
 */
class ArticleList extends WcBase {
  static get observedAttributes (): string[] {
    return ['active-cat']
  }

  private _articles: Article[] = []
  private _icons: Record<string, string> = {}
  private _pageSize = 6
  private _shown = 0
  private _done = false
  private _loading = false
  private _observer: IntersectionObserver | null = null
  private _catName = '全部文章'
  private _totalCount = 0

  set articles (val: Article[]) {
    this._articles = val
    this._resetList()
    this._renderPage()
    this._loadMore()
  }
  set icons (val: Record<string, string>) {
    this._icons = val
  }
  set catName (val: string) {
    this._catName = val
  }
  set totalCount (val: number) {
    this._totalCount = val
  }

  /** 导出卡片模板供 main.js 过渡期使用 */
  static articleCardTemplate (article: Article, { href, icons }: { href: string, icons: Record<string, string> }): string {
    return `
      <a class="article-card" href="${escapeHtml(href)}" data-id="${escapeHtml(article.id)}" data-cat="${escapeHtml(article.cat)}">
        <img class="card-thumb" src="${escapeHtml(article.cover)}" alt="" loading="lazy">
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(article.title)}</h3>
          <p class="card-desc">${escapeHtml(article.summary)}</p>
          <div class="card-meta">
            <span class="meta-item"><img class="meta-icon" src="${escapeHtml(icons.eye)}" alt="">${escapeHtml(article.views)}</span>
            <span class="meta-item"><img class="meta-icon" src="${escapeHtml(icons.comment)}" alt="">${escapeHtml(article.commentCount)}</span>
            <span class="meta-item" style="margin-left:auto;"><img class="meta-icon" src="${escapeHtml(icons.calendar)}" alt="">${escapeHtml(article.date)}</span>
          </div>
        </div>
      </a>
    `
  }

  protected render (): string {
    const icons = this._icons
    const iconHome = icons.home || '/images/extracted/home/iconfont-shouye@2x.png'

    return `
      <style>
        :host {
          display: contents;
        }
        .list-header {
          display: flex;
          align-items: center;
          padding: 40px 59px 20px;
        }
        @media (max-width: 700px) {
          .list-header { padding: 40px 20px 20px; }
        }
        @media (max-width: 480px) {
          .list-header { padding: 40px 14px 20px; }
        }
        .home-icon {
          display: inline-block;
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          background: var(--brand-primary, #eb4f38);
          mask: url(${iconHome}) center/contain no-repeat;
          -webkit-mask: url(${iconHome}) center/contain no-repeat;
        }
        .home-link {
          margin-left: 8px;
          font-size: 14px;
          letter-spacing: 0.02em;
          color: #c9c6c2;
          text-decoration: none;
          transition: color 0.2s;
        }
        .home-link:hover {
          color: #ffffff;
        }
        .crumb-sep {
          margin: 0 8px;
          font-size: 12px;
          color: #5d5a59;
        }
        .crumb-current {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: #ffffff;
        }
        .header-divider {
          margin-left: 36px;
          height: 1px;
          min-width: 20px;
          flex: 1;
          background: linear-gradient(90deg, #3c3936, transparent);
        }
        .search-trigger {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-left: 14px;
          padding: 7px 11px;
          border: 1px solid #2A2A2A;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          color: #9E9D99;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          letter-spacing: 0.02em;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .search-trigger:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #FFFFFF;
          border-color: rgba(var(--brand-rgb), 0.5);
        }
        .search-trigger:active { transform: scale(0.97); }
        .search-trigger svg { display: block; color: #6B6B6B; transition: color 0.2s ease; }
        .search-trigger:hover svg { color: var(--brand-primary); }
        .search-trigger-keys {
          display: inline-flex;
          gap: 3px;
          margin-left: 2px;
        }
        .search-trigger kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border: 1px solid #3C3936;
          border-bottom-width: 2px;
          border-radius: 4px;
          background: #1d1d1d;
          color: #9E9D99;
          font-family: inherit;
          font-size: 10px;
          line-height: 1;
          letter-spacing: 0.05em;
        }
        .article-area {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #444 transparent;
          padding: 54px 59px 48px;
        }
        .article-area::-webkit-scrollbar {
          width: 6px;
        }
        .article-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .article-area::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 3px;
        }
        .article-area::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        @media (max-width: 700px) {
          .article-area { padding: 54px 20px 48px; }
        }
        @media (max-width: 480px) {
          .article-area { padding: 54px 14px 48px; }
        }
        .article-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .article-card {
          display: flex;
          flex-direction: column;
          background: #0f0e0d;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          overflow: hidden;
          text-decoration: none;
          transition: border-color 0.2s, transform 0.2s;
          cursor: pointer;
        }
        .article-card:hover {
          border-color: #eb4f38;
          transform: translateY(-2px);
        }
        .card-thumb {
          width: 100%;
          height: 160px;
          object-fit: cover;
        }
        .card-body {
          padding: 14px 16px 16px;
        }
        .card-title {
          font-size: 15px;
          font-weight: 500;
          line-height: 1.5;
          color: #ffffff;
          margin: 0 0 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-desc {
          font-size: 13px;
          line-height: 1.5;
          color: #9e9d99;
          margin: 0 0 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-meta {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 12px;
          color: #9e9d99;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .meta-icon {
          display: block;
          width: 16px;
          height: 12px;
          object-fit: contain;
          filter: brightness(0) invert(0.62);
          transition: filter 0.2s ease;
        }
        .article-card:hover .card-meta .meta-icon {
          filter: brightness(0) invert(0.78);
        }
        .list-status {
          text-align: center;
          padding: 16px;
          font-size: 13px;
          color: #6b6b6b;
        }
        .list-status[data-state="hidden"] {
          display: none;
        }
        .grid-empty {
          text-align: center;
          padding: 48px 20px;
          color: #6b6b6b;
          font-size: 14px;
        }
      </style>
      <div class="list-header">
        <span class="home-icon"></span>
        <a href="index.html" class="home-link">首页</a>
        <span class="crumb-sep">&gt;</span>
        <span class="crumb-current" data-part="crumb">${escapeHtml(this._catName)}${this._totalCount ? ' · 共 ' + this._totalCount + ' 篇' : ''}</span>
        <div class="header-divider"></div>
        <button class="search-trigger" type="button" data-act="search" aria-label="搜索（Ctrl+Shift+F）">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>
          </svg>
          <span>搜索</span>
          <span class="search-trigger-keys"><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>F</kbd></span>
        </button>
      </div>

      <div class="article-area" data-part="area">
        <div class="article-grid" data-part="grid" aria-live="polite"></div>
        <div class="list-status" data-part="status" data-state="ready"></div>
      </div>
    `
  }

  protected mounted (): void {
    this._setupIntersectionObserver()
    this._setupCardClick()
    this._resetList()
    this._renderPage()
    // 初始内容可能未撑满可视区，触发首次滚动加载
    this._loadMore()
  }

  private _setupIntersectionObserver (): void {
    // 清理旧的 observer
    if (this._observer) {
      this._observer.disconnect()
    }

    const area = this.$('[data-part="area"]') as HTMLElement | null
    const status = this.$('[data-part="status"]') as HTMLElement | null
    if (!status) return

    this._observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) this._loadMore()
      })
    }, { root: area, rootMargin: '0px' })
    this._observer.observe(status)
  }

  private _setupCardClick (): void {
    const grid = this.$('[data-part="grid"]') as HTMLElement | null
    if (!grid) return

    grid.addEventListener('click', (e: Event) => {
      if (e.defaultPrevented) return
      const card = (e.target as HTMLElement).closest('.article-card') as HTMLElement | null
      if (!card) return
      const id = (card.dataset as Record<string, string>).id
      if (id) {
        e.preventDefault()
        this.emit('article-select', { id })
      }
    })
  }

  private _resetList (): void {
    this._shown = 0
    this._loading = false
    this._done = false
  }

  private _renderPage (): void {
    const grid = this.$('[data-part="grid"]') as HTMLElement | null
    const status = this.$('[data-part="status"]') as HTMLElement | null
    if (!grid) return

    // 按当前 active-cat 过滤
    const activeCat = this.getAttribute('active-cat') || 'all'
    const filtered = activeCat === 'all'
      ? this._articles.slice()
      : this._articles.filter(a => a.cat === activeCat)
    // 按时间倒序
    const sorted = filtered.sort((a, b) => b.date.localeCompare(a.date))

    if (!sorted.length) {
      grid.innerHTML = '<div class="grid-empty">该目录下暂时没有文章，去其他目录逛逛吧～</div>'
      if (status) status.dataset.state = 'hidden'
      return
    }

    const page = sorted.slice(0, this._pageSize)
    grid.innerHTML = page.map(a => {
      const icons = this._icons
      return `
        <a class="article-card" href="#" data-id="${escapeHtml(a.id)}" data-cat="${escapeHtml(a.cat)}">
          <img class="card-thumb" src="${escapeHtml(a.cover)}" alt="" loading="lazy">
          <div class="card-body">
            <h3 class="card-title">${escapeHtml(a.title)}</h3>
            <p class="card-desc">${escapeHtml(a.summary)}</p>
            <div class="card-meta">
              <span class="meta-item"><img class="meta-icon" src="${escapeHtml(icons.eye)}" alt="">${escapeHtml(a.views)}</span>
              <span class="meta-item"><img class="meta-icon" src="${escapeHtml(icons.comment)}" alt="">${escapeHtml(a.commentCount)}</span>
              <span class="meta-item" style="margin-left:auto;"><img class="meta-icon" src="${escapeHtml(icons.calendar)}" alt="">${escapeHtml(a.date)}</span>
            </div>
          </div>
        </a>
      `
    }).join('')

    this._shown = Math.min(this._pageSize, sorted.length)
    this._done = this._shown >= sorted.length

    // 更新 crumb
    const crumb = this.$('[data-part="crumb"]') as HTMLElement | null
    if (crumb) {
      crumb.textContent = this._catName + ' · 共 ' + sorted.length + ' 篇'
    }

    if (status) {
      if (this._done) {
        status.dataset.state = 'done'
        status.textContent = '已经到底啦 · 共 ' + sorted.length + ' 篇'
      } else {
        status.dataset.state = 'ready'
        status.textContent = ''
      }
    }
  }

  private _loadMore (): void {
    if (this._loading || this._done) return

    const activeCat = this.getAttribute('active-cat') || 'all'
    const filtered = activeCat === 'all'
      ? this._articles.slice()
      : this._articles.filter(a => a.cat === activeCat)
    const sorted = filtered.sort((a, b) => b.date.localeCompare(a.date))
    const rest = sorted.slice(this._shown)
    if (!rest.length) {
      this._done = true
      const status = this.$('[data-part="status"]') as HTMLElement | null
      if (status) {
        status.dataset.state = 'done'
        status.textContent = '已经到底啦 · 共 ' + sorted.length + ' 篇'
      }
      return
    }

    this._loading = true
    const status = this.$('[data-part="status"]') as HTMLElement | null
    if (status) {
      status.dataset.state = 'loading'
      status.innerHTML = '<span class="list-spinner"></span>正在加载更多…'
    }

    const grid = this.$('[data-part="grid"]') as HTMLElement | null
    setTimeout(() => {
      const more = rest.slice(0, this._pageSize)
      const icons = this._icons
      const html = more.map(a => `
        <a class="article-card" href="#" data-id="${escapeHtml(a.id)}" data-cat="${escapeHtml(a.cat)}">
          <img class="card-thumb" src="${escapeHtml(a.cover)}" alt="" loading="lazy">
          <div class="card-body">
            <h3 class="card-title">${escapeHtml(a.title)}</h3>
            <p class="card-desc">${escapeHtml(a.summary)}</p>
            <div class="card-meta">
              <span class="meta-item"><img class="meta-icon" src="${escapeHtml(icons.eye)}" alt="">${escapeHtml(a.views)}</span>
              <span class="meta-item"><img class="meta-icon" src="${escapeHtml(icons.comment)}" alt="">${escapeHtml(a.commentCount)}</span>
              <span class="meta-item" style="margin-left:auto;"><img class="meta-icon" src="${escapeHtml(icons.calendar)}" alt="">${escapeHtml(a.date)}</span>
            </div>
          </div>
        </a>
      `).join('')
      if (grid) grid.insertAdjacentHTML('beforeend', html)
      this._shown += more.length
      this._loading = false
      if (this._shown >= sorted.length) {
        this._done = true
        if (status) {
          status.dataset.state = 'done'
          status.textContent = '已经到底啦 · 共 ' + sorted.length + ' 篇'
        }
      } else {
        if (status) {
          status.dataset.state = 'ready'
          status.textContent = ''
        }
        // 如果状态元素仍然可见（内容未撑满可视区），继续加载下一页
        const area = this.$('[data-part="area"]')
        if (area && status && status.getBoundingClientRect().bottom <= area.getBoundingClientRect().bottom) {
          this._loadMore()
        }
      }
    }, 250)
  }
}

if (!customElements.get('article-list')) {
  customElements.define('article-list', ArticleList)
}

export { ArticleList }