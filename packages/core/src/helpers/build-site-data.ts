// =====================================================================
// 站点数据归一化
//
// 这里集中原先分散在 themes/hexo 四个 EJS 模板里的推导规则：
//   目录 → slug、日期 → YYYY/MM/DD、摘要截断、标签统计、评论键回退……
// 主题壳（Hexo / Hugo）只负责吐出原始字段，规则全部收敛到这一处。
// =====================================================================
import type { Article } from '../types/article'
import type { AboutPageConfig } from '../types/about'
import type { FriendsPageConfig } from '../types/friends'
import type { Category } from '../types/category'
import type { GiscusConfig, SocialItem } from '../types/site-config'
import type {
  RawArticle,
  RawSiteData,
  SiteData,
  SiteIcons,
  TagCount
} from '../types/site-data'
import { DEFAULT_SITE_ICONS } from './site-icons'

export { DEFAULT_SITE_ICONS } from './site-icons'

type Dict = Record<string, any>

/**
 * 读取一个配置字段，camelCase 优先、snake_case 兜底。
 * 各 SSG 的配置习惯不同（Hugo/Hexo 用 snake_case），组件契约统一 camelCase，
 * 适配全部收敛在这里，模板因此不必写字段映射。
 */
function read<T> (src: Dict | null | undefined, camel: string, snake: string, fallback: T): T {
  if (!src) return fallback
  if (src[camel] !== undefined && src[camel] !== null) return src[camel] as T
  if (src[snake] !== undefined && src[snake] !== null) return src[snake] as T
  return fallback
}

/** 默认分类图标（设计稿导出的代码图标） */
const DEFAULT_CATEGORY_ICON = '/images/extracted/home/iconfont-daima2@2x.png'
/** 默认封面 */
const DEFAULT_COVER = '/images/extracted/home/图层_21@2x.png'
/** 摘要从正文截断的长度 */
const SUMMARY_LIMIT = 120
/** 无目录归属时的分类名 */
export const FALLBACK_CATEGORY = 'uncategorized'

/** 目录名 → slug（小写 + 空格转连字符） */
export function slugifyCategory (name: string): string {
  return String(name ?? '').trim().toLowerCase().replace(/\s+/g, '-')
}

/** 取文章的分类展示名：显式 category > categories[0] > 兜底 */
export function categoryNameOf (raw: RawArticle): string {
  if (raw.category) return String(raw.category)

  const first = raw.categories && raw.categories.length ? raw.categories[0] : null
  if (first) {
    if (typeof first === 'string') return first
    const name = first.slug || first.name || ''
    if (name) return name
  }
  return FALLBACK_CATEGORY
}

/** 归一化标签：统一小写、去空、去重 */
export function tagNamesOf (raw: RawArticle): string[] {
  const list = Array.isArray(raw.tags) ? raw.tags : []
  const out: string[] = []

  for (const tag of list) {
    const name = typeof tag === 'string' ? tag : (tag && tag.name) || ''
    const value = String(name).trim().toLowerCase()
    if (value && !out.includes(value)) out.push(value)
  }
  return out
}

/** 把任意日期输入格式化为 YYYY/MM/DD（本地时区） */
export function formatYmd (value: RawArticle['date']): string {
  if (value == null || value === '') return ''

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    const pad = (n: number): string => String(n).padStart(2, '0')
    return `${value.getFullYear()}/${pad(value.getMonth() + 1)}/${pad(value.getDate())}`
  }

  if (typeof value === 'number') return formatYmd(new Date(value))

  const text = String(value).trim()
  const matched = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(text)
  if (matched) {
    return `${matched[1]}/${matched[2].padStart(2, '0')}/${matched[3].padStart(2, '0')}`
  }

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? '' : formatYmd(parsed)
}

