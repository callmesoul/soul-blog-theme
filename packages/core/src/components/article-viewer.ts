import { WcBase } from '../helpers/wc-base'
import { escapeHtml } from '../helpers/escape-html'
import { recordVercountArticleView } from '../helpers/vercount'
import type { Article, ArticleComment, GiscusConfig } from '../types'

// 时间节奏（毫秒）
const FLIP_OPEN_MS = 420
const FLIP_CLOSE_MS = 300
const CONTENT_REVEAL_MS = 240

const COMMENT_AVATARS = [
  '/images/extracted/article/20160126052324@2x.png',
  '/images/extracted/article/4@2x.png'
]

/**
 * 文章阅读器组件
 *
 * 属性（JS property）：
 *   article   — Article 当前正在阅读的文章
 *   articles  — Article[] 完整文章列表（用于推荐）
 *   icons     — 图标路径映射
 *
 * 事件：
 *   viewer-close    — 关闭阅读器时触发
 *   article-select  — 推荐点击时触发，detail 为 { id: string, cat: string }
 */
class ArticleViewer extends WcBase {
  static get observedAttributes (): string[] {
    return []
  }

  private _article: Article | null = null
  private _articles: Article[] = []
  private _icons: Record<string, string> = {}
  private _catNames: Record<string, string> = {}
  private _giscusConfig: GiscusConfig | null = null
  private _viewerGen = 0
  private _swapBusy = false
  private _swapPendingId: string | null = null
  private _cardEl: HTMLElement | null = null
  private _trackedPageViewArticleId: string | null = null
  private _pageViewFallbackTimer: number | null = null
  private _giscusRenderKey = ''
  private _giscusRenderGeneration = 0

  set article (val: Article | null) {
    this._article = val
    this._renderArticle()
    if (val) this._trackPageView(val)
  }
  set articles (val: Article[]) {
    this._articles = val
  }
  set icons (val: Record<string, string>) {
    this._icons = val
  }
  set catNames (val: Record<string, string>) {
    this._catNames = val
  }
  set giscusConfig (val: GiscusConfig | null) {
    this._giscusConfig = val
    this._renderComments()
  }

