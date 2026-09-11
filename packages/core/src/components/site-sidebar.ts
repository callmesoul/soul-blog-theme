import { WcBase } from '../helpers/wc-base'
import { escapeHtml } from '../helpers/escape-html'
import type { Category, SocialItem } from '../types'

/** 二级目录项数据结构 */
export interface NavItem {
  cat: string
  zh: string
  en: string
  icon: string
  w: number
  h: number
}

/** 标签项数据结构 */
export interface TagItem {
  name: string
  count: number
}

/**
 * 双轨站点侧栏
 *
 * 一级导航固定为：首页 / 目录 / 归档。
 * 桌面端始终展示二级栏；点击「目录」时才显示分类和标签列表。
 */
class SiteSidebar extends WcBase {
  static get observedAttributes (): string[] {
    return ['active-cat', 'active-tag']
  }

  private _hlEl: HTMLElement | null = null
  private _directoryOpen = false

  /** 导出二级目录模板供过渡期代码复用 */
  static navigationItemsTemplate (items: NavItem[], activeCat: string): string {
    return items.map((item, index) => `
      <a class="nav-item${item.cat === activeCat ? ' active' : ''}"
         href="./#cat=${encodeURIComponent(item.cat)}"
         data-cat="${escapeHtml(item.cat)}"
         title="${escapeHtml(item.zh)} · ${escapeHtml(item.en)}">
        <span class="nav-icon-slot" aria-hidden="true">
          <img class="nav-icon" src="${escapeHtml(item.icon)}" alt=""
               style="width:${Number(item.w)}px;height:${Number(item.h)}px;">
        </span>
        <span class="nav-copy">
          <span class="nav-zh">${escapeHtml(item.zh)}</span>
          <span class="nav-en">${escapeHtml(item.en)}</span>
        </span>
        <span class="nav-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      </a>
    `).join('')
  }

  protected render (): string {
    const activeCat = this.getAttribute('active-cat') || 'all'
    const activeTag = this.getAttribute('active-tag') || ''
    const categories = (this as any)._categories as Category[] | undefined
    const social = (this as any)._social as SocialItem[] | undefined
    const tags = (this as any)._tags as TagItem[] | undefined
    const icp = (this as any)._icp as string | undefined
    const archiveUrl = (this as any)._archiveUrl as string | undefined
    const aboutUrl = (this as any)._aboutUrl as string | undefined
    const friendsUrl = (this as any)._friendsUrl as string | undefined
    const siteName = ((this as any)._siteName as string | undefined) || 'CallMeSoul'

    const categoryItems = (categories || []).map(c => ({
      cat: c.id,
      zh: c.name,
      en: c.en,
      icon: c.icon,
      w: c.w,
      h: c.h,
      count: c.count
    }))
    const categorySelected = !['all', 'archives', 'about', 'friends'].includes(activeCat)
    const directoryOpen = this._directoryOpen || categorySelected
    const panelHidden = typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1199px)').matches && !directoryOpen
    const homeActive = activeCat === 'all' && !directoryOpen
    const directoryActive = directoryOpen || categorySelected
    const archiveActive = activeCat === 'archives'
    const aboutActive = activeCat === 'about'
    const friendsActive = activeCat === 'friends'

    const categoryHtml = SiteSidebar.navigationItemsTemplate(categoryItems, activeTag ? '' : activeCat)
    const tagHtml = (tags || []).map(t => {
      const isActive = t.name === activeTag
      return `<a class="tag-item${isActive ? ' active' : ''}"
                 href="./#tag=${encodeURIComponent(t.name)}"
                 data-tag="${escapeHtml(t.name)}">
                <span class="tag-name">${escapeHtml(t.name)}</span>
                <span class="tag-count">${Number(t.count)}</span>
              </a>`
    }).join('')

