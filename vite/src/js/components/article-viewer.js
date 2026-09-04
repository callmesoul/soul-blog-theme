import { defineTemplateComponent } from './define-component.js'

function escapeHtml (value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]))
}

/** 评论项模板，同时用于接口评论与用户刚发表的本地评论。 */
export function commentItemTemplate (comment, icons) {
  const avatar = comment.avatar || icons.avatarB
  return `
    <div class="comment-item">
      <div class="comment-row">
        <img class="comment-avatar" src="${escapeHtml(avatar)}" alt="头像">
        <div class="comment-main">
          <p class="comment-text"><span class="comment-name">${escapeHtml(comment.name)}</span>：<span class="comment-body">${escapeHtml(comment.text)}</span></p>
          <p class="comment-meta">
            <span class="comment-time">${escapeHtml(comment.time)}</span>
            <span class="comment-actions">
              <span class="comment-action" data-act="reply">回复</span>
              <span class="comment-action" data-act="like">
                <img src="${escapeHtml(icons.zan)}" alt="赞">
                <span class="like-count">${Number(comment.likes) || 0}</span>
              </span>
            </span>
          </p>
        </div>
      </div>
      <div class="reply-form" hidden>
        <textarea placeholder="回复 ${escapeHtml(comment.name)}..."></textarea>
        <div class="reply-form-actions">
          <button class="reply-cancel" type="button">取消</button>
          <button class="reply-submit" type="button">回复</button>
        </div>
      </div>
      <div class="reply-list"></div>
    </div>
  `
}

/** 推荐文章模板；isLast 用于移除列表末项分隔线。 */
export function recommendationItemTemplate (article, { href, isLast }) {
  const border = isLast ? '' : 'border-bottom:1px solid #333;'
  return `
    <a class="recommend-item" href="${escapeHtml(href)}" data-id="${escapeHtml(article.id)}" data-cat="${escapeHtml(article.cat)}"
       style="display:block;padding:13px 0;${border}">
      <div style="display:flex;gap:11px;">
        <img src="${escapeHtml(article.cover)}" alt="" style="width:52px;height:52px;object-fit:cover;flex-shrink:0;border-radius:2px;">
        <div style="flex:1;min-width:0;">
          <p style="font-family:var(--font-sans);font-size:13px;line-height:1.6;letter-spacing:0.01em;color:#BDBAB5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(article.title)}</p>
        </div>
      </div>
      <p style="font-family:var(--font-sans);font-size:11px;color:#6B6B6B;text-align:right;margin-top:9px;">${escapeHtml(article.date)}</p>
    </a>
  `
}

/** 阅读器头部的浏览量、评论数和发布日期。 */
export function viewerMetaTemplate (article, icons) {
  return `
    <span><img src="${escapeHtml(icons.eye)}" alt="">${escapeHtml(article.views)}</span>
    <span><img src="${escapeHtml(icons.comment)}" alt="">${escapeHtml(article.commentCount)}</span>
    <span class="viewer-date"><img src="${escapeHtml(icons.calendar)}" alt="">${escapeHtml(article.date)}</span>
  `
}

/** 正文只接受纯文本段落，并统一在组件边界进行 HTML 转义。 */
export function articleParagraphsTemplate (paragraphs = []) {
  return paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')
}

/** 表情选择器的可点击项目。 */
export function emojiItemsTemplate (emojis) {
  return emojis.map(emoji => `<span class="emoji-item">${escapeHtml(emoji)}</span>`).join('')
}

// 阅读器静态骨架只创建一次，切换文章时由控制器更新各内容挂载点。
defineTemplateComponent('article-viewer', () => `
  <div class="viewer-backdrop"></div>
  <img class="viewer-ghost" alt="" draggable="false">
  <section class="viewer-panel">
    <header class="viewer-head">
      <div class="viewer-headline">
        <span class="viewer-breadcrumb">首页</span>
        <span class="viewer-sep">&gt;</span>
        <span class="viewer-cat-name"></span>
      </div>
      <button type="button" class="viewer-close" aria-label="关闭阅读（Esc）" title="关闭（Esc）">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    </header>
    <div class="viewer-body">
      <main class="viewer-main">
        <h1 class="viewer-title"></h1>
        <div class="viewer-meta"></div>
        <img class="viewer-cover" alt="文章封面">
        <div class="article-content"></div>
        <div class="viewer-divider"></div>
        <section class="viewer-comments">
          <div class="viewer-comments-head">
            <h2>评论</h2>
            <span class="viewer-dot"></span>
            <span class="comment-total">共 0 条评论</span>
          </div>
          <div class="viewer-comments-line"></div>
          <form id="comment-form" class="viewer-comment-form" novalidate>
            <div class="comment-input-box"><textarea rows="2" placeholder="说点什么吧…"></textarea></div>
            <div class="comment-form-actions">
              <button type="button" data-act="emoji" aria-label="表情" title="表情">
                <img src="/images/extracted/article/iconfont-biaoqing1@2x.png" alt="表情">
              </button>
              <button type="submit" disabled>评论</button>
            </div>
          </form>
          <div class="comment-list"></div>
        </section>
      </main>
      <aside class="viewer-aside">
        <div class="viewer-aside-head">
          <h2>推荐文章</h2>
          <p>Recommend</p>
          <span class="viewer-dot"></span>
        </div>
        <div class="recommend-list"></div>
      </aside>
    </div>
  </section>
`)
