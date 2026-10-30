'use strict'

/**
 * @soul-blog/hexo — 站点数据出口
 *
 * 模板只负责把 Hexo 的 posts 摊平成 RawSiteData，不参与任何业务推导：
 * 分类 slug、日期格式、摘要截断、标签统计、snake_case → camelCase
 * 全部由 @soul-blog/wc 的 buildSiteData() 在前端完成。
 *
 * 这样 Hexo 与 Hugo 两个主题共享同一份归一化实现，行为不会漂移。
 */

function toArray (posts) {
  if (!posts) return []
  if (typeof posts.toArray === 'function') return posts.toArray()
  return Array.prototype.slice.call(posts)
}

/** 分类名优先取 _posts/[cat]/ 目录，其次回退 front-matter categories */
function categoryNameOf (post) {
  if (post.source && typeof post.source === 'string') {
    const parts = post.source.split('/')
    if (parts.length >= 3 && parts[0] === '_posts' && parts[1]) return parts[1]
  }

  const cats = post.categories
  if (cats && cats.length) {
    const first = typeof cats.first === 'function' ? cats.first() : cats[0]
    if (first) return typeof first === 'string' ? first : (first.name || first.slug || '')
  }
  return ''
}

function tagNamesOf (post) {
  const out = []
  if (post.tags && post.tags.length) {
    post.tags.forEach(function (tag) {
      const name = typeof tag === 'string' ? tag : (tag && tag.name) || ''
      if (name) out.push(name)
    })
  }
  return out
}

/** Hexo 的 date 是 moment 对象，统一输出 YYYY-MM-DD 交给前端再格式化 */
function dateOf (post) {
  const date = post.date
  if (date && typeof date.format === 'function') return date.format('YYYY-MM-DD')
  return date ? String(date) : ''
}

function rawPost (post) {
  return {
    id: post.path || post.slug || post.title || '',
    path: post.path || '',
    slug: post.slug || '',
    title: post.title || '',
    date: dateOf(post),
    content: post.content || '',
    excerpt: post.excerpt || post.description || '',
    cover: post.cover || post.thumbnail || '',
    category: categoryNameOf(post),
    tags: tagNamesOf(post),
    views: post.views || 0
  }
}

/** JSON 内联到 <script> 时抵御 </script> 截断与行分隔符问题 */
function jsonSafe (value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function trimSlash (value) {
  return String(value || '').replace(/^\/+|\/+$/g, '')
}

function register (hexo) {
  hexo.extend.helper.register('soul_site_data', function (posts) {
    const config = this.config || {}
    const theme = this.theme || {}
    const urlFor = typeof this.url_for === 'function' ? this.url_for : function (p) { return p }

    const about = theme.about || {}
    const friends = theme.friends || {}
    const aboutEnabled = about.enabled !== false
    const friendsEnabled = friends.enabled !== false

    const urls = {
      home: urlFor('/'),
      archive: urlFor('/' + (config.archive_dir || 'archives') + '/'),
      about: aboutEnabled ? urlFor('/' + trimSlash(about.path || 'about') + '/') : '',
      friends: friendsEnabled ? urlFor('/' + trimSlash(friends.path || 'friends') + '/') : ''
    }

    return jsonSafe({
      posts: toArray(posts).map(rawPost),
      siteName: config.title || 'CallMeSoul',
      icp: theme.icp || '',
      social: theme.social || [],
      urls: urls,
      about: about,
      friends: friends,
      // 未配置时传 null，前端回落到内置演示评论区
      giscus: theme.giscus || null
    })
  })

  /**
   * 文章页单篇数据：供 mountSite 读取 #article-data 后直接打开阅读器。
   * id/path 与列表数据保持一致，保证「相关推荐」能命中。
   */
  hexo.extend.helper.register('soul_article_data', function (post) {
    return jsonSafe(rawPost(post || this.page || {}))
  })
}

if (typeof hexo !== 'undefined') register(hexo)
module.exports = function (h) { register(h || hexo) }
