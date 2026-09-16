import type { FriendsPageConfig, SiteConfig } from '@soul-blog/wc'

export const DEFAULT_FRIENDS_CONFIG: FriendsPageConfig = {
  kicker: 'Friends · Curated People',
  title: '一些值得',
  titleAccent: '反复拜访的人。',
  description: '他们在各自的小世界里持续写作、创造，也让独立互联网保持温度。',
  links: [
    { name: '木木木木木', url: 'https://immmmm.com', domain: 'immmmm.com', note: '有趣的灵魂，持续记录设计、技术与生活。', mark: 'M', color: '#ED5A42' },
    { name: '保罗的小宇宙', url: 'https://paugram.com', domain: 'paugram.com', note: '写代码，也写那些值得被好好记住的瞬间。', mark: 'P', color: '#CA8251' },
    { name: '林木木', url: 'https://imlinmu.com', domain: 'imlinmu.com', note: '热爱开源和摄影，相信长期主义的独立开发者。', mark: 'L', color: '#6D8580' },
    { name: '青山', url: 'https://qingshaner.com', domain: 'qingshaner.com', note: '在山野、胶片和文字之间，寻找缓慢的答案。', mark: 'Q', color: '#727A9A' },
    { name: '旧梦与诗', url: 'https://dreamer.ink', domain: 'dreamer.ink', note: '写诗，做产品，收集互联网仍然温柔的证据。', mark: 'D', color: '#A56C76' },
    { name: '未读消息', url: 'https://unread.one', domain: 'unread.one', note: '关于阅读、播客和偶尔抵达远方的信。', mark: 'U', color: '#8B7656' }
  ]
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  site: {
    name: 'CallMeSoul',
    icp: '@CallMeSoul 粤ICP备15053557'
  },
  logo: {
    home: {
      src: '/images/extracted/login/图形@2x.png',
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
  theme: {
    primary: '#EB4F38',
    cta: '#EE5B44'
  },
  about: {
    kicker: 'About · Personal Manifesto',
    title: '代码是工具，',
    titleAccent: '表达才是目的。',
    description: '我喜欢把复杂的问题，做成简单、可靠、耐看的东西。这里记录我的技术实践、设计思考，以及值得被保存下来的生活切片。',
    cards: [
      { eyebrow: '01 · About', title: '我喜欢把复杂的问题，\n做成简单、可靠、耐看的东西。', variant: 'wide' },
      { eyebrow: 'Currently', title: 'Build.\nWrite.\nRepeat.', variant: 'accent' },
      { eyebrow: '02 · Believe', text: '好产品应该安静地工作，不要求用户先理解它。' },
      { eyebrow: '03 · Explore', text: 'Web / AI / Design\nOpen Source / Life' },
      { eyebrow: '04 · Contact', text: '有好想法？\nhello@callmesoul.cn', href: 'mailto:hello@callmesoul.cn' }
    ]
  },
  friends: DEFAULT_FRIENDS_CONFIG,
  giscus: {
    enabled: true,
    repo: 'callmesoul/soul-blog-theme',
    repoId: 'R_kgDOUG1kRA',
    category: 'Announcements',
    categoryId: '',
    termPrefix: 'article:',
    strict: true,
    reactionsEnabled: true,
    inputPosition: 'top',
    theme: 'dark_dimmed',
    lang: 'zh-CN',
    loading: 'lazy'
  },
  social: [
    {
      name: '微信',
      icon: '/images/extracted/home/iconfont-weixin@2x.png',
      href: '',
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
      href: 'https://github.com/',
      mono: true,
      hue: 0,
      width: 21,
      height: 18
    },
    {
      name: '哔哩哔哩',
      icon: '/images/social/bilibili.svg',
      href: 'https://www.bilibili.com/',
      hue: 157,
      width: 21,
      height: 18
    },
    {
      name: '知乎',
      icon: '/images/social/zhihu.svg',
      href: 'https://www.zhihu.com/',
      hue: 170,
      width: 20,
      height: 18
    }
  ]
}

let _config: SiteConfig | null = null

export function getSiteConfig(): SiteConfig {
  return _config || DEFAULT_SITE_CONFIG
}

function deepMerge(base: any, patch: any): any {
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

export async function loadSiteConfig(): Promise<SiteConfig> {
  if (_config) return _config
  let merged: SiteConfig = { ...DEFAULT_SITE_CONFIG, social: [...DEFAULT_SITE_CONFIG.social], logo: { ...DEFAULT_SITE_CONFIG.logo }, theme: { ...DEFAULT_SITE_CONFIG.theme }, site: { ...DEFAULT_SITE_CONFIG.site } }

  try {
    const res = await fetch('./site-config.json', { cache: 'no-store' })
    if (res.ok) {
      const remote = await res.json()
      if (remote && typeof remote === 'object') merged = deepMerge(merged, remote)
    }
  } catch { /* ignore */ }

  if (typeof window !== 'undefined' && (window as any).__SITE_CONFIG__ && typeof (window as any).__SITE_CONFIG__ === 'object') {
    merged = deepMerge(merged, (window as any).__SITE_CONFIG__)
  }

  _config = merged
  return _config
}

function hexToRgb(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

export function applySiteConfig(cfg: SiteConfig = getSiteConfig()): void {
  const root = document.documentElement
  if (cfg.theme.primary) root.style.setProperty('--brand-primary', cfg.theme.primary)
  if (cfg.theme.cta) root.style.setProperty('--brand-cta', cfg.theme.cta)
  const rgb = hexToRgb(cfg.theme.primary)
  if (rgb) root.style.setProperty('--brand-rgb', rgb)
  const ctaRgb = hexToRgb(cfg.theme.cta)
  if (ctaRgb) root.style.setProperty('--brand-cta-rgb', ctaRgb)

  if (cfg.site.icp) {
    document.querySelectorAll('[data-site-icp]').forEach(el => {
      el.textContent = cfg.site.icp
    })
  }
  // 注意：页面 <title> 由路由层（App.vue applyRouteTitle）按当前路由维护，
  // 首页 / 归档 / 登录 / 搜索 各自设置，避免归档等页面被误写成「- 首页」。
}
