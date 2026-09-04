import { defineTemplateComponent } from './define-component.js'

function escapeHtml (value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]))
}

/**
 * 高亮标题中与搜索词命中的字符。
 * 优先整段子串命中，其次退化为子序列命中；未命中返回转义后的原文。
 */
function highlightMatch (text, query) {
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

  const marks = new Set()
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

/** 搜索弹出层单条结果；result 为 { article, catName }，query 用于标题高亮。 */
export function searchResultItemTemplate (result, query) {
  const art = result.article
  return `
    <button class="search-result" type="button" data-id="${escapeHtml(art.id)}" data-cat="${escapeHtml(art.cat)}">
      <img class="search-result-cover" src="${escapeHtml(art.cover)}" alt="">
      <div class="search-result-main">
        <p class="search-result-title">${highlightMatch(art.title, query)}</p>
        <p class="search-result-desc">${escapeHtml(art.summary)}</p>
      </div>
      <div class="search-result-side">
        <span class="search-result-cat">${escapeHtml(result.catName || art.cat)}</span>
        <span class="search-result-date">${escapeHtml(art.date)}</span>
      </div>
    </button>
  `
}

// 搜索弹出层骨架；开合状态、输入与结果渲染交由 main.js 的 initSearch 统一管理。
defineTemplateComponent('search-panel', host => {
  host.className = 'search-panel'
  return `
    <div class="search-backdrop" data-search-backdrop></div>
    <div class="search-dialog" role="dialog" aria-modal="true" aria-label="站内搜索">
      <div class="search-box">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>
        </svg>
        <input class="search-input" type="text" placeholder="搜索文章、目录、正文关键词…" autocomplete="off" spellcheck="false">
        <kbd>Esc</kbd>
      </div>
      <div class="search-results" data-search-results></div>
      <div class="search-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
        <span><kbd>Enter</kbd> 打开</span>
        <span><kbd>Esc</kbd> 关闭</span>
      </div>
    </div>
  `
})