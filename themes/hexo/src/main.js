// =====================================================================
// @soul-blog/hexo — 客户端入口
//
// 装配逻辑已收敛到 @soul-blog/wc 的 mountSite()：
// 模板只需输出 <script id="site-data"> 与挂载点，这里不再重复实现。
// =====================================================================
import { mountSite } from '@soul-blog/wc'
import './style.css'

mountSite()
