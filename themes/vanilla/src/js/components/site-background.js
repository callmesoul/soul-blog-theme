import { defineTemplateComponent } from './define-component.js'

// 公共全屏背景：页面通过 image 属性提供资源，渐变遮罩保持统一。
defineTemplateComponent('site-background', host => {
  const image = host.getAttribute('image') || ''
  host.className = 'fixed inset-0 z-0 block overflow-hidden bg-base'

  return `
    <img src="${image}" alt="" class="absolute inset-0 h-full w-full object-cover object-center">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_35%,rgba(50,48,45,0.35)_0%,transparent_55%),radial-gradient(ellipse_at_65%_20%,rgba(40,38,35,0.3)_0%,transparent_45%),linear-gradient(180deg,rgba(8,8,8,0.65)_0%,rgba(8,8,8,0.3)_40%,rgba(8,8,8,0.9)_100%)]"></div>
  `
})
