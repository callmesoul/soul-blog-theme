// =====================================================================
// 站点品牌配置 类型契约
// 字段来源于 themes/vanilla/src/js/site-config.js 的 DEFAULT_SITE_CONFIG，
// 配置来源优先级：site-config.json > window.__SITE_CONFIG__ > 默认值。
// =====================================================================

/** 站点信息 */
export interface SiteInfo {
  /** 品牌名（拼接 <title> / 阅读器标题） */
  name: string
  /** 页脚版权 / 备案文案 */
  icp: string
}

/** 单个 Logo 素材 */
export interface LogoItem {
  src: string
  width: number
  height: number
  alt?: string
}

/** 三处 Logo（首页侧栏 / 登录侧栏 / 登录卡片图标） */
export interface SiteLogo {
  home: LogoItem
  login: LogoItem
  loginIcon: LogoItem
}

/** 主题色（#RRGGBB，JS 据此推导半透明所需 RGB 通道） */
export interface ThemeConfig {
  primary: string
  cta: string
}

/** 社交媒体条目（页脚图标栏） */
export interface SocialItem {
  name: string
  icon: string
  /** 外链地址（有效外链 → 新窗口跳转；空/'#' → 弹二维码或纯展示） */
  href?: string
  /** 二维码图片路径 */
  qr?: string
  /** 图标按平台品牌色着色的 hue-rotate 角度 */
  hue?: number
  /** 单色品牌图标（如 GitHub），置 true 时以中性色呈现 */
  mono?: boolean
  width?: number
  height?: number
}

/** 站点主题配置（站点信息 + Logo + 主题色 + 社交媒体） */
export interface SiteConfig {
  site: SiteInfo
  logo: SiteLogo
  theme: ThemeConfig
  social: SocialItem[]
}