/** 去掉标签与压缩空白，用于从正文生成摘要 */
export function stripHtml (html: string): string {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 单篇文章：原始字段 → 组件契约 */
export function buildArticle (raw: RawArticle): Article {
  const id = raw.id || raw.path || raw.slug || raw.title || ''
  const content = raw.content || ''
  const plain = content ? stripHtml(content) : ''

  return {
    id,
    statsKey: id,
    commentKey: raw.slug || raw.path || raw.title || id,
    cat: slugifyCategory(categoryNameOf(raw)),
    title: raw.title || '',
    cover: raw.cover || raw.thumbnail || DEFAULT_COVER,
    summary: raw.excerpt || raw.description || (plain ? plain.substring(0, SUMMARY_LIMIT) : ''),
    date: formatYmd(raw.date),
    views: raw.views || 0,
    commentCount: 0,
    tags: tagNamesOf(raw),
    paragraphs: content ? [content] : [],
    ...(raw.comments ? { comments: raw.comments } : {})
  }
}

/** 按首次出现顺序聚合分类，再用 categoryOrder 重排 */
function buildCategories (posts: RawArticle[], input: RawSiteData): Category[] {
  const map = new Map<string, Category>()

  for (const raw of posts) {
    const name = categoryNameOf(raw) || FALLBACK_CATEGORY
    const id = slugifyCategory(name)
    const existing = map.get(id)
    if (existing) {
      existing.count = (existing.count || 0) + 1
      continue
    }
    map.set(id, {
      id,
      name: (input.categoryNames && input.categoryNames[id]) || name,
      en: id,
      icon: input.categoryIcon || DEFAULT_CATEGORY_ICON,
      w: 21,
      h: 21,
      count: 1
    })
  }

  const order = input.categoryOrder
  if (!order || !order.length) return Array.from(map.values())

  const ordered: Category[] = []
  for (const rawName of order) {
    const id = slugifyCategory(rawName)
    const hit = map.get(id)
    if (hit) {
      ordered.push(hit)
      map.delete(id)
    }
  }
  return ordered.concat(Array.from(map.values()))
}

/** 全站标签统计（按名称升序） */
export function buildTagCounts (articles: Article[]): TagCount[] {
  const counts = new Map<string, number>()

  for (const article of articles) {
    for (const tag of article.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([name, count]) => ({ name, count }))
}

/** 社交媒体列表归一化（href 兼容 url 写法） */
export function normalizeSocial (list?: Dict[] | null): SocialItem[] {
  if (!Array.isArray(list)) return []

  return list.map((item) => {
    const href = read(item, 'href', 'url', '')
    return {
      name: String(read(item, 'name', 'name', '')),
      icon: String(read(item, 'icon', 'icon', '')),
      ...(href ? { href: String(href) } : {}),
      qr: String(read(item, 'qr', 'qr', '')),
      hue: Number(read(item, 'hue', 'hue', 0)),
      mono: Boolean(read(item, 'mono', 'mono', false)),
      width: Number(read(item, 'width', 'width', 0)),
      height: Number(read(item, 'height', 'height', 0))
    }
  })
}

/** 关于页配置归一化；空配置返回 undefined 以便组件使用内置默认文案 */
export function normalizeAbout (raw?: Dict | null): AboutPageConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined

  const cards = Array.isArray(raw.cards)
    ? raw.cards.map((card: Dict) => {
      const variant = read<string>(card, 'variant', 'variant', 'default')
      return {
        eyebrow: String(read(card, 'eyebrow', 'eyebrow', '')),
        title: String(read(card, 'title', 'title', '')),
        text: String(read(card, 'text', 'text', '')),
        variant: (variant === 'wide' || variant === 'accent' ? variant : 'default') as 'wide' | 'accent' | 'default',
        href: String(read(card, 'href', 'href', ''))
      }
    })
    : []

  const kicker = String(read(raw, 'kicker', 'kicker', ''))
  const title = String(read(raw, 'title', 'title', ''))
  if (!cards.length && !kicker && !title) return undefined

  return {
    kicker: kicker || 'About · Personal Manifesto',
    title,
    titleAccent: String(read(raw, 'titleAccent', 'title_accent', '')),
    description: String(read(raw, 'description', 'description', '')),
    cards
  }
}

/** 友链页配置归一化；空配置返回 undefined */
export function normalizeFriends (raw?: Dict | null): FriendsPageConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined

  const links = Array.isArray(raw.links)
    ? raw.links.map((link: Dict) => ({
      name: String(read(link, 'name', 'name', '')),
      url: String(read(link, 'url', 'url', '')),
      domain: String(read(link, 'domain', 'domain', '')),
      note: String(read(link, 'note', 'note', '')),
      mark: String(read(link, 'mark', 'mark', '')),
      color: String(read(link, 'color', 'color', '')),
      avatar: String(read(link, 'avatar', 'avatar', ''))
    }))
    : []

  const kicker = String(read(raw, 'kicker', 'kicker', ''))
  if (!links.length && !kicker) return undefined

  return {
    kicker: kicker || 'Friends · Curated People',
    title: String(read(raw, 'title', 'title', '')),
    titleAccent: String(read(raw, 'titleAccent', 'title_accent', '')),
    description: String(read(raw, 'description', 'description', '')),
    links
  }
}

