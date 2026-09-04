// =====================================================================
// 站点主题配置：logo / 主题色 / 社交媒体 等品牌信息集中管理
// ---------------------------------------------------------------------
// 配置来源优先级（高 → 低）：
//   1. public/site-config.json —— 构建后会一并拷贝到 dist/，
//      部署后直接编辑该文件即可换 logo/配色/社交，无需重新打包；
//   2. window.__SITE_CONFIG__    —— 运行时注入（控制台 / 后台直出，便于对接 CMS）；
//   3. 本文件 DEFAULT_SITE_CONFIG —— 内置默认值（兜底）。
// 调用 loadSiteConfig() 加载、applySiteConfig() 应用到页面。
// =====================================================================

export const DEFAULT_SITE_CONFIG = {
  // 站点信息
  site: {
    name: 'CallMeSoul', // 品牌名（拼接 <title> / 阅读器标题）
    icp: '@CallMeSoul 粤ICP备15053557' // 页脚版权 / 备案文案
  },

  // Logo
  //   home       首页/列表页 侧边栏顶部 Logo
  //   login      登录页侧边栏与登录卡片的 Logo
  //   loginIcon  登录卡片上方的图形图标
  logo: {
    home: {
      src: '/images/extracted/login/图形@2x.png', // 品牌吉祥物（与登录页顶部一致），替换原文字 wordmark
      width: 60,
      height: 55,
      alt: 'CallMeSoul'
    },
    login: {
      src: '/images/extracted/login/logo@2x.png',
      width: 201,
      height: 35,
      alt: 'CallMeSoul'
    },
    loginIcon: {
      src: '/images/extracted/login/图形@2x.png',
      width: 88,
      height: 81,
      alt: ''
    }
  },

  // 主题色（建议使用 #RRGGBB 十六进制，JS 会据此推导半透明所需的 RGB 通道）
  theme: {
    primary: '#EB4F38', // 品牌主色：导航高亮 / 强调 / hover / 链接
    cta: '#EE5B44' // 行动按钮主色：登录按钮等
  },

  // 社交媒体（页脚图标栏，按数组顺序从左到右渲染）
  //   每一条目自动适配以下三种交互形态：
  //     ① href 为有效外链(非空且非 '#') → 渲染为 <a target="_blank">，点击在新窗口打开；
  //     ② href 为空/'#' 但配置了 qr   → 不可跳转，hover / 键盘聚焦弹出二维码图片；
  //     ③ href 与 qr 均为空          → 纯展示图标（hover 仍显示平台名气泡）。
  //   其余字段说明：
  //     hue   深灰原图按平台品牌色着色的 filter hue-rotate 角度（彩色着色，近似色相 = 40°+hue）；
  //     mono  布尔值：平台本身为单色品牌(如 GitHub)，置 true 时图标以中性浅灰/白色呈现而不按 hue 上色；
  //     qr    二维码图片路径（置于 public/images/social/ 下，替换成自己的真实二维码即可）；
  //     href  外链地址（个人主页 / 官网，下方案例值为占位，请改成自己的主页）；
  //     width/height 图标显示尺寸
  social: [
    {
      name: '微信',
      icon: '/images/extracted/home/iconfont-weixin@2x.png',
      href: '', // 无外链 → hover 弹二维码
      qr: '/images/social/qr-weixin.svg',
      hue: 74,
      width: 22,
      height: 18
    },
    {
      name: 'QQ',
      icon: '/images/extracted/home/iconfont-QQ@2x.png',
      href: '',
      qr: '/images/social/qr-qq.svg',
      hue: 178,
      width: 17,
      height: 18
    },
    {
      name: '微博',
      icon: '/images/extracted/home/iconfont-weibo@2x.png',
      href: '',
      qr: '/images/social/qr-weibo.svg',
      hue: 326,
      width: 22,
      height: 18
    },
    {
      name: 'GitHub',
      icon: '/images/social/github.svg',
      href: 'https://github.com/', // 占位：请替换为 https://github.com/你的用户名
      mono: true,
      hue: 0,
      width: 21,
      height: 18
    },
    {
      name: '哔哩哔哩',
      icon: '/images/social/bilibili.svg',
      href: 'https://www.bilibili.com/', // 占位：请替换为 https://space.bilibili.com/你的UID
      hue: 157,
      width: 21,
      height: 18
    },
    {
      name: '知乎',
      icon: '/images/social/zhihu.svg',
      href: 'https://www.zhihu.com/', // 占位：请替换为 https://www.zhihu.com/people/你的昵称
      hue: 170,
      width: 20,
      height: 18
    }
  ]
}

/** 深合并：patch 覆盖 base（数组整体替换，对象逐层覆盖） */
function deepMerge (base, patch) {
  if (patch == null || typeof patch !== 'object') return base
  if (Array.isArray(patch)) return patch.slice()
  const out = { ...base }
  for (const key of Object.keys(patch)) {
    const bv = base && typeof base === 'object' && !Array.isArray(base) ? base[key] : undefined
    const pv = patch[key]
    out[key] = (bv && typeof bv === 'object' && !Array.isArray(bv) &&
      pv && typeof pv === 'object' && !Array.isArray(pv))
      ? deepMerge(bv, pv)
      : pv
  }
  return out
}

let _config = null

