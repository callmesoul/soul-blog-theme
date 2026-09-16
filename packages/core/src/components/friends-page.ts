import { escapeHtml } from '../helpers/escape-html'
import { WcBase } from '../helpers/wc-base'
import type { FriendLink, FriendsPageConfig } from '../types'

const DEFAULT_CONFIG: FriendsPageConfig = {
  kicker: 'Friends · Curated People',
  title: '一些值得',
  titleAccent: '反复拜访的人。',
  description: '他们在各自的小世界里持续写作、创造，也让独立互联网保持温度。',
  links: []
}

function displayDomain (friend: FriendLink): string {
  if (friend.domain) return friend.domain
  try {
    return new URL(friend.url).hostname.replace(/^www\./, '')
  } catch {
    return friend.url
  }
}

function displayMark (friend: FriendLink): string {
  return friend.mark || Array.from((friend.name || '').trim())[0] || '·'
}

function displayColor (color?: string): string {
  return /^#[0-9a-f]{6}$/i.test(color || '') ? String(color) : 'var(--brand-primary)'
}

class FriendsPage extends WcBase {
  protected render (): string {
    const supplied = (this as any)._config as Partial<FriendsPageConfig> | undefined
    const config: FriendsPageConfig = {
      ...DEFAULT_CONFIG,
      ...supplied,
      links: Array.isArray(supplied?.links) ? supplied.links : DEFAULT_CONFIG.links
    }
    const links = config.links.filter(friend => friend && friend.name && friend.url)

    const cards = links.map((friend, index) => {
      const mark = friend.avatar
        ? `<img src="${escapeHtml(friend.avatar)}" alt="" loading="lazy">`
        : escapeHtml(displayMark(friend))
      const wide = index === 0 || index === links.length - 1 ? ' wide' : ''

      return `
        <a class="friend-card${wide}" href="${escapeHtml(friend.url)}"
           target="_blank" rel="noopener noreferrer"
           style="--friend-color:${escapeHtml(displayColor(friend.color))}">
          <span class="friend-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="friend-mark">${mark}</span>
          <span class="friend-copy">
            <strong>${escapeHtml(friend.name)}</strong>
            <small>${escapeHtml(displayDomain(friend))}</small>
            <span>${escapeHtml(friend.note || '')}</span>
          </span>
          <span class="friend-arrow" aria-hidden="true">
            <svg viewBox="0 0 20 20"><path d="M5 15 15 5M7 5h8v8"></path></svg>
          </span>
        </a>
      `
    }).join('')

    return `
      <style>
        :host {
          display: block;
          min-width: 0;
          flex: 1;
          height: 100%;
          color: #f5f2ef;
        }
        * { box-sizing: border-box; }
        .friends-scroll {
          --friends-line: rgba(255, 255, 255, 0.13);
          --friends-muted: #928a84;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          background:
            radial-gradient(circle at 78% 3%, rgba(var(--brand-rgb), 0.075), transparent 26%),
            linear-gradient(120deg, rgba(39, 34, 30, 0.98), rgba(17, 15, 14, 0.99) 70%);
          scrollbar-color: #48423d transparent;
          scrollbar-width: thin;
        }
        .friends-panel {
          width: min(100%, 1120px);
          min-height: 100%;
          margin: 0 auto;
          padding: clamp(42px, 7vh, 76px) clamp(28px, 6vw, 82px) 88px;
          animation: friends-enter 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .friends-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
        }
        .kicker {
          margin: 0 0 18px;
          color: var(--brand-primary);
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.19em;
          text-transform: uppercase;
        }
        h1 {
          margin: 0;
          color: #f5f2ef;
          font-family: var(--font-sans);
          font-size: clamp(42px, 6.1vw, 78px);
          font-weight: 300;
          line-height: 0.99;
          letter-spacing: -0.048em;
        }
        h1 em {
          color: var(--brand-primary);
          font-style: normal;
          font-weight: 650;
        }
        .description {
          display: block;
          max-width: 610px;
          margin: 24px 0 0;
          color: var(--friends-muted);
          font-family: var(--font-sans);
          font-size: 13px;
          line-height: 1.9;
        }
        .friends-count {
          flex: none;
          padding-bottom: 6px;
          color: #6d6661;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 34px;
          line-height: 0.75;
          text-align: right;
        }
        .friends-count small {
          font-size: 8px;
          letter-spacing: 0.2em;
        }
        .friend-gallery {
          display: grid;
          margin-top: clamp(36px, 6vh, 58px);
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-top: 1px solid var(--friends-line);
          border-left: 1px solid var(--friends-line);
        }
        .friend-card {
          position: relative;
          display: flex;
          min-height: 230px;
          padding: 21px;
          flex-direction: column;
          overflow: hidden;
          border-right: 1px solid var(--friends-line);
          border-bottom: 1px solid var(--friends-line);
          color: inherit;
          background: rgba(12, 11, 10, 0.48);
          font-family: var(--font-sans);
          text-decoration: none;
          transition: background 0.25s ease, transform 0.25s ease;
        }
        .friend-card:hover,
        .friend-card:focus-visible {
          z-index: 2;
          background: rgba(255, 255, 255, 0.055);
          transform: translateY(-3px);
        }
        .friend-card.wide { grid-column: span 2; }
        .friend-index {
          color: #625b56;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 10px;
          letter-spacing: 0.08em;
        }
        .friend-mark {
          display: grid;
          width: 48px;
          height: 48px;
          margin: 26px 0 22px;
          place-items: center;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--friend-color) 65%, transparent);
          border-radius: 50%;
          color: #fff;
          background: color-mix(in srgb, var(--friend-color) 24%, #13110f);
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 20px;
        }
        .friend-mark img { width: 100%; height: 100%; object-fit: cover; }
        .friend-copy { display: flex; max-width: 400px; flex-direction: column; }
        .friend-copy strong { color: #f5f2ef; font-size: 18px; font-weight: 500; }
        .friend-copy small {
          margin-top: 3px;
          color: #6f6863;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 11px;
        }
        .friend-copy > span {
          margin-top: 16px;
          color: var(--friends-muted);
          font-size: 12px;
          line-height: 1.75;
        }
        .friend-arrow {
          position: absolute;
          top: 18px;
          right: 20px;
          color: #6b645f;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .friend-arrow svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 1.25;
        }
        .friend-card:hover .friend-arrow,
        .friend-card:focus-visible .friend-arrow {
          color: var(--brand-primary);
          transform: translate(2px, -2px);
        }
        .empty {
          margin: 48px 0 0;
          padding: 34px;
          border: 1px solid var(--friends-line);
          color: var(--friends-muted);
          font-family: var(--font-sans);
          font-size: 13px;
          text-align: center;
        }
        @keyframes friends-enter {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 980px) {
          .friend-gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .friend-card.wide { grid-column: span 1; }
        }
        @media (max-width: 620px) {
          .friends-panel { padding: 34px 18px 72px; }
          .friends-heading { align-items: flex-start; }
          h1 { font-size: clamp(38px, 13vw, 56px); }
          .friends-count { display: none; }
          .friend-gallery { grid-template-columns: 1fr; }
          .friend-card { min-height: 206px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .friends-panel { animation: none; }
          .friend-card { transition-duration: 0.01ms; }
        }
      </style>

      <div class="friends-scroll">
        <main class="friends-panel">
          <header class="friends-heading">
            <div>
              <p class="kicker">${escapeHtml(config.kicker)}</p>
              <h1 id="friends-title">${escapeHtml(config.title)}<br><em>${escapeHtml(config.titleAccent)}</em></h1>
              <p class="description">${escapeHtml(config.description)}</p>
            </div>
            <span class="friends-count">${String(links.length).padStart(2, '0')}<br><small>LINKS</small></span>
          </header>
          ${cards ? `<section class="friend-gallery" aria-labelledby="friends-title">${cards}</section>` : '<p class="empty">友链还在路上，稍后再来看看。</p>'}
        </main>
      </div>
    `
  }

  set config (value: Partial<FriendsPageConfig>) {
    ;(this as any)._config = value || {}
    this.shadow.innerHTML = this.render()
  }
}

if (!customElements.get('friends-page')) {
  customElements.define('friends-page', FriendsPage)
}

export { FriendsPage }