  /** 导出模板函数供过渡期使用 */
  static commentItemTemplate (comment: ArticleComment, icons: Record<string, string>): string {
    const avatar = comment.avatar || icons.avatarB || ''
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
                  <img src="${escapeHtml(icons.zan || '')}" alt="赞">
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

  static recommendationItemTemplate (article: Article, { href, isLast }: { href: string, isLast: boolean }): string {
    const border = isLast ? '' : 'border-bottom:1px solid #333;'
    return `
      <a class="recommend-item" href="${escapeHtml(href)}" data-id="${escapeHtml(article.id)}" data-cat="${escapeHtml(article.cat)}"
         style="display:block;padding:13px 0;${border}text-decoration:none;">
        <div style="display:flex;gap:11px;">
          <img src="${escapeHtml(article.cover)}" alt="" style="width:52px;height:52px;object-fit:cover;flex-shrink:0;border-radius:2px;">
          <div style="flex:1;min-width:0;">
            <p style="font-size:13px;line-height:1.6;letter-spacing:0.01em;color:#BDBAB5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(article.title)}</p>
          </div>
        </div>
        <p style="font-size:11px;color:#6B6B6B;text-align:right;margin-top:9px;">${escapeHtml(article.date)}</p>
      </a>
    `
  }

  static viewerMetaTemplate (article: Article, icons: Record<string, string>): string {
    return `
      <span><img src="${escapeHtml(icons.eye || '')}" alt=""><slot name="page-views">${escapeHtml(article.views)}</slot></span>
      <span><img src="${escapeHtml(icons.comment || '')}" alt="">${escapeHtml(article.commentCount)}</span>
      <span class="viewer-date"><img src="${escapeHtml(icons.calendar || '')}" alt="">${escapeHtml(article.date)}</span>
    `
  }

  /**
   * Vercount 的展示节点位于普通 DOM，通过 page-views slot 投影进 Shadow DOM。
   * 文章统一映射为 /articles/{id}，避免 SPA hash 被统计服务忽略。
   */
  private _trackPageView (article: Article): void {
    if (this._trackedPageViewArticleId === article.id) return

    const target = this.querySelector<HTMLElement>('#vercount_value_page_pv[slot="page-views"]')
    if (!target) return

    this._trackedPageViewArticleId = article.id
    target.textContent = '•••'
    target.classList.add('is-loading')
    target.setAttribute('aria-busy', 'true')

    const finish = (views: number): void => {
      if (this._article?.id !== article.id) return
      target.textContent = String(views)
      target.classList.remove('is-loading')
      target.removeAttribute('aria-busy')
      if (this._pageViewFallbackTimer !== null) {
        window.clearTimeout(this._pageViewFallbackTimer)
        this._pageViewFallbackTimer = null
      }
    }

    if (this._pageViewFallbackTimer !== null) window.clearTimeout(this._pageViewFallbackTimer)
    this._pageViewFallbackTimer = window.setTimeout(() => {
      finish(Number(article.views) || 0)
    }, 5000)

    void recordVercountArticleView(article.id).then(views => {
      finish(views ?? (Number(article.views) || 0))
    })
  }

  static articleParagraphsTemplate (paragraphs: string[] = []): string {
    // 段落内容视为调用方提供的可信 HTML（hexo 服务端 page.content 已渲染；
    // mock-data 段落为纯文本），由调用方负责来源可信度。含块级标签的内容
    // 直接注入，避免额外的 <p> 破坏 Hexo 已渲染的标题、列表与代码块结构。
    const blockHtml = /<(?:address|article|aside|blockquote|details|div|dl|fieldset|figure|footer|form|h[1-6]|header|hr|main|nav|ol|p|pre|section|table|ul)\b/i
    return paragraphs.map(p => blockHtml.test(p) ? p : `<p>${p}</p>`).join('')
  }

  static emojiItemsTemplate (emojis: string[]): string {
    return emojis.map(e => `<span class="emoji-item">${escapeHtml(e)}</span>`).join('')
  }

  protected render (): string {
    return `
      <style>
        :host {
          display: none;
          position: absolute;
          inset: 0;
          z-index: 50;
        }
        :host(.is-open) {
          display: flex;
        }
        :host *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        :host *::-webkit-scrollbar-track {
          background: transparent;
        }
        :host *::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 3px;
        }
        :host *::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        .viewer-backdrop {
	          position: absolute;
	          inset: 0;
	          background: rgba(0,0,0,0.5);
	          cursor: pointer;
	        }
        .viewer-ghost {
          display: none;
          position: absolute;
          z-index: 2;
          object-fit: cover;
          pointer-events: none;
          border-radius: 4px;
        }
        .viewer-panel {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 18% 0%, rgba(var(--brand-rgb), 0.055), transparent 30%),
            rgba(15, 14, 13, 0.975);
          overflow: hidden;
        }
        .viewer-panel.viewer-open {
          display: flex;
        }
        .viewer-panel.is-anim {
          will-change: transform, opacity;
        }
        .viewer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 64px;
          padding: 14px clamp(20px, 3vw, 40px);
          border-bottom: 1px solid #2a2a2a;
          background: rgba(15, 14, 13, 0.82);
          backdrop-filter: blur(16px);
          flex-shrink: 0;
        }
        .viewer-headline {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6b6b6b;
        }
        .viewer-breadcrumb {
          color: #9e9d99;
          text-decoration: none;
          transition: color 0.2s;
        }
        .viewer-breadcrumb:hover {
          color: #ffffff;
        }
        .viewer-sep {
          color: #5d5a59;
        }
        .viewer-cat-name {
          color: #c9c6c2;
          text-decoration: none;
          transition: color 0.2s;
        }
        .viewer-cat-name:hover {
          color: #ffffff;
        }
        .viewer-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          cursor: pointer;
          color: #9e9d99;
          border-radius: 50%;
          transition: background 0.2s, color 0.2s;
        }
        .viewer-close:hover {
          background: rgba(255,255,255,0.06);
          color: #ffffff;
        }
        .viewer-body {
          display: flex;
          flex: 1;
          min-height: 0;
        }
        .viewer-body.viewer-mask {
          opacity: 0.3;
        }
        .viewer-body.viewer-in {
          animation: fadeInUp ${CONTENT_REVEAL_MS}ms ease-out both;
        }
        @keyframes fadeInUp {
          from { opacity: 0.3; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .viewer-main {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: #444 transparent;
          padding: clamp(32px, 5vw, 64px) clamp(24px, 5vw, 72px) 96px;
          scroll-behavior: smooth;
        }
        .viewer-main > * {
          width: 100%;
          max-width: 860px;
          margin-inline: auto;
        }
        .viewer-main.viewer-swap-out {
          opacity: 0;
          transition: opacity 0.12s ease-out;
        }
        .viewer-main.viewer-swap-in {
          animation: fadeIn 0.2s ease-out both;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .viewer-title {
          font-size: clamp(28px, 3vw, 38px);
          font-weight: 650;
          line-height: 1.25;
          letter-spacing: -0.025em;
          color: #ffffff;
          margin: 0 auto 18px;
          text-wrap: balance;
          overflow-wrap: anywhere;
        }
        .viewer-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px 16px;
          font-size: 12px;
          color: #8f8b86;
          margin: 0 auto 16px;
        }
        .viewer-meta span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .viewer-meta img {
          width: 14px;
          height: 14px;
          object-fit: contain;
          filter: brightness(0) invert(0.62);
          transition: filter 0.2s ease;
        }
        ::slotted([slot="page-views"].is-loading) {
          min-width: 1.55em;
          color: var(--brand-primary, #eb4f38);
          letter-spacing: 0.08em;
          animation: viewCountPulse 0.8s ease-in-out infinite;
        }
        @keyframes viewCountPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          ::slotted([slot="page-views"].is-loading) { animation: none; opacity: 0.7; }
        }
        .viewer-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 0 auto 28px;
        }
        .viewer-tag {
          display: inline-block;
          padding: 4px 11px;
          font-size: 12px;
          color: #9e9d99;
          background: rgba(255,255,255,0.05);
          border: 1px solid #2a2a2a;
          border-radius: 999px;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .viewer-tag:hover {
          color: #eb4f38;
          border-color: #eb4f38;
          background: rgba(235,79,56,0.08);
        }
        .viewer-cover {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          margin: 0 auto clamp(32px, 5vw, 52px);
          box-shadow: 0 24px 70px rgba(0,0,0,0.28);
        }
        .article-content {
          font-size: 16px;
          line-height: 1.9;
          color: #bbb7b1;
          letter-spacing: 0.012em;
          overflow-wrap: break-word;
        }
        .article-content p {
          margin: 0 0 22px;
        }
        .article-content > :first-child {
          margin-top: 0;
        }
        .article-content h2,
        .article-content h3,
        .article-content h4 {
          color: #f5f3f0;
          font-weight: 650;
          line-height: 1.4;
          letter-spacing: -0.015em;
          text-wrap: balance;
        }
        .article-content h2 {
          margin: 52px 0 20px;
          padding-top: 8px;
          font-size: 25px;
        }
        .article-content h3 {
          margin: 38px 0 16px;
          font-size: 20px;
        }
        .article-content h4 {
          margin: 30px 0 14px;
          font-size: 17px;
        }
        .article-content .headerlink {
          color: inherit;
          text-decoration: none;
        }
        .article-content .headerlink::before {
          content: '#';
          margin-right: 10px;
          color: var(--brand-primary, #eb4f38);
          font-weight: 500;
          opacity: 0.72;
        }
        .article-content a:not(.headerlink) {
          color: #f08070;
          text-decoration-color: rgba(var(--brand-rgb), 0.45);
          text-decoration-thickness: 1px;
          text-underline-offset: 4px;
          transition: color 0.18s ease, text-decoration-color 0.18s ease;
        }
        .article-content a:not(.headerlink):hover {
          color: #ff9a8c;
          text-decoration-color: currentColor;
        }
        .article-content strong {
          color: #e7e3de;
          font-weight: 650;
        }
        .article-content ul,
        .article-content ol {
          margin: 0 0 24px;
          padding-left: 1.45em;
        }
        .article-content li {
          padding-left: 0.35em;
        }
        .article-content li + li {
          margin-top: 8px;
        }
        .article-content li::marker {
          color: var(--brand-primary, #eb4f38);
        }
        .article-content blockquote {
          margin: 28px 0;
          padding: 18px 22px;
          border-left: 3px solid var(--brand-primary, #eb4f38);
          border-radius: 0 9px 9px 0;
          background: rgba(var(--brand-rgb), 0.075);
          color: #c9c4bd;
        }
        .article-content blockquote > :last-child {
          margin-bottom: 0;
        }
        .article-content code {
          padding: 0.16em 0.42em;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 5px;
          background: rgba(255,255,255,0.055);
          color: #e8b4aa;
          font-size: 0.9em;
        }
        .article-content pre code,
        .article-content .highlight code {
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          color: inherit;
          font-size: inherit;
        }
        .article-content pre,
        .article-content figure.highlight {
          margin: 28px 0;
          border: 1px solid #292725;
          border-radius: 10px;
          background: #0a0909;
          box-shadow: inset 0 1px rgba(255,255,255,0.025);
          overflow-x: auto;
        }
        .article-content > pre {
          padding: 18px 20px;
        }
        .article-content figure.highlight table {
          width: 100%;
          min-width: max-content;
          border-collapse: collapse;
        }
        .article-content figure.highlight td {
          padding: 18px 0;
          vertical-align: top;
        }
        .article-content figure.highlight .gutter {
          width: 1%;
          border-right: 1px solid #242220;
          color: #514e4a;
          text-align: right;
          user-select: none;
        }
        .article-content figure.highlight .gutter pre {
          padding: 0 13px;
        }
        .article-content figure.highlight .code pre {
          padding: 0 18px;
        }
        .article-content pre,
        .article-content figure.highlight pre {
          font-size: 13px;
          line-height: 1.75;
          tab-size: 2;
        }
        .article-content img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 30px auto;
          border-radius: 10px;
        }
        .article-content hr {
          height: 1px;
          margin: 44px 0;
          border: 0;
          background: linear-gradient(90deg, transparent, #34312f 15%, #34312f 85%, transparent);
        }
        .article-content > table:not(.highlight) {
          display: block;
          width: 100%;
          margin: 28px 0;
          border-collapse: collapse;
          overflow-x: auto;
        }
        .article-content > table:not(.highlight) th,
        .article-content > table:not(.highlight) td {
          padding: 10px 14px;
          border: 1px solid #302e2b;
          text-align: left;
        }
        .article-content > table:not(.highlight) th {
          color: #e7e3de;
          background: rgba(255,255,255,0.04);
        }
        .viewer-divider {
          height: 1px;
          background: #333;
          margin: 56px auto 36px;
        }
        .viewer-comments-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .viewer-comments-head h2 {
          font-size: 16px;
          font-weight: 500;
          color: #f2f2f2;
          margin: 0;
        }
        .viewer-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #5d5a59;
        }
        .comment-total {
          font-size: 12px;
          color: #6b6b6b;
        }
        .viewer-comments-line {
          height: 1px;
          background: #333;
          margin-bottom: 20px;
        }
        .legacy-comments[hidden],
        .giscus-container[hidden] {
          display: none !important;
        }
        .giscus-container {
          min-height: 160px;
          padding-top: 20px;
        }
        .giscus-container ::slotted(.giscus) {
          display: block;
          width: 100%;
        }
        .giscus-status {
          margin: 0;
          padding: 28px 18px;
          border: 1px dashed #3b3937;
          border-radius: 6px;
          color: #8d8984;
          font-size: 13px;
          line-height: 1.7;
          text-align: center;
        }
        .giscus-status strong {
          display: block;
          margin-bottom: 8px;
          color: #d8d4cf;
          font-size: 15px;
        }
        .giscus-status p {
          margin: 0;
        }
        .giscus-status ol {
          max-width: 520px;
          margin: 16px auto 0;
          padding-left: 24px;
          text-align: left;
        }
        .giscus-status li + li {
          margin-top: 7px;
        }
        .giscus-status a {
          color: var(--brand-primary, #eb4f38);
          text-underline-offset: 3px;
        }
        .viewer-comment-form {
          margin-bottom: 24px;
        }
        .comment-input-box {
          margin-bottom: 8px;
        }
        .comment-input-box textarea {
          width: 100%;
          padding: 10px 14px;
          background: #252828;
          border: 1px solid #333;
          border-radius: 4px;
          color: #f2f2f2;
          font-size: 13px;
          font-family: inherit;
          line-height: 1.5;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
        }
        .comment-input-box textarea:focus {
          border-color: #eb4f38;
        }
        .comment-form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .comment-form-actions button[data-act="emoji"] {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #3C3936;
          border-radius: 4px;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .comment-form-actions button[data-act="emoji"]:hover {
          border-color: var(--brand-primary);
          background: rgba(var(--brand-rgb), 0.08);
        }
        .comment-form-actions button[data-act="emoji"] img {
          width: 17px;
          height: 17px;
          object-fit: contain;
          filter: brightness(0) invert(0.62);
          opacity: 1;
          transition: filter 0.2s ease, transform 0.2s ease;
        }
        .comment-form-actions button[data-act="emoji"]:hover img {
          filter: brightness(0) invert(1);
          transform: scale(1.1);
        }
        .comment-form-actions button[data-act="emoji"]:active {
          transform: scale(0.94);
        }
        .comment-form-actions button[type="submit"] {
          padding: 6px 20px;
          background: #eb4f38;
          color: #ffffff;
          border: none;
          border-radius: 3px;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }
        .comment-form-actions button[type="submit"]:disabled {
          background: #333;
          color: #6b6b6b;
          cursor: not-allowed;
        }
        .comment-form-actions button[type="submit"].is-active {
          background: #ee5b44;
        }
        .comment-item {
          padding: 12px 0;
        }
        .comment-row {
          display: flex;
          gap: 10px;
        }
        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        .comment-main {
          flex: 1;
          min-width: 0;
        }
        .comment-text {
          font-size: 13px;
          line-height: 1.6;
          color: #b3b3b3;
          margin: 0 0 4px;
        }
        .comment-name {
          color: #c9c6c2;
          font-weight: 500;
        }
        .comment-body {
          color: #b3b3b3;
        }
        .comment-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #6b6b6b;
          margin: 0;
        }
        .comment-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .comment-action {
          cursor: pointer;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          gap: 3px;
          color: #9e9d99;
        }
        .comment-action:hover {
          color: var(--brand-primary, #eb4f38);
        }
        .comment-action img {
          width: 14px;
          height: 14px;
          object-fit: contain;
          filter: brightness(0) invert(0.62);
          opacity: 1;
          transition: filter 0.2s ease;
        }
        .comment-action:hover img {
          filter: brightness(0) invert(1);
        }
        .comment-action.liked {
          color: #eb4f38;
        }
        .comment-action.liked img {
          filter: brightness(0) invert(1) drop-shadow(0 0 4px rgba(var(--brand-rgb), 0.65));
        }
        .comment-empty {
          text-align: center;
          padding: 24px;
          color: #6b6b6b;
          font-size: 13px;
        }
        .reply-form {
          margin: 8px 0 8px 42px;
        }
        .reply-form textarea {
          width: 100%;
          padding: 8px 12px;
          background: #252828;
          border: 1px solid #333;
          border-radius: 3px;
          color: #f2f2f2;
          font-size: 12px;
          font-family: inherit;
          resize: none;
          outline: none;
        }
        .reply-form-actions {
          display: flex;
          gap: 8px;
          margin-top: 6px;
        }
        .reply-cancel, .reply-submit {
          padding: 4px 12px;
          border: none;
          border-radius: 3px;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
        }
        .reply-cancel {
          background: #1d1d1d;
          color: #9e9d99;
        }
        .reply-submit {
          background: #eb4f38;
          color: #ffffff;
        }
        .reply-list {
          margin-left: 42px;
        }
        .reply-list .comment-item {
          padding: 8px 0;
        }
        .reply-list .comment-item .comment-text {
          font-size: 12px;
        }
        .viewer-aside {
          width: 300px;
          flex-shrink: 0;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #444 transparent;
          padding: 40px 28px 96px;
          border-left: 1px solid #2a2a2a;
          background: rgba(0,0,0,0.08);
          min-height: 100%;
        }
        .viewer-aside[hidden] {
          display: none !important;
        }
        .viewer-aside.viewer-swap-out {
          opacity: 0;
          transition: opacity 0.12s ease-out;
        }
        .viewer-aside.viewer-swap-in {
          animation: fadeIn 0.2s ease-out both;
        }
        .viewer-aside-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .viewer-aside-head h2 {
          font-size: 14px;
          font-weight: 500;
          color: #f2f2f2;
          margin: 0;
        }
        .viewer-aside-head p {
          font-size: 11px;
          color: #6b6b6b;
          margin: 0;
        }
        .viewer-rec-empty {
          text-align: center;
          padding: 24px;
          color: #6b6b6b;
          font-size: 13px;
        }
        .emoji-panel {
          display: none;
          position: fixed;
          z-index: 2000;
          background: #1d1d1d;
          border: 1px solid #333;
          border-radius: 6px;
          padding: 8px;
          gap: 4px;
          flex-wrap: wrap;
          width: 192px;
        }
        .emoji-panel.open {
          display: flex;
        }
        .emoji-item {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 4px;
          font-size: 18px;
          transition: background 0.15s;
        }
        .emoji-item:hover {
          background: rgba(255,255,255,0.06);
        }
        @media (max-width: 1000px) {
          .viewer-main {
            padding-inline: 32px;
          }
          .viewer-aside {
            width: 250px;
            padding-inline: 22px;
          }
        }
        @media (max-width: 760px) {
          :host {
            position: fixed;
          }
          .viewer-backdrop {
            display: none;
          }
          .viewer-panel {
            background: #0f0e0d;
          }
          .viewer-head {
            min-height: 58px;
            padding: 10px 16px;
          }
          .viewer-headline {
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
          }
          .viewer-cat-name {
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .viewer-close {
            flex: 0 0 36px;
            width: 36px;
            height: 36px;
          }
          .viewer-body {
            display: block;
            overflow-x: hidden;
            overflow-y: auto;
            overscroll-behavior: contain;
            scrollbar-width: thin;
            scrollbar-color: #444 transparent;
          }
          .viewer-main {
            overflow: visible;
            padding: 28px 20px 96px;
          }
          .viewer-title {
            font-size: clamp(25px, 8vw, 32px);
            line-height: 1.3;
          }
          .viewer-cover {
            margin-bottom: 34px;
            border-radius: 9px;
          }
          .article-content {
            font-size: 16px;
            line-height: 1.85;
          }
          .article-content h2 {
            margin-top: 42px;
            font-size: 22px;
          }
          .article-content h3 {
            margin-top: 32px;
            font-size: 19px;
          }
          .article-content pre,
          .article-content figure.highlight {
            border-radius: 8px;
          }
          .viewer-aside {
            width: auto;
            min-height: 0;
            padding: 30px 20px 104px;
            border-top: 1px solid #2a2a2a;
            border-left: 0;
            overflow: visible;
          }
        }
        @media (max-width: 420px) {
          .viewer-main {
            padding-inline: 16px;
          }
          .viewer-meta {
            gap: 7px 12px;
          }
          .viewer-tags {
            gap: 7px;
          }
          .viewer-cover {
            aspect-ratio: 4 / 3;
          }
          .article-content h2 {
            font-size: 21px;
          }
          .article-content blockquote {
            padding: 16px 18px;
          }
        }
      </style>
      <div class="viewer-backdrop" data-part="backdrop"></div>
      <img class="viewer-ghost" data-part="ghost" alt="" draggable="false">
      <section class="viewer-panel" data-part="panel">
        <header class="viewer-head">
          <div class="viewer-headline">
            <a href="./" class="viewer-breadcrumb">首页</a>
            <span class="viewer-sep">&gt;</span>
            <a href="./" class="viewer-cat-name" data-part="cat-name"></a>
          </div>
          <button type="button" class="viewer-close" data-part="close-btn" aria-label="关闭阅读（Esc）" title="关闭（Esc）">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </header>
        <div class="viewer-body" data-part="body">
          <main class="viewer-main" data-part="main">
            <h1 class="viewer-title" data-part="title"></h1>
            <div class="viewer-meta" data-part="meta"></div>
            <div class="viewer-tags" data-part="tags"></div>
            <img class="viewer-cover" data-part="cover" alt="文章封面">
            <div class="article-content" data-part="content"></div>
            <div class="viewer-divider"></div>
            <section class="viewer-comments">
              <div class="viewer-comments-head">
                <h2>评论</h2>
                <span class="viewer-dot"></span>
                <span class="comment-total" data-part="comment-total">共 0 条评论</span>
              </div>
              <div class="viewer-comments-line"></div>
              <div class="legacy-comments" data-part="legacy-comments">
                <form class="viewer-comment-form" data-part="comment-form" novalidate>
                  <div class="comment-input-box"><textarea rows="2" placeholder="说点什么吧…" data-part="comment-input"></textarea></div>
                  <div class="comment-form-actions">
                    <button type="button" data-act="emoji" aria-label="表情" title="表情">
                      <img src="/images/extracted/article/iconfont-biaoqing1@2x.png" alt="表情">
                    </button>
                    <button type="submit" disabled>评论</button>
                  </div>
                </form>
                <div class="comment-list" data-part="comment-list"></div>
              </div>
              <div class="giscus-container" data-part="giscus" hidden>
                <div data-part="giscus-status"></div>
                <slot name="giscus"></slot>
              </div>
            </section>
          </main>
          <aside class="viewer-aside" data-part="aside">
            <div class="viewer-aside-head">
              <h2>推荐文章</h2>
              <p>Recommend</p>
              <span class="viewer-dot"></span>
            </div>
            <div class="recommend-list" data-part="recommend-list"></div>
          </aside>
        </div>
      </section>
    `
  }

  protected mounted (): void {
    this._setupBackdrop()
    this._setupCloseButton()
    this._setupCommentEvents()
    this._setupEmoji()
    this._setupKeyboard()
  }

  private _setupBackdrop (): void {
    const backdrop = this.$('[data-part="backdrop"]')
    backdrop?.addEventListener('click', () => this.closeWithFlip())
  }

  private _setupCloseButton (): void {
    const close = this.$('[data-part="close-btn"]')
    close?.addEventListener('click', () => this.closeWithFlip())
  }

  private _setupKeyboard (): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.classList.contains('is-open')) return
      const tag = (e.target && (e.target as HTMLElement).tagName) || ''
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Escape') this.closeWithFlip()
    })
  }

  private _setupCommentEvents (): void {
    const viewer = this.shadow

    // 评论区事件委托
    viewer.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement

      // 点赞
      const like = target.closest('[data-act="like"]') as HTMLElement | null
      if (like && this.shadow.contains(like)) {
        const c = like.querySelector('.like-count')
	        if (c) {
	          const n = (+(c.textContent || '0') || 0) + 1
	          c.textContent = String(n)
        }
        like.classList.add('liked')
        return
      }

      // 回复开关
      const replyBtn = target.closest('[data-act="reply"]') as HTMLElement | null
      if (replyBtn && this.shadow.contains(replyBtn)) {
        const item = replyBtn.closest('.comment-item') as HTMLElement | null
        const rf = item && item.querySelector('.reply-form') as HTMLElement | null
        if (rf) {
          rf.hidden = !rf.hidden
          if (!rf.hidden) {
            const ta = rf.querySelector('textarea') as HTMLTextAreaElement | null
            ta && ta.focus()
          }
        }
        return
      }

      // 取消回复
      if (target.closest('.reply-cancel')) {
        const rf = target.closest('.reply-form') as HTMLElement | null
        if (rf) rf.hidden = true
        return
      }

      // 提交回复
      if (target.closest('.reply-submit')) {
        const rf = target.closest('.reply-form') as HTMLElement | null
        const item = target.closest('.comment-item') as HTMLElement | null
        if (!rf || !item) return
        const ta = rf.querySelector('textarea') as HTMLTextAreaElement | null
        const v = (ta?.value || '').trim()
        if (!v) { ta?.focus(); return }
        const replyEl = this._createCommentEl(v, '我')
        replyEl.classList.add('is-reply')
        const replyList = item.querySelector('.reply-list') as HTMLElement | null
        if (replyList) replyList.appendChild(replyEl)
        rf.hidden = true
        if (ta) ta.value = ''
        return
      }

      // 发表评论
	      const submit = target.closest('[data-part="comment-form"] button[type="submit"]')
	      if (submit) {
	        e.preventDefault()
	        const form = target.closest('[data-part="comment-form"]') as HTMLElement | null
	        if (!form) return
	        const ta = form.querySelector('textarea') as HTMLTextAreaElement | null
	        const text = (ta?.value || '').trim()
	        if (!text) { ta?.focus(); return }
	        const list = form.parentElement?.querySelector('.comment-list') as HTMLElement | null
	        const emptyHint = list?.querySelector('.comment-empty')
	        if (emptyHint) emptyHint.remove()
	        if (list) list.appendChild(this._createCommentEl(text, '我'))
	        if (ta) ta.value = ''
	        this._syncCommentCount()
	        return
	      }

      // 标签点击
      const tagEl = target.closest('.viewer-tag') as HTMLElement | null
      if (tagEl && this.shadow.contains(tagEl)) {
        const tag = (tagEl.dataset as Record<string, string>).tag
        if (tag) {
          e.preventDefault()
          // 先派发可取消的 tag-select，让宿主决定路由（vue-router / react-router 等）。
          // 宿主 preventDefault 即「已接管」，组件不再关闭阅读器、也不再写 hash；
          // 未接管的宿主（纯 location.hash 路由）保持旧行为不变。
          const ev = this.emit('tag-select', { tag }, { cancelable: true })
          if (!ev.defaultPrevented) {
            this.emit('viewer-close')
            // 延迟一小段时间再触发路由，让关闭动画先执行
            setTimeout(() => {
              window.location.hash = '#tag=' + encodeURIComponent(tag)
            }, 50)
          }
        }
        return
      }

      // 推荐原地切换
      const rec = target.closest('.recommend-item') as HTMLElement | null
      if (rec && this.shadow.contains(rec)) {
        const id = (rec.dataset as Record<string, string>).id
        const cat = (rec.dataset as Record<string, string>).cat
        if (id) {
          e.preventDefault()
          this.emit('article-select', { id, cat })
        }
      }
    })

    // 评论输入联动
	    viewer.addEventListener('input', (e: Event) => {
	      const ta = e.target as HTMLTextAreaElement
	      if (ta.matches('[data-part="comment-form"] textarea') || ta.matches('[data-part="comment-input"]')) {
	        const submit = this.shadow.querySelector('[data-part="comment-form"] button[type="submit"]') as HTMLButtonElement | null
	        const hasText = !!ta.value.trim()
	        if (submit) {
	          submit.disabled = !hasText
	          submit.classList.toggle('is-active', hasText)
	        }
	      }
	    })
  }

  private _setupEmoji (): void {
    const emojiBtn = this.$('[data-act="emoji"]') as HTMLElement | null
    if (!emojiBtn) return

    const emojiPanel = document.createElement('div')
    emojiPanel.className = 'emoji-panel'
    emojiPanel.style.cssText = 'display:none !important;position:fixed !important;z-index:2000;background:#1d1d1d;border:1px solid #333;border-radius:6px;padding:8px;gap:4px;flex-wrap:wrap;width:192px;'
    emojiPanel.innerHTML = ArticleViewer.emojiItemsTemplate(['😀', '😂', '😉', '😍', '👍', '🎉', '🤔', '😢', '🔥', '✨', '❤️', '🙌'])
    document.body.appendChild(emojiPanel)

    emojiPanel.addEventListener('click', (e: Event) => {
      if (!(e.target as HTMLElement).classList.contains('emoji-item')) return
      const ta = this.shadow.querySelector('[data-part="comment-input"]') as HTMLTextAreaElement | null
      if (ta) {
        ta.value += (e.target as HTMLElement).textContent
        ta.focus()
        ta.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })

    document.addEventListener('click', (e: Event) => {
      if (!emojiPanel.classList.contains('open')) return
      if (emojiPanel.contains(e.target as Node) || (emojiBtn && emojiBtn.contains(e.target as Node))) return
      emojiPanel.classList.remove('open')
    })

    emojiBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation()
      const r = emojiBtn.getBoundingClientRect()
      emojiPanel.style.left = r.left + 'px'
      emojiPanel.style.bottom = (window.innerHeight - r.top + 6) + 'px'
      emojiPanel.classList.toggle('open')
    })
  }

  private _createCommentEl (text: string, name: string): HTMLElement {
    const template = document.createElement('template')
    template.innerHTML = ArticleViewer.commentItemTemplate({
      avatar: COMMENT_AVATARS[0],
      likes: 0,
      name,
      text,
      time: this._formatNow()
    }, this._icons).trim()
    return template.content.firstElementChild as HTMLElement
  }

  private _formatNow (): string {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  private _syncCommentCount (): void {
    const list = this.$('[data-part="comment-list"]') as HTMLElement | null
    const total = this.$('[data-part="comment-total"]') as HTMLElement | null
    if (!list || !total) return
    total.textContent = `共 ${list.querySelectorAll(':scope > .comment-item').length} 条评论`
  }

  /**
   * Giscus 的客户端脚本依赖 document.currentScript 和 document.querySelector，
   * 因而不能直接在 Shadow DOM 内启动。Light DOM 容器通过 slot 投影回评论区，
   * 既满足官方脚本的运行前提，也保持 iframe 的视觉位置不变。
   */
  private _getGiscusMount (): HTMLElement {
    const existing = Array.from(this.children).find(child =>
      child instanceof HTMLElement &&
      child.classList.contains('giscus') &&
      child.slot === 'giscus'
    ) as HTMLElement | undefined
    if (existing) return existing

    const mount = document.createElement('div')
    mount.className = 'giscus'
    mount.slot = 'giscus'
    this.appendChild(mount)
    return mount
  }

  /**
   * Giscus 在 SPA 阅读器里不能使用 pathname 映射（多篇文章共享同一路径），
   * 因此用 commentKey（回退 article.id）生成 specific term，切换文章时重建 iframe。
   */
  private _renderComments (): void {
    const art = this._article
    if (!art) return

    const config = this._giscusConfig
    const enabled = config?.enabled === true
    const legacy = this.$('[data-part="legacy-comments"]') as HTMLElement | null
    const container = this.$('[data-part="giscus"]') as HTMLElement | null
    const statusHost = this.$('[data-part="giscus-status"]') as HTMLElement | null
    const total = this.$('[data-part="comment-total"]') as HTMLElement | null
    if (!legacy || !container || !statusHost) return

    const giscus = this._getGiscusMount()

    legacy.hidden = enabled
    container.hidden = !enabled
    if (!enabled) {
      this._giscusRenderKey = ''
      this._giscusRenderGeneration++
      this.querySelectorAll('script[data-giscus-loader]').forEach(script => script.remove())
      giscus.replaceChildren()
      statusHost.replaceChildren()
      this._syncCommentCount()
      return
    }

    if (total) total.textContent = '由 GitHub Discussions 提供支持'
    const required = [config.repo, config.repoId, config.category, config.categoryId]
    if (required.some(value => !String(value || '').trim())) {
      this._giscusRenderKey = ''
      this._giscusRenderGeneration++
      this.querySelectorAll('script[data-giscus-loader]').forEach(script => script.remove())
      giscus.replaceChildren()
      const status = document.createElement('div')
      status.className = 'giscus-status'
      const title = document.createElement('strong')
      title.textContent = '完成 Giscus 配置后即可开始评论'
      const description = document.createElement('p')
      description.textContent = '评论功能已默认开启，目前还缺少 GitHub Discussions 的必要配置。'
      const steps = document.createElement('ol')
      const repo = /^[\w.-]+\/[\w.-]+$/.test(config.repo) ? config.repo : ''
      const links = [
        {
          text: '在目标仓库开启 Discussions',
          href: repo ? `https://github.com/${repo}/settings` : 'https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository'
        },
        { text: '为仓库安装 Giscus App', href: 'https://github.com/apps/giscus' },
        { text: '在 Giscus 配置页生成并填写 repoId 与 categoryId', href: 'https://giscus.app/zh-CN' }
      ]
      links.forEach(({ text, href }) => {
        const item = document.createElement('li')
        const link = document.createElement('a')
        link.textContent = text
        link.href = href
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        item.appendChild(link)
        steps.appendChild(item)
      })
      status.append(title, description, steps)
      statusHost.replaceChildren(status)
      return
    }

    statusHost.replaceChildren()

    const term = `${config.termPrefix ?? 'article:'}${art.commentKey || art.id}`
    const renderKey = JSON.stringify({
      repo: config.repo,
      repoId: config.repoId,
      category: config.category,
      categoryId: config.categoryId,
      term,
      strict: config.strict !== false,
      reactionsEnabled: config.reactionsEnabled !== false,
      emitMetadata: config.emitMetadata === true,
      inputPosition: config.inputPosition ?? 'top',
      theme: config.theme ?? 'dark_dimmed',
      lang: config.lang ?? 'zh-CN',
      loading: config.loading ?? 'lazy'
    })
    const loader = this.querySelector('script[data-giscus-loader]')
    const frame = giscus.querySelector('.giscus-frame')
    if (this._giscusRenderKey === renderKey && (loader || frame)) return

    this._giscusRenderKey = renderKey
    const generation = ++this._giscusRenderGeneration
    this.querySelectorAll('script[data-giscus-loader]').forEach(script => script.remove())
    giscus.replaceChildren()

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.dataset.giscusLoader = ''
    script.setAttribute('data-repo', config.repo)
    script.setAttribute('data-repo-id', config.repoId)
    script.setAttribute('data-category', config.category)
    script.setAttribute('data-category-id', config.categoryId)
    script.setAttribute('data-mapping', 'specific')
    script.setAttribute('data-term', term)
    script.setAttribute('data-strict', config.strict === false ? '0' : '1')
    script.setAttribute('data-reactions-enabled', config.reactionsEnabled === false ? '0' : '1')
    script.setAttribute('data-emit-metadata', config.emitMetadata === true ? '1' : '0')
    script.setAttribute('data-input-position', config.inputPosition ?? 'top')
    script.setAttribute('data-theme', config.theme ?? 'dark_dimmed')
    script.setAttribute('data-lang', config.lang ?? 'zh-CN')
    script.setAttribute('data-loading', config.loading ?? 'lazy')
    script.addEventListener('load', () => {
      script.remove()
      if (generation === this._giscusRenderGeneration) return
      this._giscusRenderKey = ''
      this._renderComments()
    })
    script.addEventListener('error', () => {
      script.remove()
      if (generation !== this._giscusRenderGeneration) return
      this._giscusRenderKey = ''
      const status = document.createElement('p')
      status.className = 'giscus-status'
      status.textContent = '评论加载失败，请检查网络连接或 Giscus 配置。'
      giscus.replaceChildren()
      statusHost.replaceChildren(status)
    })
    this.appendChild(script)
  }

  // ===== 文章渲染 =====
  private _renderArticle (): void {
    const art = this._article
    if (!art) return
    const icons = this._icons

    // 标题
    const title = this.$('[data-part="title"]')
    if (title) title.textContent = art.title

    // 元信息
    const meta = this.$('[data-part="meta"]')
    if (meta) meta.innerHTML = ArticleViewer.viewerMetaTemplate(art, icons)

    // 标签
    const tagsEl = this.$('[data-part="tags"]') as HTMLElement | null
    if (tagsEl) {
      const tags = (art.tags || []).map(t =>
        `<a class="viewer-tag" href="./#tag=${encodeURIComponent(t)}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</a>`
      ).join('')
      tagsEl.innerHTML = tags
      tagsEl.style.display = tags ? '' : 'none'
    }

    // 封面
    const cover = this.$('[data-part="cover"]') as HTMLImageElement | null
    if (cover) {
      cover.src = art.cover
      cover.alt = art.title
    }

    // 正文
    const content = this.$('[data-part="content"]')
    if (content) content.innerHTML = ArticleViewer.articleParagraphsTemplate(art.paragraphs)

    // 评论（启用 Giscus 时会隐藏本地演示评论并加载对应 Discussion）
    const comments = art.comments || []
    const list = this.$('[data-part="comment-list"]')
    if (list) {
      list.innerHTML = comments.length
        ? comments.map(c => ArticleViewer.commentItemTemplate(c, icons)).join('')
        : '<p class="comment-empty">还没有评论，来抢沙发吧～</p>'
    }
    this._renderComments()

    // 推荐
    const rec = this.$('[data-part="recommend-list"]')
    if (rec) {
      const others = this._articles.filter(a => a.id !== art.id)
      const same = others.filter(a => a.cat === art.cat)
      const rest = others.filter(a => a.cat !== art.cat)
      const recs = [...same, ...rest].slice(0, 6)
      const aside = this.$('[data-part="aside"]') as HTMLElement | null
      if (aside) aside.hidden = recs.length === 0
      rec.innerHTML = recs.length
        ? recs.map((r, i) => ArticleViewer.recommendationItemTemplate(r, { href: '#', isLast: i === recs.length - 1 })).join('')
        : '<p class="viewer-rec-empty">暂无推荐</p>'
    }

    // 目录名
    const catName = this.$('[data-part="cat-name"]') as HTMLAnchorElement | null
    if (catName) {
      catName.textContent = this._catNames[art.cat] || art.cat
      catName.href = './#cat=' + encodeURIComponent(art.cat)
    }

    // 滚动复位
    const main = this.$('[data-part="main"]') as HTMLElement | null
    main?.scrollTo(0, 0)
    const body = this.$('[data-part="body"]') as HTMLElement | null
    body?.scrollTo(0, 0)
    const aside = this.$('[data-part="aside"]') as HTMLElement | null
    aside?.scrollTo(0, 0)
  }

  // ===== FLIP 动画 =====
  private _open (): void {
    this.classList.add('is-open')
    this.hidden = false
    this._viewerGen++
    this._renderArticle()
  }

  private _close (): void {
    this.classList.remove('is-open')
    this.hidden = true
    this._viewerGen++
    this._trackedPageViewArticleId = null
    if (this._pageViewFallbackTimer !== null) {
      window.clearTimeout(this._pageViewFallbackTimer)
      this._pageViewFallbackTimer = null
    }
    this.emit('viewer-close')
  }

  /** 外部调用，触发 FLIP 展开动画 */
  openWithFlip (cardEl: HTMLElement | null, siteName: string): void {
    this._cardEl = cardEl
    this._viewerGen++
    this.classList.add('is-open')
    this.hidden = false
    this._renderArticle()

    const art = this._article
    if (!art) return

    const gen = this._viewerGen
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // 更新标题
    document.title = art.title + ' - ' + siteName

    requestAnimationFrame(() => {
      if (gen !== this._viewerGen) return
      const vBase = this.getBoundingClientRect()
      const cardVp = cardEl ? cardEl.getBoundingClientRect() : null
      const cardLocal = cardVp ? {
        left: cardVp.left - vBase.left,
        top: cardVp.top - vBase.top,
        width: cardVp.width,
        height: cardVp.height
      } : null
      const coverEl = this.shadow.querySelector('[data-part="cover"]') as HTMLElement | null
      const coverRect = coverEl?.getBoundingClientRect()
      const coverLocal = coverRect ? {
        left: coverRect.left - vBase.left,
        top: coverRect.top - vBase.top,
        width: coverRect.width,
        height: coverRect.height
      } : null

      const panel = this.$('[data-part="panel"]') as HTMLElement | null
      const body = this.$('[data-part="body"]') as HTMLElement | null
      const backdrop = this.$('[data-part="backdrop"]') as HTMLElement | null
      const ghost = this.$('[data-part="ghost"]') as HTMLElement | null

      if (panel) panel.classList.add('viewer-open')
      if (body) body.classList.add('viewer-mask')
      if (backdrop) backdrop.classList.add('viewer-in')

      // 无动画情况
      if (reduceMotion || !cardLocal || !coverLocal) {
        if (body) { body.classList.remove('viewer-mask'); body.classList.add('viewer-in') }
        return
      }

      // 面板放大动画
      if (panel) {
        const P = { left: 0, top: 0, width: vBase.width, height: vBase.height }
        panel.classList.add('is-anim')
        panel.style.transformOrigin = 'top left'
        panel.style.transition = 'none'
        panel.style.transform = `translate(${cardLocal.left}px, ${cardLocal.top}px) scale(${cardLocal.width / P.width}, ${cardLocal.height / P.height})`
        void panel.offsetWidth
        panel.style.transition = `transform ${FLIP_OPEN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
        panel.style.transform = ''
      }

      // 封面克隆飞行
      if (ghost && coverEl) {
        const thumbEl = cardEl?.querySelector('.card-thumb') as HTMLElement | null
        const thumbRect = thumbEl?.getBoundingClientRect()
        const thumbLocal = thumbRect ? {
          left: thumbRect.left - vBase.left,
          top: thumbRect.top - vBase.top,
          width: thumbRect.width,
          height: thumbRect.height
        } : cardLocal

        ghost.style.display = 'block'
        ghost.style.left = '0'
        ghost.style.top = '0'
        ghost.style.transformOrigin = 'top left'
        ghost.style.width = (thumbLocal?.width || 0) + 'px'
        ghost.style.height = (thumbLocal?.height || 0) + 'px'
        const ghostImg = ghost as HTMLImageElement
        ghostImg.src = (coverEl as HTMLImageElement).src
        const fromTf = `translate(${thumbLocal?.left || 0}px, ${thumbLocal?.top || 0}px) scale(1, 1)`
        const toTf = `translate(${coverLocal.left}px, ${coverLocal.top}px) scale(${coverLocal.width / (thumbLocal?.width || 1)}, ${coverLocal.height / (thumbLocal?.height || 1)})`
        ghost.style.transform = fromTf
        const fly = ghost.animate(
          [{ transform: fromTf }, { transform: toTf }],
          { duration: FLIP_OPEN_MS + 80, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }
        )
        setTimeout(() => {
          if (gen === this._viewerGen && body) {
            body.classList.remove('viewer-mask')
            body.classList.add('viewer-in')
          }
        }, Math.round(FLIP_OPEN_MS * 0.8))
        setTimeout(() => {
          if (gen === this._viewerGen) {
            if (fly && fly.cancel) fly.cancel()
            if (ghost) { ghost.style.display = 'none'; ghost.style.transform = '' }
            if (panel) { panel.classList.remove('is-anim'); panel.style.transition = ''; panel.style.transform = '' }
          }
        }, FLIP_OPEN_MS + 160)
      }
    })
  }

  closeWithFlip (): void {
    const gen = ++this._viewerGen
    this._swapPendingId = null
    const artId = this._article?.id

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const card = this._cardEl
    const cardVp = this._rectOf(card)

    const finish = () => {
      if (gen !== this._viewerGen) return
      this._close()
      const panel = this.$('[data-part="panel"]') as HTMLElement | null
      if (panel) {
        panel.style.transition = ''
        panel.style.transform = ''
        panel.style.transformOrigin = ''
        panel.style.opacity = ''
        panel.classList.remove('is-anim')
      }
      const body = this.$('[data-part="body"]') as HTMLElement | null
      if (body) {
        body.classList.add('viewer-mask')
        body.classList.remove('viewer-in')
      }
      const backdrop = this.$('[data-part="backdrop"]') as HTMLElement | null
      if (backdrop) backdrop.classList.remove('viewer-in')
      this._ghostReset()
      if (card && card.focus) card.focus({ preventScroll: true })
    }

    if (reduceMotion || !artId || !this._inViewportRect(cardVp)) {
      const backdrop = this.$('[data-part="backdrop"]') as HTMLElement | null
      if (backdrop) backdrop.classList.remove('viewer-in')
      finish()
      return
    }

    // 1) 内容淡出
    const body = this.$('[data-part="body"]') as HTMLElement | null
    if (body) {
      body.classList.add('viewer-mask')
      body.classList.remove('viewer-in')
    }

    // 2) 延迟后面板反向收拢
    setTimeout(() => {
      if (gen !== this._viewerGen) return
      const vBase = this.getBoundingClientRect()
      const cardLocal = this._toLocalRect(cardVp, vBase)
      const coverEl = this.shadow.querySelector('[data-part="cover"]') as HTMLElement | null
      const coverLocal = coverEl ? this._toLocalRect(this._rectOf(coverEl), vBase) : null
      if (!cardLocal) { finish(); return }

      const P = { left: 0, top: 0, width: vBase.width, height: vBase.height }
      const panel = this.$('[data-part="panel"]') as HTMLElement | null
      if (panel) {
        panel.classList.add('is-anim')
        panel.style.transformOrigin = 'top left'
        // 面板先收拢到卡片矩形，到达后（FLIP_CLOSE_MS 后）自身淡出，
        // 避免不透明面板停在卡片上方、finish 突隐造成"暗块→卡片"截断闪
        panel.style.transition =
          `transform ${FLIP_CLOSE_MS}ms cubic-bezier(0.45, 0, 0.55, 1), opacity 110ms ease ${FLIP_CLOSE_MS}ms`
        panel.style.transform = `translate(${cardLocal.left}px, ${cardLocal.top}px) scale(${cardLocal.width / P.width}, ${cardLocal.height / P.height})`
        panel.style.opacity = '0'
      }

      // 封面克隆从正文封面缩回卡片缩略图，收拢动画更有"归位感"
      const thumbVp = card ? this._rectOf(card.querySelector('.card-thumb') as HTMLElement) : null
      const thumbLocal = this._toLocalRect(thumbVp, vBase) || cardLocal
      const ghost = this.$('[data-part="ghost"]') as HTMLImageElement | null
      if (coverLocal && coverEl && ghost && (coverEl as HTMLImageElement).src) {
        this._ghostShow()
        ghost.style.left = '0'
        ghost.style.top = '0'
        ghost.style.transformOrigin = 'top left'
        ghost.style.width = coverLocal.width + 'px'
        ghost.style.height = coverLocal.height + 'px'
        ghost.src = (coverEl as HTMLImageElement).src
        const fromTf = `translate(${coverLocal.left}px, ${coverLocal.top}px) scale(1, 1)`
        const toTf = `translate(${thumbLocal.left}px, ${thumbLocal.top}px) scale(${thumbLocal.width / coverLocal.width}, ${thumbLocal.height / coverLocal.height})`
        ghost.style.transform = fromTf
        // 克隆以 fill:'both' 保持收拢末帧，交由 finish 的 _ghostReset 统一取消，
        // 避免中途 cancel 使封面弹回原位、造成"详情快速缩放"的闪烁
        const flyBack = ghost.animate(
          [{ transform: fromTf }, { transform: toTf }],
          { duration: FLIP_CLOSE_MS, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'both' }
        )
        // 收拢完成时把克隆 inline 态落到"缩略图位置/尺寸"，与真实卡片缩略图逐像素对齐，
        // 停驻窗口内取消动画也不回弹，finish 隐藏时无缝交接
        setTimeout(() => {
          if (gen !== this._viewerGen) return
          if (flyBack && flyBack.cancel) flyBack.cancel()
          ghost.style.width = thumbLocal.width + 'px'
          ghost.style.height = thumbLocal.height + 'px'
          ghost.style.transform = `translate(${thumbLocal.left}px, ${thumbLocal.top}px)`
        }, FLIP_CLOSE_MS)
      }

      const backdrop = this.$('[data-part="backdrop"]') as HTMLElement | null
      if (backdrop) backdrop.classList.remove('viewer-in')

      setTimeout(finish, FLIP_CLOSE_MS + 110)
    }, 130)
  }

  private _rectOf (el: HTMLElement | null): { left: number; top: number; width: number; height: number } | null {
    if (!el || !el.getBoundingClientRect) return null
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 ? { left: r.left, top: r.top, width: r.width, height: r.height } : null
  }

  private _toLocalRect (r: { left: number; top: number; width: number; height: number } | null, base: { left: number; top: number }): { left: number; top: number; width: number; height: number } | null {
    if (!r) return null
    return { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height }
  }

  private _inViewportRect (r: { left: number; top: number; width: number; height: number } | null): boolean {
    if (!r) return false
    const right = r.left + r.width
    const bottom = r.top + r.height
    return right > 0 && r.left < window.innerWidth &&
      bottom > 0 && r.top < window.innerHeight
  }

  private _ghostShow (): void {
    const ghost = this.$('[data-part="ghost"]') as HTMLElement | null
    if (ghost) ghost.style.display = 'block'
  }

  private _ghostReset (): void {
    const ghost = this.$('[data-part="ghost"]') as HTMLElement | null
    if (ghost) {
      ghost.style.display = 'none'
      ghost.style.transform = ''
      ghost.style.width = ''
      ghost.style.height = ''
      ghost.style.left = ''
      ghost.style.top = ''
    }
    if (ghost && ghost.getAnimations) ghost.getAnimations().forEach(a => a.cancel())
  }
}

if (!customElements.get('article-viewer')) {
  customElements.define('article-viewer', ArticleViewer)
}

export { ArticleViewer }
