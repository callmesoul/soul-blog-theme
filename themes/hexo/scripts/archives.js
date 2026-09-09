'use strict'

/**
 * @soul-blog/hexo — 归档页生成器
 *
 * 生成单页 /archives/index.html（layout: archive.ejs），提供 site.posts 的全量
 * 倒序列表，使四个主题的归档路由保持一致：vanilla → archives.html，
 * vue → /archives，react → /archives，hexo → /archives/。
 *
 * 说明：Hexo 站点如额外安装了 hexo-generator-archive，其生成的 /archives/
 * 会被本生成器（theme scripts 在插件之后加载）覆盖为全量时间线；
 * 该插件仍会保留 年/月/分页 等子路由，由 archive.ejs 兼容渲染。
 */

function register (hexo) {
  hexo.extend.generator.register('soul-archives', function (locals) {
    const archiveDir = hexo.config.archive_dir || 'archives'
    const posts = locals.posts
      .filter(function (p) { return p.published !== false })
      .sort('-date')
      .toArray()

    return {
      path: archiveDir + '/index.html',
      layout: ['soul-archive', 'archive', 'page'],
      data: {
        title: '归档',
        soulPosts: posts,
        // 供 archive.ejs 判断「是否是本生成器输出」的标记
        soulArchive: true
      }
    }
  })
}

// theme scripts 以模块方式加载；同时兼容全局 hexo 变量注入的形式
if (typeof hexo !== 'undefined') register(hexo)
module.exports = function (h) { register(h || hexo) }
