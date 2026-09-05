/**
 * @soul-blog/wc 组件基类
 *
 * 提供 Shadow DOM + adoptedStyleSheets + 属性/事件 的标准行为。
 * 所有 Web Components 都应继承此类。
 *
 * 样式注入策略：
 *   theme.css 通过 Vite `?inline` 查询在构建时编译为 CSS 字符串并内联到 JS 包中，
 *   组件实例化时通过 adoptedStyleSheets 注入 Shadow DOM，实现跨包消费时样式自包含。
 */

// 构建时内联编译后的 theme.css 字符串
import themeCSS from '../styles/theme.css?inline'

// 共享的 CSSStyleSheet 缓存（所有组件实例复用同一个）
let sharedSheet: CSSStyleSheet | null = null

/** 获取或创建共享的 CSSStyleSheet 实例 */
function getThemeSheet (): CSSStyleSheet | null {
  if (sharedSheet) return sharedSheet
  try {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(themeCSS)
    sharedSheet = sheet
    return sheet
  } catch {
    return null
  }
}

export abstract class WcBase extends HTMLElement {
  protected shadow: ShadowRoot

  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  /** 子类返回 HTML 模板字符串 */
  protected abstract render (): string

  /** 子类可覆盖此方法执行挂载后的初始化逻辑（绑定事件等） */
  protected mounted (): void {
    // 默认空实现
  }

  /** 查询 Shadow DOM 中的单个元素 */
  protected $<T extends Element = Element> (sel: string): T | null {
    return this.shadow.querySelector<T>(sel)
  }

  /** 查询 Shadow DOM 中的多个元素 */
  protected $$<T extends Element = Element> (sel: string): NodeListOf<T> {
    return this.shadow.querySelectorAll<T>(sel)
  }

  /** 触发冒泡自定义事件 */
  protected emit (name: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true
    }))
  }

  // ---- 生命周期 ----

  connectedCallback (): void {
    if (this.shadow.children.length > 0) return // 已渲染

    // 注入主题样式
    const sheet = getThemeSheet()
    if (sheet) {
      try {
        (this.shadow as ShadowRoot).adoptedStyleSheets = [sheet]
      } catch {
        // 降级：内联 style
        const style = document.createElement('style')
        style.textContent = themeCSS
        this.shadow.appendChild(style)
      }
    } else {
      const style = document.createElement('style')
      style.textContent = themeCSS
      this.shadow.appendChild(style)
    }

    // 渲染模板
    this.shadow.innerHTML += this.render()

    // 通知子类
    this.mounted()
  }

  /** 属性变化时重新渲染（子类可覆盖以实现增量更新） */
  attributeChangedCallback (name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return
    this.shadow.innerHTML = ``
    this.shadow.innerHTML = this.render()
    this.mounted()
  }
}