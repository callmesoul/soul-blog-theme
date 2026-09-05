import { WcBase } from '../helpers/wc-base'
import { escapeHtml } from '../helpers/escape-html'
import type { Category, SocialItem } from '../types'

/** 导航项数据结构（首页 + 各目录） */
export interface NavItem {
  cat: string
  zh: string
  en: string
  icon: string
  w: number
  h: number
}

/**
 * 首页侧栏组件
 *
 * 属性：
 *   active-cat — 当前激活的目录 id（默认 'all'）
 *
 * 属性（JS property）：
 *   categories — Category[] 目录列表
 *   social     — SocialItem[] 社交链接
 *   siteName   — 站点名称
 *   icp        — 备案文案
 *
 * 事件：
 *   navigate — 导航点击时触发，detail 为 { cat: string }
 */
class SiteSidebar extends WcBase {
  static get observedAttributes (): string[] {
    return ['active-cat']
  }

  /** 导航高亮指示条元素 */
  private _hlEl: HTMLElement | null = null

  /** 导出导航模板供 main.js 过渡期使用 */
  static navigationItemsTemplate (items: NavItem[], activeCat: string): string {
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

  protected render (): string {
    const activeCat = this.getAttribute('active-cat') || 'all'
    const categories = (this as any)._categories as Category[] | undefined
    const social = (this as any)._social as SocialItem[] | undefined
    const icp = (this as any)._icp as string | undefined

    // 导航项：首页 + 各目录
    const navItems = [
      { cat: 'all', zh: '首页', en: 'Home', icon: '/images/extracted/home/iconfont-shouye@2x.png', w: 21, h: 21 },
      ...(categories || []).map(c => ({
        cat: c.id, zh: c.name, en: c.en, icon: c.icon, w: c.w, h: c.h
      }))
    ]

    const navHtml = SiteSidebar.navigationItemsTemplate(navItems, activeCat)

    // 社交栏
    const socialHtml = (social || []).map(s => {
      const name = escapeHtml(s.name || '')
      const icon = `<img${s.mono ? ' class="tone-mono"' : ''} src="${escapeHtml(s.icon)}" alt="${name}" style="width:${s.width || 22}px;height:${s.height || 18}px;object-fit:contain;--hue:${s.hue ?? 0}deg;">`
      const href = s.href && s.href !== '#' ? escapeHtml(s.href) : ''
      const qr = s.qr && s.qr !== '#' ? escapeHtml(s.qr) : ''

      if (href) {
        return `<a class="social-icon has-link" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${name}" title="${name}">${icon}</a>`
      }
      if (qr) {
        return `<span class="social-icon has-qr" role="img" tabindex="0" aria-label="${name}二维码" title="扫码关注${name}">
          ${icon}
          <span class="social-qr"><img class="qr-image" src="${qr}" alt="${name}二维码"><em>扫一扫关注</em><b>${name}</b></span>
        </span>`
      }
      return `<span class="social-icon is-static" aria-label="${name}" title="${name}">${icon}</span>`
    }).join('')

    return `
      <style>
        :host {
          display: contents;
        }
        .sidebar {
          display: flex;
          height: 100%;
          width: 372px;
          min-width: 372px;
          max-width: 372px;
          flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.16);
          background: rgba(15,14,13,0.55);
          backdrop-filter: blur(16px) saturate(120%);
          -webkit-backdrop-filter: blur(16px) saturate(120%);
          position: relative;
          z-index: 20;
        }
        @media (max-width: 1023px) {
          .sidebar { width: 64px; min-width: 64px; background: rgba(15,14,13,0.85); }
        }
        .logo-area {
          padding: 20px 0 20px 84px;
        }
        @media (max-width: 1023px) {
          .logo-area { display: none; }
        }
        @media (max-width: 1199px) {
          .nav-item {
            padding: 24px 0 !important;
            justify-content: center;
          }
          .nav-item > div { display: none; }
          .footer-area > div:first-child { display: none; }
          .social-bar {
            flex-direction: column;
            width: 100%;
            height: auto !important;
            border-top: none;
          }
          .social-icon {
            min-height: 48px;
            border-right: none;
            border-bottom: 1px solid #2a2a2a;
          }
          .social-icon:last-child { border-bottom: none; }
        }
        .site-nav {
          flex: 1;
          overflow-x: hidden;
          overflow-y: auto;
          position: relative;
        }
        .site-nav::-webkit-scrollbar {
          width: 4px;
        }
        .nav-item {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 24px 84px;
          color: #9e9d99;
          cursor: pointer;
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
          transition: color 0.25s ease;
        }
        .nav-item:hover {
          color: #ffffff;
        }
        .nav-item.active {
          color: #ffffff;
        }
        .nav-icon {
          width: 21px;
          height: 21px;
          object-fit: contain;
          filter: brightness(0) invert(0.62);
          flex-shrink: 0;
          transition: filter 0.25s ease, transform 0.25s ease;
        }
        .nav-item:hover .nav-icon,
        .nav-item.active .nav-icon {
          filter: brightness(0) invert(1);
          transform: scale(1.06);
        }
        .nav-item:active .nav-icon {
          transform: scale(0.95);
        }
        .nav-zh {
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.04em;
          line-height: 1.3;
          margin-bottom: 5px;
        }
        .nav-en {
          font-family: var(--font-sans);
          font-size: 11px;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          line-height: 1.3;
        }
        .nav-highlight {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 0;
          pointer-events: none;
          opacity: 0;
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease;
          will-change: transform;
        }
        .nav-highlight.is-on {
          opacity: 1;
        }
        .nav-highlight.no-anim {
          transition: none;
        }
        .nav-highlight::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg,
            rgba(var(--brand-rgb), 0.24) 0%,
            rgba(var(--brand-rgb), 0.08) 55%,
            rgba(var(--brand-rgb), 0) 100%);
        }
        .nav-highlight::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--brand-primary);
        }
        @media (prefers-reduced-motion: reduce) {
          .nav-highlight {
            transition: opacity 0.15s ease;
          }
        }
        .footer-area {
          margin-top: 12px;
        }
        .icp-text {
          padding: 0 96px 24px;
          font-size: 12px;
          line-height: 1.3;
          letter-spacing: 0.02em;
          color: #6b6b6b;
        }
        .social-bar {
          display: flex;
          height: 51px;
          border-top: 1px solid #333;
        }
        .social-icon {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #333;
          text-decoration: none;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: box-shadow 0.25s ease;
        }
        .social-icon:last-child {
          border-right: none;
        }
        .social-icon img {
          --hue: 0deg;
          opacity: 1;
          filter: invert(64%) sepia(79%) saturate(467%) hue-rotate(var(--hue)) brightness(97%);
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), filter 0.25s ease;
        }
        .social-icon::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(var(--brand-rgb), 0.10), rgba(255, 255, 255, 0.03) 55%, rgba(var(--brand-rgb), 0.05));
          opacity: 0;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }
        .social-icon:hover::before,
        .social-icon:focus-visible::before {
          opacity: 1;
        }
        .social-bar .social-icon:hover img,
        .social-bar .social-icon:focus-visible img {
          opacity: 1;
          transform: translateY(-1px) scale(1.06);
          filter: invert(54%) sepia(88%) saturate(740%) hue-rotate(var(--hue)) brightness(112%);
        }
        .social-icon:hover,
        .social-icon:focus-visible {
          box-shadow: inset 0 -2px 0 var(--brand-primary);
          outline: none;
        }
        .social-icon:active img {
          transform: translateY(0) scale(0.92);
          opacity: 0.85;
        }
        .social-icon::after {
          content: attr(aria-label);
          position: absolute;
          left: 50%;
          bottom: calc(100% + 10px);
          transform: translateX(-50%) translateY(4px);
          padding: 4px 10px;
          border: 1px solid #3c3936;
          border-radius: 4px;
          background: rgba(20, 19, 18, 0.92);
          color: #ffffff;
          font-family: var(--font-sans);
          font-size: 12px;
          line-height: 1.4;
          letter-spacing: 0.02em;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
          z-index: 60;
        }
        .social-icon:hover::after,
        .social-icon:focus-visible::after {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .social-bar .social-icon img.tone-mono {
          filter: brightness(0) invert(0.62);
        }
        .social-bar .social-icon:hover img.tone-mono,
        .social-bar .social-icon:focus-visible img.tone-mono {
          filter: brightness(0) invert(0.92);
        }
        .social-icon.has-qr::after {
          display: none;
        }
        .social-icon.has-qr {
          cursor: help;
        }
        .social-icon .social-qr {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 10px);
          transform: translateX(-50%) translateY(6px);
          width: 150px;
          padding: 10px 10px 9px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          background: rgba(22, 21, 20, 0.96);
          border: 1px solid #3c3936;
          border-radius: 8px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
          z-index: 70;
        }
        .social-bar .social-icon .social-qr img.qr-image {
          width: 124px;
          height: 124px;
          display: block;
          object-fit: contain;
          padding: 5px;
          border-radius: 6px;
          background: #ffffff;
          filter: none !important;
          transform: none !important;
          opacity: 1 !important;
        }
        .social-qr em {
          font-style: normal;
          font-family: var(--font-sans);
          font-size: 11px;
          color: #9e9d99;
          line-height: 1.4;
          letter-spacing: 0.5px;
        }
        .social-qr b {
          font-family: var(--font-sans);
          font-size: 12px;
          color: #ffffff;
          line-height: 1.4;
          font-weight: 500;
          letter-spacing: 0.04em;
        }
        .social-icon.has-qr:hover .social-qr,
        .social-icon.has-qr:focus-visible .social-qr {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .social-icon:first-child .social-qr {
          left: 6px;
          transform: translateY(6px);
        }
        .social-icon:first-child.has-qr:hover .social-qr,
        .social-icon:first-child.has-qr:focus-visible .social-qr {
          transform: translateY(0);
        }
        .social-icon:last-child .social-qr {
          left: auto;
          right: 6px;
          transform: translateY(6px);
        }
        .social-icon:last-child.has-qr:hover .social-qr,
        .social-icon:last-child.has-qr:focus-visible .social-qr {
          transform: translateY(0);
        }
      </style>
      <aside class="sidebar">
        <div class="logo-area">
          <img src="/images/extracted/login/图形@2x.png" alt="CallMeSoul" class="block h-[55px] w-[60px] object-contain">
        </div>

        <nav class="site-nav" aria-label="文章目录">
          ${navHtml}
          <span class="nav-highlight" aria-hidden="true"></span>
        </nav>

        <div class="footer-area">
          <div class="icp-text">${icp ? escapeHtml(icp) : '@CallMeSoul 粤ICP备15053557'}</div>
          <div class="social-bar" aria-label="社交媒体">${socialHtml}</div>
        </div>
      </aside>
    `
  }

  protected mounted (): void {
    this._hlEl = this.$('.nav-highlight')
    this._layoutHighlight()

    // 导航点击事件委托
    const nav = this.$('.site-nav') as HTMLElement | null
    nav?.addEventListener('click', (e: Event) => {
      const item = (e.target as HTMLElement).closest('.nav-item') as HTMLElement | null
      if (!item) return
      const cat = (item.dataset as Record<string, string>).cat
      if (cat) {
        e.preventDefault()
        this.emit('navigate', { cat })
      }
    })
  }

  attributeChangedCallback (name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return
    // active-cat 变化时只更新高亮和 active 类，不重建整个 DOM
    if (name === 'active-cat') {
      this._syncActiveClass(newValue || 'all')
      this._layoutHighlight()
    }
  }

  /** 属性 setter：JS property 写入 */
  set categories (val: Category[]) {
    (this as any)._categories = val
    this._reRender()
  }
  set social (val: SocialItem[]) {
    (this as any)._social = val
    this._reRender()
  }
  set icp (val: string) {
    (this as any)._icp = val
    this._reRender()
  }

  private _reRender (): void {
    // 重建整个 Shadow DOM
    this.shadow.innerHTML = ''
    this.shadow.innerHTML = this.render()
    this.mounted()
  }

  private _syncActiveClass (activeCat: string): void {
    this.shadow.querySelectorAll<HTMLElement>('.nav-item').forEach(el => {
      el.classList.toggle('active', (el.dataset as Record<string, string>).cat === activeCat)
    })
  }

  private _layoutHighlight (): void {
    const hl = this._hlEl
    if (!hl) return
    const activeCat = this.getAttribute('active-cat') || 'all'
    const items = Array.from(this.shadow.querySelectorAll<HTMLElement>('.nav-item'))
    const active = items.find(el => (el.dataset as Record<string, string>).cat === activeCat) || items[0]
    if (!active) {
      hl.classList.remove('is-on')
      return
    }
    const created = !hl.classList.contains('is-on')
    if (created) hl.classList.add('no-anim')
    hl.style.height = active.offsetHeight + 'px'
    hl.style.transform = 'translateY(' + active.offsetTop + 'px)'
    hl.classList.add('is-on')
    if (created) requestAnimationFrame(() => hl.classList.remove('no-anim'))
  }
}

if (!customElements.get('site-sidebar')) {
  customElements.define('site-sidebar', SiteSidebar)
}

export { SiteSidebar }