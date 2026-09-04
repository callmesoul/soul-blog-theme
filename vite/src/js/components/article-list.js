import { defineTemplateComponent } from './define-component.js'

function escapeHtml (value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]))
}

/** 渲染单张文章卡片；href 与图标由列表控制器注入，组件不依赖路由全局状态。 */
export function articleCardTemplate (article, { href, icons }) {
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

// 列表组件只提供面包屑与滚动容器，分页数据由 initBlogList 写入挂载点。
defineTemplateComponent('article-list', host => {
  // 两个顶层区块需要直接成为右侧 Flex 容器的子元素。
  host.className = 'contents'
  return `
  <div class="mb-5 flex items-center px-[59px] pt-10 max-[700px]:px-5 max-[480px]:px-[14px]">
    <span aria-hidden="true" class="inline-block size-[14px] shrink-0 bg-(--brand-primary) [mask:url('/images/extracted/home/iconfont-shouye@2x.png')_center/contain_no-repeat] [-webkit-mask:url('/images/extracted/home/iconfont-shouye@2x.png')_center/contain_no-repeat]"></span>
    <a href="index.html" class="ml-2 text-[14px] tracking-[0.02em] text-cat no-underline transition-colors duration-200 hover:text-white">首页</a>
    <span class="mx-2 text-[12px] text-crumb-sep">&gt;</span>
    <span id="crumb-current" class="text-[14px] font-medium tracking-[0.02em] text-white">全部文章</span>
    <div class="ml-9 h-px min-w-5 flex-1 bg-[linear-gradient(90deg,#3C3936,transparent)]"></div>
    <button class="search-trigger" type="button" data-act="search" aria-label="搜索（Ctrl+Shift+F）" title="搜索（Ctrl+Shift+F）">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>
      </svg>
      <span>搜索</span>
      <span class="search-trigger-keys"><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>F</kbd></span>
    </button>
  </div>

  <div class="article-area flex-1 overflow-y-auto px-[59px] pb-12 pt-[54px] max-[700px]:px-5 max-[480px]:px-[14px]">
    <div class="article-grid" id="article-grid" aria-live="polite"></div>
  </div>
  `
})