/**
 * 评论配置归一化。
 * 未提供配置时启用了内置演示评论区（enabled: true）；
 * 提供了但未显式 enabled 时视为关闭，交由页面显示配置引导。
 */
export function normalizeGiscus (raw?: Dict | null): Partial<GiscusConfig> {
  if (!raw || typeof raw !== 'object') return { enabled: true }

  return {
    enabled: read<boolean>(raw, 'enabled', 'enabled', false) === true,
    repo: String(read(raw, 'repo', 'repo', '')),
    repoId: String(read(raw, 'repoId', 'repo_id', '')),
    category: String(read(raw, 'category', 'category', '')),
    categoryId: String(read(raw, 'categoryId', 'category_id', '')),
    termPrefix: String(read(raw, 'termPrefix', 'term_prefix', 'article:')),
    strict: read<boolean>(raw, 'strict', 'strict', true) !== false,
    reactionsEnabled: read<boolean>(raw, 'reactionsEnabled', 'reactions_enabled', true) !== false,
    inputPosition: read(raw, 'inputPosition', 'input_position', 'top'),
    theme: String(read(raw, 'theme', 'theme', 'dark_dimmed')),
    lang: String(read(raw, 'lang', 'lang', 'zh-CN')),
    loading: read(raw, 'loading', 'loading', 'lazy')
  }
}

/** 原始站点数据 → 组件可消费的 SiteData */
export function buildSiteData (input: RawSiteData): SiteData {
  const posts = Array.isArray(input.posts) ? input.posts : []
  const articles = posts.map(buildArticle)
  const about = normalizeAbout(input.about)
  const friends = normalizeFriends(input.friends)
  const urls = input.urls || {}

  return {
    articles,
    categories: buildCategories(posts, input),
    tags: buildTagCounts(articles),
    icons: { ...DEFAULT_SITE_ICONS, ...(input.icons || {}) },
    siteName: input.siteName || 'CallMeSoul',
    icp: input.icp || '',
    social: normalizeSocial(input.social as Dict[]),
    archiveUrl: urls.archive || '/archives/',
    aboutUrl: urls.about || '',
    friendsUrl: urls.friends || '',
    homeUrl: urls.home || '/',
    ...(about ? { about } : {}),
    ...(friends ? { friends } : {}),
    giscus: normalizeGiscus(input.giscus)
  }
}

/**
 * 兼容入口：解析页面里内联的站点数据。
 *
 * 新格式（{ posts: [...] }）走归一化；旧格式（{ articles: [...] }）直接透传，
 * 保证 Hexo 主题可以逐步迁移而不会一次性全部失效。
 */
export function resolveSiteData (input: unknown): SiteData | null {
  if (!input || typeof input !== 'object') return null

  const record = input as Record<string, unknown>

  if (Array.isArray(record.posts)) {
    return buildSiteData(record as unknown as RawSiteData)
  }

  if (Array.isArray(record.articles)) {
    const data = record as unknown as SiteData
    return {
      ...data,
      icons: { ...DEFAULT_SITE_ICONS, ...(data.icons || {}) },
      categories: Array.isArray(data.categories) ? data.categories : [],
      social: Array.isArray(data.social) ? data.social : [],
      siteName: data.siteName || 'CallMeSoul',
      icp: data.icp || '',
      archiveUrl: data.archiveUrl || '/archives/',
      aboutUrl: data.aboutUrl || '',
      friendsUrl: data.friendsUrl || '',
      homeUrl: data.homeUrl || '/',
      giscus: data.giscus || { enabled: true }
    }
  }

  return null
}