    const socialHtml = (social || []).map(s => {
      const name = escapeHtml(s.name || '')
      const icon = `<img${s.mono ? ' class="tone-mono"' : ''}
                         src="${escapeHtml(s.icon)}" alt="${name}"
                         style="width:${s.width || 22}px;height:${s.height || 18}px;object-fit:contain;--hue:${s.hue ?? 0}deg;">`
      const href = s.href && s.href !== '#' ? escapeHtml(s.href) : ''
      const qr = s.qr && s.qr !== '#' ? escapeHtml(s.qr) : ''

      if (href) {
        return `<a class="social-icon has-link" href="${href}" target="_blank"
                   rel="noopener noreferrer" aria-label="${name}" title="${name}">${icon}</a>`
      }
      if (qr) {
        return `<span class="social-icon has-qr" role="img" aria-label="${name}二维码" title="扫码关注${name}">
          ${icon}
          <span class="social-qr">
            <img class="qr-image" src="${qr}" alt="${name}二维码">
            <em>扫一扫关注</em><b>${name}</b>
          </span>
        </span>`
      }
      return `<span class="social-icon is-static" aria-label="${name}" title="${name}">${icon}</span>`
    }).join('')

    const archiveHtml = archiveUrl
      ? `<a class="primary-item${archiveActive ? ' active' : ''}"
            href="${escapeHtml(archiveUrl)}" data-cat="archives"
            aria-label="归档" title="归档 · Archives">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4.5 8h15v10.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5z"></path>
            <path d="M3.5 4h17v4h-17zM9 12h6"></path>
          </svg>
          <span class="primary-tooltip">归档</span>
        </a>`
      : ''

    const aboutHtml = aboutUrl
      ? `<a class="primary-item${aboutActive ? ' active' : ''}"
            href="${escapeHtml(aboutUrl)}" data-cat="about"
            aria-label="关于" title="关于我 · About">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="3"></circle>
            <path d="M6 19c.8-4 3-6 6-6s5.2 2 6 6"></path>
          </svg>
          <span class="primary-tooltip">关于</span>
        </a>`
      : ''

    const friendsHtml = friendsUrl
      ? `<a class="primary-item${friendsActive ? ' active' : ''}"
            href="${escapeHtml(friendsUrl)}" data-cat="friends"
            aria-label="友链" title="友链 · Friends">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="8" cy="12" r="3.5"></circle>
            <circle cx="16" cy="12" r="3.5"></circle>
            <path d="M11.5 12h1M5.2 9.5 3.8 8M18.8 9.5 20.2 8"></path>
          </svg>
          <span class="primary-tooltip">友链</span>
        </a>`
      : ''

