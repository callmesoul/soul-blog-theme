// =====================================================================
// 站点数据 类型契约（跨主题唯一真源）
//
// 设计要点：
//   RawSiteData —— 主题侧（Hexo / Hugo / 其他 SSG）只需提供自己能拿到的原始字段，
//                  不需要理解分类 slug、日期格式、摘要截断等规则。
//   SiteData    —— 组件层最终消费的形状，由 buildSiteData() 从原始数据推导。
//
// 这样「数据归一化」只存在一份实现，主题壳可以薄到只剩模板。
// =====================================================================
import type { Article, ArticleComment } from './article'
import type { Category } from './category'
import type { AboutPageConfig } from './about'
import type { FriendsPageConfig } from './friends'
import type { GiscusConfig, SocialItem } from './site-config'

/** 侧栏标签及其文章数 */
export interface TagCount {
  name: string
  count: number
}

/** 列表卡片 / 侧栏使用的图标位 */
export interface SiteIcons {
  home?: string
  eye?: string
  comment?: string
  calendar?: string
  tag?: string
  zan?: string
  avatarA?: string
  avatarB?: string
}

/** 站点级链接，供侧栏跨页跳转使用 */
export interface SiteUrls {
  /** 首页地址 */
  home: string
  /** 归档页地址 */
  archive: string
  /** 关于页地址；空串表示未启用 */
  about?: string
  /** 友链页地址；空串表示未启用 */
  friends?: string
}

/** 组件层最终消费的数据形状 */
export interface SiteData {
  articles: Article[]
  categories: Category[]
  tags?: TagCount[]
  icons: SiteIcons
  siteName: string
  icp: string
  social: SocialItem[]
  archiveUrl: string
  aboutUrl: string
  friendsUrl: string
  homeUrl: string
  about?: AboutPageConfig
  friends?: FriendsPageConfig
  giscus?: Partial<GiscusConfig>
}

/**
 * 单篇文章的原始输入。
 * 缺失字段由 buildSiteData 兜底，主题侧不必补齐。
 */
export interface RawArticle {
  /** 稳定 id；缺省按 path → slug → title 回退 */
  id?: string
  slug?: string
  path?: string
  title?: string
  /** 发布日期：Date / 时间戳 / ISO / YYYY-MM-DD / YYYY/MM/DD */
  date?: Date | string | number | null
  /** 渲染后的正文 HTML */
  content?: string
  excerpt?: string
  description?: string
  cover?: string
  thumbnail?: string
  /** 单一分类名，优先于 categories */
  category?: string
  categories?: Array<string | { name?: string; slug?: string }>
  tags?: Array<string | { name?: string }>
  views?: number
  comments?: ArticleComment[]
}

/**
 * 主题可提供的最小原始站点数据。
 * Hexo / Hugo 的模板只需吐出这个结构，前端会调用 buildSiteData 补齐。
 *
 * about / friends / social 允许 snake_case（各 SSG 的配置惯例），
 * 归一化统一在 buildSiteData 里完成，模板因此不需要写任何字段映射。
 */
export interface RawSiteData {
  posts: RawArticle[]
  siteName?: string
  icp?: string
  social?: Array<Record<string, unknown>>
  icons?: SiteIcons
  urls?: Partial<SiteUrls>
  giscus?: Record<string, unknown> | null
  about?: Record<string, unknown> | null
  friends?: Record<string, unknown> | null
  /** 分类展示名覆盖（slug → 展示名） */
  categoryNames?: Record<string, string>
  /** 分类排序；未列出的按首次出现顺序追加 */
  categoryOrder?: string[]
  /** 分类图标，缺省使用内置占位图 */
  categoryIcon?: string
}
