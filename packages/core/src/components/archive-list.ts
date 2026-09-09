import { WcBase } from '../helpers/wc-base'
import { escapeHtml } from '../helpers/escape-html'
import type { Article } from '../types'

/**
 * 文章归档组件（按年/月时间线）
 *
 * 以 Hexo 博客 Archive 页为蓝本：
 *  - 按 年 → 月 → 文章 三级倒序归档，年份 / 月份分别展示篇数；
 *  - 月份可折叠，年份提供快捷跳转（桌面右侧导航 / 窄屏顶部胶囊）；
 *  - 年份分组渐进渲染，滚动到底部自动加载更早归档（IntersectionObserver）；
 *  - 全部加载后给出"已经到底啦 · 共 N 篇"收尾；
 *  - 行内展示日期、标题与分类，点击整行触发 article-select，由宿主决定跳转。
 *
 * 属性（JS property）：
 *   articles — Article[] 全部文章（按 date 倒序分组）
 *   catNames — Record<string, string> 分类 id → 展示名（可选）
 *
 * 事件：
 *   article-select — 点击文章行时触发，detail 为 { id: string, cat: string }
 */

interface ArchiveMonth {
  /** 'YYYY-MM' */
  key: string
  /** 月份序号 'MM' */
  month: string
  posts: Article[]
}

interface ArchiveYear {
  year: string
  months: ArchiveMonth[]
}

/** 默认渲染的年份组数，滚动后再按 _chunk 递增 */
const INITIAL_YEARS = 4
const LOAD_CHUNK_YEARS = 2

class ArchiveList extends WcBase {
  private _articles: Article[] = []
  private _catNames: Record<string, string> = {}
  private _years: ArchiveYear[] = []
  private _revealed = 0
  private _loading = false
  private _done = false
  private _observer: IntersectionObserver | null = null
  private _activeYear = ''
  private _scrollRaf = 0

  set articles (val: Article[]) {
    this._articles = val || []
    this._years = ArchiveList.groupByYearMonth(this._articles)
    this._revealed = 0
    this._loading = false
    this._done = false
    this._scheduleRender()
  }

  set catNames (val: Record<string, string>) {
    this._catNames = val || {}
    // 分类名只影响行内 chip，全量重建成本低，直接重绘
    if (this._years.length) {
      this._scheduleRender()
    }
  }

