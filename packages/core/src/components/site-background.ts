import { WcBase } from '../helpers/wc-base'

/**
 * 公共全屏背景组件
 *
 * 属性：
 *   image — 背景图片 URL
 *
 * 用法：<site-background image="/path/to/bg.png"></site-background>
 */
class SiteBackground extends WcBase {
  static get observedAttributes (): string[] {
    return ['image']
  }

  protected render (): string {
    const image = this.getAttribute('image') || ''

    return `
      <style>
        :host {
          display: block;
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background-color: #080808;
        }
        img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        .overlay {
          pointer-events: none;
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 30% 35%, rgba(50,48,45,0.35) 0%, transparent 55%),
            radial-gradient(ellipse at 65% 20%, rgba(40,38,35,0.3) 0%, transparent 45%),
            linear-gradient(180deg, rgba(8,8,8,0.65) 0%, rgba(8,8,8,0.3) 40%, rgba(8,8,8,0.9) 100%);
        }
      </style>
      <img src="${image}" alt="" part="bg-image">
      <div class="overlay" part="overlay"></div>
    `
  }
}

// 确保组件只注册一次
if (!customElements.get('site-background')) {
  customElements.define('site-background', SiteBackground)
}

export { SiteBackground }