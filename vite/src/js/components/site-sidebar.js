import { defineTemplateComponent } from './define-component.js'

function escapeHtml (value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]))
}

/** 根据目录数据生成导航项；高亮状态由 activeCat 明确传入。 */
export function navigationItemsTemplate (items, activeCat) {
  return items.map(item => `
    <a class="nav-item${item.cat === activeCat ? ' active' : ''}" href="index.html#cat=${encodeURIComponent(item.cat)}"
       data-cat="${escapeHtml(item.cat)}" title="${escapeHtml(item.zh)} · ${escapeHtml(item.en)}">
      <img class="nav-icon" src="${escapeHtml(item.icon)}" alt="" style="width:${Number(item.w)}px;height:${Number(item.h)}px;">
      <div>
        <div class="nav-zh">${escapeHtml(item.zh)}</div>
        <div class="nav-en">${escapeHtml(item.en)}</div>
      </div>
    </a>
  `).join('')
}

// 首页公共侧栏骨架；导航和社交区分别由 main.js 与站点配置动态填充。
defineTemplateComponent('site-sidebar', host => {
  // display: contents 让内部 aside 直接参与首页父级的 Flex 布局。
  host.className = 'contents'
  return `
  <aside id="sidebar" class="flex h-full w-[372px] min-w-[372px] flex-col border-r border-white/15 bg-[rgba(15,14,13,0.55)] backdrop-blur-[16px] backdrop-saturate-[1.2] max-lg:w-16 max-lg:min-w-16 max-lg:bg-[rgba(15,14,13,0.85)]">
    <div class="py-5 pl-[84px] max-lg:hidden">
      <img src="/images/extracted/login/图形@2x.png" alt="CallMeSoul" data-site-logo="home" class="block h-[55px] w-[60px] shrink-0 object-contain">
    </div>

    <nav class="site-nav flex-1 overflow-x-hidden overflow-y-auto" aria-label="文章目录"></nav>

    <div class="mt-3">
      <div class="px-[96px] pb-6">
        <p class="site-icp text-xs leading-[1.3] tracking-[0.02em] text-dim">@CallMeSoul 粤ICP备15053557</p>
      </div>
      <div class="social-bar flex h-[51px] border-t border-sep" aria-label="社交媒体"></div>
    </div>
  </aside>
  `
})