  /** 根据文章 date 字段（YYYY/MM/DD 或 YYYY-MM-DD）倒序分组 */
  static groupByYearMonth (articles: Article[]): ArchiveYear[] {
    const sorted = articles
      .filter(a => a && a.date)
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))

    const yearsMap = new Map<string, Map<string, Article[]>>()
    sorted.forEach(a => {
      const m = /^(\d{4})[-\/](\d{1,2})/.exec(String(a.date))
      if (!m) return
      const year = m[1]
      const month = m[2].padStart(2, '0')
      let months = yearsMap.get(year)
      if (!months) {
        months = new Map()
        yearsMap.set(year, months)
      }
      let posts = months.get(month)
      if (!posts) {
        posts = []
        months.set(month, posts)
      }
      posts.push(a)
    })

    const years: ArchiveYear[] = []
    yearsMap.forEach((months, year) => {
      const list: ArchiveMonth[] = []
      months.forEach((posts, month) => {
        list.push({ key: `${year}-${month}`, month, posts })
      })
      // 月份倒序
      list.sort((a, b) => b.key.localeCompare(a.key))
      years.push({ year, months: list })
    })
    // 年份倒序
    years.sort((a, b) => b.year.localeCompare(a.year))
    return years
  }

  // ------------------------------------------------------------------
  // 模板片段
  // ------------------------------------------------------------------

  private _yearHTML (y: ArchiveYear): string {
    const total = y.months.reduce((sum, m) => sum + m.posts.length, 0)
    const monthsHTML = y.months.map(m => this._monthHTML(y, m)).join('')
    return `
      <section class="tl-year" data-year="${escapeHtml(y.year)}">
        <header class="tl-year-bar">
          <h2 class="tl-year-num">${escapeHtml(y.year)}</h2>
          <span class="tl-year-cnt">${total} 篇</span>
          <span class="tl-year-line"></span>
          <span class="tl-year-mons">${y.months.length} 个月</span>
        </header>
        <div class="tl-months">${monthsHTML}</div>
      </section>
    `
  }

  private _monthHTML (y: ArchiveYear, m: ArchiveMonth): string {
    const rows = m.posts.map(p => this._postHTML(p)).join('')
    const mon = Number(m.month)
    return `
      <section class="tl-mon" data-month="${escapeHtml(m.key)}">
        <h3 class="tl-mon-h" role="button" tabindex="0" aria-expanded="true" data-act="mon-toggle">
          <span class="tl-mon-caret" aria-hidden="true"></span>
          <span class="tl-mon-name">${y.year} 年 ${mon} 月</span>
          <span class="tl-mon-cnt">${m.posts.length} 篇</span>
        </h3>
        <div class="tl-mon-body">${rows}</div>
      </section>
    `
  }

  private _postHTML (a: Article): string {
    const m = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/.exec(String(a.date))
    const dateTxt = m ? `${m[2].padStart(2, '0')}/${m[3].padStart(2, '0')}` : String(a.date || '')
    const catName = (this._catNames && this._catNames[a.cat]) || ''
    return `
      <a class="tl-post" href="#" data-id="${escapeHtml(a.id)}" data-cat="${escapeHtml(a.cat)}">
        <time class="tl-date">${escapeHtml(dateTxt)}</time>
        <span class="tl-title">${escapeHtml(a.title)}</span>
        ${catName ? `<span class="tl-cat">${escapeHtml(catName)}</span>` : ''}
      </a>
    `
  }

  /** 年份快捷导航按钮（右侧竖排 / 顶部胶囊共用） */
  private _yearBtnsHTML (): string {
    return this._years.map(y => this._yearBtnHTML(y, y.year === this._activeYear)).join('')
  }

  private _yearBtnHTML (y: ArchiveYear, active: boolean): string {
    const total = y.months.reduce((sum, m) => sum + m.posts.length, 0)
    return `<button type="button" class="year-btn${active ? ' active' : ''}" data-year-btn="${escapeHtml(y.year)}">${escapeHtml(y.year)}<em>${total}</em></button>`
  }

  private _totalStats (): string {
    if (!this._years.length) return '暂无文章'
    const posts = this._years.reduce((s, y) => s + y.months.reduce((a, b) => a + b.posts.length, 0), 0)
    return `归档 · 共 ${posts} 篇 · ${this._years.length} 年`
  }

  // ------------------------------------------------------------------
  // 渲染
  // ------------------------------------------------------------------

  protected render (): string {
    const iconHome = '/images/extracted/home/iconfont-shouye@2x.png'
    return `
      <style>
        :host { display: contents; }
        .arch-top {
          display: flex;
          align-items: center;
          padding: 40px 59px 16px;
        }
        @media (max-width: 700px) { .arch-top { padding: 32px 20px 12px; } }
        @media (max-width: 480px) { .arch-top { padding: 28px 14px 10px; } }
        .arch-home-icon {
          display: inline-block;
          width: 14px; height: 14px; flex-shrink: 0;
          background: var(--brand-primary, #eb4f38);
          mask: url(${iconHome}) center/contain no-repeat;
          -webkit-mask: url(${iconHome}) center/contain no-repeat;
        }
        .arch-home-link {
          margin-left: 8px; font-size: 14px; letter-spacing: 0.02em;
          color: #c9c6c2; text-decoration: none; transition: color 0.2s;
        }
        .arch-home-link:hover { color: #ffffff; }
        .arch-sep { margin: 0 8px; font-size: 12px; color: #5d5a59; }
        .arch-crumb {
          font-size: 14px; font-weight: 500; letter-spacing: 0.02em;
          color: #ffffff; white-space: nowrap;
        }
        .arch-crumb small { margin-left: 8px; font-size: 12px; font-weight: 400; color: #9e9d99; letter-spacing: 0.04em; }
        .arch-divider {
          margin-left: 24px; height: 1px; min-width: 20px; flex: 1;
          background: linear-gradient(90deg, #3c3936, transparent);
        }
        .arch-area {
          flex: 1; min-height: 0; overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: #444 transparent;
        }
        .arch-area::-webkit-scrollbar { width: 6px; }
        .arch-area::-webkit-scrollbar-track { background: transparent; }
        .arch-area::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
        .arch-area::-webkit-scrollbar-thumb:hover { background: #555; }
        .arch-frame {
          margin: 0 auto;
          padding: 30px 48px 26px;
          container-type: inline-size;
        }
        @media (max-width: 700px) { .arch-frame { padding: 20px 20px 18px; } }
        @media (max-width: 480px) { .arch-frame { padding: 16px 14px 14px; } }

        .arch-main { display: flex; gap: 44px; align-items: flex-start; }

        /* 时间线 */
        .tl { flex: 1; min-width: 0; }
        .tl-year {
          margin-bottom: 18px;
          background: rgba(15, 14, 13, 0.55);
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          overflow: hidden;
        }
        .tl-year-bar {
          display: flex; align-items: baseline; gap: 10px;
          padding: 13px 16px 11px;
          border-bottom: 1px solid #1f1e1d;
          background: rgba(255, 255, 255, 0.02);
        }
        .tl-year-num {
          font-size: 19px; font-weight: 600; line-height: 1;
          color: var(--brand-primary, #eb4f38);
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.02em;
        }
        .tl-year-cnt { font-size: 12px; color: #9e9d99; white-space: nowrap; }
        .tl-year-line {
          flex: 1; height: 1px; min-width: 16px;
          background: linear-gradient(90deg, rgba(255,255,255,0.10), transparent);
        }
        .tl-year-mons { font-size: 11px; color: #5d5a59; letter-spacing: 0.06em; white-space: nowrap; }

        /* 月份 */
        .tl-mon + .tl-mon { border-top: 1px solid #1c1b1a; }
        .tl-mon-h {
          display: flex; align-items: center; gap: 8px;
          margin: 0; padding: 10px 16px;
          cursor: pointer; user-select: none;
          font-size: 13px; font-weight: 500; color: #c9c6c2;
          letter-spacing: 0.04em;
          -webkit-tap-highlight-color: transparent;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .tl-mon-h:hover, .tl-mon-h:focus-visible {
          background: rgba(255, 255, 255, 0.03);
          color: #ffffff;
          outline: none;
        }
        .tl-mon-caret {
          width: 0; height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid #5d5a59;
          transition: transform 0.22s ease;
          flex-shrink: 0;
        }
        .tl-mon-h[aria-expanded="false"] .tl-mon-caret { transform: rotate(-90deg); }
        .tl-mon-cnt {
          margin-left: auto; font-size: 11px; font-weight: 400;
          color: #6b6b6b; white-space: nowrap;
        }
        .tl-mon-body { padding: 0 8px 8px; }
        .tl-mon-h[aria-expanded="false"] + .tl-mon-body { display: none; }

        /* 文章行 */
        .tl-post {
          display: flex; align-items: baseline; gap: 12px;
          padding: 7px 8px; border-radius: 4px;
          color: #d8d6d3; text-decoration: none;
          transition: background 0.18s ease, color 0.18s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .tl-post:hover { background: rgba(235, 79, 56, 0.07); }
        .tl-date {
          flex-shrink: 0; min-width: 44px;
          font-size: 12px; color: #777672;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.03em;
          transition: color 0.18s ease;
        }
        .tl-title {
          flex: 1; min-width: 0;
          font-size: 14px; line-height: 1.55;
          color: #f2f2f2;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          transition: color 0.18s ease;
        }
        .tl-post:hover .tl-title { color: var(--brand-primary, #eb4f38); }
        .tl-cat {
          flex-shrink: 0;
          max-width: 30%;
          padding: 1px 7px;
          font-size: 11px; line-height: 1.6;
          color: #9e9d99;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #2a2a2a; border-radius: 3px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .tl-post:hover .tl-cat {
          color: #c9c6c2; border-color: rgba(235, 79, 56, 0.4);
        }
        @media (max-width: 480px) {
          .tl-cat { display: none; }
        }

        .arch-empty {
          padding: 70px 20px; text-align: center;
          color: #6b6b6b; font-size: 14px;
        }

        /* 年份快捷导航：桌面右侧竖排 */
        .year-nav { display: none; width: 132px; flex-shrink: 0; }
        .year-nav-title {
          display: block; padding: 2px 6px 10px;
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: #5d5a59;
        }
        .year-nav-list {
          position: sticky; top: 6px;
          display: flex; flex-direction: column; gap: 4px;
          max-height: calc(100vh - 220px); overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: #444 transparent;
        }
        .year-nav .year-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 10px;
          border: 1px solid transparent; border-radius: 5px;
          background: transparent;
          font-family: inherit; font-size: 13px; color: #9e9d99;
          cursor: pointer; text-align: left;
          transition: color 0.2s, background 0.2s, border-color 0.2s;
        }
        .year-btn em {
          font-style: normal; margin-left: auto;
          min-width: 18px; padding: 0 4px;
          font-size: 10px; line-height: 1.7; text-align: center;
          color: #5d5a59; background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }
        .year-nav .year-btn:hover { color: #ffffff; background: rgba(255,255,255,0.04); }
        .year-nav .year-btn.active {
          color: var(--brand-primary, #eb4f38);
          background: rgba(235, 79, 56, 0.10);
          border-color: rgba(235, 79, 56, 0.35);
        }
        .year-nav .year-btn.active em { color: #eb4f38; background: rgba(235, 79, 56, 0.12); }

        /* 年份快捷导航：窄屏顶部胶囊 */
        .top-chips { display: none; }
        .top-chips .year-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px;
          border: 1px solid #2a2a2a; border-radius: 999px;
          background: rgba(255,255,255,0.03);
          font-family: inherit; font-size: 12px; color: #9e9d99;
          cursor: pointer; white-space: nowrap;
          transition: color 0.2s, background 0.2s, border-color 0.2s;
        }
        .top-chips .year-btn em {
          min-width: 0; padding: 0; background: transparent;
          font-size: 10px; color: #6b6b6b;
        }
        .top-chips .year-btn:hover { color: #ffffff; border-color: #3c3936; }
        .top-chips .year-btn.active {
          color: #eb4f38;
          background: rgba(235, 79, 56, 0.12);
          border-color: rgba(235, 79, 56, 0.45);
        }
        .top-chips .year-btn.active em { color: #eb4f38; }

        @container (min-width: 760px) {
          .year-nav { display: block; }
          .top-chips { display: none; }
        }
        @container (max-width: 759px) {
          .top-chips { display: flex; flex-wrap: nowrap; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
          .top-chips::-webkit-scrollbar { display: none; }
          .tl-post { flex-wrap: wrap; row-gap: 2px; }
        }

        .arch-status {
          padding: 14px 0 10px; text-align: center;
          font-size: 12px; color: #6b6b6b; letter-spacing: 0.04em;
        }
        .arch-status[data-state="hidden"] { display: none; }
        .arch-status .arch-spinner {
          display: inline-block; width: 14px; height: 14px;
          margin-right: 6px; vertical-align: -2px;
          border: 2px solid rgba(255,255,255,0.12);
          border-top-color: var(--brand-primary, #eb4f38);
          border-radius: 50%;
          animation: arch-rotate 0.7s linear infinite;
        }
        @keyframes arch-rotate { to { transform: rotate(360deg); } }
      </style>

      <div class="arch-top">
        <span class="arch-home-icon"></span>
        <a href="./" class="arch-home-link">首页</a>
        <span class="arch-sep">&gt;</span>
        <span class="arch-crumb" data-part="crumb">${escapeHtml(this._totalStats())}</span>
        <div class="arch-divider"></div>
      </div>

      <div class="arch-area" data-part="area">
        <div class="arch-frame">
          <div class="top-chips" data-part="topchips" role="tablist" aria-label="按年份跳转">${this._yearBtnsHTML()}</div>
          <div class="arch-main">
            <div class="tl" data-part="tl"></div>
            <nav class="year-nav" data-part="yearnav" aria-label="按年份跳转">
              <span class="year-nav-title">年份归档</span>
              <div class="year-nav-list" data-part="yearnav-list">${this._yearBtnsHTML()}</div>
            </nav>
          </div>
          <div class="arch-status" data-part="status" data-state="ready"></div>
        </div>
      </div>
    `
  }

  // ------------------------------------------------------------------
  // 生命周期
  // ------------------------------------------------------------------

  protected mounted (): void {
    this._setupAreaEvents()
    this._setupNavEvents()
    this._scheduleRender()
  }

  private _resetAndRender (): void {
    this._revealed = 0
    this._loading = false
    this._done = false
    this._activeYear = this._years.length ? this._years[0].year : ''

    const tl = this.$('[data-part="tl"]') as HTMLElement | null
    if (!tl) return
    tl.innerHTML = ''
    this._refreshCrumb()

    if (!this._years.length) {
      tl.innerHTML = '<div class="arch-empty">归档空空如也，快去发布第一篇文章吧～</div>'
      const status = this.$('[data-part="status"]') as HTMLElement | null
      if (status) status.dataset.state = 'hidden'
      this._renderYearNav()
      return
    }

    const initial = this._years.slice(0, INITIAL_YEARS)
    tl.innerHTML = initial.map(y => this._yearHTML(y)).join('')
    this._revealed = initial.length
    this._done = this._revealed >= this._years.length

    const status = this.$('[data-part="status"]') as HTMLElement | null
    if (status) {
      status.dataset.state = this._done ? 'done' : 'ready'
      status.textContent = this._done ? `已经到底啦 · 共 ${this._totalCount()} 篇` : ''
    }

    this._renderYearNav()
    this._observeStatus()
    this._scrollSpy()

    // 首次渲染内容不足一屏时自动续载
    if (!this._done) {
      requestAnimationFrame(() => this._autoFill())
    }
  }

  /** 防重入：将渲染推到下一帧，避免在 Vue/React 的 setter 链中触发同步递归 */
  private _renderRaf = 0
  private _scheduleRender (): void {
    if (this._renderRaf) return
    this._renderRaf = requestAnimationFrame(() => {
      this._renderRaf = 0
      this._resetAndRender()
    })
  }

  private _totalCount (): number {
    return this._years.reduce((s, y) => s + y.months.reduce((a, b) => a + b.posts.length, 0), 0)
  }

  private _refreshCrumb (): void {
    const crumb = this.$('[data-part="crumb"]') as HTMLElement | null
    if (crumb) crumb.textContent = this._totalStats()
  }

  private _refreshNav (): void {
    const active = this._activeYear
    const btns = this.$$<HTMLElement>('[data-part="yearnav"] .year-btn, [data-part="topchips"] .year-btn')
    btns.forEach(btn => {
      btn.classList.toggle('active', (btn.dataset as Record<string, string>).yearBtn === active)
    })
  }

  /** 重建年份快捷导航按钮（桌面右侧竖排 + 窄屏顶部胶囊）。按钮仅在 render() 初始为空时生成过一次，数据到位后需在此重建。 */
  private _renderYearNav (): void {
    const html = this._years.map(y => this._yearBtnHTML(y, y.year === this._activeYear)).join('')
    const yearList = this.$('[data-part="yearnav-list"]')
    if (yearList) yearList.innerHTML = html
    const topChips = this.$('[data-part="topchips"]')
    if (topChips) topChips.innerHTML = html
  }

  private _observeStatus (): void {
    if (this._observer) this._observer.disconnect()
    const area = this.$('[data-part="area"]') as HTMLElement | null
    const status = this.$('[data-part="status"]') as HTMLElement | null
    if (!area || !status) return
    this._observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) this._loadMore()
      })
    }, { root: area, rootMargin: '120px 0px' })
    this._observer.observe(status)
  }

  private _loadMore (): void {
    if (this._loading || this._done) return
    const rest = this._years.slice(this._revealed)
    if (!rest.length) {
      this._done = true
      this._finishStatus()
      return
    }

    this._loading = true
    const status = this.$('[data-part="status"]') as HTMLElement | null
    if (status) {
      status.dataset.state = 'loading'
      status.innerHTML = '<span class="arch-spinner"></span>正在加载更早的归档…'
    }

    const tl = this.$('[data-part="tl"]') as HTMLElement | null
    setTimeout(() => {
      const chunk = rest.slice(0, LOAD_CHUNK_YEARS)
      if (tl) tl.insertAdjacentHTML('beforeend', chunk.map(y => this._yearHTML(y)).join(''))
      this._revealed += chunk.length
      this._loading = false

      if (this._revealed >= this._years.length) {
        this._done = true
        this._finishStatus()
      } else {
        if (status) {
          status.dataset.state = 'ready'
          status.textContent = ''
        }
        // 内容仍未撑满可视区时继续补载
        const area = this.$('[data-part="area"]')
        if (area && status && status.getBoundingClientRect().bottom <= area.getBoundingClientRect().bottom) {
          this._loadMore()
        }
      }
    }, 200)
  }

  private _finishStatus (): void {
    const status = this.$('[data-part="status"]') as HTMLElement | null
    if (status) {
      status.dataset.state = 'done'
      status.textContent = `已经到底啦 · 共 ${this._totalCount()} 篇`
    }
  }

  private _autoFill (): void {
    if (this._done || this._loading) return
    const area = this.$('[data-part="area"]')
    const status = this.$('[data-part="status"]')
    if (area && status && status.getBoundingClientRect().bottom <= area.getBoundingClientRect().bottom) {
      this._loadMore()
    }
  }

  // ------------------------------------------------------------------
  // 交互
  // ------------------------------------------------------------------

  private _setupAreaEvents (): void {
    const area = this.$('[data-part="area"]') as HTMLElement | null
    if (!area) return

    area.addEventListener('click', (e: Event) => {
      if (e.defaultPrevented) return
      const target = e.target as HTMLElement

      // 月份折叠/展开
      const toggle = target.closest('[data-act="mon-toggle"]') as HTMLElement | null
      if (toggle) {
        e.preventDefault()
        const expanded = toggle.getAttribute('aria-expanded') !== 'false'
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true')
        return
      }

      // 文章行点击 → 交由宿主跳转
      const post = target.closest('.tl-post') as HTMLElement | null
      if (post) {
        const data = post.dataset as Record<string, string>
        e.preventDefault()
        if (data.id) this.emit('article-select', { id: data.id, cat: data.cat || '' })
      }
    })

    area.addEventListener('keydown', (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key !== 'Enter' && e.key !== ' ') return
      const toggle = target.closest('[data-act="mon-toggle"]') as HTMLElement | null
      if (!toggle) return
      e.preventDefault()
      const expanded = toggle.getAttribute('aria-expanded') !== 'false'
      toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true')
    })
  }

  private _setupNavEvents (): void {
    const area = this.$('[data-part="area"]') as HTMLElement | null
    if (!area) return

    area.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-year-btn]') as HTMLElement | null
      if (!btn) return
      e.preventDefault()
      const year = (btn.dataset as Record<string, string>).yearBtn
      if (!year) return
      this._jumpToYear(year)
    })
  }

  private _jumpToYear (year: string): void {
    // 尚未渲染的年份：先把更早归档全部载入，再定位
    if (this._revealed < this._years.length && !this._loading) {
      const needAll = this._years[this._revealed].year <= year
      if (needAll) {
        this._loading = true
        const tl = this.$('[data-part="tl"]') as HTMLElement | null
        const rest = this._years.slice(this._revealed)
        if (tl) tl.insertAdjacentHTML('beforeend', rest.map(y => this._yearHTML(y)).join(''))
        this._revealed = this._years.length
        this._loading = false
        this._done = true
        this._finishStatus()
      }
    }

    const area = this.$('[data-part="area"]') as HTMLElement | null
    const section = this.shadow.querySelector<HTMLElement>(`.tl-year[data-year="${CSS.escape(year)}"]`)
    if (!area || !section) return
    const top = section.getBoundingClientRect().top - area.getBoundingClientRect().top + area.scrollTop
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    area.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
  }

  /** 滚动过程中高亮当前年份 */
  private _scrollSpy (): void {
    const area = this.$('[data-part="area"]') as HTMLElement | null
    if (!area) return
    area.addEventListener('scroll', () => {
      if (this._scrollRaf) return
      this._scrollRaf = requestAnimationFrame(() => {
        this._scrollRaf = 0
        const top = area.scrollTop + 24
        const bottom = area.scrollTop + area.clientHeight * 0.55
        let active = ''
        this.shadow.querySelectorAll<HTMLElement>('.tl-year').forEach(section => {
          const yTop = section.offsetTop
          if (yTop <= top) active = (section.dataset as Record<string, string>).year || ''
        })
        if (!active) active = this._years.length ? this._years[0].year : ''
        if (active !== this._activeYear) {
          this._activeYear = active
          this._refreshNav()
        }
        // 滚动到底并存在未加载年份 → 触底加载
        if (!this._done && !this._loading) {
          const status = this.$('[data-part="status"]') as HTMLElement | null
          if (status && status.getBoundingClientRect().bottom <= bottom) this._loadMore()
        }
      })
    }, { passive: true })
  }
}

if (!customElements.get('archive-list')) {
  customElements.define('archive-list', ArchiveList)
}

export { ArchiveList }
