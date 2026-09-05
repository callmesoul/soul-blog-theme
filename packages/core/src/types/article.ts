// =====================================================================
// 文章 / 评论 类型契约
// 字段来源于 themes/vanilla/src/js/mock-data.js 的 ARTICLES 结构，
// 各端数据源只要保持结构一致即可无缝替换。
// =====================================================================

/** 文章评论（预置演示评论或后端返回） */
export interface ArticleComment {
  /** 评论者昵称 */
  name: string
  /** 头像地址 */
  avatar: string
  /** 评论正文 */
  text: string
  /** 发布时间，如 2016/02/14 09:12 */
  time: string
  /** 点赞数 */
  likes: number
}

/**
 * 文章条目
 *   id          文章唯一标识（首页阅读器 #cat=xxx&art=yyy）
 *   cat         所属目录 id（对应 Category.id）
 *   cover       列表卡片封面
 *   summary     卡片摘要
 *   paragraphs  详情页正文段落
 *   comments    评论区预置内容（部分文章可缺省）
 */
export interface Article {
  id: string
  cat: string
  title: string
  cover: string
  summary: string
  date: string // 'YYYY/MM/DD'
  views: number
  commentCount: number
  paragraphs: string[]
  comments?: ArticleComment[]
}