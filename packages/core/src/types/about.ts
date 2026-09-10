/** “关于我”个人宣言卡片 */
export interface AboutCard {
  eyebrow: string
  title?: string
  text?: string
  variant?: 'default' | 'wide' | 'accent'
  href?: string
}

/** “关于我”页面配置 */
export interface AboutPageConfig {
  kicker: string
  title: string
  titleAccent: string
  description: string
  cards: AboutCard[]
}
