import { WcBase } from '../helpers/wc-base'
import { escapeHtml } from '../helpers/escape-html'
import { store } from '../helpers/store'

/**
 * 登录页组件
 *
 * 属性：
 *   remembered-username — 上次记住的用户名（可选）
 *
 * 事件：
 *   login-submit — 提交时触发，detail 为 { username, password, remember }
 *   register     — 点击注册时触发
 *   forgot       — 点击忘记密码时触发
 */
class LoginPanel extends WcBase {
  static get observedAttributes (): string[] {
    return []
  }

  protected render (): string {
    return `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100%;
          padding: 40px 20px;
        }
        .login-icon {
          position: relative;
          z-index: 1;
          margin-bottom: -30px;
          display: block;
          width: 88px;
          height: 81px;
          object-fit: contain;
        }
        .login-card {
          width: 357px;
          overflow: hidden;
          background: #211e1c;
        }
        .login-form {
          padding: 48px 36px 44px;
        }
        .input-row {
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid #2d2927;
          padding: 8px 0;
          margin-bottom: 16px;
          transition: border-color 0.2s;
        }
        .input-row:focus-within {
          border-bottom-color: var(--brand-primary, #eb4f38);
        }
        .input-row img {
          width: 13px;
          height: 13px;
          object-fit: contain;
          flex-shrink: 0;
          filter: brightness(0) invert(0.62);
          transition: filter 0.2s;
        }
        .input-row:focus-within img {
          filter: brightness(0) invert(1);
        }
        .input-row input {
          min-width: 0;
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          line-height: 1.6;
          letter-spacing: 0.01em;
          color: #f2f2f2;
          font-family: inherit;
        }
        .input-row input::placeholder {
          color: #6b6b6b;
        }
        .input-row input:focus::placeholder {
          color: #9e9d99;
        }
        .input-row input[type="password"]:not(:placeholder-shown) {
          letter-spacing: 0.25em;
        }
        .options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
        }
        .checkbox-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }
        .checkbox-box {
          display: flex;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 1px;
          border: 1px solid #4a4542;
          background: transparent;
          transition: background 0.2s, border-color 0.2s;
        }
        .checkbox-box[data-checked="1"] {
          border-color: var(--brand-primary, #eb4f38);
          background: var(--brand-primary, #eb4f38);
        }
        .checkbox-label {
          font-size: 12px;
          line-height: 1.6;
          letter-spacing: 0.03em;
          color: #9e9d99;
        }
        .forgot-link {
          font-size: 12px;
          line-height: 1.6;
          letter-spacing: 0.03em;
          color: #6b6b6b;
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover {
          color: #ffffff;
        }
        .btn-login {
          display: block;
          width: 100%;
          height: 44px;
          margin-bottom: 10px;
          cursor: pointer;
          border: none;
          border-radius: 3px;
          background: var(--brand-cta, #ee5b44);
          color: #f2f2f2;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.15em;
          font-family: inherit;
          transition: all 0.2s ease-out;
        }
        .btn-login:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
          box-shadow: 0 6px 16px rgba(238, 91, 68, 0.25);
        }
        .btn-login:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
        .btn-register {
          display: block;
          width: 100%;
          height: 44px;
          cursor: pointer;
          border: 1px solid #363230;
          border-radius: 3px;
          background: #292623;
          color: #8a8784;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.15em;
          font-family: inherit;
          transition: all 0.2s;
        }
        .btn-register:hover {
          transform: translateY(-1px);
          background: #322e2a;
          color: #9e9d99;
        }
        .form-tip {
          text-align: center;
          color: #eb4f38;
          font-size: 13px;
          margin-top: 12px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .form-tip.show {
          opacity: 1;
        }
        .pwd-toggle {
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        .pwd-toggle:hover {
          opacity: 1;
        }
      </style>
      <img src="/images/extracted/login/图形@2x.png" alt="" class="login-icon">

      <div class="login-card">
        <form class="login-form" novalidate>
          <div class="input-row">
            <img src="/images/extracted/login/iconfont-denglu@2x.png" alt="">
            <input type="text" class="username-input" placeholder="请输入用户名" autocomplete="username">
          </div>

          <div class="input-row">
            <img src="/images/extracted/login/iconfont-iconyaochi@2x.png" alt="">
            <input type="password" class="password-input" placeholder="请输入密码" autocomplete="current-password">
          </div>

          <div class="options-row">
            <label class="checkbox-wrap">
              <input type="checkbox" class="remember-input" checked style="position:absolute;opacity:0;width:1px;height:1px;">
              <span class="checkbox-box" data-checked="1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
              </span>
              <span class="checkbox-label">自动登录</span>
            </label>
            <a href="#" class="forgot-link">忘记密码</a>
          </div>

          <button type="submit" class="btn-login">登录</button>
          <button type="button" class="btn-register" data-act="register">注册</button>
        </form>
        <p class="form-tip"></p>
      </div>
    `
  }

