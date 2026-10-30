// =====================================================================
// @soul-blog/hugo — 客户端入口
//
// 与 Hexo 主题共用同一套装配实现（@soul-blog/wc 的 mountSite），
// 差异只在于模板由 Go template 输出、资源由 Hugo 的 static/ 提供。
// =====================================================================
import { mountSite } from '@soul-blog/wc'
import './style.css'

mountSite()