    return `
      <style>
        :host {
          display: contents;
        }
        * {
          box-sizing: border-box;
        }
        .sidebar {
          position: relative;
          z-index: 20;
          display: flex;
          width: 320px;
          min-width: 320px;
          max-width: 320px;
          height: 100%;
          color: #f2f2f2;
          transition: width 0.32s cubic-bezier(0.22, 1, 0.36, 1),
                      min-width 0.32s cubic-bezier(0.22, 1, 0.36, 1),
                      max-width 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .sidebar.directory-open {
          width: 320px;
          min-width: 320px;
          max-width: 320px;
        }

        /* 一级图标轨道 */
        .primary-rail {
          position: relative;
          z-index: 2;
          display: flex;
          width: 68px;
          min-width: 68px;
          height: 100%;
          flex-direction: column;
          align-items: center;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(9, 9, 9, 0.97);
          backdrop-filter: blur(18px) saturate(120%);
          -webkit-backdrop-filter: blur(18px) saturate(120%);
        }
        .primary-logo {
          display: grid;
          width: 38px;
          height: 38px;
          margin: 22px auto 26px;
          place-items: center;
          border-radius: 11px;
          background: var(--brand-primary);
          box-shadow: 0 8px 22px rgba(var(--brand-rgb), 0.24);
        }
        .primary-logo img {
          display: block;
          width: 21px;
          height: auto;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }
        .primary-nav {
          display: flex;
          width: 100%;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .primary-item {
          position: relative;
          display: grid;
          width: 42px;
          height: 42px;
          padding: 0;
          place-items: center;
          border: 0;
          border-radius: 12px;
          color: #76716b;
          background: transparent;
          cursor: pointer;
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
          transition: color 0.2s ease, background 0.2s ease, transform 0.2s ease;
        }
        .primary-item::before {
          content: '';
          position: absolute;
          top: 8px;
          bottom: 8px;
          left: -13px;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: var(--brand-primary);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .primary-item:hover,
        .primary-item:focus-visible {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.055);
        }
        .primary-item.active {
          color: var(--brand-primary);
          background: rgba(var(--brand-rgb), 0.14);
        }
        .primary-item.active::before {
          opacity: 1;
        }
        .primary-item:active {
          transform: scale(0.94);
        }
        .primary-item img {
          display: block;
          width: 20px;
          height: 20px;
          object-fit: contain;
          filter: brightness(0) invert(0.46);
          transition: filter 0.2s ease;
        }
        .primary-item:hover img,
        .primary-item:focus-visible img {
          filter: brightness(0) invert(1);
        }
        .primary-item.active img {
          filter: brightness(0) saturate(100%) invert(46%) sepia(82%) saturate(2207%) hue-rotate(336deg) brightness(100%) contrast(87%);
        }
        .primary-item svg {
          width: 19px;
          height: 19px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 1.8;
        }
        .primary-tooltip {
          position: absolute;
          top: 50%;
          left: calc(100% + 12px);
          z-index: 80;
          padding: 5px 9px;
          border: 1px solid #3c3936;
          border-radius: 6px;
          color: #ffffff;
          background: rgba(20, 19, 18, 0.96);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.3);
          font-family: var(--font-sans);
          font-size: 11px;
          line-height: 1.3;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translate(-4px, -50%);
          transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
        }
        .primary-item:hover .primary-tooltip,
        .primary-item:focus-visible .primary-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translate(0, -50%);
        }
        .directory-open .primary-tooltip {
          display: none;
        }
        .rail-caption {
          margin-top: auto;
          margin-bottom: 18px;
          color: #494541;
          font-family: var(--font-sans);
          font-size: 8px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          writing-mode: vertical-rl;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .rail-caption:hover { color: #9e9d99; }

        /* 二级目录面板 */
        .secondary-panel {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 68px;
          z-index: 1;
          display: flex;
          width: 252px;
          flex-direction: column;
          border-right: 1px solid rgba(255, 255, 255, 0.12);
          color: #f2f2f2;
          background: rgba(20, 18, 16, 0.94);
          box-shadow: 18px 0 48px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(18px) saturate(120%);
          -webkit-backdrop-filter: blur(18px) saturate(120%);
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateX(0);
          transition: opacity 0.24s ease,
                      transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
                      visibility 0.24s;
        }
        .secondary-header {
          display: flex;
          min-height: 104px;
          padding: 22px 16px;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .secondary-title {
          min-width: 0;
        }
        .context-title {
          display: none;
        }
        .sidebar:not(.directory-open):not(.archive-context):not(.about-context):not(.friends-context) .context-home,
        .sidebar.directory-open .context-directory,
        .sidebar.archive-context:not(.directory-open) .context-archive,
        .sidebar.about-context:not(.directory-open) .context-about,
        .sidebar.friends-context:not(.directory-open) .context-friends {
          display: block;
        }
        .secondary-title small,
        .secondary-title strong,
        .secondary-title span {
          display: block;
        }
        .secondary-title small {
          overflow: hidden;
          margin-bottom: 5px;
          color: #706a64;
          font-family: var(--font-sans);
          font-size: 9px;
          line-height: 1.2;
          letter-spacing: 0.05em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .secondary-title strong {
          color: #ffffff;
          font-family: var(--font-sans);
          font-size: 17px;
          font-weight: 500;
          line-height: 1.25;
          letter-spacing: 0.04em;
        }
        .secondary-title span {
          margin-top: 3px;
          color: #625d57;
          font-family: var(--font-sans);
          font-size: 8px;
          line-height: 1.2;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .panel-close {
          display: none;
          width: 32px;
          height: 32px;
          flex: 0 0 auto;
          padding: 0;
          place-items: center;
          border: 0;
          border-radius: 8px;
          color: #746e68;
          background: rgba(255, 255, 255, 0.04);
          cursor: pointer;
        }
        .panel-close:hover,
        .panel-close:focus-visible {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }
        .panel-close svg {
          width: 15px;
          height: 15px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-width: 1.8;
        }
        .site-nav {
          position: relative;
          min-height: 0;
          flex: 1;
          padding: 18px 0 10px;
          overflow-x: hidden;
          overflow-y: auto;
          scrollbar-color: #45403b transparent;
          scrollbar-width: thin;
        }
        .categories-section {
          display: none;
        }
        .directory-open .categories-section {
          display: block;
        }
        .site-nav::-webkit-scrollbar {
          width: 4px;
        }
        .site-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        .site-nav::-webkit-scrollbar-thumb {
          border-radius: 3px;
          background: #45403b;
        }
        .section-heading {
          display: flex;
          margin: 0 14px 9px;
          align-items: center;
          justify-content: space-between;
          color: #6d6761;
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 500;
          line-height: 1.2;
          letter-spacing: 0.11em;
        }
        .section-heading span:last-child {
          color: #4e4944;
          font-size: 9px;
          letter-spacing: 0;
        }
        .nav-item {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr) 24px;
          min-height: 52px;
          margin: 1px 0;
          padding: 0 14px;
          align-items: center;
          color: #9e9d99;
          cursor: pointer;
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
          transition: color 0.2s ease;
        }
        .nav-item:hover,
        .nav-item.active {
          color: #ffffff;
        }
        .nav-icon-slot {
          display: grid;
          width: 32px;
          height: 32px;
          place-items: center;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.035);
        }
        .nav-icon {
          max-width: 18px;
          max-height: 18px;
          object-fit: contain;
          filter: brightness(0) invert(0.52);
          transition: filter 0.2s ease, transform 0.2s ease;
        }
        .nav-item:hover .nav-icon,
        .nav-item.active .nav-icon {
          filter: brightness(0) saturate(100%) invert(46%) sepia(82%) saturate(2207%) hue-rotate(336deg) brightness(100%) contrast(87%);
          transform: scale(1.05);
        }
        .nav-copy,
        .nav-zh,
        .nav-en {
          display: block;
          min-width: 0;
        }
        .nav-copy {
          padding-left: 7px;
        }
        .nav-zh,
        .nav-en {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nav-zh {
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.25;
          letter-spacing: 0.02em;
        }
        .nav-en {
          margin-top: 3px;
          color: #69635d;
          font-family: var(--font-sans);
          font-size: 8px;
          line-height: 1.2;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .nav-item.active .nav-en {
          color: #8d8580;
        }
        .nav-index {
          color: #514c47;
          font-family: var(--font-sans);
          font-size: 9px;
          line-height: 1;
          text-align: right;
        }
        .nav-item.active .nav-index {
          color: var(--brand-primary);
        }
        .nav-highlight {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 0;
          width: 100%;
          opacity: 0;
          pointer-events: none;
          will-change: transform;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
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
          inset: 4px 10px;
          border-radius: 10px;
          background: linear-gradient(90deg,
            rgba(var(--brand-rgb), 0.15),
            rgba(var(--brand-rgb), 0.055));
        }
        .nav-highlight::after {
          content: '';
          position: absolute;
          top: 10px;
          bottom: 10px;
          left: 0;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: var(--brand-primary);
        }

        /* 标签 */
        .tags-section {
          margin: 16px 14px 0;
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.075);
        }
        /* 首页/归档（非目录浏览）场景：标签区作为面板最后一块，不显示上边框 */
        .sidebar:not(.directory-open) .tags-section {
          border-top: none;
        }
        .tags-section .section-heading {
          margin-right: 0;
          margin-left: 0;
        }
        .tags-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
        }
        .tag-item {
          display: flex;
          min-width: 0;
          min-height: 30px;
          padding: 5px 7px 5px 10px;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          border-radius: 7px;
          color: #9e9d99;
          background: rgba(255, 255, 255, 0.045);
          font-family: var(--font-sans);
          font-size: 11px;
          line-height: 1.25;
          text-decoration: none;
          transition: color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }
        .tag-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .tag-count {
          flex: 0 0 auto;
          color: #625d57;
          font-size: 9px;
          font-weight: 400;
        }
        .tag-item:hover,
        .tag-item:focus-visible {
          color: #ffffff;
          background: rgba(var(--brand-rgb), 0.1);
          box-shadow: inset 2px 0 0 var(--brand-primary);
        }
        .tag-item.active {
          color: #ffffff;
          font-weight: 500;
          background: linear-gradient(90deg,
            rgba(var(--brand-rgb), 0.2),
            rgba(var(--brand-rgb), 0.1));
          box-shadow:
            inset 0 0 0 1px rgba(var(--brand-rgb), 0.38),
            inset 3px 0 0 var(--brand-primary);
        }
        .tag-item:hover .tag-count,
        .tag-item:focus-visible .tag-count {
          color: var(--brand-primary);
        }
        .tag-item.active .tag-count {
          padding: 1px 4px;
          border-radius: 4px;
          color: #ffffff;
          background: rgba(var(--brand-rgb), 0.22);
        }

        /* 二级面板底部 */
        .secondary-footer {
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.065);
        }
        .icp-text {
          padding: 13px 16px 11px;
          overflow: hidden;
          color: #5c5751;
          font-family: var(--font-sans);
          font-size: 9px;
          line-height: 1.4;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .social-bar {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          height: 44px;
          border-top: 1px solid rgba(255, 255, 255, 0.065);
        }
        .social-icon {
          position: relative;
          display: flex;
          min-width: 0;
          align-items: center;
          justify-content: center;
          border-right: 1px solid rgba(255, 255, 255, 0.065);
          color: #8b857e;
          cursor: pointer;
          text-decoration: none;
        }
        .social-icon:last-child {
          border-right: 0;
        }
        .social-icon img {
          --hue: 0deg;
          opacity: 0.92;
          filter: invert(64%) sepia(79%) saturate(467%) hue-rotate(var(--hue)) brightness(97%);
          transition: opacity 0.2s ease, transform 0.2s ease, filter 0.2s ease;
        }
        .social-icon:hover img,
        .social-icon:focus-visible img {
          opacity: 1;
          transform: translateY(-1px) scale(1.06);
          filter: invert(54%) sepia(88%) saturate(740%) hue-rotate(var(--hue)) brightness(112%);
        }
        .social-icon img.tone-mono {
          filter: brightness(0) invert(0.62);
        }
        .social-icon:hover img.tone-mono,
        .social-icon:focus-visible img.tone-mono {
          filter: brightness(0) invert(0.92);
        }
        .social-icon::after {
          content: attr(aria-label);
          position: absolute;
          bottom: calc(100% + 9px);
          left: 50%;
          z-index: 70;
          padding: 4px 8px;
          border: 1px solid #3c3936;
          border-radius: 5px;
          color: #ffffff;
          background: rgba(20, 19, 18, 0.96);
          font-family: var(--font-sans);
          font-size: 11px;
          line-height: 1.3;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translate(-50%, 4px);
          transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
        }
        .social-icon:hover::after,
        .social-icon:focus-visible::after {
          opacity: 1;
          visibility: visible;
          transform: translate(-50%, 0);
        }
        .social-icon.has-qr::after {
          display: none;
        }
        .social-qr {
          position: absolute;
          bottom: calc(100% + 9px);
          left: 50%;
          z-index: 80;
          display: flex;
          width: 146px;
          padding: 9px;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          border: 1px solid #3c3936;
          border-radius: 8px;
          color: #ffffff;
          background: rgba(22, 21, 20, 0.98);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translate(-50%, 6px);
          transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
        }
        .social-icon.has-qr:hover .social-qr,
        .social-icon.has-qr:focus-visible .social-qr {
          opacity: 1;
          visibility: visible;
          transform: translate(-50%, 0);
        }
        .social-bar .social-qr .qr-image {
          display: block;
          width: 120px !important;
          height: 120px !important;
          padding: 5px;
          border-radius: 6px;
          object-fit: contain;
          background: #ffffff;
          filter: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
        .social-qr em {
          color: #9e9d99;
          font-family: var(--font-sans);
          font-size: 10px;
          font-style: normal;
          line-height: 1.3;
        }
        .social-qr b {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 500;
          line-height: 1.3;
        }
        .social-icon:first-child .social-qr {
          left: 5px;
          transform: translateY(6px);
        }
        .social-icon:first-child.has-qr:hover .social-qr,
        .social-icon:first-child.has-qr:focus-visible .social-qr {
          transform: translateY(0);
        }
        .social-icon:last-child .social-qr {
          right: 5px;
          left: auto;
          transform: translateY(6px);
        }
        .social-icon:last-child.has-qr:hover .social-qr,
        .social-icon:last-child.has-qr:focus-visible .social-qr {
          transform: translateY(0);
        }

        @media (max-width: 1199px) {
          .sidebar,
          .sidebar.directory-open {
            width: 68px;
            min-width: 68px;
            max-width: 68px;
          }
          .secondary-panel {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateX(-14px);
          }
          .directory-open .secondary-panel {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: translateX(0);
          }
          .directory-open .secondary-panel {
            box-shadow: 22px 0 48px rgba(0, 0, 0, 0.36);
          }
          .panel-close {
            display: grid;
          }
        }
        @media (max-width: 380px) {
          .secondary-panel {
            width: calc(100vw - 68px);
          }
          .tags-list {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .sidebar,
          .secondary-panel,
          .nav-highlight {
            transition-duration: 0.01ms;
          }
        }
      </style>

      <aside class="sidebar${directoryOpen ? ' directory-open' : ''}${archiveActive ? ' archive-context' : ''}${aboutActive ? ' about-context' : ''}${friendsActive ? ' friends-context' : ''}">
        <div class="primary-rail">
          <div class="primary-logo" title="${escapeHtml(siteName)}">
            <img src="/images/extracted/login/图形@2x.png" alt="${escapeHtml(siteName)}">
          </div>

          <nav class="primary-nav" aria-label="一级导航">
            <a class="primary-item${homeActive ? ' active' : ''}"
               href="./#cat=all" data-cat="all" aria-label="首页"
               ${homeActive ? 'aria-current="page"' : ''} title="首页 · Home">
              <img src="/images/extracted/home/iconfont-shouye@2x.png" alt="" aria-hidden="true">
              <span class="primary-tooltip">首页</span>
            </a>

            <button class="primary-item directory-toggle${directoryActive ? ' active' : ''}"
                    type="button" aria-label="目录" aria-controls="category-panel"
                    aria-expanded="${directoryOpen ? 'true' : 'false'}" title="目录 · Categories">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.5 6.5h6l1.8 2h9.2v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"></path>
                <path d="M3.5 9h17"></path>
              </svg>
              <span class="primary-tooltip">目录</span>
            </button>

            ${archiveHtml}
            ${friendsHtml}
            ${aboutHtml}
          </nav>

          <a class="rail-caption" href="https://github.com/callmesoul/soul-blog-theme"
             target="_blank" rel="noopener noreferrer"
             title="Soul Blog Theme · 本项目 GitHub" aria-label="Soul Blog Theme · 本项目 GitHub">Soul&nbsp;Blog</a>
        </div>

        <section class="secondary-panel" id="category-panel"
                 aria-label="二级导航" aria-hidden="${panelHidden ? 'true' : 'false'}">
          <header class="secondary-header">
            <div class="secondary-title context-title context-home">
              <small>${escapeHtml(siteName)}</small>
              <strong>首页</strong>
              <span>Home</span>
            </div>
            <div class="secondary-title context-title context-directory">
              <small>${escapeHtml(siteName)}</small>
              <strong>内容目录</strong>
              <span>Categories</span>
            </div>
            <div class="secondary-title context-title context-archive">
              <small>${escapeHtml(siteName)}</small>
              <strong>归档</strong>
              <span>Archives</span>
            </div>
            <div class="secondary-title context-title context-about">
              <small>${escapeHtml(siteName)}</small>
              <strong>关于我</strong>
              <span>About</span>
            </div>
            <div class="secondary-title context-title context-friends">
              <small>${escapeHtml(siteName)}</small>
              <strong>友链</strong>
              <span>Friends</span>
            </div>
            <button class="panel-close" type="button" aria-label="收起目录" title="收起目录">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 6-6 6 6 6"></path>
              </svg>
            </button>
          </header>

          <nav class="site-nav" aria-label="目录列表">
            <section class="categories-section" aria-label="分类列表">
              <div class="section-heading">
                <span>分类</span><span>${String(categoryItems.length).padStart(2, '0')}</span>
              </div>
              ${categoryHtml || '<p class="section-heading"><span>暂无分类</span></p>'}
              <span class="nav-highlight" aria-hidden="true"></span>
            </section>

            ${tagHtml ? `<section class="tags-section" aria-label="标签列表">
              <h3 class="section-heading">
                <span>标签</span><span>${String(tags?.length || 0).padStart(2, '0')}</span>
              </h3>
              <div class="tags-list">${tagHtml}</div>
            </section>` : ''}
          </nav>

          <footer class="secondary-footer">
            <div class="icp-text">${icp ? escapeHtml(icp) : '@CallMeSoul 粤ICP备15053557'}</div>
            <div class="social-bar" aria-label="社交媒体">${socialHtml}</div>
          </footer>
        </section>
      </aside>
    `
  }

  protected mounted (): void {
    this._hlEl = this.$('.nav-highlight')
    this._layoutHighlight()

    this.$('.directory-toggle')?.addEventListener('click', () => {
      this._setDirectoryOpen(true)
    })
    this.$('.panel-close')?.addEventListener('click', () => {
      this._setDirectoryOpen(false)
    })

    const home = this.$<HTMLAnchorElement>('.primary-item[data-cat="all"]')
    home?.addEventListener('click', (e: Event) => {
      e.preventDefault()
      this._setDirectoryOpen(false)
      this.emit('navigate', { cat: 'all' })
    })

    const nav = this.$('.site-nav') as HTMLElement | null
    nav?.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement
      const tagItem = target.closest('.tag-item') as HTMLElement | null
      if (tagItem) {
        const tag = (tagItem.dataset as Record<string, string>).tag
        if (tag) {
          e.preventDefault()
          this.emit('navigate', { cat: 'all', tag })
          this._closeOverlayAfterNavigation()
        }
        return
      }

      const item = target.closest('.nav-item') as HTMLElement | null
      const cat = item && (item.dataset as Record<string, string>).cat
      if (cat) {
        e.preventDefault()
        this.emit('navigate', { cat })
        this._closeOverlayAfterNavigation()
      }
    })
  }

  attributeChangedCallback (name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return

    if (name === 'active-cat') {
      const activeCat = newValue || 'all'
      const activeTag = this.getAttribute('active-tag') || ''
      this._syncActiveClass(activeTag ? '' : activeCat)
      if (!['all', 'archives', 'about', 'friends'].includes(activeCat)) this._setDirectoryOpen(true)
      if (['all', 'archives', 'about', 'friends'].includes(activeCat) && !activeTag) this._setDirectoryOpen(false)
    }

    if (name === 'active-tag') {
      const activeTag = newValue || ''
      const activeCat = this.getAttribute('active-cat') || 'all'
      this._syncTagActiveClass(activeTag)
      this._syncActiveClass(activeTag ? '' : activeCat)
      if (!activeTag && activeCat === 'all') this._setDirectoryOpen(false)
    }

    this._syncPrimaryState()
    this._layoutHighlight()
  }

  set categories (val: Category[]) {
    (this as any)._categories = val
    this._reRender()
  }

  set social (val: SocialItem[]) {
    (this as any)._social = val
    this._reRender()
  }

  set siteName (val: string) {
    (this as any)._siteName = val
    this._reRender()
  }

  set icp (val: string) {
    (this as any)._icp = val
    this._reRender()
  }

  set tags (val: TagItem[]) {
    (this as any)._tags = val
    this._reRender()
  }

  /** 归档页链接；传入空字符串可隐藏归档一级导航 */
  set archiveUrl (val: string) {
    (this as any)._archiveUrl = val || ''
    this._reRender()
  }

  /** 关于页链接；传入空字符串可隐藏关于一级导航 */
  set aboutUrl (val: string) {
    (this as any)._aboutUrl = val || ''
    this._reRender()
  }

  /** 友链页链接；传入空字符串可隐藏友链一级导航 */
  set friendsUrl (val: string) {
    (this as any)._friendsUrl = val || ''
    this._reRender()
  }

  private _reRender (): void {
    this.shadow.innerHTML = this.render()
    this.mounted()
  }

  private _isDirectoryOpen (): boolean {
    return Boolean(this.$('.sidebar')?.classList.contains('directory-open'))
  }

  private _setDirectoryOpen (open: boolean): void {
    this._directoryOpen = open
    const sidebar = this.$('.sidebar')
    const panel = this.$('.secondary-panel')
    const toggle = this.$('.directory-toggle')
    sidebar?.classList.toggle('directory-open', open)
    const panelHidden = window.matchMedia('(max-width: 1199px)').matches && !open
    panel?.setAttribute('aria-hidden', panelHidden ? 'true' : 'false')
    toggle?.setAttribute('aria-expanded', open ? 'true' : 'false')
    this._syncPrimaryState()
    if (open) requestAnimationFrame(() => this._layoutHighlight())
  }

  private _syncPrimaryState (): void {
    const activeCat = this.getAttribute('active-cat') || 'all'
    const activeTag = this.getAttribute('active-tag') || ''
    const open = this._isDirectoryOpen()
    const home = this.$('.primary-item[data-cat="all"]')
    const directory = this.$('.directory-toggle')
    const archive = this.$('.primary-item[data-cat="archives"]')
    const about = this.$('.primary-item[data-cat="about"]')
    const friends = this.$('.primary-item[data-cat="friends"]')

    home?.classList.toggle('active', activeCat === 'all' && !open)
    directory?.classList.toggle('active', open || !['all', 'archives', 'about', 'friends'].includes(activeCat))
    archive?.classList.toggle('active', activeCat === 'archives' && !open)
    about?.classList.toggle('active', activeCat === 'about' && !open)
    friends?.classList.toggle('active', activeCat === 'friends' && !open)

    // 同步 secondary-header 标题上下文类（CSS 据此切换 首页/目录/归档 显示）。
    // 注意 directory-open 的真源是交互字段 _directoryOpen，与 render() 的
    // directoryOpen = this._directoryOpen || categorySelected 推导保持一致，
    // 不能用 activeCat 反推——否则在首页(active-cat=all)点击目录展开后，
    // 回调会把刚加上的 directory-open 类移除，导致二级分类面板显示不出来。
    const aside = this.$('.sidebar')
    if (aside) {
      const categorySelected = !['all', 'archives', 'about', 'friends'].includes(activeCat)
      const dirState = this._directoryOpen || (categorySelected && !activeTag)
      aside.classList.toggle('archive-context', activeCat === 'archives' && !activeTag)
      aside.classList.toggle('about-context', activeCat === 'about' && !activeTag)
      aside.classList.toggle('friends-context', activeCat === 'friends' && !activeTag)
      aside.classList.toggle('directory-open', dirState)
    }
  }

  private _syncActiveClass (activeCat: string): void {
    this.shadow.querySelectorAll<HTMLElement>('.nav-item').forEach(el => {
      el.classList.toggle('active', (el.dataset as Record<string, string>).cat === activeCat)
    })
  }

  private _syncTagActiveClass (activeTag: string): void {
    this.shadow.querySelectorAll<HTMLElement>('.tag-item').forEach(el => {
      el.classList.toggle('active', (el.dataset as Record<string, string>).tag === activeTag)
    })
  }

  private _layoutHighlight (): void {
    const hl = this._hlEl
    if (!hl || !this._isDirectoryOpen() || this.getAttribute('active-tag')) {
      hl?.classList.remove('is-on')
      return
    }

    const activeCat = this.getAttribute('active-cat') || 'all'
    const active = Array.from(this.shadow.querySelectorAll<HTMLElement>('.nav-item'))
      .find(el => (el.dataset as Record<string, string>).cat === activeCat)
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

  private _closeOverlayAfterNavigation (): void {
    if (window.matchMedia('(max-width: 1199px)').matches) {
      this._setDirectoryOpen(false)
    }
  }
}

if (!customElements.get('site-sidebar')) {
  customElements.define('site-sidebar', SiteSidebar)
}

export { SiteSidebar }
