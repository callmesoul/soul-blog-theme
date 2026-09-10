import { escapeHtml } from '../helpers/escape-html'
import { WcBase } from '../helpers/wc-base'
import type { AboutPageConfig } from '../types'

const DEFAULT_CONFIG: AboutPageConfig = {
  kicker: 'About · Personal Manifesto',
  title: '代码是工具，',
  titleAccent: '表达才是目的。',
  description: '我喜欢把复杂的问题，做成简单、可靠、耐看的东西。',
  cards: []
}

function lines (value: string): string {
  return escapeHtml(value || '').replace(/\r?\n/g, '<br>')
}

class AboutPage extends WcBase {
  protected render (): string {
    const supplied = (this as any)._config as Partial<AboutPageConfig> | undefined
    const config: AboutPageConfig = {
      ...DEFAULT_CONFIG,
      ...supplied,
      cards: Array.isArray(supplied?.cards) ? supplied.cards : DEFAULT_CONFIG.cards
    }

    const cards = config.cards.map((card, index) => {
      const variant = card.variant === 'wide' || card.variant === 'accent'
        ? card.variant
        : 'default'
      const className = `manifesto-card ${variant}`
      const content = `
        <small>${escapeHtml(card.eyebrow || String(index + 1).padStart(2, '0'))}</small>
        ${card.title ? `<h2>${lines(card.title)}</h2>` : ''}
        ${card.text ? `<p>${lines(card.text)}</p>` : ''}
      `

      if (card.href) {
        return `<a class="${className}" href="${escapeHtml(card.href)}"
                   target="_blank" rel="noopener noreferrer">${content}</a>`
      }
      return `<article class="${className}">${content}</article>`
    }).join('')

    return `
      <style>
        :host {
          display: block;
          min-width: 0;
          flex: 1;
          height: 100%;
          color: #f4f1ed;
        }
        * {
          box-sizing: border-box;
        }
        .about-scroll {
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          background:
            radial-gradient(circle at 76% 14%, rgba(var(--brand-rgb), 0.065), transparent 29%),
            linear-gradient(115deg, rgba(43, 38, 34, 0.98), rgba(20, 18, 16, 0.98) 68%);
          scrollbar-color: #48423d transparent;
          scrollbar-width: thin;
        }
        .about-shell {
          width: min(100%, 1120px);
          min-height: 100%;
          margin: 0 auto;
          padding: clamp(42px, 7vh, 76px) clamp(28px, 6vw, 82px) 72px;
        }
        .kicker {
          margin: 0 0 20px;
          color: var(--brand-primary);
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 600;
          line-height: 1.4;
          letter-spacing: 0.19em;
          text-transform: uppercase;
        }
        h1 {
          max-width: 900px;
          margin: 0;
          color: #f5f2ef;
          font-family: var(--font-sans);
          font-size: clamp(42px, 6.1vw, 78px);
          font-weight: 300;
          line-height: 0.99;
          letter-spacing: -0.048em;
        }
        h1 strong {
          display: block;
          margin-top: 5px;
          color: var(--brand-primary);
          font-weight: 650;
        }
        .intro {
          max-width: 660px;
          margin: 24px 0 0;
          color: #a39b94;
          font-family: var(--font-sans);
          font-size: 13px;
          line-height: 1.9;
        }
        .manifesto-grid {
          display: grid;
          margin-top: clamp(34px, 6vh, 58px);
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-top: 1px solid rgba(255, 255, 255, 0.13);
          border-left: 1px solid rgba(255, 255, 255, 0.13);
        }
        .manifesto-card {
          display: flex;
          min-height: 154px;
          padding: 23px;
          flex-direction: column;
          justify-content: flex-start;
          border-right: 1px solid rgba(255, 255, 255, 0.13);
          border-bottom: 1px solid rgba(255, 255, 255, 0.13);
          color: inherit;
          background: rgba(16, 14, 13, 0.52);
          font-family: var(--font-sans);
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        a.manifesto-card:hover,
        a.manifesto-card:focus-visible {
          background: rgba(255, 255, 255, 0.045);
          transform: translateY(-2px);
        }
        .manifesto-card.wide {
          grid-column: span 2;
        }
        .manifesto-card.accent {
          justify-content: flex-end;
          color: #ffffff;
          background: var(--brand-primary);
        }
        .manifesto-card small {
          display: block;
          margin-bottom: 20px;
          color: #716963;
          font-size: 9px;
          line-height: 1.35;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .manifesto-card h2 {
          margin: 0;
          color: #f3efeb;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(18px, 2vw, 24px);
          font-weight: 400;
          line-height: 1.4;
        }
        .manifesto-card p {
          margin: auto 0 0;
          color: #99918a;
          font-size: 11px;
          line-height: 1.75;
        }
        .manifesto-card.accent small,
        .manifesto-card.accent p {
          color: rgba(255, 255, 255, 0.78);
        }
        .manifesto-card.accent h2 {
          color: #ffffff;
          font-size: clamp(21px, 2.3vw, 29px);
          line-height: 1.18;
        }
        @media (max-width: 820px) {
          .about-shell {
            padding-right: 28px;
            padding-left: 28px;
          }
          .manifesto-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .about-shell {
            padding: 34px 18px 54px;
          }
          h1 {
            font-size: clamp(38px, 13vw, 56px);
          }
          .manifesto-grid {
            grid-template-columns: 1fr;
          }
          .manifesto-card.wide {
            grid-column: auto;
          }
          .manifesto-card {
            min-height: 132px;
            padding: 19px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .manifesto-card {
            transition-duration: 0.01ms;
          }
        }
      </style>

      <div class="about-scroll">
        <main class="about-shell">
          <p class="kicker">${escapeHtml(config.kicker)}</p>
          <h1>${lines(config.title)}<strong>${lines(config.titleAccent)}</strong></h1>
          <p class="intro">${lines(config.description)}</p>
          ${cards ? `<section class="manifesto-grid" aria-label="关于我的信息">${cards}</section>` : ''}
        </main>
      </div>
    `
  }

  set config (value: Partial<AboutPageConfig>) {
    ;(this as any)._config = value || {}
    this.shadow.innerHTML = this.render()
  }
}

if (!customElements.get('about-page')) {
  customElements.define('about-page', AboutPage)
}

export { AboutPage }
