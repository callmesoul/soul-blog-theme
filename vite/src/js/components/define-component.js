/**
 * 定义只负责渲染轻量 DOM 模板的 Web Component。
 * data-component-mounted 用于防止节点重新连接时重复创建内部 DOM。
 */
export function defineTemplateComponent (name, render) {
  if (customElements.get(name)) return

  customElements.define(name, class extends HTMLElement {
    connectedCallback () {
      if (this.hasAttribute('data-component-mounted')) return
      this.setAttribute('data-component-mounted', '')
      // render 接收宿主元素，组件可从属性读取页面传入的轻量配置。
      this.innerHTML = render(this)
    }
  })
}
