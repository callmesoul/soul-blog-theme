import { WcBase } from '../helpers/wc-base'
import { escapeHtml } from '../helpers/escape-html'
import { searchArticles, type SearchResult } from '../helpers/search'
import type { Article } from '../types'

/**
 * 高亮标题中与搜索词命中的字符
 */
function highlightMatch (text: string, query: string): string {
  const t = String(text)
  const q = String(query || '').trim().toLowerCase()
  if (!q) return escapeHtml(t)

  const lower = t.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx >= 0) {
    return escapeHtml(t.slice(0, idx)) +
      '<b class="search-hl">' + escapeHtml(t.slice(idx, idx + q.length)) + '</b>' +
      escapeHtml(t.slice(idx + q.length))
  }

  const marks = new Set<number>()
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i].toLowerCase() === q[qi]) { marks.add(i); qi++ }
  }
  if (qi < q.length) return escapeHtml(t)

  let out = ''
  for (let i = 0; i < t.length; i++) {
    const ch = escapeHtml(t[i])
    out += marks.has(i) ? '<b class="search-hl">' + ch + '</b>' : ch
  }
  return out
}

/**
 * 搜索弹出层组件
 *
 * 属性：
 *   articles — Article[] 搜索数据源（JS property）
 *
 * 事件：
 *   search-select — 选择结果时触发，detail 为 { id: string, cat: string }
 */
class SearchPanel extends WcBase {
  static get observedAttributes (): string[] {
    return []
  }

  private _articles: Article[] = []
  private _results: SearchResult[] = []
  private _activeIndex = 0
  private _catNames: Record<string, string> = {}

  set articles (val: Article[]) {
    this._articles = val
    // 预计算目录名映射
    this._catNames = {}
    // 从文章的 cat 字段推断，也可以通过外部注入
  }

  /** 设置目录名映射 */
  set catNames (val: Record<string, string>) {
    this._catNames = val
  }

  protected render (): string {
    return `
      <style>
        :host {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 1000;
        }
        :host(.is-open) {
          display: block;
        }
        .search-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
        }
        .search-dialog {
          position: absolute;
          top: 18%;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          max-width: 90vw;
          background: #0f0e0d;
          border: 1px solid #333;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #2a2a2a;
        }
        .search-box svg {
          flex-shrink: 0;
          color: #6b6b6b;
        }
        .search-input {
          flex: 1;
          min-width: 0;
          background: none;
          border: none;
          outline: none;
          font-size: 15px;
          line-height: 1.6;
          color: #f2f2f2;
          font-family: inherit;
        }
        .search-input::placeholder {
          color: #6b6b6b;
        }
        .search-box kbd {
          font-size: 11px;
          color: #6b6b6b;
          background: #1d1d1d;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: inherit;
        }
        .search-results {
          max-height: 400px;
          overflow-y: auto;
        }
        .search-result {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 20px;
          border: none;
          background: none;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          font-size: 14px;
          color: #f2f2f2;
          transition: background 0.15s;
        }
        .search-result:hover,
        .search-result.active {
          background: rgba(255,255,255,0.05);
        }
        .search-result-cover {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .search-result-main {
          flex: 1;
          min-width: 0;
        }
        .search-result-title {
          font-size: 14px;
          line-height: 1.5;
          color: #f2f2f2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .search-hl {
          color: #eb4f38;
          font-weight: 500;
        }
        .search-result-desc {
          font-size: 12px;
          color: #6b6b6b;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .search-result-side {
          flex-shrink: 0;
          text-align: right;
        }
        .search-result-cat {
          display: block;
          font-size: 11px;
          color: #9e9d99;
        }
        .search-result-date {
          display: block;
          font-size: 11px;
          color: #6b6b6b;
          margin-top: 2px;
        }
        .search-empty {
          padding: 32px 20px;
          text-align: center;
          color: #6b6b6b;
          font-size: 14px;
        }
        .search-foot {
          display: flex;
          gap: 16px;
          padding: 10px 20px;
          border-top: 1px solid #2a2a2a;
          font-size: 12px;
          color: #6b6b6b;
        }
        .search-foot kbd {
          font-size: 11px;
          color: #9e9d99;
          background: #1d1d1d;
          padding: 1px 5px;
          border-radius: 2px;
          font-family: inherit;
        }
      </style>
      <div class="search-backdrop" data-part="backdrop"></div>
      <div class="search-dialog" role="dialog" aria-modal="true" aria-label="站内搜索">
        <div class="search-box">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>
          </svg>
          <input class="search-input" type="text" placeholder="搜索文章、目录、正文关键词…" autocomplete="off" spellcheck="false">
          <kbd>Esc</kbd>
        </div>
        <div class="search-results" data-part="results"></div>
        <div class="search-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span><kbd>Enter</kbd> 打开</span>
          <span><kbd>Esc</kbd> 关闭</span>
        </div>
      </div>
    `
  }

