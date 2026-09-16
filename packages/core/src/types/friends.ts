/** 单条友链信息 */
export interface FriendLink {
  /** 站点或作者名称 */
  name: string
  /** 点击卡片后打开的完整地址 */
  url: string
  /** 卡片展示的短域名；缺省时从 url 自动提取 */
  domain?: string
  /** 一句话介绍 */
  note: string
  /** 无头像时显示的字符标识；缺省时使用 name 首字符 */
  mark?: string
  /** 字符标识的主题色（#RRGGBB） */
  color?: string
  /** 可选头像或站点 Logo 地址 */
  avatar?: string
}

/** “友链”人物画廊页面配置 */
export interface FriendsPageConfig {
  kicker: string
  title: string
  titleAccent: string
  description: string
  links: FriendLink[]
}