/** 当前生效的配置（未加载时返回默认值） */
export function getSiteConfig () {
  return _config || DEFAULT_SITE_CONFIG
}

/** 异步加载生效配置（结果缓存，只拉取一次） */
export async function loadSiteConfig () {
  if (_config) return _config
  let merged = DEFAULT_SITE_CONFIG

  // 1) 远程站点配置：public/site-config.json（部署后可直接改，无需重新构建）
  try {
    const res = await fetch('./site-config.json', { cache: 'no-store' })
    if (res.ok) {
      const remote = await res.json()
      if (remote && typeof remote === 'object') merged = deepMerge(merged, remote)
    }
  } catch { /* 忽略：直开文件 / 网络异常时回退默认配置 */ }

  // 2) 运行时注入（window.__SITE_CONFIG__），便于控制台 / 后台动态改配
  if (typeof window !== 'undefined' && window.__SITE_CONFIG__ && typeof window.__SITE_CONFIG__ === 'object') {
    merged = deepMerge(merged, window.__SITE_CONFIG__)
  }

  _config = merged
  return _config
}

/** hex（#RRGGBB）→ 'r, g, b'；非十六进制返回 null */
function hexToRgb (hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

function esc (s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}

function pageName () {
  return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase()
}

/** 主题色 → CSS 变量（var(--brand-primary) 等由 style.css 引用） */
function applyTheme (theme = {}) {
  const root = document.documentElement
  if (theme.primary) root.style.setProperty('--brand-primary', theme.primary)
  if (theme.cta) root.style.setProperty('--brand-cta', theme.cta)
  // 半透明场景在 CSS 里用 rgba(var(--brand-rgb), a) 引用，需同步推导 RGB 通道
  const rgb = hexToRgb(theme.primary)
  if (rgb) root.style.setProperty('--brand-rgb', rgb)
  const ctaRgb = hexToRgb(theme.cta)
  if (ctaRgb) root.style.setProperty('--brand-cta-rgb', ctaRgb)
}

/** Logo：按 <img data-site-logo="..."> 匹配 key（home/login/loginIcon）逐个应用 */
function applyLogo (logo = {}) {
  if (!logo) return
  const isLogin = pageName().startsWith('login')
  document.querySelectorAll('[data-site-logo]').forEach(el => {
    const key = el.dataset.siteLogo
    let item = logo[key]
    if (!item && !isLogin) item = logo.home // 首页任意缺失回落到 home
    if (!item || !item.src) return
    el.src = item.src
    if (item.alt != null) el.alt = item.alt
    if (item.width) el.style.width = item.width + 'px'
    if (item.height) el.style.height = item.height + 'px'
  })
}

/** 社交媒体：按配置重建 .social-bar 内容
 *  交互规则：href 为有效外链 → <a target="_blank"> 新窗口跳转；
 *           否则有 qr → hover/聚焦 弹二维码卡片；两者皆无 → 纯展示。 */
function applySocial (social = []) {
  const bar = document.querySelector('.social-bar')
  if (!bar) return
  const items = Array.isArray(social) ? social : []
  if (!items.length) { bar.innerHTML = ''; return }
  bar.innerHTML = items.map(s => {
    const name = esc(s.name || '')
    const w = s.width || 22
    const h = s.height || 18
    const cls = s.mono ? ' class="tone-mono"' : ''
    const icon = `<img${cls} src="${esc(s.icon)}" alt="${name}" style="width:${w}px;height:${h}px;object-fit:contain;--hue:${s.hue ?? 0}deg;">`
    const href = s.href && s.href !== '#' ? String(s.href) : ''
    const qr = s.qr && s.qr !== '#' ? String(s.qr) : ''

    // ① 有有效外链：点击新窗口打开
    if (href) {
      return `<a class="social-icon has-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="${name}" title="${name}">${icon}</a>`
    }
    // ② 无外链但配置了二维码：hover / 聚焦展示二维码（不跳转）
    if (qr) {
      return `<span class="social-icon has-qr" role="img" tabindex="0" aria-label="${name}二维码" title="扫码关注${name}">
      ${icon}
      <span class="social-qr"><img class="qr-image" src="${esc(qr)}" alt="${name}二维码"><em>扫一扫关注</em><b>${name}</b></span>
    </span>`
    }
    // ③ 无外链也无二维码：仅展示图标，hover 提示平台名
    return `<span class="social-icon is-static" aria-label="${name}" title="${name}">${icon}</span>`
  }).join('')
}

/** 页脚备案文案 + 页面 <title>（阅读器等打开后的标题由 main.js 拼接） */
function applySiteMeta (site = {}) {
  if (!site) return
  if (site.icp) {
    document.querySelectorAll('.site-icp').forEach(el => {
      el.textContent = site.icp
    })
  }
  if (site.name) {
    const page = pageName()
    document.title = page.startsWith('login')
      ? `登录 - ${site.name}`
      : page.startsWith('search')
        ? `搜索 - ${site.name}`
        : `${site.name} - 首页`
  }
}

/** 把配置应用到当前页面（CSS 变量 + logo + 社交栏 + 备案/标题） */
export function applySiteConfig (cfg = getSiteConfig()) {
  applyTheme(cfg.theme)
  applyLogo(cfg.logo)
  applySocial(cfg.social)
  applySiteMeta(cfg.site)
}