  protected mounted (): void {
    const input = this.$('.search-input') as HTMLInputElement | null
    const list = this.$('[data-part="results"]') as HTMLElement | null
    const backdrop = this.$('[data-part="backdrop"]') as HTMLElement | null

    if (!input || !list) return

    // 输入搜索
    input.addEventListener('input', () => {
      this._results = searchArticles(input.value, this._articles, this._catNames, 12)
      this._activeIndex = 0
      this._renderResults(input.value)
    })

    // 键盘导航
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') { this._close(); return }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!this._results.length) return
        e.preventDefault()
        const delta = e.key === 'ArrowDown' ? 1 : -1
        this._activeIndex = (this._activeIndex + delta + this._results.length) % this._results.length
        this._syncActive()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const r = this._results[this._activeIndex]
        if (r) {
          this._openResult(r)
        } else {
          const v = input.value.trim()
          this._close()
          if (v) { window.location.href = 'search.html?q=' + encodeURIComponent(v) }
        }
      }
    })

    // 结果点击
    list.addEventListener('click', (e: Event) => {
      const item = (e.target as HTMLElement).closest('.search-result') as HTMLElement | null
      if (!item) return
      const id = (item.dataset as Record<string, string>).id
      const cat = (item.dataset as Record<string, string>).cat
      if (id) {
        this._close()
        this.emit('search-select', { id, cat })
      }
    })

    // 鼠标悬停同步高亮
    list.addEventListener('mousemove', (e: Event) => {
      const item = (e.target as HTMLElement).closest('.search-result') as HTMLElement | null
      if (!item) return
      const items = Array.from(list.querySelectorAll<HTMLElement>('.search-result'))
      const i = items.indexOf(item)
      if (i >= 0 && i !== this._activeIndex) {
        this._activeIndex = i
        this._syncActive()
      }
    })

    // 点击遮罩关闭
    backdrop?.addEventListener('click', (e: Event) => {
      if (e.target === backdrop) this._close()
    })

    // 全局快捷键 Ctrl+Shift+F
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault()
        this._open()
      }
    })

    // 页面内搜索按钮触发（composedPath 穿透 Shadow DOM）
    document.addEventListener('click', (e: Event) => {
      const target = (e.composedPath()[0] || e.target) as HTMLElement
      if (target.closest('[data-act="search"]')) {
        this._open()
      }
    })
  }

  private _renderResults (query: string): void {
    const list = this.$('[data-part="results"]') as HTMLElement | null
    if (!list) return

    const q = query.trim()
    if (!q) {
      list.innerHTML = '<div class="search-empty">输入关键词，模糊搜索文章 / 目录 / 正文内容</div>'
      return
    }
    if (!this._results.length) {
      list.innerHTML = '<div class="search-empty">没有找到与「' + escapeHtml(q) + '」相关的内容</div>'
      return
    }

    list.innerHTML = this._results.map(r => {
      const art = r.article
      return `
        <button class="search-result${this._results.indexOf(r) === this._activeIndex ? ' active' : ''}" type="button"
                data-id="${escapeHtml(art.id)}" data-cat="${escapeHtml(art.cat)}">
          <img class="search-result-cover" src="${escapeHtml(art.cover)}" alt="">
          <div class="search-result-main">
            <p class="search-result-title">${highlightMatch(art.title, q)}</p>
            <p class="search-result-desc">${escapeHtml(art.summary)}</p>
          </div>
          <div class="search-result-side">
            <span class="search-result-cat">${escapeHtml(r.catName || art.cat)}</span>
            <span class="search-result-date">${escapeHtml(art.date)}</span>
          </div>
        </button>
      `
    }).join('')
  }

  private _syncActive (): void {
    const list = this.$('[data-part="results"]') as HTMLElement | null
    if (!list) return
    const items = Array.from(list.querySelectorAll<HTMLElement>('.search-result'))
    items.forEach((el, i) => el.classList.toggle('active', i === this._activeIndex))
    const cur = items[this._activeIndex]
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' })
  }

  private _open (): void {
    this.classList.add('is-open')
    const input = this.$('.search-input') as HTMLInputElement | null
    if (input) {
      input.value = ''
      this._results = []
      this._activeIndex = 0
      this._renderResults('')
      requestAnimationFrame(() => input.focus())
    }
  }

  private _close (): void {
    this.classList.remove('is-open')
  }

  private _openResult (result: SearchResult): void {
    this._close()
    this.emit('search-select', { id: result.article.id, cat: result.article.cat })
  }
}

if (!customElements.get('search-panel')) {
  customElements.define('search-panel', SearchPanel)
}

export { SearchPanel }