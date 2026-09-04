import { defineTemplateComponent } from './define-component.js'

// 搜索结果页主体：搜索框 / 结果计数 / 结果卡片网格；渲染逻辑由 main.js 接管。
defineTemplateComponent('search-results', host => {
  host.className = 'contents'
  return `
    <div class="results-root flex min-h-0 flex-1 flex-col overflow-hidden">
      <header class="results-head">
        <h1 class="results-title">搜索</h1>
        <form class="results-form" data-results-form novalidate>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>
          </svg>
          <input class="results-input" type="search" placeholder="搜索文章、目录、正文关键词…" autocomplete="off" spellcheck="false">
        </form>
        <a class="results-back" href="index.html">返回首页</a>
      </header>
      <div class="results-meta"><span class="results-count" data-results-count></span></div>
      <div class="results-area">
        <div class="article-grid" data-results-grid></div>
      </div>
    </div>
  `
})