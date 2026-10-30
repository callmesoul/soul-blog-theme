// =====================================================================
// 列表 / 侧栏图标位默认值
//
// 放在独立模块，避免组件为了拿默认值而依赖「构建期数据归一化」逻辑；
// buildSiteData 与各组件都从这里取同一份常量。
// =====================================================================
import type { SiteIcons } from '../types/site-data'

export const DEFAULT_SITE_ICONS: SiteIcons = {
  home: '/images/extracted/home/iconfont-shouye@2x.png',
  eye: '/images/extracted/home/iconfont-icon01@2x.png',
  comment: '/images/extracted/home/iconfont-icon27@2x.png',
  calendar: '/images/extracted/home/iconfont-03(1)@2x.png',
  tag: '/images/extracted/home/iconfont-biaoqian@2x.png',
  zan: '/images/extracted/article/iconfont-zan@2x.png',
  avatarA: '/images/extracted/article/4@2x.png',
  avatarB: '/images/extracted/article/20160126052324@2x.png'
}
