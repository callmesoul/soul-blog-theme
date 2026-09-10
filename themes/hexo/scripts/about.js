'use strict'

/**
 * 根据主题 _config.yml 的 about 配置生成 /about/ 页面。
 */
function register (hexo) {
  hexo.extend.generator.register('soul-about', function () {
    const about = hexo.theme.config.about || {}
    if (about.enabled === false) return []

    const aboutPath = String(about.path || 'about').replace(/^\/+|\/+$/g, '')
    return {
      path: aboutPath + '/index.html',
      layout: ['soul-about', 'about', 'page'],
      data: {
        title: about.page_title || '关于我',
        soulAbout: true
      }
    }
  })
}

if (typeof hexo !== 'undefined') register(hexo)
module.exports = function (h) { register(h || hexo) }
