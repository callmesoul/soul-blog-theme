import { defineTemplateComponent } from './define-component.js'

/** 密码可见性开关图标，由登录控制器按需插入密码输入行。 */
export function passwordToggleTemplate () {
  return '<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5S1 8 1 8z" stroke="#6B6B6B" stroke-width="1.2"/><circle cx="8" cy="8" r="2" stroke="#6B6B6B" stroke-width="1.2"/></svg>'
}

// 登录页主体组件；只描述视图结构，不在组件内耦合模拟登录流程。
defineTemplateComponent('login-panel', () => `
  <img src="/images/extracted/login/图形@2x.png" alt="" data-site-logo="loginIcon" class="relative z-[1] mb-[-30px] block h-[81px] w-[88px] object-contain">

  <div class="w-[357px] overflow-hidden bg-[#211E1C]">
    <form id="login-form" class="px-9 pb-11 pt-12">
      <div class="login-input-row group mb-4 flex items-center gap-[14px] border-b border-inline py-2 transition-[border-color] duration-200 focus-within:border-(--brand-primary)">
        <img src="/images/extracted/login/iconfont-denglu@2x.png" alt="" class="h-[15px] w-[13px] shrink-0 object-contain [filter:brightness(0)_invert(0.62)] transition-[filter] duration-200 group-focus-within:[filter:brightness(0)_invert(1)]">
        <input type="text" placeholder="请输入用户名" autocomplete="username" class="min-w-0 flex-1 bg-transparent text-[14px] leading-[1.6] tracking-[0.01em] text-body outline-none placeholder:text-dim transition-colors duration-200 focus:placeholder:text-mute">
      </div>

      <div class="login-input-row group flex items-center gap-[14px] border-b border-inline py-2 transition-[border-color] duration-200 focus-within:border-(--brand-primary)">
        <img src="/images/extracted/login/iconfont-iconyaochi@2x.png" alt="" class="h-[13px] w-[13px] shrink-0 object-contain [filter:brightness(0)_invert(0.62)] transition-[filter] duration-200 group-focus-within:[filter:brightness(0)_invert(1)]">
        <input type="password" placeholder="请输入密码" autocomplete="current-password" class="min-w-0 flex-1 bg-transparent text-[14px] leading-[1.6] tracking-[0.01em] text-body outline-none transition-colors duration-200 [&:not(:placeholder-shown)]:tracking-[0.25em] placeholder:text-dim focus:placeholder:text-mute">
      </div>

      <div class="flex items-center justify-between py-4">
        <label class="checkbox-wrap group/checkbox flex cursor-pointer select-none items-center gap-2">
          <input type="checkbox" checked>
          <span class="checkbox-box flex size-[18px] shrink-0 items-center justify-center rounded-[1px] border border-[#4A4542] bg-transparent transition-[background,border-color] duration-200 data-[checked=1]:border-(--brand-primary) data-[checked=1]:bg-(--brand-primary) group-hover/checkbox:border-(--brand-primary)" data-checked="1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
          </span>
          <span class="text-[12px] leading-[1.6] tracking-[0.03em] text-mute">自动登录</span>
        </label>
        <a href="#" class="text-[12px] leading-[1.6] tracking-[0.03em] text-dim no-underline transition-colors duration-200 hover:text-white">忘记密码</a>
      </div>

      <button type="submit" class="btn-login mb-2.5 block h-11 w-full cursor-pointer overflow-hidden rounded-[3px] border-none bg-(--brand-cta) text-[14px] leading-[44px] font-semibold tracking-[0.15em] text-body [text-indent:0.15em] transition-all duration-200 ease-out hover:-translate-y-px hover:brightness-110 hover:shadow-[0_6px_16px_rgba(var(--brand-cta-rgb),0.25)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:grayscale-[0.3]">登录</button>
      <button type="button" data-act="register" class="btn-register block h-11 w-full cursor-pointer rounded-[3px] border border-btnline bg-row text-[14px] leading-[44px] font-medium tracking-[0.15em] text-[#8A8784] [text-indent:0.15em] transition-all duration-200 hover:-translate-y-px hover:bg-rowhover hover:text-mute active:translate-y-0">注册</button>
    </form>
  </div>
`)
