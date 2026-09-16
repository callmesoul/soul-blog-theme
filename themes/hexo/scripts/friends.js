'use strict'

/** 根据主题 _config.yml 的 friends 配置生成 /friends/ 页面。 */
function register (hexo) {
  hexo.extend.generator.register('soul-friends', function () {
    const friends = hexo.theme.config.friends || {}
    if (friends.enabled === false) return []

    const friendsPath = String(friends.path || 'friends').replace(/^\/+|\/+$/g, '')
    return {
      path: friendsPath + '/index.html',
      layout: ['soul-friends', 'friends', 'page'],
      data: {
        title: friends.page_title || '友链',
        soulFriends: true
      }
    }
  })
}

if (typeof hexo !== 'undefined') register(hexo)
module.exports = function (h) { register(h || hexo) }