  protected mounted (): void {
    this._setupForm()
    this._setupPasswordToggle()
    this._setupCheckbox()
    this._setupForgotPassword()
    this._setupRegister()
    this._fillRememberedUsername()
  }

  private _setupForm (): void {
    const form = this.$('.login-form') as HTMLFormElement | null
    if (!form) return

    form.addEventListener('submit', (e: Event) => {
      e.preventDefault()
      const username = (this.$('.username-input') as HTMLInputElement)?.value.trim() || ''
      const password = (this.$('.password-input') as HTMLInputElement)?.value || ''
      const remember = (this.$('.remember-input') as HTMLInputElement)?.checked || false

      if (!username || !password) {
        this._flashError('请填写用户名和密码')
        return
      }
      if (password.length < 4) {
        this._flashError('密码长度至少 4 位')
        return
      }

      if (remember) {
        store.set('auth:remembered-username', username)
      }
      store.set('auth:last-user', username)

      const btn = form.querySelector('.btn-login') as HTMLButtonElement | null
      if (btn) {
        btn.disabled = true
        btn.textContent = '登录中…'
      }

      this.emit('login-submit', { username, password, remember })
    })
  }

  private _setupPasswordToggle (): void {
    const pwdInput = this.$('.password-input') as HTMLInputElement | null
    if (!pwdInput) return
    const row = pwdInput.closest('.input-row')
    if (!row) return

    const toggle = document.createElement('span')
    toggle.className = 'pwd-toggle'
    toggle.title = '显示/隐藏密码'
    toggle.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5S1 8 1 8z" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.2"/></svg>'
    toggle.addEventListener('click', () => {
      pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password'
      toggle.classList.toggle('show', pwdInput.type === 'text')
    })
    row.appendChild(toggle)
  }

  private _setupCheckbox (): void {
    const checkbox = this.$('.remember-input') as HTMLInputElement | null
    const box = this.$('.checkbox-box') as HTMLElement | null
    if (!checkbox || !box) return

    // 恢复上次的勾选偏好
    checkbox.checked = store.get<boolean>('auth:remember-login', true)
    box.dataset.checked = checkbox.checked ? '1' : '0'

    checkbox.addEventListener('change', () => {
      box.dataset.checked = checkbox.checked ? '1' : '0'
      store.set('auth:remember-login', checkbox.checked)
    })
  }

  private _setupForgotPassword (): void {
    const link = this.$('.forgot-link') as HTMLAnchorElement | null
    if (link) {
      link.addEventListener('click', (e: Event) => {
        e.preventDefault()
        this.emit('forgot-password')
        this._flashError('请联系管理员重置密码', 2400)
      })
    }
  }

  private _setupRegister (): void {
    const btn = this.$('[data-act="register"]') as HTMLButtonElement | null
    if (btn) {
      btn.addEventListener('click', () => {
        this.emit('register')
        this._flashError('注册功能即将上线，敬请期待', 2400)
      })
    }
  }

  private _fillRememberedUsername (): void {
    const username = this.$('.username-input') as HTMLInputElement | null
    if (!username) return
    const remembered = store.get('auth:remembered-username', null)
    if (remembered && !username.value) {
      username.value = remembered
    }
  }

  private _flashError (msg: string, ms = 1800): void {
    const tip = this.$('.form-tip') as HTMLElement | null
    if (!tip) return
    tip.textContent = msg
    tip.classList.add('show')
    clearTimeout((tip as any)._t)
    ;(tip as any)._t = setTimeout(() => tip.classList.remove('show'), ms)
  }
}

if (!customElements.get('login-panel')) {
  customElements.define('login-panel', LoginPanel)
}

export { LoginPanel }