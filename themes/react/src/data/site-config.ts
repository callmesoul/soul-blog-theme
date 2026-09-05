import type { SiteConfig } from '@soul-blog/wc'

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  site: { name: 'CallMeSoul', icp: '@CallMeSoul 粤ICP备15053557' },
  logo: {
    home: { src: '/images/extracted/login/图形@2x.png', width: 60, height: 55, alt: 'CallMeSoul' },
    login: { src: '/images/extracted/login/logo@2x.png', width: 201, height: 35, alt: 'CallMeSoul' },
    loginIcon: { src: '/images/extracted/login/图形@2x.png', width: 88, height: 81, alt: '' }
  },
  theme: { primary: '#EB4F38', cta: '#EE5B44' },
  social: [
    { name: '微信', icon: '/images/extracted/home/iconfont-weixin@2x.png', href: '', qr: '/images/social/qr-weixin.svg', hue: 74, width: 22, height: 18 },
    { name: 'QQ', icon: '/images/extracted/home/iconfont-QQ@2x.png', href: '', qr: '/images/social/qr-qq.svg', hue: 178, width: 17, height: 18 },
    { name: '微博', icon: '/images/extracted/home/iconfont-weibo@2x.png', href: '', qr: '/images/social/qr-weibo.svg', hue: 326, width: 22, height: 18 },
    { name: 'GitHub', icon: '/images/social/github.svg', href: 'https://github.com/', mono: true, hue: 0, width: 21, height: 18 },
    { name: '哔哩哔哩', icon: '/images/social/bilibili.svg', href: 'https://www.bilibili.com/', hue: 157, width: 21, height: 18 },
    { name: '知乎', icon: '/images/social/zhihu.svg', href: 'https://www.zhihu.com/', hue: 170, width: 20, height: 18 }
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
    out[key] = (bv && typeof bv === 'object' && !Array.isArray(bv) && pv && typeof pv === 'object' && !Array.isArray(pv))
      ? deepMerge(bv, pv) : pv
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
    document.querySelectorAll('[data-site-icp]').forEach(el => { el.textContent = cfg.site.icp })
  }
  if (cfg.site.name) {
    document.title = `${cfg.site.name} - 首页`
  }
}