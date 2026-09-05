import { WcBase } from '../helpers/wc-base'
import { escapeHtml } from '../helpers/escape-html'
import { searchArticles } from '../helpers/search'
import type { Article } from '../types'

/**
 * 搜索结果页组件
 *
 * 属性（JS property）：
 *   articles — Article[] 完整文章列表
 *   catNames — 目录名映射 { catId: catName }
 *
 * 事件：
 *   result-select — 点击结果卡片时触发，detail 为 { id: string, cat: string }
 */
class SearchResults extends WcBase {
  static get observedAttributes (): string[] {
    return []
  }

  private _articles: Article[] = []
  private _catNames: Record<string, string> = {}

  set articles (val: Article[]) {
    this._articles = val
    this._render()
  }
  set catNames (val: Record<string, string>) {
    this._catNames = val
  }

  protected render (): string {
    return `
      <style>
        :host {
          display: contents;
        }
        .results-root {
          display: flex;
          min-height: 0;
          flex: 1;
          flex-direction: column;
          overflow: hidden;
        }
        .results-head {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 40px 59px 0;
        }
        @media (max-width: 700px) {
          .results-head { padding: 40px 20px 0; }
        }
        .results-title {
          font-size: 22px;
          font-weight: 500;
          color: #ffffff;
          margin: 0;
          white-space: nowrap;
        }
        .results-form {
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 400px;
          gap: 10px;
          padding: 8px 14px;
          border: 1px solid #333;
          border-radius: 6px;
          transition: border-color 0.2s;
        }
        .results-form:focus-within {
          border-color: #eb4f38;
        }
        .results-form svg {
          flex-shrink: 0;
          color: #6b6b6b;
        }
        .results-input {
          flex: 1;
          min-width: 0;
          background: none;
          border: none;
          outline: none;
          color: #f2f2f2;
          font-size: 14px;
          font-family: inherit;
        }
        .results-input::placeholder {
          color: #6b6b6b;
        }
        .results-back {
          margin-left: auto;
          color: #9e9d99;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .results-back:hover {
          color: #ffffff;
        }
        .results-meta {
          padding: 16px 59px 0;
        }
        @media (max-width: 700px) {
          .results-meta { padding: 16px 20px 0; }
        }
        .results-count {
          font-size: 14px;
          color: #9e9d99;
        }
        .results-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px 59px 48px;
        }
        @media (max-width: 700px) {
          .results-area { padding: 24px 20px 48px; }
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
          gap: 12px;
          font-size: 12px;
          color: #6b6b6b;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .meta-icon {
          width: 14px;
          height: 14px;
          object-fit: contain;
          opacity: 0.5;
        }
        .grid-empty {
          text-align: center;
          padding: 48px 20px;
          color: #6b6b6b;
          font-size: 14px;
        }
      </style>
      <div class="results-root">
        <header class="results-head">
          <h1 class="results-title">搜索</h1>
          <form class="results-form" data-part="form" novalidate>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>
            </svg>
            <input class="results-input" type="search" data-part="search-input" placeholder="搜索文章、目录、正文关键词…" autocomplete="off" spellcheck="false">
          </form>
          <a class="results-back" href="index.html">返回首页</a>
        </header>
        <div class="results-meta"><span class="results-count" data-part="count"></span></div>
        <div class="results-area">
          <div class="article-grid" data-part="grid"></div>
        </div>
      </div>
    `
  }

  protected mounted (): void {
    const input = this.$('[data-part="search-input"]') as HTMLInputElement | null
    const form = this.$('[data-part="form"]') as HTMLFormElement | null

    if (input) {
      input.value = new URLSearchParams(window.location.search).get('q') || ''
    }

    form?.addEventListener('submit', (e: Event) => {
      e.preventDefault()
      this._render()
    })

    input?.addEventListener('input', () => {
      this._render()
    })

    this._render()
  }

  private _render (): void {
    const input = this.$('[data-part="search-input"]') as HTMLInputElement | null
    const grid = this.$('[data-part="grid"]') as HTMLElement | null
    const count = this.$('[data-part="count"]') as HTMLElement | null

    const q = input ? input.value.trim() : ''
    const list = q ? searchArticles(q, this._articles, this._catNames) : []

    // 更新 URL 参数
    const path = window.location.pathname
    const newUrl = path + (q ? '?q=' + encodeURIComponent(q) : '')
    window.history.replaceState(null, '', newUrl)

    // 更新结果计数
    if (count) {
      count.textContent = q
        ? `与「${q}」相关的文章 · 共 ${list.length} 篇`
        : '输入关键词开始搜索'
    }

    if (!grid) return

    if (!list.length) {
      grid.innerHTML = q
        ? '<div class="grid-empty">没有找到相关的内容，换个关键词试试吧～</div>'
        : '<div class="grid-empty">输入关键词，模糊搜索文章 / 目录 / 正文内容</div>'
      return
    }

    grid.innerHTML = list.map(r => {
      const art = r.article
      const icons = { eye: '', comment: '', calendar: '' }
      return `
        <a class="article-card" href="index.html#cat=${encodeURIComponent(art.cat)}&art=${encodeURIComponent(art.id)}" data-id="${escapeHtml(art.id)}" data-cat="${escapeHtml(art.cat)}">
          <img class="card-thumb" src="${escapeHtml(art.cover)}" alt="" loading="lazy">
          <div class="card-body">
            <h3 class="card-title">${escapeHtml(art.title)}</h3>
            <p class="card-desc">${escapeHtml(art.summary)}</p>
            <div class="card-meta">
              <span class="meta-item">${escapeHtml(art.views)} 浏览</span>
              <span class="meta-item">${escapeHtml(art.commentCount)} 评论</span>
              <span class="meta-item" style="margin-left:auto;">${escapeHtml(art.date)}</span>
            </div>
          </div>
        </a>
      `
    }).join('')
  }
}

if (!customElements.get('search-results')) {
  customElements.define('search-results', SearchResults)
}

export { SearchResults }